import { useEffect, useState } from "react";
import { aiApi } from "../../../05-services/api";
import "./reportPane.css";

function Icon({ children }) { return <svg viewBox="0 0 24 24" aria-hidden="true">{children}</svg>; }

export default function ReportPane({ expanded, closed, onExpand, onMinimize, onClose }) {
  const [providers, setProviders] = useState([]);
  const [provider, setProvider] = useState("gemini");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { if (!expanded) return; aiApi.getProviders().then((data) => { const items = data?.providers || []; setProviders(items); setProvider((current) => items.find((item) => item.id === current && item.configured)?.id || items.find((item) => item.configured)?.id || current); }).catch((reason) => setError(reason.message || "Unable to load AI models.")); }, [expanded]);

  async function submit(event) {
    event.preventDefault(); if (!prompt.trim() || loading) return;
    setLoading(true); setError("");
    try { await aiApi.downloadReport({ provider, prompt: prompt.trim() }); }
    catch (reason) { setError(reason.message || "Unable to create the report."); }
    finally { setLoading(false); }
  }

  if (closed) return <button type="button" className="report-reopen-button" data-ai-ignore="true" onClick={onExpand}>Open Report</button>;
  if (!expanded) return <aside className="report-pane report-pane-minimized" data-ai-ignore="true" title="Report"><button type="button" className="workspace-icon-button" onClick={onExpand} aria-label="Expand Report"><Icon><path d="M8 5H5v3m0-3 6 6m5-6h3v3m0-3-6 6M8 19H5v-3m0 3 6-6m5 6h3v-3m0 3-6-6" /></Icon></button><button type="button" className="workspace-icon-button danger" onClick={onClose} aria-label="Close Report"><Icon><path d="m6 6 12 12M18 6 6 18" /></Icon></button><div>REPORT</div></aside>;
  return <section className="report-pane report-pane-expanded" data-ai-ignore="true"><header className="report-pane-header"><div><div className="details-main-eyebrow">AI REPORTING</div><div className="details-main-title">Report</div></div><div className="details-main-actions"><button type="button" className="workspace-icon-button" onClick={onMinimize} title="Minimize Report"><Icon><path d="M5 12h14" /></Icon></button><button type="button" className="workspace-icon-button danger" onClick={onClose} title="Close Report"><Icon><path d="m6 6 12 12M18 6 6 18" /></Icon></button></div></header><form className="report-form" onSubmit={submit}><label>Describe the columns and report style you want<textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} disabled={loading} rows={4} placeholder="Example: Create a landscape table of every company, its division, status, and incorporation date." /></label><div className="report-form-actions"><label>Model<select value={provider} onChange={(event) => setProvider(event.target.value)} disabled={loading}>{providers.length ? providers.map((item) => <option key={item.id} value={item.id} disabled={!item.configured}>{item.name}{item.configured ? "" : " (not configured)"}</option>) : <><option value="gemini">Gemini</option><option value="groq">Groq</option></>}</select></label><button type="submit" disabled={loading || !prompt.trim()}>{loading ? "Creating Word report…" : "Generate Word report"}</button></div>{error && <div className="report-error" role="alert">{error}</div>}</form></section>;
}
