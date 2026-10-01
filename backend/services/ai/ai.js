import { config } from "../../config.js";

import {
  estimateTokens,
  normalizeAiAnswer,
  normalizeMessages,
} from "./aiUtils.js";

import { buildSystemPrompt, contextTooLarge } from "./promptBuilder.js";

import {
  providerConfig,
  getGeminiClient,
  getGroqClient,
} from "./aiProviders.js";

export function getAiProviders() {
  return providerConfig();
}

export async function answerWithAi({ provider, messages, selections }) {
  if (!["gemini", "groq"].includes(provider)) {
    const error = new Error("Unsupported AI provider.");
    error.status = 400;
    throw error;
  }
  if (!Array.isArray(selections) || !selections.length) {
    const error = new Error(
      "Select at least one PDF or detail element before asking a question.",
    );
    error.status = 400;
    throw error;
  }
  if (selections.length > config.aiMaxSelections) {
    const error = new Error(
      `You selected ${selections.length} items, but the maximum is ${config.aiMaxSelections}. Remove some selections and try again.`,
    );
    error.status = 413;
    error.code = "AI_TOO_MANY_SELECTIONS";
    throw error;
  }

  const systemPrompt = await buildSystemPrompt(selections);
  const estimatedSystemTokens = estimateTokens(systemPrompt);
  const sizeError = contextTooLarge(estimatedSystemTokens);
  if (sizeError) throw sizeError;

  const normalizedMessages = normalizeMessages(messages);
  const lastUserMessage = [...normalizedMessages]
    .reverse()
    .find((message) => message.role === "user");
  if (!lastUserMessage) {
    const error = new Error("A user question is required.");
    error.status = 400;
    throw error;
  }

  if (provider === "groq") {
    const client = getGroqClient();
    if (!client) {
      const error = new Error(
        "Groq is not configured. Set GROQ_API_KEY on the server.",
      );
      error.status = 503;
      throw error;
    }

    const completion = await client.chat.completions.create({
      model: config.groqModel,
      temperature: 0.2,
      messages: [
        { role: "system", content: systemPrompt },
        ...normalizedMessages,
      ],
    });
    const answer = normalizeAiAnswer(
      completion.choices?.[0]?.message?.content ||
        "No response was returned by Groq.",
    );
    return {
      provider,
      model: config.groqModel,
      answer,
      estimatedSystemTokens,
      usage: completion.usage || null,
    };
  }

  const client = getGeminiClient();
  if (!client) {
    const error = new Error(
      "Gemini is not configured. Set GEMINI_API_KEY on the server.",
    );
    error.status = 503;
    throw error;
  }

  const transcript = normalizedMessages
    .map(
      (message) =>
        `${message.role === "user" ? "USER" : "ASSISTANT"}: ${message.content}`,
    )
    .join("\n\n");

  const interaction = await client.interactions.create({
    model: config.geminiModel,
    system_instruction: systemPrompt,
    input: transcript,
    store: false,
  });

  return {
    provider,
    model: config.geminiModel,
    answer: normalizeAiAnswer(
      interaction.output_text || "No response was returned by Gemini.",
    ),
    estimatedSystemTokens,
    usage: interaction.usage || null,
  };
}
