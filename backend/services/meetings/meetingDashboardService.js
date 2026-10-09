import {
  daysUntil,
  addDays,
  parseDateOnly,
  formatDate,
  severityForDays,
} from "./meetingDates.js";
import {
  isMonitoredCompany,
  calculateBoardDueDate,
  calculateAgmDueDate,
} from "./boardMeetingService.js";
import { getPrisma } from "../prisma.js";

function dashboardRow(company, meetings, now) {
  const boardMeetings = meetings.filter((meeting) => meeting.type === "BOARD");
  const latestHeldMeeting = boardMeetings.find(
    (meeting) => meeting.status === "HELD" && meeting.heldDate,
  );
  const latestHeld = latestHeldMeeting?.heldDate;
  const scheduled = boardMeetings
    .filter(
      (meeting) => meeting.scheduledDate && meeting.status === "PLANNED",
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
  const agms = meetings.filter((meeting) => meeting.type === "AGM");
  const latestAgm = agms.find(
    (meeting) => meeting.status === "HELD" && meeting.heldDate,
  )?.heldDate;
  const agmDueDate = monitored
    ? calculateAgmDueDate(
        company,
        latestAgm ? parseDateOnly(latestAgm) : null,
      )
    : null;
  const agmDays = agmDueDate ? daysUntil(agmDueDate, now) : null;
  const halfYearStartMonth = now.getUTCMonth() < 6 ? 0 : 6;
  const halfYearStart = Date.UTC(
    now.getUTCFullYear(),
    halfYearStartMonth,
    1,
  );
  const halfYearEnd = Date.UTC(
    now.getUTCFullYear(),
    halfYearStartMonth + 6,
    0,
  );
  const calendarYearStart = Date.UTC(now.getUTCFullYear(), 0, 1);
  const calendarYearEnd = Date.UTC(now.getUTCFullYear(), 11, 31);
  const halfYearProfile =
    String(company.meetingProfile || "STANDARD_120").toUpperCase() ===
    "HALF_YEAR_90";
  const boardMeetingsThisPeriod = boardMeetings.filter(
    (meeting) =>
      meeting.status === "HELD" &&
      meeting.heldDate &&
      meeting.heldDate.getTime() >=
        (halfYearProfile ? halfYearStart : calendarYearStart) &&
      meeting.heldDate.getTime() <= (halfYearProfile ? halfYearEnd : calendarYearEnd),
  ).length;

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
    latestEarlyMeetingDate: dueDate
      ? formatDate(addDays(dueDate, -1))
      : null,
    earliestEarlyMeetingDate: formatDate(
      addDays(
        latestHeld || company.incorporationDate,
        halfYearProfile ? 90 : 1,
      ),
    ),
    nextAgmDueDate: agmDueDate ? formatDate(agmDueDate) : null,
    daysUntilAgmDue: agmDays,
    daysUntilAnyMeetingDue: [days, agmDays]
      .filter((value) => value != null)
      .reduce(
        (minimum, value) => Math.min(minimum, value),
        Number.POSITIVE_INFINITY,
      ),
    boardMeetingsThisPeriod,
    boardMeetingFrequencyRequirement: halfYearProfile ? 1 : 4,
    boardMeetingPeriodLabel: halfYearProfile
      ? now.getUTCMonth() < 6
        ? "Jan-Jun"
        : "Jul-Dec"
      : `${now.getUTCFullYear()} CY`,
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
      const aDays = a.daysUntilAnyMeetingDue;
      const bDays = b.daysUntilAnyMeetingDue;
      return aDays - bDays || a.companyName.localeCompare(b.companyName);
    }),
  };
}
