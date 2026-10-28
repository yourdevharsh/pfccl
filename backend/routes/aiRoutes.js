import express from "express";
import { answerWithAi, getAiProviders } from "../services/ai/ai.js";
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

export default router;
