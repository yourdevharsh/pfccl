import fs from "node:fs/promises";
import { getPrisma } from "../prisma.js";
import {
  parseDateOnly,
  formatDate,
  financialQuarter,
} from "./meetingDates.js";
import { hydrateMeeting } from "./meetingSerializer.js";
import { normalizeMeetingInput } from "./meetingValidation.js";
import { nextMeetingNumber } from "./meetingRepository.js";
import {
  isMonitoredCompany,
  calculateBoardDueDate,
} from "./boardMeetingService.js";
import { detailPath, resolveStoredFile } from "../storage.js";
import { safeJoin } from "../../utils/pathSafety.js";

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
    scheduledDate: payload.scheduledDate ?? formatDate(existing.scheduledDate),
    heldDate: payload.heldDate ?? formatDate(existing.heldDate),
    noticeSentDate:
      payload.noticeSentDate ?? formatDate(existing.noticeSentDate),
    agendaSentDate:
      payload.agendaSentDate ?? formatDate(existing.agendaSentDate),
    attendanceDate:
      payload.attendanceDate ?? formatDate(existing.attendanceDate),
    minutesCirculatedDate:
      payload.minutesCirculatedDate ??
      formatDate(existing.minutesCirculatedDate),
    commentsReceivedDate:
      payload.commentsReceivedDate ?? formatDate(existing.commentsReceivedDate),
    finalMinutesDate:
      payload.finalMinutesDate ?? formatDate(existing.finalMinutesDate),
    meetingNumber: payload.meetingNumber ?? existing.meetingNumber,
    type: payload.type ?? existing.type,
    status: payload.status ?? existing.status,
    earlyConducted: payload.earlyConducted ?? existing.earlyConducted,
    notes: payload.notes ?? existing.notes,
  });
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
    where: { companyId, type: "BOARD", heldDate: { not: null } },
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
    heldDate.getTime() >= dueDate.getTime() ||
    financialQuarter(heldDate) !== financialQuarter(dueDate)
  ) {
    const error = new Error(
      `The early meeting date must be before ${formatDate(dueDate)} and in the same financial quarter as that deadline.`,
    );
    error.status = 422;
    throw error;
  }

  const activeScheduled = await prisma.meeting.findMany({
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

  let row;
  if (activeScheduled.length) {
    const target = activeScheduled[0];
    row = await prisma.meeting.update({
      where: { id: target.id },
      data: {
        scheduledDate: heldDate,
        heldDate,
        status: "HELD",
        earlyConducted: true,
      },
    });
    if (activeScheduled.length > 1) {
      await prisma.meeting.updateMany({
        where: {
          id: { in: activeScheduled.slice(1).map((meeting) => meeting.id) },
        },
        data: { status: "CANCELLED", earlyConducted: false },
      });
    }
  } else {
    row = await prisma.meeting.create({
      data: {
        companyId,
        type: "BOARD",
        meetingNumber: await nextMeetingNumber(companyId, "BOARD"),
        scheduledDate: heldDate,
        heldDate,
        status: "HELD",
        earlyConducted: true,
      },
    });
  }

  return hydrateMeeting(company, row);
}
