import DraggableNode from "./DraggableNode.jsx";

export default function Toolbar() {
  return (
    <div
      style={{
        padding: "16px 24px",
        backgroundColor: "#F8FAFC",
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
        <DraggableNode type="companyName" label="Name" />
        <DraggableNode type="companyCard" label="Card" />
      </div>
    </div>
  );
}
