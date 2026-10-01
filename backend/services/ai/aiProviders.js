import Groq from "groq-sdk";
import { GoogleGenAI } from "@google/genai";
import { config } from "../../config.js";

let groqClient;
let geminiClient;

function getGroqClient() {
  if (!config.groqApiKey) return null;
  if (!groqClient) groqClient = new Groq({ apiKey: config.groqApiKey });
  return groqClient;
}

function getGeminiClient() {
  if (!config.geminiApiKey) return null;
  if (!geminiClient)
    geminiClient = new GoogleGenAI({ apiKey: config.geminiApiKey });
  return geminiClient;
}

function providerConfig() {
  return [
    {
      id: "gemini",
      name: "Gemini",
      configured: Boolean(config.geminiApiKey),
      model: config.geminiModel,
    },
    {
      id: "groq",
      name: "Groq",
      configured: Boolean(config.groqApiKey),
      model: config.groqModel,
    },
  ];
}

function getAiProviders() {
  return providerConfig();
}

export { getGroqClient, getGeminiClient, getAiProviders, providerConfig };
