import express from "express";
import { answerWithAi, getAiProviders } from "../services/ai.js";
import { asyncRoute, sendData } from "../utils/http.js";

const router = express.Router();

router.get("/providers", (_req, res) => {
  sendData(res, { providers: getAiProviders() });
});

router.post("/chat", asyncRoute(async (req, res) => {
  const { provider, messages, selections } = req.body || {};
  const result = await answerWithAi({ provider, messages, selections });
  sendData(res, result);
}));

export default router;
