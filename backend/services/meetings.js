import fs from "node:fs/promises";
import { getPrisma } from "./prisma.js";
import { buildFileUrl, detailPath } from "./storage.js";
import { safeJoin } from "../utils/pathSafety.js";

export const MEETING_TYPES = ["BOARD", "AGM", "EGM"];
export const MEETING_STATUSES = ["PLANNED", "HELD", "CANCELLED"];
export const COMPANY_STATUSES = ["ACTIVE", "TRANSFERRED", "UNDER_INCORPORATION", "DORMANT", "CLOSED", "OTHER"];

function parseDateOnly(value) {
  if (!value) return null;
  const raw = String(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  const date = new Date(`${raw}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

function addDays(date, days) {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function daysUntil(date, now = new Date()) {
  return Math.ceil((date.getTime() - now.getTime()) / 86400000);
}

function financialQuarter(date) {
  const month = date.getUTCMonth() + 1;
  if (month >= 4 && month <= 6) return `Q1-${date.getUTCFullYear()}`;
  if (month >= 7 && month <= 9) return `Q2-${date.getUTCFullYear()}`;
  if (month >= 10 && month <= 12) return `Q3-${date.getUTCFullYear()}`;
  return `Q4-${month <= 3 ? date.getUTCFullYear() - 1 : date.getUTCFullYear()}`;
}

function severityForDays(days) {
  if (days < 0) return "critical";
  if (days <= 3) return "critical";
  if (days <= 7) return "high";
  if (days <= 14) return "medium";
  return "low";
}

function isMonitoredCompany(company) {
  return !["TRANSFERRED", "CLOSED"].includes(String(company.status || "ACTIVE").toUpperCase());
}

function meetingIntervalDays(company) {
  return String(company.meetingProfile || "STANDARD_120").toUpperCase() === "STANDARD_120" ? 120 : 120;
}

function calculateBoardDueDate(company, latestHeldDate) {
  if (latestHeldDate) {
    if (String(company.meetingProfile || "STANDARD_120").toUpperCase() === "HALF_YEAR_90") {
      const month = latestHeldDate.getUTCMonth() + 1;
      if (month <= 6) return new Date(Date.UTC(latestHeldDate.getUTCFullYear(), 8, 30));
      return new Date(Date.UTC(latestHeldDate.getUTCFullYear() + 1, 2, 31));
    }
    return addDays(latestHeldDate, meetingIntervalDays(company));
  }

  const incorporationDate = company.incorporationDate;
  if (!incorporationDate) return null;
  return addDays(incorporationDate, 30);
}

function buildFileRecord(company, row) {
  return {
    id: row.id,
    name: row.originalName,
    url: buildFileUrl(company, "meetings", row.physicalName),
    mimeType: row.mimeType,
    size: row.size,
  };
}

async function hydrateMeeting(company, meeting) {
  const prisma = getPrisma();
  const rows = await prisma.storedFile.findMany({
    where: {
      companyId: company.id,
      detailKey: "meetings",
      fieldPath: { startsWith: `meeting.${meeting.id}.` },
    },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });

  return {
    id: meeting.id,
    companyId: meeting.companyId,
    type: meeting.type,
    meetingNumber: meeting.meetingNumber,
    scheduledDate: formatDate(meeting.scheduledDate),
    heldDate: formatDate(meeting.heldDate),
    status: meeting.status,
    earlyConducted: meeting.earlyConducted,
    noticeSentDate: formatDate(meeting.noticeSentDate),
    agendaSentDate: formatDate(meeting.agendaSentDate),
    attendanceDate: formatDate(meeting.attendanceDate),
    minutesCirculatedDate: formatDate(meeting.minutesCirculatedDate),
    commentsReceivedDate: formatDate(meeting.commentsReceivedDate),
    finalMinutesDate: formatDate(meeting.finalMinutesDate),
    notes: meeting.notes || "",
    documents: rows.map((row) => buildFileRecord(company, row)),
    createdAt: meeting.createdAt.toISOString(),
    updatedAt: meeting.updatedAt.toISOString(),
  };
}

function normalizeMeetingInput(payload = {}) {
  const type = String(payload.type || "BOARD").toUpperCase();
  if (!MEETING_TYPES.includes(type)) {
    const error = new Error(`Meeting type must be one of ${MEETING_TYPES.join(", ")}.`);
    error.status = 400;
    throw error;
  }

  const status = String(payload.status || (payload.heldDate ? "HELD" : "PLANNED")).toUpperCase();
  if (!MEETING_STATUSES.includes(status)) {
    const error = new Error(`Meeting status must be one of ${MEETING_STATUSES.join(", ")}.`);
    error.status = 400;
    throw error;
  }

  const dateFields = [
    "scheduledDate",
    "heldDate",
    "noticeSentDate",
    "agendaSentDate",
    "attendanceDate",
    "minutesCirculatedDate",
    "commentsReceivedDate",
    "finalMinutesDate",
  ];
  const dates = {};
  for (const field of dateFields) {
    if (payload[field] === "" || payload[field] == null) {
      dates[field] = null;
      continue;
    }
    const parsed = parseDateOnly(payload[field]);
    if (!parsed) {
      const error = new Error(`${field} must be a valid YYYY-MM-DD date.`);
      error.status = 400;
      throw error;
    }
    dates[field] = parsed;
  }

  return {
    type,
    meetingNumber: payload.meetingNumber == null || payload.meetingNumber === "" ? null : String(payload.meetingNumber),
    status,
    earlyConducted: Boolean(payload.earlyConducted),
    notes: payload.notes == null ? null : String(payload.notes),
    ...dates,
  };
}

async function nextMeetingNumber(companyId, type) {
  const rows = await getPrisma().meeting.findMany({
    where: { companyId, type },
    select: { meetingNumber: true },
  });
  let max = 0;
  for (const row of rows) {
    const value = Number.parseInt(String(row.meetingNumber || ""), 10);
    if (Number.isFinite(value)) max = Math.max(max, value);
  }
  return String(max + 1);
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
    orderBy: [{ scheduledDate: "desc" }, { heldDate: "desc" }, { createdAt: "desc" }],
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
  if (!data.meetingNumber) data.meetingNumber = await nextMeetingNumber(companyId, data.type);

  const row = await prisma.meeting.create({
    data: { companyId, ...data },
  });
  return hydrateMeeting(company, row);
}

export async function updateMeeting(companyId, meetingId, payload) {
  const prisma = getPrisma();
  const existing = await prisma.meeting.findFirst({ where: { id: meetingId, companyId } });
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
    noticeSentDate: payload.noticeSentDate ?? formatDate(existing.noticeSentDate),
    agendaSentDate: payload.agendaSentDate ?? formatDate(existing.agendaSentDate),
    attendanceDate: payload.attendanceDate ?? formatDate(existing.attendanceDate),
    minutesCirculatedDate: payload.minutesCirculatedDate ?? formatDate(existing.minutesCirculatedDate),
    commentsReceivedDate: payload.commentsReceivedDate ?? formatDate(existing.commentsReceivedDate),
    finalMinutesDate: payload.finalMinutesDate ?? formatDate(existing.finalMinutesDate),
    meetingNumber: payload.meetingNumber ?? existing.meetingNumber,
    type: payload.type ?? existing.type,
    status: payload.status ?? existing.status,
    earlyConducted: payload.earlyConducted ?? existing.earlyConducted,
    notes: payload.notes ?? existing.notes,
  });
  const row = await prisma.meeting.update({ where: { id: meetingId }, data });
  return hydrateMeeting(company, row);
}

export async function deleteMeeting(companyId, meetingId) {
  const prisma = getPrisma();
  const existing = await prisma.meeting.findFirst({ where: { id: meetingId, companyId } });
  if (!existing) {
    const error = new Error("Meeting not found.");
    error.status = 404;
    throw error;
  }
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  const files = await prisma.storedFile.findMany({
    where: { companyId, detailKey: "meetings", fieldPath: { startsWith: `meeting.${meetingId}.` } },
  });
  for (const file of files) {
    await fs.rm(safeJoin(detailPath(company, "meetings"), file.physicalName), { force: true });
  }
  await prisma.storedFile.deleteMany({ where: { id: { in: files.map((file) => file.id) } } });
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
    const error = new Error("Transferred or closed companies are not eligible for an active board-meeting reminder update.");
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
  const dueDate = calculateBoardDueDate(company, latest?.heldDate || null);

  if (!dueDate || heldDate.getTime() >= dueDate.getTime() || financialQuarter(heldDate) !== financialQuarter(dueDate)) {
    const error = new Error(`The early meeting date must be before ${formatDate(dueDate)} and in the same financial quarter as that deadline.`);
    error.status = 422;
    throw error;
  }

  return createMeeting(companyId, {
    type: "BOARD",
    meetingNumber: await nextMeetingNumber(companyId, "BOARD"),
    scheduledDate: formatDate(heldDate),
    heldDate: formatDate(heldDate),
    status: "HELD",
    earlyConducted: true,
  });
}

function dashboardRow(company, boardMeetings, now) {
  const latestHeld = boardMeetings.find((meeting) => meeting.heldDate)?.heldDate;
  const scheduled = boardMeetings
    .filter((meeting) => meeting.scheduledDate && new Date(`${meeting.scheduledDate}T00:00:00Z`) >= now && meeting.status !== "CANCELLED")
    .sort((a, b) => String(a.scheduledDate).localeCompare(String(b.scheduledDate)))[0];

  const monitored = isMonitoredCompany(company);
  const dueDate = monitored ? calculateBoardDueDate(company, latestHeld ? parseDateOnly(latestHeld) : null) : null;
  const days = dueDate ? daysUntil(dueDate, now) : null;

  return {
    companyId: company.id,
    companyName: company.name,
    division: company.divisionId,
    status: company.status || "ACTIVE",
    meetingProfile: company.meetingProfile || "STANDARD_120",
    lastBoardMeetingDate: latestHeld ? formatDate(latestHeld) : null,
    nextScheduledDate: scheduled?.scheduledDate ? formatDate(scheduled.scheduledDate) : null,
    nextDueDate: dueDate ? formatDate(dueDate) : null,
    daysUntilDue: days,
    severity: days == null ? "low" : severityForDays(days),
    canRecordEarly: isMonitoredCompany(company) && Boolean(dueDate && days > 0),
    boardMeetingCount: boardMeetings.length,
  };
}

export async function getMeetingDashboard() {
  const prisma = getPrisma();
  const companies = await prisma.company.findMany({
    orderBy: [{ divisionId: "asc" }, { name: "asc" }],
    include: {
      meetings: {
        where: { type: "BOARD" },
        orderBy: [{ heldDate: "desc" }, { scheduledDate: "asc" }],
      },
    },
  });
  const now = new Date();
  const rows = companies.map((company) => dashboardRow(company, company.meetings, now));
  return {
    generatedAt: now.toISOString(),
    companies: rows.sort((a, b) => {
      const aDays = a.daysUntilDue ?? Number.POSITIVE_INFINITY;
      const bDays = b.daysUntilDue ?? Number.POSITIVE_INFINITY;
      return aDays - bDays || a.companyName.localeCompare(b.companyName);
    }),
  };
}

export async function getMeetingEvents({ days = 60, overdueDays = 30 } = {}) {
  const prisma = getPrisma();
  const companies = await prisma.company.findMany({
    orderBy: { name: "asc" },
    include: { meetings: { orderBy: [{ scheduledDate: "asc" }, { heldDate: "desc" }] } },
  });
  const now = new Date();
  const windowEnd = addDays(now, Number(days) || 60);
  const windowStart = addDays(now, -(Number(overdueDays) || 30));
  const events = [];

  for (const company of companies) {
    if (isMonitoredCompany(company)) {
      const boardMeetings = company.meetings.filter((meeting) => meeting.type === "BOARD");
      const latestHeld = boardMeetings.find((meeting) => meeting.heldDate)?.heldDate;
      const dueDate = calculateBoardDueDate(company, latestHeld ? parseDateOnly(latestHeld) : null);
      if (dueDate && dueDate >= windowStart && dueDate <= windowEnd) {
        const delta = daysUntil(dueDate, now);
        events.push({
          id: `board-due-${company.id}-${formatDate(dueDate)}`,
          companyId: company.id,
          meetingId: null,
          type: "BOARD_DUE",
          title: "Board meeting due",
          companyName: company.name,
          division: company.divisionId,
          date: formatDate(dueDate),
          daysUntil: delta,
          severity: severityForDays(delta),
          description: latestHeld ? `Based on last Board Meeting on ${formatDate(latestHeld)}.` : "First Board Meeting deadline based on incorporation date.",
        });
      }
    }

    for (const meeting of company.meetings) {
      if (meeting.status === "CANCELLED") continue;
      const baseName = meeting.type === "BOARD" ? "Board Meeting" : meeting.type === "AGM" ? "AGM" : "EGM";
      if (meeting.scheduledDate) {
        const scheduled = new Date(`${formatDate(meeting.scheduledDate)}T00:00:00Z`);
        if (scheduled >= windowStart && scheduled <= windowEnd) {
          const delta = daysUntil(scheduled, now);
          events.push({
            id: `meeting-${meeting.id}`,
            companyId: company.id,
            meetingId: meeting.id,
            type: meeting.type,
            title: `${baseName} scheduled`,
            companyName: company.name,
            division: company.divisionId,
            date: formatDate(scheduled),
            daysUntil: delta,
            severity: severityForDays(delta),
            description: meeting.meetingNumber ? `Meeting #${meeting.meetingNumber}.` : "Scheduled meeting.",
          });
        }

        const taskDates = [
          ["NOTICE_DUE", "Notice due", addDays(scheduled, -7), meeting.noticeSentDate, "Notice should be completed 7 days before the meeting unless the applicable exception is used."],
          ["AGENDA_DUE", "Agenda due", addDays(scheduled, -7), meeting.agendaSentDate, "Agenda / Notes should be completed 7 days before the meeting."],
        ];
        for (const [type, title, taskDate, completedDate, description] of taskDates) {
          if (completedDate) continue;
          if (taskDate >= windowStart && taskDate <= windowEnd) {
            const delta = daysUntil(taskDate, now);
            events.push({
              id: `${type}-${meeting.id}`,
              companyId: company.id,
              meetingId: meeting.id,
              type,
              title,
              companyName: company.name,
              division: company.divisionId,
              date: formatDate(taskDate),
              daysUntil: delta,
              severity: severityForDays(delta),
              description,
            });
          }
        }
      }

      if (meeting.heldDate) {
        const held = parseDateOnly(formatDate(meeting.heldDate));
        const workflowDates = [
          ["MINUTES_DRAFT_DUE", "Draft minutes due", addDays(held, 15), meeting.minutesCirculatedDate, "Draft minutes should ordinarily be circulated within 15 days."],
          ["MINUTES_FINAL_DUE", "Minutes completion due", addDays(held, 30), meeting.finalMinutesDate, "Minutes should ordinarily be completed / entered within 30 days."],
        ];
        if (meeting.minutesCirculatedDate) {
          const commentsDue = addDays(parseDateOnly(formatDate(meeting.minutesCirculatedDate)), 7);
          workflowDates.push(["MINUTES_COMMENTS_DUE", "Director comments due", commentsDue, meeting.commentsReceivedDate, "Director comments are ordinarily due within 7 days of circulation."]);
        }
        for (const [type, title, taskDate, completedDate, description] of workflowDates) {
          if (completedDate) continue;
          if (taskDate >= windowStart && taskDate <= windowEnd) {
            const delta = daysUntil(taskDate, now);
            events.push({
              id: `${type}-${meeting.id}`,
              companyId: company.id,
              meetingId: meeting.id,
              type,
              title,
              companyName: company.name,
              division: company.divisionId,
              date: formatDate(taskDate),
              daysUntil: delta,
              severity: severityForDays(delta),
              description,
            });
          }
        }
      }
    }
  }

  return {
    generatedAt: now.toISOString(),
    events: events.sort((a, b) => new Date(`${a.date}T00:00:00Z`) - new Date(`${b.date}T00:00:00Z`) || a.companyName.localeCompare(b.companyName)),
  };
}
