import "./boardEventsSidebar.css";

function formatEventDate(value) {
  if (!value) return "—";
  return new Date(`${value}T00:00:00Z`).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function urgencyLabel(event) {
  if (event.daysUntil < 0) return `${Math.abs(event.daysUntil)}d overdue`;
  if (event.daysUntil === 0) return "Today";
  if (event.daysUntil === 1) return "Tomorrow";
  return `${event.daysUntil}d`;
}

const eventTypeLabel = {
  BOARD_DUE: "BOARD DUE",
  BOARD: "BOARD",
  AGM: "AGM",
  EGM: "EGM",
  NOTICE_DUE: "NOTICE",
  AGENDA_DUE: "AGENDA",
  MINUTES_DRAFT_DUE: "DRAFT MINUTES",
  MINUTES_COMMENTS_DUE: "COMMENTS",
  MINUTES_FINAL_DUE: "FINAL MINUTES",
};

export default function BoardEventsSidebar({ events = [], onOpenEvent }) {
  return (
    <aside className="board-events-sidebar" aria-label="Date-bound events">
      <div className="board-events-header">
        <div>
          <div className="board-events-eyebrow">WHAT NEEDS ATTENTION</div>
          <h2>Upcoming events</h2>
        </div>
        <div className="board-events-count">{events.length}</div>
      </div>

      <div className="board-events-legend" aria-hidden="true">
        <span><i className="urgency-dot urgency-critical" />Urgent</span>
        <span><i className="urgency-dot urgency-high" />Soon</span>
        <span><i className="urgency-dot urgency-medium" />Upcoming</span>
        <span><i className="urgency-dot urgency-low" />Safe</span>
      </div>

      <div className="board-events-list">
        {events.length === 0 ? (
          <div className="board-events-empty">
            <div className="board-events-empty-icon">✓</div>
            <strong>No date-bound actions</strong>
            <span>Nothing is currently due in the active reminder window.</span>
          </div>
        ) : (
          events.map((event) => (
            <button
              type="button"
              className={`board-event-card urgency-${event.severity || "low"}`}
              key={event.id}
              onClick={() => onOpenEvent?.(event)}
              title={event.description || event.title}
            >
              <div className="board-event-marker" />
              <div className="board-event-content">
                <div className="board-event-topline">
                  <span className="board-event-type">{eventTypeLabel[event.type] || event.type}</span>
                  <span className="board-event-urgency">{urgencyLabel(event)}</span>
                </div>
                <strong className="board-event-title">{event.title}</strong>
                <span className="board-event-company">{event.companyName}</span>
                <div className="board-event-meta">
                  <span>{formatEventDate(event.date)}</span>
                  <span>{event.division?.toUpperCase()}</span>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </aside>
  );
}
