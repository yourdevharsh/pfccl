// promptNode.js
import { baseNode } from "./baseNode";

const promptConfig = {
  title: "Prompt Constructor",
  description: "Formats engineering blocks into templates.",
  inputs: [
    {
      label: "Temperature Optimization",
      type: "dropdown",
      options: ["Deterministic (0.0)", "Balanced (0.7)", "Creative (1.0)"],
    },
    {
      label: "Safety Filters Enabled",
      type: "checkbox",
      options: ["Hate Speech", "Harassment", "Pornography"],
    },
  ],
  handles: {
    left: [
      { type: "target", id: "contextInput" },
      { type: "target", id: "variableOverride" },
    ],
    right: [{ type: "source", id: "formattedPrompt" }],
  },
};

export const PromptNode = baseNode(promptConfig);
