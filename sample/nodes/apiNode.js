// apiNode.js
import { baseNode } from "./baseNode";

const apiConfig = {
  title: "REST API Endpoint",
  description: "Triggers third-party webhook integrations.",
  inputs: [
    {
      label: "HTTP Method Selection",
      type: "radio",
      options: ["GET", "POST", "PUT", "DELETE"],
    },
    {
      label: "Target URL Path String",
      type: "text",
      defaultValue: "https://api.service.com/v1",
    },
  ],
  handles: {
    left: [{ type: "target", id: "payloadBody" }],
    right: [
      { type: "source", id: "apiSuccess" },
      { type: "source", id: "apiFailure" },
    ],
  },
};

export const ApiNode = baseNode(apiConfig);
