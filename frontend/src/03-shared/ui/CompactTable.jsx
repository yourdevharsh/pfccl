import "./compactTable.css";

export default function CompactTable({
  columns = [],
  rows = [],
  empty = "No records available.",
}) {
  if (!rows.length) return <div className="compact-table-empty">{empty}</div>;
  return (
    <div className="compact-table-wrap">
      <table className="compact-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={row.__rowId || row.id || `${rowIndex}`}>
              {columns.map((column) => (
                <td key={column.key}>
                  {column.render
                    ? column.render(row)
                    : (row[column.key] ?? "—")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
