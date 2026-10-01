import {
  startOfUtcDay,
  daysUntil,
  parseDateOnly,
  formatDate,
  severityForDays,
} from "./meetingDates.js";
import {
  isMonitoredCompany,
  calculateBoardDueDate,
} from "./boardMeetingService.js";
import { getPrisma } from "../prisma.js";

function dashboardRow(company, boardMeetings, now) {
  const latestHeldMeeting = boardMeetings.find((meeting) => meeting.heldDate);
  const latestHeld = latestHeldMeeting?.heldDate;
  const today = startOfUtcDay(now);
  const scheduled = boardMeetings
    .filter(
      (meeting) =>
        meeting.scheduledDate &&
        meeting.status === "PLANNED" &&
        new Date(`${meeting.scheduledDate}T00:00:00Z`) >= today,
    )
    .sort((a, b) =>
      String(a.scheduledDate).localeCompare(String(b.scheduledDate)),
    )[0];

  const monitored = isMonitoredCompany(company);
  const dueDate = monitored
    ? calculateBoardDueDate(
        company,
        latestHeld ? parseDateOnly(latestHeld) : null,
      )
    : null;
  const days = dueDate ? daysUntil(dueDate, now) : null;

  return {
    companyId: company.id,
    companyName: company.name,
    division: company.divisionId,
    status: company.status || "ACTIVE",
    meetingProfile: company.meetingProfile || "STANDARD_120",
    incorporationDate: formatDate(company.incorporationDate),
    lastBoardMeetingDate: latestHeld ? formatDate(latestHeld) : null,
    lastBoardMeetingEarly: Boolean(latestHeldMeeting?.earlyConducted),
    nextScheduledDate: scheduled?.scheduledDate
      ? formatDate(scheduled.scheduledDate)
      : null,
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
  const rows = companies.map((company) =>
    dashboardRow(company, company.meetings, now),
  );
  return {
    generatedAt: now.toISOString(),
    companies: rows.sort((a, b) => {
      const aDays = a.daysUntilDue ?? Number.POSITIVE_INFINITY;
      const bDays = b.daysUntilDue ?? Number.POSITIVE_INFINITY;
      return aDays - bDays || a.companyName.localeCompare(b.companyName);
    }),
  };
}
