import { MEETING_STATUSES, MEETING_TYPES } from "./meetingConstants.js";
import { parseDateOnly } from "./meetingDates.js";

function normalizeMeetingInput(payload = {}) {
  const type = String(payload.type || "BOARD").toUpperCase();
  if (!MEETING_TYPES.includes(type)) {
    const error = new Error(
      `Meeting type must be one of ${MEETING_TYPES.join(", ")}.`,
    );
    error.status = 400;
    throw error;
  }

  const status = String(
    payload.status || (payload.heldDate ? "HELD" : "PLANNED"),
  ).toUpperCase();
  if (!MEETING_STATUSES.includes(status)) {
    const error = new Error(
      `Meeting status must be one of ${MEETING_STATUSES.join(", ")}.`,
    );
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

  if (status === "HELD" && !dates.heldDate) {
    dates.heldDate = dates.scheduledDate || null;
    if (!dates.heldDate) {
      const error = new Error("A held meeting must have a held date.");
      error.status = 422;
      throw error;
    }
  }
  if (status === "PLANNED" && dates.heldDate) {
    const error = new Error(
      "A planned meeting cannot have a held date. Mark it as held first.",
    );
    error.status = 422;
    throw error;
  }
  if (
    dates.heldDate &&
    dates.scheduledDate &&
    dates.heldDate.getTime() < dates.scheduledDate.getTime()
  ) {
    // An early-held meeting is valid, but the explicit early flag is required
    // so the historical record remains unambiguous.
    if (!payload.earlyConducted) {
      const error = new Error(
        "A held date earlier than the scheduled date must be marked as an early-conducted meeting.",
      );
      error.status = 422;
      throw error;
    }
  }

  return {
    type,
    meetingNumber:
      payload.meetingNumber == null || payload.meetingNumber === ""
        ? null
        : String(payload.meetingNumber),
    status,
    earlyConducted: Boolean(payload.earlyConducted),
    notes: payload.notes == null ? null : String(payload.notes),
    ...dates,
  };
}

export { normalizeMeetingInput };
