import express from "express";
import { answerWithAi, getAiProviders } from "../services/ai/ai.js";
import { createAiReport } from "../services/reports/reportService.js";
import { asyncRoute, sendData } from "../utils/http.js";
import { requirePermission } from "../services/auth.js";
import { PERMISSIONS } from "../services/authorization.js";

const router = express.Router();

router.get("/providers", requirePermission(PERMISSIONS.USE_AI), (_req, res) => {
  sendData(res, { providers: getAiProviders() });
});

router.post("/chat", requirePermission(PERMISSIONS.USE_AI), asyncRoute(async (req, res) => {
  const { provider, messages, selections } = req.body || {};
  const result = await answerWithAi({ provider, messages, selections });
  sendData(res, result);
}));

router.post("/reports", requirePermission(PERMISSIONS.USE_AI), asyncRoute(async (req, res) => {
  const result = await createAiReport(req.body || {});
  res.set({
    "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "Content-Disposition": 'attachment; filename="PFCCL-report.docx"',
    "X-Report-Row-Count": String(result.rowCount),
  });
  res.send(result.buffer);
}));

export default router;
