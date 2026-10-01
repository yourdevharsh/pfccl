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
import { calculateBoardDueDate } from "./boardMeetingService.js";

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
      const latestHeld = boardMeetings.find(
        (meeting) => meeting.heldDate,
      )?.heldDate;
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
      if (meeting.status !== "PLANNED") continue;
      const baseName =
        meeting.type === "BOARD"
          ? "Board Meeting"
          : meeting.type === "AGM"
            ? "AGM"
            : "EGM";
      if (meeting.scheduledDate) {
        const scheduled = new Date(
          `${formatDate(meeting.scheduledDate)}T00:00:00Z`,
        );
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
            description: meeting.meetingNumber
              ? `Meeting #${meeting.meetingNumber}.`
              : "Scheduled meeting.",
          });
          if (plannedMeetings[0]?.id === meeting.id)
            nextScheduledIncluded = true;
        }

        const taskDates = [
          [
            "NOTICE_DUE",
            "Notice due",
            addDays(scheduled, -7),
            meeting.noticeSentDate,
            "Notice should be completed 7 days before the meeting unless the applicable exception is used.",
          ],
          [
            "AGENDA_DUE",
            "Agenda due",
            addDays(scheduled, -7),
            meeting.agendaSentDate,
            "Agenda / Notes should be completed 7 days before the meeting.",
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
