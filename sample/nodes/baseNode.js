//baseNode.js
import { useState, useEffect } from "react";
import { Handle, Position, useUpdateNodeInternals } from "reactflow";
import { useStore } from "../store";

export const baseNode = (nodeConfig) => {
  const handlePositions = {
    left: Position.Left,
    right: Position.Right,
    top: Position.Top,
    bottom: Position.Bottom,
  };

  return ({ id, data }) => {
    const updateNodeInternals = useUpdateNodeInternals();

    const updateNodeField = useStore((state) => state.updateNodeField);

    const [formState, updateFormState] = useState(() => {
      const initialState = {};
      nodeConfig.inputs.forEach((input) => {
        const fieldKey = input.label || input.name;
        initialState[fieldKey] =
          data?.[fieldKey] ||
          input.defaultValue ||
          (input.type === "checkbox" ? [] : "");
      });
      return initialState;
    });

    const handleInputChange = (fieldKey, value) => {
      updateFormState((prevState) => ({
        ...prevState,
        [fieldKey]: value,
      }));
      updateNodeField(id, fieldKey, value);
    };

    useEffect(() => {
      updateNodeInternals(id);
    }, [formState, id, updateNodeInternals]);

    return (
      <div
        style={{
          display: "inline-block",
          minWidth: "200px",
          maxWidth: "350px",
          height: "auto",
          backgroundColor: "#FFFFFF",
          borderRadius: "8px",
          border: "1px solid #E2E8F0",
          boxShadow:
            "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
          overflow: "hidden",
          fontFamily: "system-ui, sans-serif",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            backgroundColor: "#1C2536",
            padding: "6px 12px",
            borderBottom: "1px solid #2B384E",
          }}
        >
          <span
            style={{ color: "#FFFFFF", fontSize: "12px", fontWeight: "600" }}
          >
            {nodeConfig.title}
          </span>
        </div>

        <div
          style={{
            padding: "12px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          {nodeConfig.description && (
            <div
              style={{
                fontSize: "11px",
                color: "#64748B",
                marginTop: "-2px",
                marginBottom: "2px",
              }}
            >
              <span>{nodeConfig.description}</span>
            </div>
          )}

          {nodeConfig.inputs.map((input, index) => {
            const fieldKey = input.label || input.name;
            const isTextualInput = !["dropdown", "checkbox", "radio"].includes(
              input.type,
            );

            return (
              <div
                key={index}
                style={{ display: "flex", flexDirection: "column", gap: "4px" }}
              >
                <label
                  style={{
                    display: "flex",
                    flexDirection: isTextualInput ? "column" : "row",
                    alignItems: isTextualInput ? "stretch" : "center",
                    justifyContent: "space-between",
                    gap: "4px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: "600",
                      color: "#64748B",
                    }}
                  >
                    {input.label}
                  </span>

                  {input.type === "dropdown" ? (
                    <select
                      value={formState[fieldKey]}
                      onChange={(e) =>
                        handleInputChange(fieldKey, e.target.value)
                      }
                      style={{
                        padding: "6px 8px",
                        fontSize: "12px",
                        border: "1px solid #CBD5E1",
                        borderRadius: "4px",
                        backgroundColor: "#FFFFFF",
                        outline: "none",
                        color: "#334155",
                        cursor: "pointer",
                        width: "100%",
                        boxSizing: "border-box",
                      }}
                    >
                      {input.options?.map((opt, i) => (
                        <option key={i} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : input.type === "checkbox" ? (
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "4px 8px",
                        justifyContent: "flex-end",
                      }}
                    >
                      {input.options?.map((opt, i) => {
                        const currentSelections = Array.isArray(
                          formState[fieldKey],
                        )
                          ? formState[fieldKey]
                          : [];
                        const isChecked = currentSelections.includes(opt);

                        return (
                          <label
                            key={i}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              fontSize: "12px",
                              color: "#334155",
                              cursor: "pointer",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                const updatedSelections = e.target.checked
                                  ? [...currentSelections, opt]
                                  : currentSelections.filter((x) => x !== opt);
                                handleInputChange(fieldKey, updatedSelections);
                              }}
                              style={{ cursor: "pointer" }}
                            />
                            <span style={{ marginLeft: 4 }}>{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                  ) : input.type === "radio" ? (
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "4px 8px",
                        justifyContent: "flex-end",
                      }}
                    >
                      {input.options?.map((opt, i) => (
                        <label
                          key={i}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            fontSize: "12px",
                            color: "#334155",
                            cursor: "pointer",
                          }}
                        >
                          <input
                            type="radio"
                            name={`${id}-${fieldKey}`}
                            checked={formState[fieldKey] === opt}
                            onChange={() => handleInputChange(fieldKey, opt)}
                            style={{ cursor: "pointer" }}
                          />
                          <span style={{ marginLeft: 4 }}>{opt}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div
                      style={{
                        position: "relative",
                        display: "inline-grid",
                        width: "100%",
                      }}
                    >
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
                        }}
                      >
                        {formState[fieldKey] || " "}
                      </span>

                      <input
                        type={input.type}
                        value={formState[fieldKey]}
                        onChange={(e) =>
                          handleInputChange(fieldKey, e.target.value)
                        }
                        style={{
                          gridArea: "1 / 1 / 2 / 2",
                          width: "100%",
                          fontFamily: "inherit",
                          fontSize: "12px",
                          padding: "6px 8px",
                          border: "1px solid #CBD5E1",
                          borderRadius: "4px",
                          outline: "none",
                          color: "#334155",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>
                  )}
                </label>
              </div>
            );
          })}
        </div>

        {Object.keys(nodeConfig.handles || {}).map((key) => {
          return nodeConfig.handles[key].map((handle, index) => {
            const isHorizontal = key === "top" || key === "bottom";
            return (
              <Handle
                key={`${key}-${index}`}
                type={handle.type}
                position={handlePositions[key]}
                id={`${id}-value-${handle.id}`}
                style={{
                  width: "8px",
                  height: "8px",
                  backgroundColor: "#00d2ff",
                  border: "2px solid #FFFFFF",
                  left: isHorizontal
                    ? `${((index + 1) * 100) / (nodeConfig.handles[key].length + 1)}%`
                    : key === "left"
                      ? "-5px"
                      : undefined,
                  right: key === "right" ? "-5px" : undefined,
                  top: !isHorizontal
                    ? `${((index + 1) * 100) / (nodeConfig.handles[key].length + 1)}%`
                    : key === "top"
                      ? "-5px"
                      : undefined,
                  bottom: key === "bottom" ? "-5px" : undefined,
                }}
              />
            );
          });
        })}
      </div>
    );
  };
};
