import { normalizeText, formatAiDate } from "./aiUtils.js";
import { config } from "../../config.js";
import { extractPdfRecord } from "./pdfService.js";
import { getPrisma } from "../prisma.js";

async function collectDetailContext(company, detailKey, detailValue) {
  const blocks = [];

  async function visit(value, pathParts) {
    if (value === null || value === undefined) return;
    if (Array.isArray(value)) {
      for (let index = 0; index < value.length; index += 1)
        await visit(value[index], [...pathParts, String(index)]);
      return;
    }
    if (typeof value !== "object") {
      const label = pathParts.join(".") || "value";
      blocks.push(
        `FIELD NAME: ${label}\nFIELD VALUE: ${normalizeText(value, config.aiMaxElementChars) || "(empty)"}`,
      );
      return;
    }
    if (Array.isArray(value.files)) {
      const fieldPath = pathParts.join(".") || "files";
      for (const file of value.files) {
        const name = normalizeText(
          file?.name ||
            file?.originalName ||
            file?.originalname ||
            "Unnamed file",
          500,
        );
        const isPdf =
          String(file?.mimeType || file?.mimetype || "").toLowerCase() ===
            "application/pdf" || /\.pdf$/i.test(name);
        if (!file?.id) {
          blocks.push(
            `FILE FIELD: ${fieldPath}\nFILE NAME: ${name}\nFILE STATUS: Legacy metadata without a file record.`,
          );
          continue;
        }
        const pdf = isPdf
          ? await extractPdfRecord(file, company.id, detailKey)
          : await extractPdfRecord(file, company.id, detailKey);
        if (!pdf) {
          blocks.push(
            `FILE FIELD: ${fieldPath}\nFILE NAME: ${name}\nFILE STATUS: Stored file could not be read.`,
          );
          continue;
        }
        if (pdf.nonPdf) {
          blocks.push(
            `FILE FIELD: ${fieldPath}\nFILE NAME: ${name}\nFILE TYPE: ${normalizeText(pdf.mimeType || "unknown", 120)}\nFILE SIZE: ${Number(pdf.size || 0)} bytes`,
          );
          continue;
        }
        blocks.push(
          `FILE FIELD: ${fieldPath}\nFILE NAME: ${pdf.name}\nFILE TYPE: PDF\nEXTRACTED TEXT:\n${pdf.text || "(No extractable text was found in this PDF.)"}`,
        );
      }
      return;
    }
    for (const [key, child] of Object.entries(value))
      await visit(child, [...pathParts, key]);
  }

  await visit(detailValue, []);
  return blocks;
}

async function collectStructuredMeetingsContext(companyId) {
  const prisma = getPrisma();
  const meetings = await prisma.meeting.findMany({
    where: { companyId },
    orderBy: [{ scheduledDate: "desc" }, { heldDate: "desc" }],
  });
  const blocks = [];
  for (const meeting of meetings) {
    const lines = [
      `Meeting ID: ${meeting.id}`,
      `Type: ${meeting.type}`,
      `Meeting Number: ${meeting.meetingNumber || "(not recorded)"}`,
      `Scheduled Date: ${meeting.scheduledDate ? formatAiDate(meeting.scheduledDate) : "(not recorded)"}`,
      `Held Date: ${meeting.heldDate ? formatAiDate(meeting.heldDate) : "(not recorded)"}`,
      `Status: ${meeting.status}`,
      `Early Conducted: ${meeting.earlyConducted ? "Yes" : "No"}`,
      `Notice Sent: ${meeting.noticeSentDate ? formatAiDate(meeting.noticeSentDate) : "(not recorded)"}`,
      `Agenda Sent: ${meeting.agendaSentDate ? formatAiDate(meeting.agendaSentDate) : "(not recorded)"}`,
      `Attendance: ${meeting.attendanceDate ? formatAiDate(meeting.attendanceDate) : "(not recorded)"}`,
      `Draft Minutes Circulated: ${meeting.minutesCirculatedDate ? formatAiDate(meeting.minutesCirculatedDate) : "(not recorded)"}`,
      `Comments Received: ${meeting.commentsReceivedDate ? formatAiDate(meeting.commentsReceivedDate) : "(not recorded)"}`,
      `Final Minutes: ${meeting.finalMinutesDate ? formatAiDate(meeting.finalMinutesDate) : "(not recorded)"}`,
      `Notes: ${normalizeText(meeting.notes || "", config.aiMaxElementChars) || "(none)"}`,
    ];
    const files = await prisma.storedFile.findMany({
      where: {
        companyId,
        detailKey: "meetings",
        fieldPath: { startsWith: `meeting.${meeting.id}.` },
      },
      orderBy: { createdAt: "asc" },
    });
    for (const file of files) {
      const extracted = await extractPdfRecord(file, companyId, "meetings");
      if (!extracted) continue;
      lines.push(`Document: ${extracted.name}`);
      if (extracted.nonPdf)
        lines.push(
          `Document type: ${extracted.mimeType || "unknown"}; size: ${extracted.size || 0} bytes`,
        );
      else
        lines.push(
          `Document text:\n${extracted.text || "(No extractable text.)"}`,
        );
    }
    blocks.push(lines.join("\n"));
  }
  return blocks;
}

export { collectDetailContext, collectStructuredMeetingsContext };
