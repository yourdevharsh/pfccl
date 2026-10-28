import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { fileURLToPath } from "node:url";
import { config } from "../config.js";
import { getPrisma } from "./prisma.js";
import { ADMIN_ROLES, hasPermission, permissionsForRole } from "./authorization.js";

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const secretPath = path.join(backendRoot, ".jwt-secret");
const credentialsPath = path.join(backendRoot, ".admin-credentials");
const USERNAME_PATTERN = /^[a-zA-Z0-9._-]{3,64}$/;
const PASSWORD_MIN_LENGTH = 12;

function getJwtSecret() {
  if (config.jwtSecret) return config.jwtSecret;
  try {
    return fs.readFileSync(secretPath, "utf8").trim();
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    const secret = crypto.randomBytes(64).toString("base64url");
    fs.writeFileSync(secretPath, `${secret}\n`, { encoding: "utf8", mode: 0o600, flag: "wx" });
    return secret;
  }
}

export function validateUsername(username) {
  if (!USERNAME_PATTERN.test(String(username || ""))) {
    const error = new Error("Username must be 3–64 characters using letters, numbers, dots, underscores, or hyphens.");
    error.status = 400;
    throw error;
  }
  return String(username).trim();
}

export function validatePassword(password) {
  if (typeof password !== "string" || password.length < PASSWORD_MIN_LENGTH) {
    const error = new Error(`Password must be at least ${PASSWORD_MIN_LENGTH} characters.`);
    error.status = 400;
    throw error;
  }
  return password;
}

export function serializeAdmin(user) {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    active: user.active,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    permissions: permissionsForRole(user.role),
  };
}

export async function ensureInitialSuperAdmin() {
  const prisma = getPrisma();
  const count = await prisma.adminUser.count();
  if (count) return;

  const username = validateUsername(process.env.SUPER_ADMIN_USERNAME || "superadmin");
  const password = process.env.SUPER_ADMIN_PASSWORD || crypto.randomBytes(18).toString("base64url");
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.adminUser.create({
    data: { username, passwordHash, role: ADMIN_ROLES.SUPER },
  });

  // The one-time credential record is deliberately gitignored. Move it to a
  // password manager and delete it once the first sign-in is verified.
  try {
    fs.writeFileSync(
      credentialsPath,
      `PFCCL initial Super admin\nCreated: ${new Date().toISOString()}\nUsername: ${username}\nPassword: ${password}\n\nStore this in a password manager, then delete this file.\n`,
      { encoding: "utf8", mode: 0o600, flag: "wx" },
    );
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
  }
}

export function createAccessToken(user) {
  return jwt.sign(
    { sub: user.id, username: user.username, role: user.role, tokenVersion: user.tokenVersion },
    getJwtSecret(),
    { algorithm: "HS256", expiresIn: config.jwtExpiresIn, issuer: "pfccl-repository", audience: "pfccl-web" },
  );
}

export async function authenticateToken(token) {
  let payload;
  try {
    payload = jwt.verify(token, getJwtSecret(), { algorithms: ["HS256"], issuer: "pfccl-repository", audience: "pfccl-web" });
  } catch {
    return null;
  }
  const user = await getPrisma().adminUser.findUnique({ where: { id: payload.sub } });
  if (!user || !user.active || user.tokenVersion !== payload.tokenVersion) return null;
  return user;
}

export async function verifyCredentials(username, password) {
  const normalizedUsername = validateUsername(username);
  const user = await getPrisma().adminUser.findUnique({ where: { username: normalizedUsername } });
  if (!user || !user.active || !(await bcrypt.compare(String(password || ""), user.passwordHash))) return null;
  return user;
}

export function requireAuth(req, res, next) {
  const cookieToken = String(req.headers.cookie || "").split(";").map((part) => part.trim()).find((part) => part.startsWith("pfccl_access="))?.slice("pfccl_access=".length);
  const token = cookieToken || req.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ error: "Authentication required.", message: "Authentication required." });
  authenticateToken(token).then((user) => {
    if (!user) return res.status(401).json({ error: "Your session is invalid or has expired.", message: "Your session is invalid or has expired." });
    req.user = user;
    next();
  }).catch(next);
}

export function requirePermission(permission) {
  return (req, res, next) => {
    if (!hasPermission(req.user?.role, permission)) {
      return res.status(403).json({ error: "You do not have permission to perform this action.", message: "You do not have permission to perform this action." });
    }
    next();
  };
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: "lax",
    maxAge: config.jwtCookieMaxAgeMs,
    path: "/",
  };
}
