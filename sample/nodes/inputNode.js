// inputNode.js

import { useState } from "react";
import { Handle, Position } from "reactflow";
import { useStore } from "../store";

export const InputNode = ({ id, data }) => {
  const [currName, setCurrName] = useState(
    data?.inputName || id.replace("customInput-", "input_"),
  );
  const [inputType, setInputType] = useState(data.inputType || "Text");

  const updateNodeField = useStore((state) => state.updateNodeField);

  const handleNameChange = (e) => {
    setCurrName(e.target.value);
    updateNodeField(id, "inputName", e.target.value);
  };

  const handleTypeChange = (e) => {
    setInputType(e.target.value);
    updateNodeField(id, "inputType", e.target.value);
  };

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
      <div 
        style={{ 
          backgroundColor: "#1C2536", 
          padding: "6px 12px", 
          borderBottom: "1px solid #2B384E" 
        }}
      >
        <span style={{ color: "#FFFFFF", fontSize: "12px", fontWeight: "600" }}>
          Input Node
        </span>
      </div>

      <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "11px", fontWeight: "600", color: "#64748B" }}>
            Field Name
          </label>
          <input 
            type="text" 
            value={currName} 
            onChange={handleNameChange} 
            style={{
              padding: "6px 8px",
              fontSize: "12px",
              border: "1px solid #CBD5E1",
              borderRadius: "4px",
              outline: "none",
              color: "#334155"
            }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "11px", fontWeight: "600", color: "#64748B" }}>
            Data Type
          </label>
          <select 
            value={inputType} 
            onChange={handleTypeChange}
            style={{
              padding: "6px 8px",
              fontSize: "12px",
              border: "1px solid #CBD5E1",
              borderRadius: "4px",
              backgroundColor: "#FFFFFF",
              outline: "none",
              color: "#334155",
              cursor: "pointer"
            }}
          >
            <option value="Text">Text</option>
            <option value="File">File</option>
          </select>
        </div>
      </div>

      <Handle 
        type="source" 
        position={Position.Right} 
        id={`${id}-value`} 
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