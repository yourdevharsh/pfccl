import fs from "node:fs/promises";
import { getPrisma } from "../prisma.js";
import { parseDateOnly, formatDate } from "./meetingDates.js";
import { hydrateMeeting } from "./meetingSerializer.js";
import { normalizeMeetingInput } from "./meetingValidation.js";
import { nextMeetingNumber } from "./meetingRepository.js";
import {
  isMonitoredCompany,
  calculateBoardDueDate,
} from "./boardMeetingService.js";
import { detailPath, resolveStoredFile } from "../storage.js";
import { safeJoin } from "../../utils/pathSafety.js";

async function validateHalfYearSpacing(company, meetingData, excludeMeetingId) {
  if (
    meetingData.type !== "BOARD" ||
    meetingData.status !== "HELD" ||
    !meetingData.heldDate ||
    String(company.meetingProfile || "STANDARD_120").toUpperCase() !==
      "HALF_YEAR_90"
  )
    return;

  const rows = await getPrisma().meeting.findMany({
    where: {
      companyId: company.id,
      type: "BOARD",
      status: "HELD",
      heldDate: { not: null },
      ...(excludeMeetingId ? { NOT: { id: excludeMeetingId } } : {}),
    },
    select: { heldDate: true },
  });
  if (
    rows.some(
      (row) =>
        Math.abs(meetingData.heldDate.getTime() - row.heldDate.getTime()) <
        90 * 86400000,
    )
  ) {
    const error = new Error(
      "For the half-year profile, Board Meetings must be at least 90 days apart.",
    );
    error.status = 422;
    throw error;
  }
}

export async function listCompanyMeetings(companyId) {
  const prisma = getPrisma();
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) {
    const error = new Error("Company not found.");
    error.status = 404;
    throw error;
  }

  const rows = await prisma.meeting.findMany({
    where: { companyId },
    orderBy: [
      { scheduledDate: "desc" },
      { heldDate: "desc" },
      { createdAt: "desc" },
    ],
  });

  return Promise.all(rows.map((row) => hydrateMeeting(company, row)));
}

export async function createMeeting(companyId, payload) {
  const prisma = getPrisma();
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) {
    const error = new Error("Company not found.");
    error.status = 404;
    throw error;
  }

  const data = normalizeMeetingInput(payload);
  await validateHalfYearSpacing(company, data);
  if (
    data.status === "HELD" &&
    data.heldDate > new Date(new Date().toISOString().slice(0, 10))
  ) {
    const error = new Error("A held meeting date cannot be in the future.");
    error.status = 422;
    throw error;
  }
  if (!data.meetingNumber)
    data.meetingNumber = await nextMeetingNumber(companyId, data.type);
  if (
    company.incorporationDate &&
    data.scheduledDate &&
    data.scheduledDate < company.incorporationDate
  ) {
    const error = new Error(
      "Meeting scheduled date cannot be before the company's incorporation date.",
    );
    error.status = 422;
    throw error;
  }
  if (
    company.incorporationDate &&
    data.heldDate &&
    data.heldDate < company.incorporationDate
  ) {
    const error = new Error(
      "Meeting held date cannot be before the company's incorporation date.",
    );
    error.status = 422;
    throw error;
  }

  const duplicate = await prisma.meeting.findFirst({
    where: { companyId, type: data.type, meetingNumber: data.meetingNumber },
    select: { id: true },
  });
  if (duplicate) {
    const error = new Error(
      `Meeting number ${data.meetingNumber} already exists for this company and meeting type.`,
    );
    error.status = 409;
    throw error;
  }

  const row = await prisma.meeting.create({
    data: { companyId, ...data },
  });
  return hydrateMeeting(company, row);
}

export async function updateMeeting(companyId, meetingId, payload) {
  const prisma = getPrisma();
  const existing = await prisma.meeting.findFirst({
    where: { id: meetingId, companyId },
  });
  if (!existing) {
    const error = new Error("Meeting not found.");
    error.status = 404;
    throw error;
  }
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  const data = normalizeMeetingInput({
    ...existing,
    ...payload,
    scheduledDate:
      Object.hasOwn(payload, "scheduledDate")
        ? payload.scheduledDate
        : formatDate(existing.scheduledDate),
    heldDate: Object.hasOwn(payload, "heldDate")
      ? payload.heldDate
      : formatDate(existing.heldDate),
    noticeSentDate: Object.hasOwn(payload, "noticeSentDate")
      ? payload.noticeSentDate
      : formatDate(existing.noticeSentDate),
    agendaSentDate: Object.hasOwn(payload, "agendaSentDate")
      ? payload.agendaSentDate
      : formatDate(existing.agendaSentDate),
    attendanceDate: Object.hasOwn(payload, "attendanceDate")
      ? payload.attendanceDate
      : formatDate(existing.attendanceDate),
    minutesCirculatedDate: Object.hasOwn(payload, "minutesCirculatedDate")
      ? payload.minutesCirculatedDate
      : formatDate(existing.minutesCirculatedDate),
    commentsReceivedDate: Object.hasOwn(payload, "commentsReceivedDate")
      ? payload.commentsReceivedDate
      : formatDate(existing.commentsReceivedDate),
    finalMinutesDate: Object.hasOwn(payload, "finalMinutesDate")
      ? payload.finalMinutesDate
      : formatDate(existing.finalMinutesDate),
    minutesSignedDate: Object.hasOwn(payload, "minutesSignedDate")
      ? payload.minutesSignedDate
      : formatDate(existing.minutesSignedDate),
    signedMinutesCirculatedDate: Object.hasOwn(
      payload,
      "signedMinutesCirculatedDate",
    )
      ? payload.signedMinutesCirculatedDate
      : formatDate(existing.signedMinutesCirculatedDate),
    meetingNumber: payload.meetingNumber ?? existing.meetingNumber,
    type: payload.type ?? existing.type,
    status: payload.status ?? existing.status,
    earlyConducted: payload.earlyConducted ?? existing.earlyConducted,
    notes: payload.notes ?? existing.notes,
  });
  if (formatDate(data.heldDate) !== formatDate(existing.heldDate)) {
    await validateHalfYearSpacing(company, data, meetingId);
  }
  if (
    data.status === "HELD" &&
    data.heldDate > new Date(new Date().toISOString().slice(0, 10))
  ) {
    const error = new Error("A held meeting date cannot be in the future.");
    error.status = 422;
    throw error;
  }
  if (
    company?.incorporationDate &&
    data.scheduledDate &&
    data.scheduledDate < company.incorporationDate
  ) {
    const error = new Error(
      "Meeting scheduled date cannot be before the company's incorporation date.",
    );
    error.status = 422;
    throw error;
  }
  if (
    company?.incorporationDate &&
    data.heldDate &&
    data.heldDate < company.incorporationDate
  ) {
    const error = new Error(
      "Meeting held date cannot be before the company's incorporation date.",
    );
    error.status = 422;
    throw error;
  }
  if (data.meetingNumber) {
    const duplicate = await prisma.meeting.findFirst({
      where: {
        companyId,
        type: data.type,
        meetingNumber: data.meetingNumber,
        NOT: { id: meetingId },
      },
      select: { id: true },
    });
    if (duplicate) {
      const error = new Error(
        `Meeting number ${data.meetingNumber} already exists for this company and meeting type.`,
      );
      error.status = 409;
      throw error;
    }
  }
  const row = await prisma.meeting.update({ where: { id: meetingId }, data });
  return hydrateMeeting(company, row);
}

export async function deleteMeeting(companyId, meetingId) {
  const prisma = getPrisma();
  const existing = await prisma.meeting.findFirst({
    where: { id: meetingId, companyId },
  });
  if (!existing) {
    const error = new Error("Meeting not found.");
    error.status = 404;
    throw error;
  }
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  const files = await prisma.storedFile.findMany({
    where: {
      companyId,
      detailKey: "meetings",
      fieldPath: { startsWith: `meeting.${meetingId}.` },
    },
  });
  for (const file of files) {
    const resolved = await resolveStoredFile(file.id);
    if (resolved?.filePath) {
      await fs.rm(resolved.filePath, { force: true });
    } else {
      await fs.rm(
        safeJoin(detailPath(company, "meetings"), file.physicalName),
        { force: true },
      );
    }
  }
  await prisma.storedFile.deleteMany({
    where: { id: { in: files.map((file) => file.id) } },
  });
  await prisma.meeting.delete({ where: { id: meetingId } });
}

export async function recordEarlyBoardMeeting(companyId, heldDateValue) {
  const prisma = getPrisma();
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) {
    const error = new Error("Company not found.");
    error.status = 404;
    throw error;
  }
  if (!isMonitoredCompany(company)) {
    const error = new Error(
      "Transferred or closed companies are not eligible for an active Board Meeting reminder update.",
    );
    error.status = 409;
    throw error;
  }

  const heldDate = parseDateOnly(heldDateValue);
  if (!heldDate) {
    const error = new Error("heldDate must be a valid YYYY-MM-DD date.");
    error.status = 400;
    throw error;
  }

  const latest = await prisma.meeting.findFirst({
    where: { companyId, type: "BOARD", status: "HELD", heldDate: { not: null } },
    orderBy: { heldDate: "desc" },
  });
  const latestHeld = latest?.heldDate || null;
  const dueDate = calculateBoardDueDate(company, latestHeld);
  if (!dueDate) {
    const error = new Error(
      "A Board Meeting deadline could not be calculated for this company.",
    );
    error.status = 422;
    throw error;
  }
  if (
    company.incorporationDate &&
    heldDate.getTime() < company.incorporationDate.getTime()
  ) {
    const error = new Error(
      "The early meeting date cannot be before the company's incorporation date.",
    );
    error.status = 422;
    throw error;
  }
  if (latestHeld && heldDate.getTime() <= latestHeld.getTime()) {
    const error = new Error(
      `The early meeting date must be after the previous Board Meeting on ${formatDate(latestHeld)}.`,
    );
    error.status = 422;
    throw error;
  }
  if (
    String(company.meetingProfile || "STANDARD_120").toUpperCase() ===
      "HALF_YEAR_90" &&
    latestHeld &&
    heldDate.getTime() - latestHeld.getTime() < 90 * 86400000
  ) {
    const error = new Error(
      "For the half-year profile, Board Meetings must be at least 90 days apart.",
    );
    error.status = 422;
    throw error;
  }
  if (heldDate > new Date(new Date().toISOString().slice(0, 10))) {
    const error = new Error("A held meeting date cannot be in the future.");
    error.status = 422;
    throw error;
  }
  if (heldDate.getTime() >= dueDate.getTime()) {
    const error = new Error(
      `The early meeting date must be before the calculated deadline of ${formatDate(dueDate)}.`,
    );
    error.status = 422;
    throw error;
  }

  const target = await prisma.meeting.findFirst({
    where: {
      companyId,
      type: "BOARD",
      status: "PLANNED",
      scheduledDate: {
        gte: latestHeld || company.incorporationDate,
        lte: dueDate,
      },
    },
    orderBy: { scheduledDate: "asc" },
  });

  const row = target
    ? await prisma.meeting.update({
        where: { id: target.id },
        data: {
          heldDate,
          status: "HELD",
          earlyConducted: heldDate < target.scheduledDate,
        },
      })
    : await prisma.meeting.create({
        data: {
          companyId,
          type: "BOARD",
          meetingNumber: await nextMeetingNumber(companyId, "BOARD"),
          scheduledDate: null,
          heldDate,
          status: "HELD",
          earlyConducted: true,
        },
      });

  return hydrateMeeting(company, row);
}
