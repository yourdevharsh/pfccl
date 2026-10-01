import { addDays } from "./meetingDates.js";

function isMonitoredCompany(company) {
  return !["TRANSFERRED", "CLOSED"].includes(
    String(company.status || "ACTIVE").toUpperCase(),
  );
}

function calculateBoardDueDate(company, latestHeldDate) {
  if (latestHeldDate) {
    const profile = String(
      company.meetingProfile || "STANDARD_120",
    ).toUpperCase();
    if (profile === "HALF_YEAR_90") {
      const month = latestHeldDate.getUTCMonth() + 1;
      const year = latestHeldDate.getUTCFullYear();
      return month <= 6
        ? new Date(Date.UTC(year, 11, 31))
        : new Date(Date.UTC(year + 1, 5, 30));
    }
    return addDays(latestHeldDate, 120);
  }

  const incorporationDate = company.incorporationDate;
  if (!incorporationDate) return null;
  return addDays(incorporationDate, 30);
}

export { isMonitoredCompany, calculateBoardDueDate };
