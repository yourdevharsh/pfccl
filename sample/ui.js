// ui.js
// Displays the drag-and-drop UI
// --------------------------------------------------

import { useState, useRef, useCallback } from "react";
import ReactFlow, { Controls, Background, MiniMap } from "reactflow";
import { useStore } from "./store";
import { shallow } from "zustand/shallow";
import { InputNode } from "./nodes/inputNode";
import { LLMNode } from "./nodes/llmNode";
import { OutputNode } from "./nodes/outputNode";
import { TextNode } from "./nodes/textNode";
import { DatabaseNode } from "./nodes/databaseNode";
import { ApiNode } from "./nodes/apiNode";
import { PromptNode } from "./nodes/promptNode";
import { CodeNode } from "./nodes/codeNode";
import { NotificationNode } from "./nodes/notificationNode";

import "reactflow/dist/style.css";

const gridSize = 20;
const proOptions = { hideAttribution: true };
const nodeTypes = {
  customInput: InputNode,
  llm: LLMNode,
  customOutput: OutputNode,
  text: TextNode,
  database: DatabaseNode,
  api: ApiNode,
  prompt: PromptNode,
  code: CodeNode,
  notification: NotificationNode,
};

const selector = (state) => ({
  nodes: state.nodes,
  edges: state.edges,
  getNodeID: state.getNodeID,
  addNode: state.addNode,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  onConnect: state.onConnect,
  setNodes: state.setNodes || state.onNodesChange,
});

export const PipelineUI = () => {
  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const {
    nodes,
    edges,
    getNodeID,
    addNode,
    onNodesChange,
    onEdgesChange,
    onConnect,
  } = useStore(selector, shallow);

  const getInitNodeData = (nodeID, type) => {
    let nodeData = { id: nodeID, nodeType: `${type}` };
    return nodeData;
  };

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      if (event?.dataTransfer?.getData("application/reactflow")) {
        const appData = JSON.parse(
          event.dataTransfer.getData("application/reactflow"),
        );
        const type = appData?.nodeType;

        if (typeof type === "undefined" || !type) {
          return;
        }

        const position = reactFlowInstance.project({
          x: event.clientX - reactFlowBounds.left,
          y: event.clientY - reactFlowBounds.top,
        });

        const nodeID = getNodeID(type);
        const newNode = {
          id: nodeID,
          type,
          position,
          data: getInitNodeData(nodeID, type),
        };

        addNode(newNode);
      }
    },
    [reactFlowInstance],
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onNodeDoubleClick = useCallback(
    (event, node) => {
      event.preventDefault();

      const connectedEdges = edges.filter(
        (edge) => edge.source === node.id || edge.target === node.id,
      );

      const edgeChanges = connectedEdges.map((edge) => ({
        id: edge.id,
        type: "remove",
      }));

      onNodesChange([{ id: node.id, type: "remove" }]);
      if (edgeChanges.length > 0) {
        onEdgesChange(edgeChanges);
      }
    },
    [edges, onNodesChange, onEdgesChange],
  );

  const onEdgeDoubleClick = useCallback(
    (event, edge) => {
      event.preventDefault();
      // Fire React Flow's native structural edge removal
      onEdgesChange([{ id: edge.id, type: "remove" }]);
    },
    [onEdgesChange],
  );

  return (
    <div style={{ padding: "20px", backgroundColor: "#F1F5F9" }}>
      <div
        ref={reactFlowWrapper}
        style={{
          width: "100%",
          height: "70vh",
          backgroundColor: "#FFFFFF",
          borderRadius: "12px",
          border: "1px solid #E2E8F0",
          boxShadow:
            "inset 0 2px 4px rgba(0,0,0,0.02), 0 4px 12px rgba(15, 23, 42, 0.05)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onInit={setReactFlowInstance}
          nodeTypes={nodeTypes}
          proOptions={proOptions}
          snapGrid={[gridSize, gridSize]}
          connectionLineType="smoothstep"
          connectionLineStyle={{ stroke: "#00d2ff", strokeWidth: 2 }}
          onNodeDoubleClick={onNodeDoubleClick}
          onEdgeDoubleClick={onEdgeDoubleClick}
        >
          <Background color="#CBD5E1" gap={gridSize} size={1.5} />
          <Controls
            style={{
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
              borderRadius: "6px",
              overflow: "hidden",
              border: "1px solid #E2E8F0",
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
};
