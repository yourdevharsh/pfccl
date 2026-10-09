import { getPrisma } from "../prisma.js";
import {
  parseDateOnly,
  formatDate,
  severityForDays,
  daysUntil,
  addDays,
  startOfUtcDay,
} from "./meetingDates.js";
import { isMonitoredCompany } from "./boardMeetingService.js";
import {
  calculateBoardDueDate,
  calculateAgmDueDate,
} from "./boardMeetingService.js";

export async function getMeetingEvents({ days = 365, overdueDays = 30 } = {}) {
  const prisma = getPrisma();
  const companies = await prisma.company.findMany({
    orderBy: { name: "asc" },
    include: {
      meetings: { orderBy: [{ scheduledDate: "asc" }, { heldDate: "desc" }] },
    },
  });
  const now = new Date();
  const today = startOfUtcDay(now);
  const windowEnd = addDays(today, Number(days) || 365);
  const windowStart = addDays(today, -(Number(overdueDays) || 30));
  const events = [];

  for (const company of companies) {
    if (isMonitoredCompany(company)) {
      const boardMeetings = company.meetings.filter(
        (meeting) => meeting.type === "BOARD",
      );
      const latestHeld = boardMeetings
        .filter((meeting) => meeting.status === "HELD" && meeting.heldDate)
        .sort((a, b) => b.heldDate.getTime() - a.heldDate.getTime())[0]
        ?.heldDate;
      const dueDate = calculateBoardDueDate(
        company,
        latestHeld ? parseDateOnly(latestHeld) : null,
      );
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
          description: latestHeld
            ? `Based on last Board Meeting on ${formatDate(latestHeld)}.`
            : "First Board Meeting deadline based on incorporation date.",
        });
      }

      const halfYearProfile =
        String(company.meetingProfile || "STANDARD_120").toUpperCase() ===
        "HALF_YEAR_90";
      const periodStart = halfYearProfile
        ? new Date(
            Date.UTC(
              now.getUTCFullYear(),
              now.getUTCMonth() < 6 ? 0 : 6,
              1,
            ),
          )
        : new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
      const periodEnd = halfYearProfile
        ? new Date(
            Date.UTC(
              now.getUTCFullYear(),
              now.getUTCMonth() < 6 ? 6 : 12,
              0,
            ),
          )
        : new Date(Date.UTC(now.getUTCFullYear(), 11, 31));
      const heldThisPeriod = boardMeetings.filter(
        (meeting) =>
          meeting.status === "HELD" &&
          meeting.heldDate &&
          meeting.heldDate >= periodStart &&
          meeting.heldDate <= periodEnd,
      ).length;
      const requiredBoardMeetings = halfYearProfile ? 1 : 4;
      if (
        heldThisPeriod < requiredBoardMeetings &&
        periodEnd >= windowStart &&
        periodEnd <= windowEnd
      ) {
        const delta = daysUntil(periodEnd, now);
        events.push({
          id: `board-frequency-${company.id}-${formatDate(periodEnd)}`,
          companyId: company.id,
          meetingId: null,
          type: "BOARD_FREQUENCY_DUE",
          title: "Board meeting frequency due",
          companyName: company.name,
          division: company.divisionId,
          date: formatDate(periodEnd),
          daysUntil: delta,
          severity: severityForDays(delta),
          description: halfYearProfile
            ? `No Board Meeting is recorded for the ${periodStart.getUTCMonth() === 0 ? "January-June" : "July-December"} half-year; at least one is required.`
            : `${heldThisPeriod} of at least 4 Board Meetings are recorded for this calendar year.`,
        });
      }

      const agms = company.meetings.filter((meeting) => meeting.type === "AGM");
      const latestAgm = agms
        .filter((meeting) => meeting.status === "HELD" && meeting.heldDate)
        .sort((a, b) => b.heldDate.getTime() - a.heldDate.getTime())[0]
        ?.heldDate;
      const agmDueDate = calculateAgmDueDate(
        company,
        latestAgm || null,
      );
      if (agmDueDate && agmDueDate >= windowStart && agmDueDate <= windowEnd) {
        const delta = daysUntil(agmDueDate, now);
        events.push({
          id: `agm-due-${company.id}-${formatDate(agmDueDate)}`,
          companyId: company.id,
          meetingId: null,
          type: "AGM_DUE",
          title: "Annual general meeting due",
          companyName: company.name,
          division: company.divisionId,
          date: formatDate(agmDueDate),
          daysUntil: delta,
          severity: severityForDays(delta),
          description: latestAgm
            ? `Based on the last AGM held on ${formatDate(latestAgm)} and the next financial-year deadline.`
            : "First AGM deadline based on the first financial year and incorporation date.",
        });
      }
    }

    const plannedMeetings = company.meetings
      .filter(
        (meeting) => meeting.status === "PLANNED" && meeting.scheduledDate,
      )
      .sort((a, b) =>
        String(a.scheduledDate).localeCompare(String(b.scheduledDate)),
      );
    let nextScheduledIncluded = false;

    for (const meeting of company.meetings) {
      if (meeting.status === "CANCELLED") continue;
      const baseName =
        meeting.type === "BOARD"
          ? "Board Meeting"
          : meeting.type === "AGM"
            ? "AGM"
            : "EGM";
      const meetingDate =
        meeting.status === "HELD"
          ? meeting.heldDate || meeting.scheduledDate
          : meeting.scheduledDate || meeting.heldDate;
      if (meetingDate) {
        const scheduled = new Date(
          `${formatDate(meetingDate)}T00:00:00Z`,
        );
        if (
          meeting.status === "PLANNED" &&
          meeting.scheduledDate &&
          scheduled >= windowStart &&
          scheduled <= windowEnd
        ) {
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
            description: meeting.meetingNumber
              ? `Meeting #${meeting.meetingNumber}.`
              : "Scheduled meeting.",
          });
          if (plannedMeetings[0]?.id === meeting.id)
            nextScheduledIncluded = true;
        }

        const noticeDays = meeting.type === "BOARD" ? 8 : 22;
        const taskDates = [
          [
            "NOTICE_DUE",
            "Notice due",
            addDays(scheduled, -noticeDays),
            meeting.noticeSentDate,
            meeting.type === "BOARD"
              ? "Target date leaves seven clear days before the Board Meeting. Shorter notice is permitted only under the statutory conditions."
              : "Target date leaves twenty-one clear days before the general meeting; shorter notice requires the applicable member consent.",
          ],
          [
            "AGENDA_DUE",
            "Agenda due",
            addDays(scheduled, meeting.type === "BOARD" ? -7 : -22),
            meeting.agendaSentDate,
            meeting.type === "BOARD"
              ? "Agenda and notes should be sent at least seven days before the Board Meeting."
              : "General-meeting agenda and explanatory statement should accompany the meeting notice.",
          ],
        ];
        for (const [
          type,
          title,
          taskDate,
          completedDate,
          description,
        ] of taskDates) {
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
          [
            "MINUTES_DRAFT_DUE",
            "Draft minutes due",
            addDays(held, 15),
            meeting.minutesCirculatedDate,
            "Draft minutes should ordinarily be circulated within 15 days.",
          ],
          [
            "MINUTES_FINAL_DUE",
            "Minutes completion due",
            addDays(held, 30),
            meeting.finalMinutesDate,
            "Minutes should ordinarily be completed / entered within 30 days.",
          ],
        ];
        if (meeting.minutesSignedDate) {
          workflowDates.push([
            "SIGNED_MINUTES_CIRCULATION_DUE",
            "Signed minutes circulation due",
            addDays(parseDateOnly(formatDate(meeting.minutesSignedDate)), 15),
            meeting.signedMinutesCirculatedDate,
            "Circulate a certified copy of the signed minutes to directors within 15 days of signing.",
          ]);
        }
        if (meeting.minutesCirculatedDate) {
          const commentsDue = addDays(
            parseDateOnly(formatDate(meeting.minutesCirculatedDate)),
            7,
          );
          workflowDates.push([
            "MINUTES_COMMENTS_DUE",
            "Director comments due",
            commentsDue,
            meeting.commentsReceivedDate,
            "Director comments are ordinarily due within 7 days of circulation.",
          ]);
        }
        for (const [
          type,
          title,
          taskDate,
          completedDate,
          description,
        ] of workflowDates) {
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

    // Always surface the nearest planned meeting for a monitored company,
    // even when it falls beyond the normal reminder window.
    if (
      plannedMeetings.length &&
      !nextScheduledIncluded &&
      isMonitoredCompany(company)
    ) {
      const nextMeeting = plannedMeetings.find(
        (meeting) =>
          new Date(`${formatDate(meeting.scheduledDate)}T00:00:00Z`) >= today,
      );
      if (nextMeeting) {
        const scheduled = new Date(
          `${formatDate(nextMeeting.scheduledDate)}T00:00:00Z`,
        );
        const delta = daysUntil(scheduled, now);
        const baseName =
          nextMeeting.type === "BOARD"
            ? "Board Meeting"
            : nextMeeting.type === "AGM"
              ? "AGM"
              : "EGM";
        events.push({
          id: `meeting-${nextMeeting.id}`,
          companyId: company.id,
          meetingId: nextMeeting.id,
          type: nextMeeting.type,
          title: `${baseName} scheduled`,
          companyName: company.name,
          division: company.divisionId,
          date: formatDate(scheduled),
          daysUntil: delta,
          severity: severityForDays(delta),
          description: nextMeeting.meetingNumber
            ? `Meeting #${nextMeeting.meetingNumber}.`
            : "Next scheduled meeting.",
        });
      }
    }
  }

  return {
    generatedAt: now.toISOString(),
    events: events.sort(
      (a, b) =>
        new Date(`${a.date}T00:00:00Z`) - new Date(`${b.date}T00:00:00Z`) ||
        a.companyName.localeCompare(b.companyName),
    ),
  };
}
