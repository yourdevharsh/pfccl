import fs from "node:fs/promises";
import crypto from "node:crypto";
import "dotenv/config";
import { config } from "../config.js";
import { DETAIL_DIRECTORIES, DETAIL_KEYS, DETAIL_PROPERTIES, DIVISIONS } from "../constants.js";
import { connectDatabase, disconnectDatabase, getPrisma } from "../services/prisma.js";
import { assertSafeSegment, safeJoin } from "../utils/pathSafety.js";
import { ensureDatabase, ensureStorage } from "../services/storage.js";

function parseDateOnly(value) {
  const raw = String(value || "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  const date = new Date(`${raw}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
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

  if (typeof value !== "object") return { value, files };

  const output = {};
  for (const [key, child] of Object.entries(value)) {
    if (key === "files" && Array.isArray(child)) {
      const fieldPath = pathParts.join(".") || "files";
      for (const record of child) files.push({ fieldPath, record });
      continue;
    }
    const result = stripFileArrays(child, [...pathParts, key], files);
    output[key] = result.value;
    files = result.files;
  }
  return { value: output, files };
}

function physicalNameFromRecord(record) {
  const raw = record?.url || "";
  try {
    const pathname = new URL(raw, "http://localhost").pathname;
    return decodeURIComponent(pathname.split("/").pop() || "");
  } catch {
    return decodeURIComponent(String(raw).split("/").pop() || "");
  }
}

async function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return fallback;
    throw error;
  }
}

async function discoverCompanies() {
  const result = [];
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
      const yearPath = safeJoin(divisionPath, yearEntry.name);
      const entries = await fs.readdir(yearPath, { withFileTypes: true });

      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        assertSafeSegment(entry.name, "company id");
        const companyPath = safeJoin(yearPath, entry.name);
        const company = await readJson(safeJoin(companyPath, "company.json"), null);
        if (!company) continue;
        result.push({ division, year: Number(yearEntry.name), company, companyPath });
      }
    }
  }
  return result;
}

async function migrateCompany(item) {
  const prisma = getPrisma();
  const company = item.company;
  const incorporationDate = parseDateOnly(company.incorporationDate);
  if (!incorporationDate) {
    console.warn(`Skipping ${item.company.id}: invalid incorporationDate.`);
    return;
  }

  const divisionId = item.division.id;
  await prisma.company.upsert({
    where: { id: company.id },
    update: {
      name: String(company.name || ""),
      incorporationDate,
      divisionId,
      status: String(company.status || company.master?.status || "ACTIVE").toUpperCase(),
      meetingProfile: String(company.meetingProfile || company.master?.meetingProfile || "STANDARD_120").toUpperCase(),
    },
    create: {
      id: company.id,
      name: String(company.name || ""),
      incorporationDate,
      divisionId,
      status: String(company.status || company.master?.status || "ACTIVE").toUpperCase(),
      meetingProfile: String(company.meetingProfile || company.master?.meetingProfile || "STANDARD_120").toUpperCase(),
    },
  });

  for (const detailKey of DETAIL_KEYS) {
    const property = DETAIL_PROPERTIES[detailKey];
    const stripped = stripFileArrays(company[property] || {}, [], []);

    await prisma.companyDetail.upsert({
      where: { companyId_detailKey: { companyId: company.id, detailKey } },
      update: { data: stripped.value },
      create: {
        companyId: company.id,
        detailKey,
        data: stripped.value,
      },
    });

    for (const { fieldPath, record } of stripped.files) {
      const physicalName = physicalNameFromRecord(record);
      if (!physicalName) {
        console.warn(`Skipping file ${record?.name || "unknown"} for ${company.id}: physical name not found.`);
        continue;
      }

      const physicalPath = safeJoin(
        item.companyPath,
        DETAIL_DIRECTORIES[detailKey],
        physicalName,
      );

      try {
        await fs.access(physicalPath);
      } catch {
        console.warn(`Skipping missing physical file ${physicalPath}`);
        continue;
      }

      const fileId = String(record?.id || `file-${crypto.randomUUID()}`);
      await prisma.storedFile.upsert({
        where: { id: fileId },
        update: {
          companyId: company.id,
          detailKey,
          fieldPath,
          originalName: String(record?.name || physicalName),
          physicalName,
          mimeType: String(record?.mimeType || "application/octet-stream"),
          size: Number(record?.size || 0),
        },
        create: {
          id: fileId,
          companyId: company.id,
          detailKey,
          fieldPath,
          originalName: String(record?.name || physicalName),
          physicalName,
          mimeType: String(record?.mimeType || "application/octet-stream"),
          size: Number(record?.size || 0),
        },
      });
    }
  }

  console.log(`Imported ${company.id} (${company.name}).`);
}

await ensureStorage();
await connectDatabase();
await ensureDatabase();

const companies = await discoverCompanies();
console.log(`Discovered ${companies.length} filesystem companies.`);

const prisma = getPrisma();
const existingCount = await prisma.company.count();

if (existingCount > 0) {
  console.log(`Database already contains ${existingCount} companies. No filesystem import was performed to avoid overwriting SQL data.`);
  await disconnectDatabase();
  process.exit(0);
}

for (const item of companies) {
  await migrateCompany(item);
}

console.log("Filesystem-to-PostgreSQL migration completed.");
await disconnectDatabase();
