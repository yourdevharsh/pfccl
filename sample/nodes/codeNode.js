// codeNode.js
import { baseNode } from "./baseNode";

const codeConfig = {
  title: "JavaScript Evaluator",
  description: "Runs inline sandboxed scripts.",
  inputs: [
    { label: "Timeout (ms)", type: "text", defaultValue: "5000" },
    {
      label: "Production Node Environment",
      type: "radio",
      options: ["Development", "Production"],
    },
  ],
  handles: {
    left: [
      { type: "target", id: "arg1" },
      { type: "target", id: "arg2" },
      { type: "target", id: "arg3" },
    ],
    right: [{ type: "source", id: "executionOutput" }],
  },
};

export const CodeNode = baseNode(codeConfig);
