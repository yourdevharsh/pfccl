import { buildFileUrl } from "../storage.js";
import { getPrisma } from "../prisma.js";
import { formatDate } from "./meetingDates.js";

function buildFileRecord(company, row) {
  return {
    id: row.id,
    name: row.originalName,
    url: buildFileUrl(company, "meetings", row.physicalName, row.id),
    originalName: row.originalName,
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
    minutesSignedDate: formatDate(meeting.minutesSignedDate),
    signedMinutesCirculatedDate: formatDate(meeting.signedMinutesCirculatedDate),
    notes: meeting.notes || "",
    documents: rows.map((row) => buildFileRecord(company, row)),
    createdAt: meeting.createdAt.toISOString(),
    updatedAt: meeting.updatedAt.toISOString(),
  };
}

export { buildFileRecord, hydrateMeeting };
