import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { config } from "../config.js";
import { DETAIL_DIRECTORIES, DETAIL_KEYS, DETAIL_PROPERTIES, DIVISIONS } from "../constants.js";
import { readJson, writeJson } from "../utils/json.js";
import { assertSafeDetailKey, assertSafeSegment, safeJoin, sanitizeFileName } from "../utils/pathSafety.js";

function companyYear(company) {
  const year = Number.parseInt(String(company.incorporationDate || "").slice(0, 4), 10);
  return Number.isInteger(year) ? year : null;
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

export async function getRootRecord() {
  const file = safeJoin(config.storageRoot, "repository.json");
  const saved = await readJson(file, null);
  if (saved) return saved;

  const root = { id: "pfccl", name: "PFCCL" };
  await writeJson(file, root);
  return root;
}

export async function saveRootRecord(root) {
  await writeJson(safeJoin(config.storageRoot, "repository.json"), root);
  return root;
}

export async function listCompanies(division, year) {
  assertSafeSegment(division, "division");
  if (!DIVISIONS.some((item) => item.id === division)) {
    const error = new Error("Unknown division.");
    error.status = 404;
    throw error;
  }
  const yearPath = safeJoin(config.storageRoot, division, String(year));
  let entries;
  try {
    entries = await fs.readdir(yearPath, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }

  const result = [];
  for (const entry of entries) {
    if (!entry.isDirectory() || !/^[a-zA-Z0-9._-]+$/.test(entry.name)) continue;
    const company = await readJson(safeJoin(yearPath, entry.name, "company.json"), null);
    if (!company) continue;
    result.push(lightweightCompany(company));
  }
  return result.sort((a, b) => a.name.localeCompare(b.name));
}

export async function readCompanyByPath(division, year, companyId) {
  const file = safeJoin(companyPathByValues(division, year, companyId), "company.json");
  return readJson(file, null);
}

export async function findCompany(companyId) {
  assertSafeSegment(companyId, "company id");
  for (const division of DIVISIONS) {
    const divisionPath = safeJoin(config.storageRoot, division.id);
    let years;
    try {
      years = await fs.readdir(divisionPath, { withFileTypes: true });
    } catch (error) {
      if (error.code === "ENOENT") continue;
      throw error;
    }
    for (const yearEntry of years) {
      if (!yearEntry.isDirectory() || !/^\d{4}$/.test(yearEntry.name)) continue;
      const company = await readCompanyByPath(division.id, Number(yearEntry.name), companyId);
      if (company) return { company, division: division.id, year: Number(yearEntry.name) };
    }
  }
  return null;
}

export function lightweightCompany(company) {
  return {
    id: company.id,
    name: company.name,
    division: company.division,
    incorporationDate: company.incorporationDate,
  };
}

export async function createCompany(payload) {
  const division = assertSafeSegment(String(payload?.division || ""), "division");
  if (!DIVISIONS.some((item) => item.id === division)) {
    const error = new Error("Unknown division.");
    error.status = 400;
    throw error;
  }

  const incorporationDate = String(payload?.incorporationDate || "");
  const parsedDate = new Date(`${incorporationDate}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(incorporationDate) || Number.isNaN(parsedDate.getTime())) {
    const error = new Error("incorporationDate must be a valid YYYY-MM-DD date.");
    error.status = 400;
    throw error;
  }

  const id = `company-${crypto.randomUUID()}`;
  const year = parsedDate.getUTCFullYear();
  const company = {
    id,
    name: payload.name || `New ${division.toUpperCase()} Company`,
    division,
    incorporationDate,
    master: {},
    meetings: { bm: { numberOfMeetings: 0 } },
    filings: {},
    transfer: {},
    certificates: {},
    misc: {},
  };

  const base = companyPathByValues(division, year, id);
  await fs.mkdir(base, { recursive: true });
  await Promise.all(
    DETAIL_KEYS.map((key) => fs.mkdir(safeJoin(base, DETAIL_DIRECTORIES[key]), { recursive: true })),
  );
  await writeJson(safeJoin(base, "company.json"), company);
  return company;
}

export async function saveCompany(company) {
  const base = companyPath(company);
  await fs.mkdir(base, { recursive: true });
  await writeJson(safeJoin(base, "company.json"), company);
  return company;
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
}

function normalizeDetailField(detailKey, field) {
  const property = DETAIL_PROPERTIES[detailKey];
  const value = String(field || "").trim();

  // The detail endpoint already operates on the detail object. Accept both
  // `roc.incorporation` and the older `filings.roc.incorporation` form so
  // existing clients/data do not break.
  const prefix = `${property}.`;
  return value.startsWith(prefix) ? value.slice(prefix.length) : value;
}

function normalizeLegacyDetailShape(company, detailKey) {
  const property = DETAIL_PROPERTIES[detailKey];
  const existing = company[property];
  if (!existing || typeof existing !== "object" || Array.isArray(existing)) {
    return { detail: existing ?? {}, changed: false };
  }

  // Older uploads accidentally stored e.g.
  // company.filings.filings.roc.incorporation instead of
  // company.filings.roc.incorporation. Flatten that shape once and persist
  // it, while preserving the actual uploaded file metadata.
  if (existing[property] && typeof existing[property] === "object" && !Array.isArray(existing[property])) {
    const flattened = { ...existing[property], ...Object.fromEntries(
      Object.entries(existing).filter(([key]) => key !== property),
    ) };
    company[property] = flattened;
    return { detail: flattened, changed: true };
  }

  return { detail: existing, changed: false };
}

export async function readDetail(company, detailKey) {
  assertSafeDetailKey(detailKey, DETAIL_KEYS);
  const { detail, changed } = normalizeLegacyDetailShape(company, detailKey);
  if (changed) await saveCompany(company);
  return detail ?? {};
}

export async function writeDetail(company, detailKey, detailData) {
  const property = DETAIL_PROPERTIES[detailKey];
  const next = detailData ?? {};
  company[property] = next;
  await saveCompany(company);
  return next;
}

export async function saveUploadedFile(company, detailKey, field, uploadedFile) {
  assertSafeDetailKey(detailKey, DETAIL_KEYS);
  field = normalizeDetailField(detailKey, field);
  if (!field || typeof field !== "string" || field.includes("..")) {
    const error = new Error("Invalid file field.");
    error.status = 400;
    throw error;
  }
  const { detail } = normalizeLegacyDetailShape(company, detailKey);
  const base = detailPath(company, detailKey);
  const physicalName = `${uploadedFile.id}-${sanitizeFileName(uploadedFile.originalname)}`;
  const filePath = safeJoin(base, physicalName);
  await fs.mkdir(base, { recursive: true });
  await fs.writeFile(filePath, uploadedFile.buffer);

  const property = DETAIL_PROPERTIES[detailKey];
  setFilesAtPath(detail, field, [
    ...(getFilesAtPath(detail, field) || []),
    {
      id: uploadedFile.id,
      name: uploadedFile.originalname,
      url: buildFileUrl(company, detailKey, physicalName),
      mimeType: uploadedFile.mimetype || "application/octet-stream",
      size: uploadedFile.size,
    },
  ]);
  company[property] = detail;
  await saveCompany(company);
  return company[property];
}

export async function removeFile(company, detailKey, field, fileId) {
  assertSafeDetailKey(detailKey, DETAIL_KEYS);
  assertSafeSegment(fileId, "file id");
  field = normalizeDetailField(detailKey, field);
  const property = DETAIL_PROPERTIES[detailKey];
  const { detail } = normalizeLegacyDetailShape(company, detailKey);
  const files = getFilesAtPath(detail, field) || [];
  const target = files.find((item) => item?.id === fileId);
  if (!target) {
    const error = new Error("File not found.");
    error.status = 404;
    throw error;
  }

  const physicalName = target.url?.split("/").pop();
  if (physicalName) {
    await fs.rm(safeJoin(detailPath(company, detailKey), physicalName), { force: true });
  }

  setFilesAtPath(detail, field, files.filter((item) => item?.id !== fileId));
  company[property] = detail;
  await saveCompany(company);
  return company[property];
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

export function buildFileUrl(company, detailKey, physicalName) {
  const relative = `/api/files/${encodeURIComponent(company.division)}/${encodeURIComponent(String(companyYear(company)))}/${encodeURIComponent(company.id)}/${encodeURIComponent(DETAIL_DIRECTORIES[detailKey])}/${encodeURIComponent(physicalName)}`;
  return config.publicBaseUrl ? `${config.publicBaseUrl}${relative}` : relative;
}

export async function getCompanyStats() {
  let total = 0;
  const byDivision = {};
  for (const division of DIVISIONS) {
    byDivision[division.id] = 0;
    const divisionPath = safeJoin(config.storageRoot, division.id);
    let yearEntries = [];
    try {
      yearEntries = await fs.readdir(divisionPath, { withFileTypes: true });
    } catch (error) {
      if (error.code === "ENOENT") continue;
      throw error;
    }
    for (const entry of yearEntries) {
      if (!entry.isDirectory() || !/^\d{4}$/.test(entry.name)) continue;
      const companies = await listCompanies(division.id, Number(entry.name));
      byDivision[division.id] += companies.length;
    }
    total += byDivision[division.id];
  }
  return { totalCompanies: total, umppCompanies: byDivision.umpp || 0, itpCompanies: byDivision.itp || 0 };
}
