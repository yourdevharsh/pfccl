import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { config } from "../config.js";
import { DETAIL_DIRECTORIES, DETAIL_KEYS, DETAIL_PROPERTIES, DIVISIONS } from "../constants.js";
import { getPrisma } from "./prisma.js";
import { assertSafeDetailKey, assertSafeSegment, safeJoin, sanitizeFileName } from "../utils/pathSafety.js";

const DIVISION_SEED = DIVISIONS;

function companyYear(company) {
  const raw = company?.incorporationDate;
  const year = raw instanceof Date
    ? raw.getUTCFullYear()
    : Number.parseInt(String(raw || "").slice(0, 4), 10);
  return Number.isInteger(year) ? year : null;
}

function formatDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function parseDateOnly(value) {
  const raw = String(value || "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  const date = new Date(`${raw}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function companyPathByValues(division, year, companyId) {
  assertSafeSegment(division, "division");
  assertSafeSegment(String(year), "year");
  assertSafeSegment(companyId, "company id");
  return safeJoin(config.storageRoot, division, String(year), companyId);
}

export function companyPath(company) {
  const year = companyYear(company);
  if (!year) {
    const error = new Error("Company has an invalid incorporation date.");
    error.status = 422;
    throw error;
  }
  return companyPathByValues(company.division, year, company.id);
}

export function detailPath(company, detailKey) {
  assertSafeDetailKey(detailKey, DETAIL_KEYS);
  return safeJoin(companyPath(company), DETAIL_DIRECTORIES[detailKey]);
}

export async function ensureStorage() {
  await fs.mkdir(config.storageRoot, { recursive: true });
  for (const division of DIVISIONS) {
    await fs.mkdir(safeJoin(config.storageRoot, division.id), { recursive: true });
  }
}

export async function ensureDatabase() {
  const prisma = getPrisma();
  await prisma.repositoryMeta.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, name: "PFCCL" },
  });

  for (const division of DIVISION_SEED) {
    await prisma.division.upsert({
      where: { id: division.id },
      update: { name: division.name },
      create: { id: division.id, name: division.name },
    });
  }
}

export async function getRootRecord() {
  const prisma = getPrisma();
  const root = await prisma.repositoryMeta.findUnique({ where: { id: 1 } });
  return root
    ? { id: "pfccl", name: root.name }
    : { id: "pfccl", name: "PFCCL" };
}

export async function saveRootRecord(root) {
  const prisma = getPrisma();
  await prisma.repositoryMeta.upsert({
    where: { id: 1 },
    update: { name: root?.name || "PFCCL" },
    create: { id: 1, name: root?.name || "PFCCL" },
  });
  return getRootRecord();
}

export async function listDivisions() {
  const prisma = getPrisma();
  return prisma.division.findMany({
    orderBy: { id: "asc" },
    select: { id: true, name: true },
  });
}

function toLightweightCompany(row) {
  return {
    id: row.id,
    name: row.name,
    division: row.divisionId,
    status: row.status || "ACTIVE",
    meetingProfile: row.meetingProfile || "STANDARD_120",
    incorporationDate: formatDate(row.incorporationDate),
  };
}

async function getStoredFilesForCompany(companyId, detailKey) {
  const prisma = getPrisma();
  return prisma.storedFile.findMany({
    where: { companyId, detailKey },
    orderBy: [{ fieldPath: "asc" }, { createdAt: "asc" }, { id: "asc" }],
  });
}

function cloneValue(value) {
  if (value === undefined) return {};
  return JSON.parse(JSON.stringify(value));
}

export function getFilesAtPath(object, pathExpression) {
  const pathParts = String(pathExpression).split(".").filter(Boolean);
  let current = object;
  for (const part of pathParts) {
    if (!current || typeof current !== "object") return undefined;
    current = current[part];
  }
  if (current && typeof current === "object" && Array.isArray(current.files)) return current.files;
  if (Array.isArray(current)) return current;
  return undefined;
}

export function setFilesAtPath(object, pathExpression, files) {
  const pathParts = String(pathExpression).split(".").filter(Boolean);
  if (!pathParts.length) {
    throw new Error("Invalid file field path.");
  }
  let current = object;
  for (let index = 0; index < pathParts.length; index += 1) {
    const part = pathParts[index];
    const isLast = index === pathParts.length - 1;
    if (isLast) {
      const existing = current[part];
      if (existing && typeof existing === "object" && !Array.isArray(existing)) {
        current[part] = { ...existing, files };
      } else {
        current[part] = { files };
      }
      return;
    }
    if (!current[part] || typeof current[part] !== "object" || Array.isArray(current[part])) {
      current[part] = {};
    }
    current = current[part];
  }
}

function stripFileArrays(value, pathParts = [], files = []) {
  if (value === null || value === undefined) return { value, files };

  if (Array.isArray(value)) {
    const output = [];
    for (const item of value) {
      const result = stripFileArrays(item, pathParts, files);
      output.push(result.value);
      files = result.files;
    }
    return { value: output, files };
  }

  if (typeof value !== "object") {
    return { value, files };
  }

  const output = {};
  for (const [key, child] of Object.entries(value)) {
    if (key === "files" && Array.isArray(child)) {
      const fieldPath = pathParts.join(".") || "files";
      for (const record of child) {
        files.push({ fieldPath, record });
      }
      continue;
    }
    const result = stripFileArrays(child, [...pathParts, key], files);
    output[key] = result.value;
    files = result.files;
  }
  return { value: output, files };
}

function buildFileRecordPayload(company, detailKey, row) {
  return {
    id: row.id,
    name: row.originalName,
    url: buildFileUrl(company, detailKey, row.physicalName),
    mimeType: row.mimeType,
    size: row.size,
  };
}

async function hydrateDetail(company, detailKey, data) {
  const detail = cloneValue(data || {});
  const storedFiles = await getStoredFilesForCompany(company.id, detailKey);
  for (const row of storedFiles) {
    const existing = getFilesAtPath(detail, row.fieldPath) || [];
    existing.push(buildFileRecordPayload(company, detailKey, row));
    setFilesAtPath(detail, row.fieldPath, existing);
  }
  return detail;
}

async function hydrateCompany(row) {
  const details = {};
  const detailRows = await getPrisma().companyDetail.findMany({
    where: { companyId: row.id },
  });
  const byKey = new Map(detailRows.map((item) => [item.detailKey, item.data]));
  for (const key of DETAIL_KEYS) {
    details[key] = await hydrateDetail(row, key, byKey.get(key) || {});
  }

  return {
    id: row.id,
    name: row.name,
    division: row.divisionId,
    incorporationDate: formatDate(row.incorporationDate),
    status: row.status || "ACTIVE",
    meetingProfile: row.meetingProfile || "STANDARD_120",
    master: details["master-data"],
    meetings: details.meetings,
    filings: details.filings,
    transfer: details.transfer,
    certificates: details.certificates,
    misc: details.miscellaneous,
  };
}

export async function listCompanies(division, year, status = "ALL") {
  assertSafeSegment(division, "division");
  const prisma = getPrisma();
  const divisionRow = await prisma.division.findUnique({ where: { id: division } });
  if (!divisionRow) {
    const error = new Error("Unknown division.");
    error.status = 404;
    throw error;
  }
  const where = { divisionId: division };
  if (String(year).toLowerCase() !== "all") {
    const numericYear = Number(year);
    const start = new Date(Date.UTC(numericYear, 0, 1));
    const end = new Date(Date.UTC(numericYear + 1, 0, 1));
    where.incorporationDate = { gte: start, lt: end };
  }
  if (status && String(status).toUpperCase() !== "ALL") {
    where.status = String(status).toUpperCase();
  }
  const rows = await prisma.company.findMany({
    where,
    orderBy: { name: "asc" },
  });
  return rows.map(toLightweightCompany);
}

async function readCompanyRow(companyId) {
  assertSafeSegment(companyId, "company id");
  return getPrisma().company.findUnique({ where: { id: companyId } });
}

export async function findCompany(companyId) {
  const row = await readCompanyRow(companyId);
  if (!row) return null;
  return {
    company: await hydrateCompany(row),
    division: row.divisionId,
    year: row.incorporationDate.getUTCFullYear(),
  };
}

export async function createCompany(payload) {
  const division = assertSafeSegment(String(payload?.division || ""), "division");
  const incorporationDate = parseDateOnly(payload?.incorporationDate);
  if (!incorporationDate) {
    const error = new Error("incorporationDate must be a valid YYYY-MM-DD date.");
    error.status = 400;
    throw error;
  }

  const prisma = getPrisma();
  const divisionRow = await prisma.division.findUnique({ where: { id: division } });
  if (!divisionRow) {
    const error = new Error("Unknown division.");
    error.status = 400;
    throw error;
  }

  const id = `company-${crypto.randomUUID()}`;
  const details = {
    "master-data": cloneValue(payload.master || {}),
    meetings: cloneValue(payload.meetings || { bm: { numberOfMeetings: 0 } }),
    filings: cloneValue(payload.filings || {}),
    transfer: cloneValue(payload.transfer || {}),
    certificates: cloneValue(payload.certificates || {}),
    miscellaneous: cloneValue(payload.misc || {}),
  };

  const sanitized = {};
  const detachedFiles = [];
  for (const key of DETAIL_KEYS) {
    const stripped = stripFileArrays(details[key], [], []);
    sanitized[key] = stripped.value;
    detachedFiles.push(...stripped.files.map(({ fieldPath, record }) => ({ key, fieldPath, record })));
  }

  // New companies normally have no file metadata because files arrive through
  // the dedicated upload endpoint. We reject embedded file metadata here rather
  // than pretending the physical file exists.
  if (detachedFiles.length) {
    const error = new Error("File metadata cannot be created through the company endpoint. Upload files through the dedicated file endpoint.");
    error.status = 400;
    throw error;
  }

  const row = await prisma.company.create({
    data: {
      id,
      name: String(payload?.name || `New ${division.toUpperCase()} Company`),
      divisionId: division,
      incorporationDate,
      status: String(payload?.status || "ACTIVE").toUpperCase(),
      meetingProfile: String(payload?.meetingProfile || "STANDARD_120").toUpperCase(),
      details: {
        create: DETAIL_KEYS.map((key) => ({
          detailKey: key,
          data: sanitized[key],
        })),
      },
    },
    include: { division: true },
  });

  try {
    const base = companyPath(rowToCompanyShape(row));
    await fs.mkdir(base, { recursive: true });
    await Promise.all(
      DETAIL_KEYS.map((key) => fs.mkdir(safeJoin(base, DETAIL_DIRECTORIES[key]), { recursive: true })),
    );
  } catch (error) {
    await prisma.company.delete({ where: { id } }).catch(() => {});
    throw error;
  }

  return hydrateCompany(row);
}

function rowToCompanyShape(row) {
  return {
    id: row.id,
    division: row.divisionId,
    incorporationDate: row.incorporationDate,
  };
}

async function syncCompanyDetailsFromPayload(companyId, payload) {
  const prisma = getPrisma();
  const map = {
    master: "master-data",
    meetings: "meetings",
    filings: "filings",
    transfer: "transfer",
    certificates: "certificates",
    misc: "miscellaneous",
  };

  for (const [property, detailKey] of Object.entries(map)) {
    if (!Object.prototype.hasOwnProperty.call(payload, property)) continue;
    const stripped = stripFileArrays(payload[property] ?? {}, [], []);
    await prisma.companyDetail.upsert({
      where: { companyId_detailKey: { companyId, detailKey } },
      update: { data: stripped.value },
      create: { companyId, detailKey, data: stripped.value },
    });
  }
}

export async function saveCompany(company) {
  const parsedDate = parseDateOnly(company.incorporationDate);
  if (!parsedDate) {
    const error = new Error("Company has an invalid incorporationDate.");
    error.status = 422;
    throw error;
  }

  const prisma = getPrisma();
  await prisma.company.update({
    where: { id: company.id },
    data: {
      name: String(company.name || ""),
      incorporationDate: parsedDate,
      status: String(company.status || "ACTIVE").toUpperCase(),
      meetingProfile: String(company.meetingProfile || "STANDARD_120").toUpperCase(),
    },
  });
  await syncCompanyDetailsFromPayload(company.id, company);
  const refreshed = await readCompanyRow(company.id);
  return hydrateCompany(refreshed);
}

export async function moveCompanyIfLocationChanged(previous, next) {
  const oldBase = companyPath(previous);
  const newBase = companyPath(next);
  if (oldBase === newBase) return;

  await fs.mkdir(path.dirname(newBase), { recursive: true });
  try {
    await fs.access(newBase);
    const error = new Error("The target company storage location already exists.");
    error.status = 409;
    throw error;
  } catch (error) {
    if (error.status) throw error;
    if (error.code !== "ENOENT") throw error;
  }

  await fs.rename(oldBase, newBase);
}

export async function deleteCompany(company) {
  await fs.rm(companyPath(company), { recursive: true, force: true });
  await getPrisma().company.delete({ where: { id: company.id } });
}

function normalizeDetailField(detailKey, field) {
  const property = DETAIL_PROPERTIES[detailKey];
  const value = String(field || "").trim();
  const prefix = `${property}.`;
  return value.startsWith(prefix) ? value.slice(prefix.length) : value;
}

export async function readDetail(company, detailKey) {
  assertSafeDetailKey(detailKey, DETAIL_KEYS);
  const row = await getPrisma().companyDetail.findUnique({
    where: { companyId_detailKey: { companyId: company.id, detailKey } },
  });
  return hydrateDetail(company, detailKey, row?.data || {});
}

export async function writeDetail(company, detailKey, detailData) {
  assertSafeDetailKey(detailKey, DETAIL_KEYS);
  const stripped = stripFileArrays(detailData || {}, [], []);
  await getPrisma().companyDetail.upsert({
    where: { companyId_detailKey: { companyId: company.id, detailKey } },
    update: { data: stripped.value },
    create: { companyId: company.id, detailKey, data: stripped.value },
  });
  return readDetail(company, detailKey);
}

export async function saveUploadedFile(company, detailKey, field, uploadedFile) {
  assertSafeDetailKey(detailKey, DETAIL_KEYS);
  field = normalizeDetailField(detailKey, field);
  if (!field || typeof field !== "string" || field.includes("..")) {
    const error = new Error("Invalid file field.");
    error.status = 400;
    throw error;
  }

  const base = detailPath(company, detailKey);
  const physicalName = `${uploadedFile.id}-${sanitizeFileName(uploadedFile.originalname)}`;
  const filePath = safeJoin(base, physicalName);
  await fs.mkdir(base, { recursive: true });
  await fs.writeFile(filePath, uploadedFile.buffer);

  const prisma = getPrisma();
  try {
    await prisma.storedFile.create({
      data: {
        id: uploadedFile.id,
        companyId: company.id,
        detailKey,
        fieldPath: field,
        originalName: uploadedFile.originalname,
        physicalName,
        mimeType: uploadedFile.mimetype || "application/octet-stream",
        size: uploadedFile.size || 0,
      },
    });
  } catch (error) {
    await fs.rm(filePath, { force: true });
    throw error;
  }

  return readDetail(company, detailKey);
}

export async function removeFile(company, detailKey, field, fileId) {
  assertSafeDetailKey(detailKey, DETAIL_KEYS);
  assertSafeSegment(fileId, "file id");
  field = normalizeDetailField(detailKey, field);

  const prisma = getPrisma();
  const target = await prisma.storedFile.findFirst({
    where: {
      id: fileId,
      companyId: company.id,
      detailKey,
      fieldPath: field,
    },
  });
  if (!target) {
    const error = new Error("File not found.");
    error.status = 404;
    throw error;
  }

  await fs.rm(safeJoin(detailPath(company, detailKey), target.physicalName), { force: true });
  await prisma.storedFile.delete({ where: { id: target.id } });
  return readDetail(company, detailKey);
}

export function buildFileUrl(company, detailKey, physicalName) {
  const relative = `/api/files/${encodeURIComponent(company.division)}/${encodeURIComponent(String(companyYear(company)))}/${encodeURIComponent(company.id)}/${encodeURIComponent(DETAIL_DIRECTORIES[detailKey])}/${encodeURIComponent(physicalName)}`;
  return config.publicBaseUrl ? `${config.publicBaseUrl}${relative}` : relative;
}

export async function getCompanyStats() {
  const prisma = getPrisma();
  const [totalCompanies, umppCompanies, itpCompanies] = await Promise.all([
    prisma.company.count(),
    prisma.company.count({ where: { divisionId: "umpp" } }),
    prisma.company.count({ where: { divisionId: "itp" } }),
  ]);
  return { totalCompanies, umppCompanies, itpCompanies };
}

export async function findStoredFile(fileId) {
  assertSafeSegment(fileId, "file id");
  return getPrisma().storedFile.findUnique({ where: { id: fileId } });
}
