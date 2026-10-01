import { getPrisma } from "../prisma.js";

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

export { nextMeetingNumber };
