import express from "express";
import crypto from "node:crypto";
import multer from "multer";
import fs from "node:fs/promises";
import { config } from "../config.js";
import { DETAIL_KEYS } from "../constants.js";
import {
  createCompany,
  deleteCompany,
  findCompany,
  getCompanyStats,
  getRootRecord,
  listCompanies,
  listDivisions,
  moveCompanyIfLocationChanged,
  readDetail,
  removeFile,
  saveCompany,
  saveRootRecord,
  saveUploadedFile,
  resolveStoredFile,
} from "../services/storage.js";
import { asyncRoute, sendData } from "../utils/http.js";
import { assertSafeDetailKey, assertSafeSegment, safeJoin } from "../utils/pathSafety.js";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.maxFileSize, files: 20 },
});

function normalizeCompanyPatch(payload, existing) {
  const next = { ...existing };
  const allowed = ["name", "incorporationDate", "status", "meetingProfile", "master", "meetings", "filings", "transfer", "certificates", "misc"];
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(payload || {}, key)) next[key] = payload[key];
  }
  next.id = existing.id;
  next.division = existing.division;
  return next;
}

router.get("/pfccl", asyncRoute(async (_req, res) => {
  const root = await getRootRecord();
  const stats = await getCompanyStats();
  sendData(res, { ...root, ...stats, stats });
}));

router.get("/divisions", asyncRoute(async (_req, res) => {
  sendData(res, await listDivisions());
}));

router.get("/divisions/:division/years/:year/companies", asyncRoute(async (req, res) => {
  assertSafeSegment(req.params.division, "division");
  const rawYear = String(req.params.year).toLowerCase();
  const year = rawYear === "all" ? "all" : Number(req.params.year);
  if (year !== "all" && (!Number.isInteger(year) || year < 1900 || year > 9999)) {
    const error = new Error("Invalid year.");
    error.status = 400;
    throw error;
  }
  const status = String(req.query.status || "ALL").toUpperCase();
  sendData(res, await listCompanies(req.params.division, year, status));
}));

router.get("/companies/:companyId", asyncRoute(async (req, res) => {
  const found = await findCompany(req.params.companyId);
  if (!found) {
    const error = new Error("Company not found.");
    error.status = 404;
    throw error;
  }
  sendData(res, found.company);
}));

router.get("/companies/:companyId/details/:detailKey", asyncRoute(async (req, res) => {
  assertSafeDetailKey(req.params.detailKey, DETAIL_KEYS);
  const found = await findCompany(req.params.companyId);
  if (!found) {
    const error = new Error("Company not found.");
    error.status = 404;
    throw error;
  }
  sendData(res, await readDetail(found.company, req.params.detailKey));
}));

router.post("/companies", asyncRoute(async (req, res) => {
  const company = await createCompany(req.body || {});
  sendData(res, company, 201);
}));

router.patch("/companies/:companyId", asyncRoute(async (req, res) => {
  const found = await findCompany(req.params.companyId);
  if (!found) {
    const error = new Error("Company not found.");
    error.status = 404;
    throw error;
  }

  const next = normalizeCompanyPatch(req.body || {}, found.company);
  await moveCompanyIfLocationChanged(found.company, next);
  await saveCompany(next);
  const refreshed = (await findCompany(req.params.companyId))?.company;
  sendData(res, refreshed);
}));

router.delete("/companies/:companyId", asyncRoute(async (req, res) => {
  const found = await findCompany(req.params.companyId);
  if (!found) {
    const error = new Error("Company not found.");
    error.status = 404;
    throw error;
  }
  await deleteCompany(found.company);
  res.status(204).end();
}));

router.post(
  "/companies/:companyId/details/:detailKey/files",
  upload.array("files", 20),
  asyncRoute(async (req, res) => {
    assertSafeDetailKey(req.params.detailKey, DETAIL_KEYS);
    const field = String(req.body?.field || "");
    if (!field) {
      const error = new Error("field is required.");
      error.status = 400;
      throw error;
    }
    const found = await findCompany(req.params.companyId);
    if (!found) {
      const error = new Error("Company not found.");
      error.status = 404;
      throw error;
    }
    const files = req.files || [];
    if (!files.length) {
      const error = new Error("At least one file is required.");
      error.status = 400;
      throw error;
    }

    let detail;
    for (const file of files) {
      const uploaded = {
        id: `file-${crypto.randomUUID()}`,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        buffer: file.buffer,
      };
      detail = await saveUploadedFile(found.company, req.params.detailKey, field, uploaded);
    }

    const updatedCompany = (await findCompany(req.params.companyId))?.company;
    sendData(res, { company: updatedCompany, detail }, 201);
  }),
);

router.delete(
  "/companies/:companyId/details/:detailKey/files/:fileId",
  asyncRoute(async (req, res) => {
    assertSafeDetailKey(req.params.detailKey, DETAIL_KEYS);
    assertSafeSegment(req.params.fileId, "file id");
    const field = String(req.body?.field || "");
    if (!field) {
      const error = new Error("field is required.");
      error.status = 400;
      throw error;
    }
    const found = await findCompany(req.params.companyId);
    if (!found) {
      const error = new Error("Company not found.");
      error.status = 404;
      throw error;
    }
    const detail = await removeFile(found.company, req.params.detailKey, field, req.params.fileId);
    const updatedCompany = (await findCompany(req.params.companyId))?.company;
    sendData(res, { company: updatedCompany, detail });
  }),
);

async function serveStoredFile(req, res) {
  assertSafeSegment(req.params.fileId, "file id");
  const resolved = await resolveStoredFile(req.params.fileId);
  if (!resolved) {
    const error = new Error("File not found.");
    error.status = 404;
    throw error;
  }
  try {
    await fs.access(resolved.filePath);
  } catch (accessError) {
    if (accessError.code === "ENOENT") {
      const error = new Error("File not found.");
      error.status = 404;
      throw error;
    }
    throw accessError;
  }
  const originalName = String(resolved.row.originalName || "file").replace(/[^a-zA-Z0-9._ -]/g, "_");
  res.setHeader("Content-Type", resolved.row.mimeType || "application/octet-stream");
  res.setHeader(
    "Content-Disposition",
    `${req.query.download === "1" ? "attachment" : "inline"}; filename="${originalName}"`,
  );
  if (req.method === "HEAD") {
    res.status(200).end();
    return;
  }
  res.sendFile(resolved.filePath);
}

router.get("/files/:fileId", asyncRoute(serveStoredFile));
router.head("/files/:fileId", asyncRoute(serveStoredFile));

router.get(
  "/files/:division/:year/:companyId/:detailDirectory/:fileName",
  asyncRoute(async (req, res) => {
    assertSafeSegment(req.params.division, "division");
    assertSafeSegment(req.params.year, "year");
    assertSafeSegment(req.params.companyId, "company id");
    assertSafeSegment(req.params.detailDirectory, "detail directory");
    assertSafeSegment(req.params.fileName, "file name");
    const filePath = safeJoin(
      config.storageRoot,
      req.params.division,
      req.params.year,
      req.params.companyId,
      req.params.detailDirectory,
      req.params.fileName,
    );
    try {
      await fs.access(filePath);
    } catch (error) {
      if (error.code === "ENOENT") {
        const missing = new Error("File not found.");
        missing.status = 404;
        throw missing;
      }
      throw error;
    }
    res.sendFile(filePath);
  }),
);

export default router;
