import express from "express";
import { asyncRoute, sendData } from "../utils/http.js";
import {
  createMeeting,
  deleteMeeting,
  getMeetingDashboard,
  getMeetingEvents,
  listCompanyMeetings,
  recordEarlyBoardMeeting,
  updateMeeting,
} from "../services/meetings.js";
import { assertSafeSegment } from "../utils/pathSafety.js";

const router = express.Router();

router.get("/meetings/dashboard", asyncRoute(async (_req, res) => {
  sendData(res, await getMeetingDashboard());
}));

router.get("/meetings/events", asyncRoute(async (req, res) => {
  const days = Math.min(Math.max(Number(req.query.days) || 60, 7), 180);
  const overdueDays = Math.min(Math.max(Number(req.query.overdueDays) || 30, 7), 180);
  sendData(res, await getMeetingEvents({ days, overdueDays }));
}));

router.get("/companies/:companyId/meetings", asyncRoute(async (req, res) => {
  assertSafeSegment(req.params.companyId, "company id");
  sendData(res, await listCompanyMeetings(req.params.companyId));
}));

router.post("/companies/:companyId/meetings/board/early", asyncRoute(async (req, res) => {
  assertSafeSegment(req.params.companyId, "company id");
  sendData(res, await recordEarlyBoardMeeting(req.params.companyId, req.body?.heldDate), 201);
}));

router.post("/companies/:companyId/meetings", asyncRoute(async (req, res) => {
  assertSafeSegment(req.params.companyId, "company id");
  sendData(res, await createMeeting(req.params.companyId, req.body || {}), 201);
}));

router.patch("/companies/:companyId/meetings/:meetingId", asyncRoute(async (req, res) => {
  assertSafeSegment(req.params.companyId, "company id");
  assertSafeSegment(req.params.meetingId, "meeting id");
  sendData(res, await updateMeeting(req.params.companyId, req.params.meetingId, req.body || {}));
}));

router.delete("/companies/:companyId/meetings/:meetingId", asyncRoute(async (req, res) => {
  assertSafeSegment(req.params.companyId, "company id");
  assertSafeSegment(req.params.meetingId, "meeting id");
  await deleteMeeting(req.params.companyId, req.params.meetingId);
  res.status(204).end();
}));

export default router;
