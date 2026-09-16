import { buildDetailNavigation } from "../../utils/detailNavigation";
import "./detailsNavigation.css";

function ArrowIcon({ direction }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {direction === "back" ? (
        <path d="M14.5 5 7.5 12l7 7M8 12h10" />
      ) : (
        <path d="m9.5 5 7 7-7 7M16 12H6" />
      )}
    </svg>
  );
}

function DetailsNavigation({
  selectedNodeId,
  companies,
  selectedYearByDivision,
  onSelect,
}) {
  const navigation = buildDetailNavigation({
    selectedNodeId,
    companies,
    selectedYearByDivision,
  });

  const canGoBack = Boolean(navigation.previousId);
  const canGoForward = Boolean(navigation.nextId);

  function goTo(id) {
    if (id) onSelect(id);
  }

  return (
    <div className="details-navigation" aria-label="Details navigation">
      <button
        type="button"
        className="details-navigation-button"
        onClick={() => goTo(navigation.previousId)}
        disabled={!canGoBack}
        title={
          canGoBack
            ? `Back to ${navigation.previousLabel}`
            : "Already at the top level"
        }
        aria-label={
          canGoBack
            ? `Back to ${navigation.previousLabel}`
            : "Back navigation unavailable"
        }
      >
        <ArrowIcon direction="back" />
      </button>

      <button
        type="button"
        className="details-navigation-button"
        onClick={() => goTo(navigation.nextId)}
        disabled={!canGoForward}
        title={
          canGoForward
            ? `Forward to ${navigation.nextLabel}`
            : "Already at the last available detail"
        }
        aria-label={
          canGoForward
            ? `Forward to ${navigation.nextLabel}`
            : "Forward navigation unavailable"
        }
      >
        <ArrowIcon direction="forward" />
      </button>
    </div>
  );
}

export default DetailsNavigation;
