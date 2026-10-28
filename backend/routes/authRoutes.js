import express from "express";
import bcrypt from "bcryptjs";
import { asyncRoute, sendData } from "../utils/http.js";
import { ADMIN_ROLES, PERMISSIONS } from "../services/authorization.js";
import {
  createAccessToken,
  requireAuth,
  requirePermission,
  serializeAdmin,
  sessionCookieOptions,
  validatePassword,
  validateUsername,
  verifyCredentials,
} from "../services/auth.js";
import { getPrisma } from "../services/prisma.js";

const router = express.Router();
const loginAttempts = new Map();
const MAX_LOGIN_ATTEMPTS = 8;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

function clientKey(req) {
  return req.ip || "unknown";
}
function canAttemptLogin(req) {
  const record = loginAttempts.get(clientKey(req));
  return (
    !record ||
    record.count < MAX_LOGIN_ATTEMPTS ||
    Date.now() - record.startedAt > LOGIN_WINDOW_MS
  );
}
function recordFailedLogin(req) {
  const key = clientKey(req);
  const current = loginAttempts.get(key);
  if (!current || Date.now() - current.startedAt > LOGIN_WINDOW_MS)
    loginAttempts.set(key, { count: 1, startedAt: Date.now() });
  else loginAttempts.set(key, { ...current, count: current.count + 1 });
}

router.post(
  "/login",
  asyncRoute(async (req, res) => {
    if (!canAttemptLogin(req)) {
      const error = new Error(
        "Too many sign-in attempts. Please try again in 15 minutes.",
      );
      error.status = 429;
      throw error;
    }
    const user = await verifyCredentials(
      req.body?.username,
      req.body?.password,
    );
    if (!user) {
      recordFailedLogin(req);
      const error = new Error("Invalid username or password.");
      error.status = 401;
      throw error;
    }
    loginAttempts.delete(clientKey(req));
    res.cookie("pfccl_access", createAccessToken(user), sessionCookieOptions());
    sendData(res, { user: serializeAdmin(user) });
  }),
);

router.post("/logout", (_req, res) => {
  res.clearCookie("pfccl_access", sessionCookieOptions());
  res.status(204).end();
});

router.get("/me", requireAuth, (req, res) =>
  sendData(res, { user: serializeAdmin(req.user) }),
);

router.get(
  "/admins",
  requireAuth,
  requirePermission(PERMISSIONS.MANAGE_ADMINS),
  asyncRoute(async (_req, res) => {
    const users = await getPrisma().adminUser.findMany({
      orderBy: [{ role: "asc" }, { username: "asc" }],
    });
    sendData(res, { users: users.map(serializeAdmin) });
  }),
);

router.post(
  "/admins",
  requireAuth,
  requirePermission(PERMISSIONS.MANAGE_ADMINS),
  asyncRoute(async (req, res) => {
    const username = validateUsername(req.body?.username);
    const password = validatePassword(req.body?.password);
    const role = String(req.body?.role || "").toUpperCase();
    if (!Object.values(ADMIN_ROLES).includes(role)) {
      const error = new Error("A valid admin role is required.");
      error.status = 400;
      throw error;
    }
    let user;
    try {
      user = await getPrisma().adminUser.create({
        data: { username, role, passwordHash: await bcrypt.hash(password, 12) },
      });
    } catch (error) {
      if (error?.code === "P2002") {
        const conflict = new Error("That username is already in use.");
        conflict.status = 409;
        throw conflict;
      }
      throw error;
    }
    sendData(res, { user: serializeAdmin(user) }, 201);
  }),
);

router.patch(
  "/admins/:adminId",
  requireAuth,
  requirePermission(PERMISSIONS.MANAGE_ADMINS),
  asyncRoute(async (req, res) => {
    const existing = await getPrisma().adminUser.findUnique({
      where: { id: req.params.adminId },
    });
    if (!existing) {
      const error = new Error("Admin not found.");
      error.status = 404;
      throw error;
    }
    const data = {};
    if (Object.hasOwn(req.body || {}, "username"))
      data.username = validateUsername(req.body.username);
    if (Object.hasOwn(req.body || {}, "password")) {
      data.passwordHash = await bcrypt.hash(
        validatePassword(req.body.password),
        12,
      );
      data.tokenVersion = { increment: 1 };
    }
    if (Object.hasOwn(req.body || {}, "role")) {
      const role = String(req.body.role || "").toUpperCase();
      if (!Object.values(ADMIN_ROLES).includes(role)) {
        const error = new Error("A valid admin role is required.");
        error.status = 400;
        throw error;
      }
      data.role = role;
      data.tokenVersion = { increment: 1 };
    }
    if (!Object.keys(data).length) {
      const error = new Error("No supported changes were supplied.");
      error.status = 400;
      throw error;
    }
    let user;
    try {
      user = await getPrisma().adminUser.update({
        where: { id: existing.id },
        data,
      });
    } catch (error) {
      if (error?.code === "P2002") {
        const conflict = new Error("That username is already in use.");
        conflict.status = 409;
        throw conflict;
      }
      throw error;
    }
    sendData(res, { user: serializeAdmin(user) });
  }),
);

router.delete(
  "/admins/:adminId",
  requireAuth,
  requirePermission(PERMISSIONS.MANAGE_ADMINS),
  asyncRoute(async (req, res) => {
    const existing = await getPrisma().adminUser.findUnique({
      where: { id: req.params.adminId },
    });
    if (!existing) {
      const error = new Error("Admin not found.");
      error.status = 404;
      throw error;
    }
    if (existing.id === req.user.id) {
      const error = new Error("You cannot delete your own account.");
      error.status = 400;
      throw error;
    }
    if (
      existing.role === ADMIN_ROLES.SUPER &&
      (await getPrisma().adminUser.count({
        where: { role: ADMIN_ROLES.SUPER, active: true },
      })) <= 1
    ) {
      const error = new Error("At least one active Super admin is required.");
      error.status = 400;
      throw error;
    }
    await getPrisma().adminUser.delete({ where: { id: existing.id } });
    res.status(204).end();
  }),
);

export default router;
