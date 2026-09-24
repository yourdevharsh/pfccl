import { useEffect, useState } from "react";
import { getFileCandidates, getFileName } from "../../utils/fileUtils";

export default function PDFViewer({ file, title }) {
  const candidates = getFileCandidates(file);
  const [state, setState] = useState({ status: "checking", url: "", message: "" });

  useEffect(() => {
    let cancelled = false;
    if (!candidates.length) {
      setState({ status: "error", url: "", message: "This file does not have a valid repository URL." });
      return undefined;
    }

    async function resolveCandidate() {
      setState({ status: "checking", url: "", message: "Opening file…" });
      let lastMessage = "The repository could not find this file.";

      for (const candidate of candidates) {
        const target = new URL(candidate, window.location.href);
        try {
          // Same-origin HEAD gives us a useful early failure signal. For
          // cross-origin/blocked HEAD requests, let the browser's PDF viewer
          // attempt the URL instead of treating the CORS check as a 404.
          if (target.origin === window.location.origin) {
            const response = await fetch(target.href, { method: "HEAD", cache: "no-store" });
            if (response.ok) {
              if (!cancelled) setState({ status: "ready", url: target.href, message: "" });
              return;
            }
            try {
              const body = await response.text();
              const parsed = JSON.parse(body);
              lastMessage = parsed?.message || lastMessage;
            } catch {
              // Try the next candidate.
            }
            continue;
          }

          if (!cancelled) setState({ status: "ready", url: target.href, message: "" });
          return;
        } catch (error) {
          lastMessage = error?.message || lastMessage;
          if (!cancelled) {
            // The URL may still be valid when the HEAD request is blocked.
            setState({ status: "ready", url: target.href, message: "" });
            return;
          }
        }
      }

      if (!cancelled) setState({ status: "error", url: "", message: lastMessage });
    }

    resolveCandidate();
    return () => { cancelled = true; };
  }, [candidates.join("|")]);

  if (state.status === "checking") return <div className="pdf-unavailable">{state.message || "Checking file…"}</div>;
  if (state.status === "error") return <div className="pdf-unavailable" role="alert">{state.message}</div>;
  return <iframe title={title || getFileName(file) || "PDF"} src={state.url} className="pdf-viewer" />;
}
