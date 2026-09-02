function TreeNode({
  type,
  name,
  collapsed,
  selected,
  onToggle,
  onSelect,
  onAdd,
  onDelete,
  children,
}) {
  const hasChildren = children !== undefined;

  return (
    <div
      className={`tree-node tree-node-${type} ${selected ? "selected" : ""}`}
    >
      <div className="tree-node-content">
        {hasChildren && (
          <button type="button" className="tree-collapse" onClick={onToggle}>
            {collapsed ? "+" : "−"}
          </button>
        )}

        <button type="button" className="tree-node-box" onClick={onSelect}>
          {name}
        </button>

        {type === "division" && (
          <button
            type="button"
            className="tree-add"
            onClick={onAdd}
            title="Add company"
          >
            +
          </button>
        )}

        {type === "company" && (
          <button
            type="button"
            className="tree-delete"
            onClick={onDelete}
            title="Delete company"
          >
            ×
          </button>
        )}
      </div>

      {hasChildren && !collapsed && (
        <div className="tree-node-children">{children}</div>
      )}
    </div>
  );
}

export default TreeNode;
