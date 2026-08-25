// toolbar.js

import { DraggableNode } from "./draggableNode";

export const PipelineToolbar = () => {
  return (
    <div
      style={{
        padding: "16px 24px",
        backgroundColor: "#F8FAFC",
        borderBottom: "1px solid #E2E8F0",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h2
        style={{
          margin: "0 0 12px 0",
          fontSize: "16px",
          fontWeight: "600",
          color: "#0F172A",
        }}
      >
        Components Panel
      </h2>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          alignItems: "center",
        }}
      >
        <DraggableNode type="customInput" label="Input" />
        <DraggableNode type="llm" label="LLM" />
        <DraggableNode type="customOutput" label="Output" />
        <DraggableNode type="text" label="Text" />
        <DraggableNode type="database" label="Database" />
        <DraggableNode type="prompt" label="Prompt" />
        <DraggableNode type="api" label="API" />
        <DraggableNode type="code" label="Code" />
        <DraggableNode type="notification" label="Notification" />
      </div>
    </div>
  );
};
