// draggableNode.js

export const DraggableNode = ({ type, label }) => {
  const onDragStart = (event, nodeType) => {
    const appData = { nodeType };
    event.target.style.cursor = "grabbing";
    event.dataTransfer.setData(
      "application/reactflow",
      JSON.stringify(appData),
    );
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <div
      className={type}
      onDragStart={(event) => onDragStart(event, type)}
      onDragEnd={(event) => (event.target.style.cursor = "grab")}
      style={{
        cursor: "grab",
        minWidth: "90px",
        height: "40px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "6px",
        backgroundColor: "#1C2536",
        border: "1px solid #2B384E",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
        padding: "0 16px",
        transition: "all 0.2s ease",
      }}
      draggable
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "#253248";
        e.currentTarget.style.borderColor = "#00d2ff";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "#1C2536";
        e.currentTarget.style.borderColor = "#2B384E";
      }}
    >
      <span 
        style={{ 
          color: "#fff", 
          fontSize: "13px", 
          fontWeight: "500",
          fontFamily: "system-ui, sans-serif" 
        }}
      >
        {label}
      </span>
    </div>
  );
};