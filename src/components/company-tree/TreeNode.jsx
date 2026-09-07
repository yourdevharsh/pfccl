import "./treeNode.css";

function TreeNode({
  type,
  name,
  selected = false,
  collapsed = false,
  hasToggle = false,
  onToggle,
  onSelect,
  onAdd,
  children,
}) {
  const hasChildren = hasToggle || children !== undefined;

  return (
    <div className={`tree-node tree-node-${type} ${selected ? "selected" : ""}`}>
      <div className="tree-node-content">
        {hasChildren && (
          <button
            type="button"
            className="tree-collapse"
            onClick={onToggle}
            aria-label={`${collapsed ? "Expand" : "Collapse"} ${name}`}
          >
            {collapsed ? "+" : "−"}
          </button>
        )}

        <button
          type="button"
          className="tree-node-box"
          onClick={onSelect}
          aria-current={selected ? "true" : undefined}
        >
          {name}
        </button>

        {type === "division" && (
          <button
            type="button"
            className="tree-action tree-add"
            onClick={onAdd}
            title={`Add ${name} company`}
            aria-label={`Add ${name} company`}
          >
            +
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
