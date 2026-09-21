-- Add company lifecycle/compliance fields
ALTER TABLE "Company" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "Company" ADD COLUMN "meetingProfile" TEXT NOT NULL DEFAULT 'STANDARD_120';

CREATE INDEX "Company_divisionId_status_idx" ON "Company"("divisionId", "status");

-- Structured meeting records for Board / AGM / EGM management
CREATE TABLE "Meeting" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "meetingNumber" TEXT,
    "scheduledDate" DATE,
    "heldDate" DATE,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "earlyConducted" BOOLEAN NOT NULL DEFAULT false,
    "noticeSentDate" DATE,
    "agendaSentDate" DATE,
    "attendanceDate" DATE,
    "minutesCirculatedDate" DATE,
    "commentsReceivedDate" DATE,
    "finalMinutesDate" DATE,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Meeting_companyId_type_heldDate_idx" ON "Meeting"("companyId", "type", "heldDate");
CREATE INDEX "Meeting_companyId_type_scheduledDate_idx" ON "Meeting"("companyId", "type", "scheduledDate");
CREATE INDEX "Meeting_scheduledDate_idx" ON "Meeting"("scheduledDate");
CREATE INDEX "Meeting_heldDate_idx" ON "Meeting"("heldDate");

ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
