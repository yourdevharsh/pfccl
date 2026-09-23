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
      setState({ status: "checking", url: "", message: "Checking file…" });
      let lastMessage = "The repository could not find this file.";

      for (const candidate of candidates) {
        const target = new URL(candidate, window.location.href);
        try {
          const response = await fetch(target.href, { method: "HEAD", cache: "no-store" });
          if (response.ok) {
            if (!cancelled) setState({ status: "ready", url: candidate, message: "" });
            return;
          }
          try {
            const body = await response.text();
            const parsed = JSON.parse(body);
            lastMessage = parsed?.message || lastMessage;
          } catch {
            // Try the next candidate without replacing the friendly fallback.
          }
        } catch (error) {
          if (target.origin !== window.location.origin && error instanceof TypeError) {
            if (!cancelled) setState({ status: "ready", url: candidate, message: "" });
            return;
          }
          lastMessage = error?.message || lastMessage;
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
