import fs from "node:fs/promises";
import { PDFParse } from "pdf-parse";
import { config } from "../../config.js";
import { DETAIL_KEYS } from "../../constants.js";
import { findCompany, resolveStoredFile } from "../storage.js";
import {
  assertSafeDetailKey,
  assertSafeSegment,
} from "../../utils/pathSafety.js";
import { normalizeText } from "./aiUtils.js";

const pdfTextCache = new Map();

async function findSelectedPdf(selection) {
  if (!selection?.companyId || !selection?.detailKey || !selection?.fileId) {
    const error = new Error(
      "PDF selection is missing companyId, detailKey, or fileId.",
    );
    error.status = 400;
    throw error;
  }
  assertSafeSegment(selection.companyId, "company id");
  assertSafeDetailKey(selection.detailKey, DETAIL_KEYS);
  const resolved = await resolveStoredFile(selection.fileId);
  if (
    !resolved ||
    resolved.row.companyId !== selection.companyId ||
    resolved.row.detailKey !== selection.detailKey
  ) {
    const error = new Error(
      `Selected PDF "${selection.name || selection.fileId}" was not found in the repository.`,
    );
    error.status = 404;
    throw error;
  }
  if (selection.field && resolved.row.fieldPath !== selection.field) {
    const error = new Error(
      "Selected PDF no longer matches its original field.",
    );
    error.status = 409;
    throw error;
  }
  return {
    file: {
      id: resolved.row.id,
      name: resolved.row.originalName,
      mimeType: resolved.row.mimeType,
      size: resolved.row.size,
    },
    filePath: resolved.filePath,
    company: await (async () => {
      const found = await findCompany(selection.companyId);
      return found.company;
    })(),
  };
}

async function extractPdfRecord(fileRecord, companyId, detailKey) {
  if (!fileRecord?.id) return null;
  const resolved = await resolveStoredFile(fileRecord.id);
  if (
    !resolved ||
    resolved.row.companyId !== companyId ||
    resolved.row.detailKey !== detailKey
  )
    return null;
  try {
    await fs.access(resolved.filePath);
  } catch {
    return null;
  }
  const stat = await fs.stat(resolved.filePath);
  const cacheKey = `${resolved.row.id}:${stat.size}:${stat.mtimeMs}`;
  const cached = pdfTextCache.get(cacheKey);
  if (cached) return cached;
  const isPdf =
    String(resolved.row.mimeType || "").toLowerCase() === "application/pdf" ||
    /\.pdf$/i.test(resolved.row.originalName || "");
  if (!isPdf)
    return {
      name: resolved.row.originalName,
      text: "",
      pages: undefined,
      nonPdf: true,
      size: resolved.row.size,
      mimeType: resolved.row.mimeType,
    };
  const buffer = await fs.readFile(resolved.filePath);
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    const text = normalizeText(result.text, config.aiMaxPdfCharsPerFile);
    const entry = {
      name: resolved.row.originalName,
      text,
      pages: result.total ?? undefined,
      mimeType: resolved.row.mimeType,
    };
    pdfTextCache.set(cacheKey, entry);
    return entry;
  } finally {
    await parser.destroy();
  }
}

async function extractPdfText(selection) {
  const selected = await findSelectedPdf(selection);
  const pdf = await extractPdfRecord(
    selected.file,
    selection.companyId,
    selection.detailKey,
  );
  if (!pdf || pdf.nonPdf) {
    const error = new Error("The selected file is not a readable PDF.");
    error.status = 422;
    throw error;
  }
  return pdf;
}

export { findSelectedPdf, extractPdfRecord, extractPdfText };
