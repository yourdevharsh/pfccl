import "./compactTable.css";

function CompactTable({ columns, rows, empty = "No records available." }) {
  return (
    <div className="compact-table-wrap">
      {rows.length === 0 ? (
        <div className="compact-table-empty">{empty}</div>
      ) : (
        <table className="compact-table">
          <thead>
            <tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.__rowId ?? row.id ?? JSON.stringify(row)}>
                {columns.map((column) => <td key={column.key}>{column.render ? column.render(row) : row[column.key] ?? "—"}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default CompactTable;
