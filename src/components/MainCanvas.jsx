import { ReactFlow, Controls, MiniMap, Background } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

export default function MainCanvas() {
  return (
    <div style={{ padding: "10px", backgroundColor: "#F1F5F9" }}>
      <div
        style={{
          width: "100%",
          height: "85vh",
          backgroundColor: "#F9F9F9",
          borderRadius: "12px",
          border: "1px solid #E2E8F0",
          boxShadow:
            "inset 0 2px 4px rgba(0,0,0,0.02), 0 4px 12px rgba(15, 23, 42, 0.05)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <ReactFlow
        // nodes={nodes}
        // edges={edges}
        // onNodesChange={onNodesChange}
        // onEdgesChange={onEdgesChange}
        // onConnect={onConnect}
        // onDrop={onDrop}
        // onDragOver={onDragOver}
        // onInit={setReactFlowInstance}
        // nodeTypes={nodeTypes}
        // proOptions={proOptions}
        // snapGrid={[gridSize, gridSize]}
        // connectionLineType="smoothstep"
        // connectionLineStyle={{ stroke: "#00d2ff", strokeWidth: 2 }}
        // onNodeDoubleClick={onNodeDoubleClick}
        // onEdgeDoubleClick={onEdgeDoubleClick}
        >
          <Background color="#CBD5E1" gap={20} size={1.5} />
          <Controls
            style={{
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
              borderRadius: "6px",
              overflow: "hidden",
              border: "1px solid #E2E8F0",
              padding: "3px",
            }}
          />
          <MiniMap
            nodeColor="#1C2536"
            maskColor="rgba(241, 245, 249, 0.7)"
            style={{
              borderRadius: "8px",
              border: "1px solid #E2E8F0",
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
            }}
          />
        </ReactFlow>
      </div>
    </div>
  );
}
