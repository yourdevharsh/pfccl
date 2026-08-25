// textNode.js

import { useState, useEffect, useRef } from "react";
import { Handle, Position, useUpdateNodeInternals } from "reactflow";
import { useStore } from "../store";

export const TextNode = ({ id, data }) => {
  const [currText, setCurrText] = useState(data?.text || "{{input}}");
  const updateNodeInternals = useUpdateNodeInternals();
  const textareaRef = useRef(null);

  const updateNodeField = useStore((state) => state.updateNodeField);

  const MAX_WIDTH = 250;

  const handleTextChange = (e) => {
    setCurrText(e.target.value);
    updateNodeField(id, "text", e.target.value);
  };

  const regex = /\{\{\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\}\}/g;
  const variables = [];
  let match;

  while ((match = regex.exec(currText)) !== null) {
    if (!variables.includes(match[1])) {
      variables.push(match[1]);
    }
  }

  useEffect(() => {
    updateNodeInternals(id);
  }, [currText, id, updateNodeInternals]);

  return (
    <div
      style={{
        display: "inline-block",
        minWidth: "200px",
        backgroundColor: "#FFFFFF",
        borderRadius: "8px",
        border: "1px solid #E2E8F0",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
        overflow: "hidden",
        fontFamily: "system-ui, sans-serif",
        boxSizing: "border-box",
      }}
    >
      {variables.map((variable, index) => {
        const topPosition = `${((index + 1) * 100) / (variables.length + 1)}%`;

        return (
          <Handle
            key={variable}
            type="target"
            position={Position.Left}
            id={`${id}-variable-${variable}`}
            style={{
              width: "8px",
              height: "8px",
              backgroundColor: "#00d2ff",
              border: "2px solid #FFFFFF",
              left: "-5px",
              top: topPosition,
            }}
          />
        );
      })}

      <div 
        style={{ 
          backgroundColor: "#1C2536", 
          padding: "6px 12px", 
          borderBottom: "1px solid #2B384E" 
        }}
      >
        <span style={{ color: "#FFFFFF", fontSize: "12px", fontWeight: "600" }}>
          Text Node
        </span>
      </div>

      <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "11px", fontWeight: "600", color: "#64748B", display: "flex", flexDirection: "column", gap: "4px" }}>
            Text Content
          </label>

          <div style={{ position: "relative", display: "inline-grid", width: "100%" }}>
            <span
              style={{
                gridArea: "1 / 1 / 2 / 2",
                visibility: "hidden",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                fontFamily: "inherit",
                fontSize: "12px",
                padding: "6px 8px",
                border: "1px solid transparent",
                maxWidth: `${MAX_WIDTH}px`,
                minWidth: "100px",
                boxSizing: "border-box",
              }}
            >
              {currText || " "}
            </span>

            <textarea
              ref={textareaRef}
              value={currText}
              onChange={handleTextChange}
              rows={1}
              style={{
                gridArea: "1 / 1 / 2 / 2",
                width: "100%",
                height: "100%",
                fontFamily: "inherit",
                fontSize: "12px",
                padding: "6px 8px",
                border: "1px solid #CBD5E1",
                borderRadius: "4px",
                outline: "none",
                color: "#334155",
                boxSizing: "border-box",
                resize: "none",
                overflow: "hidden",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            />
          </div>
        </div>
      </div>

      <Handle 
        type="source" 
        position={Position.Right} 
        id={`${id}-output`} 
        style={{
          width: "8px",
          height: "8px",
          backgroundColor: "#00d2ff",
          border: "2px solid #FFFFFF",
          right: "-5px",
        }}
      />
    </div>
  );
};