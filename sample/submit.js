// submit.js
import { useState } from "react";
import { useNodes, useEdges } from "reactflow";

export const SubmitButton = () => {
  const nodes = useNodes();
  const edges = useEdges();

  const [modalData, setModalData] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = async () => {
    try {
      const response = await fetch("http://localhost:8000/pipelines/parse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nodes, edges }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      const result = await response.json();

      setModalData(result);
      setIsOpen(true);
    } catch (error) {
      console.error("Submission failed: ", error);
      alert("Failed to submit pipeline. Please try again.");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginTop: "10px",
      }}
    >
      <button
        type="button"
        onClick={handleSubmit}
        style={{
          padding: "10px 24px",
          background: "#10b981",
          color: "white",
          border: "none",
          borderRadius: "6px",
          fontSize: "14px",
          fontWeight: "600",
          cursor: "pointer",
          transition: "background 0.2s",
        }}
      >
        Submit
      </button>

      {isOpen && modalData && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "24px",
              borderRadius: "12px",
              boxShadow:
                "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
              width: "320px",
              textAlign: "center",
              fontFamily: "sans-serif",
            }}
          >
            <h3
              style={{
                margin: "0 0 16px 0",
                color: "#111827",
                fontSize: "18px",
              }}
            >
              Pipeline Status
            </h3>

            <div
              style={{
                textAlign: "left",
                marginBottom: "20px",
                color: "#4b5563",
                fontSize: "14px",
                lineHeight: "1.6",
              }}
            >
              <p style={{ margin: "4px 0" }}>
                <strong>Nodes:</strong> {modalData.num_nodes}
              </p>
              <p style={{ margin: "4px 0" }}>
                <strong>Edges:</strong> {modalData.num_edges}
              </p>
              <p style={{ margin: "4px 0" }}>
                <strong>DAG Status:</strong>{" "}
                <span
                  style={{
                    color: modalData.is_dag ? "#059669" : "#dc2626",
                    fontWeight: "bold",
                  }}
                >
                  {modalData.is_dag
                    ? "Valid (Is DAG)"
                    : "Invalid (Contains Loops)"}
                </span>
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{
                width: "100%",
                padding: "8px 0",
                background: "#ef4444",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontWeight: "500",
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
