// llmNode.js

import { Handle, Position } from "reactflow";

export const LLMNode = ({ id, data }) => {
  return (
    <div 
      style={{ 
        width: 200, 
        minHeight: 80, 
        backgroundColor: "#FFFFFF",
        borderRadius: "8px",
        border: "1px solid #E2E8F0",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
        overflow: "hidden",
        fontFamily: "system-ui, sans-serif"
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        id={`${id}-system`}
        style={{
          width: "8px",
          height: "8px",
          backgroundColor: "#00d2ff",
          border: "2px solid #FFFFFF",
          left: "-5px",
          top: `${100 / 3}%`
        }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id={`${id}-prompt`}
        style={{
          width: "8px",
          height: "8px",
          backgroundColor: "#00d2ff",
          border: "2px solid #FFFFFF",
          left: "-5px",
          top: `${200 / 3}%`
        }}
      />

      <div 
        style={{ 
          backgroundColor: "#1C2536", 
          padding: "6px 12px", 
          borderBottom: "1px solid #2B384E" 
        }}
      >
        <span style={{ color: "#FFFFFF", fontSize: "12px", fontWeight: "600" }}>
          LLM Node
        </span>
      </div>

      <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
        <div style={{ fontSize: "12px", color: "#334155", lineHeight: "1.5" }}>
          This is an LLM module layer.
        </div>
      </div>

      <Handle 
        type="source" 
        position={Position.Right} 
        id={`${id}-response`} 
        style={{
          width: "8px",
          height: "8px",
          backgroundColor: "#00d2ff",
          border: "2px solid #FFFFFF",
          right: "-5px"
        }}
      />
    </div>
  );
};