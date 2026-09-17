import { useEffect, useMemo, useState } from "react";
import { aiApi } from "../../api";
import "./aiAssistant.css";

function BotIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 9h8M8 13h5M12 3v3m-6 2h12a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-5a3 3 0 0 1 3-3Zm-3 3v6m14-6v6" /></svg>;
}
function CloseIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>;
}
function SendIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 4 16 8-16 8 3-8-3-8Zm3 8h13" /></svg>;
}
function PlusIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>;
}
function TrashIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M9 7V4h6v3m-8 0 1 13h8l1-13M10 11v6m4-6v6" /></svg>;
}

function normalizeAiAnswer(text) {
  return String(text ?? "")
    .replace(/```[\s\S]*?```/g, (block) => block.replace(/^```[^\n]*\n?/, "").replace(/```$/, ""))
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/\*\*([^*\n]+)\*\*/g, "$1")
    .replace(/__([^_\n]+)__/g, "$1")
    .replace(/\*([^*\n]+)\*/g, "$1")
    .replace(/_([^_\n]+)_/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^\s*[-+*]\s+/gm, "")
    .replace(/^\s*\d+[.)]\s+/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function SelectionChip({ item, onRemove }) {
  const label = item.type === "pdf"
    ? `PDF • ${item.name}`
    : item.type === "section"
      ? `SECTION • ${item.fieldName || item.detailKey}`
      : `${item.fieldName}: ${item.fieldValue || "(empty)"}`;
  const kind = item.type === "pdf" ? "PDF" : item.type === "section" ? "SECTION" : "FIELD";
  return (
    <div className="ai-selection-chip" title={label}>
      <span className="ai-selection-chip-type">{kind}</span>
      <span className="ai-selection-chip-text">{label}</span>
      <button type="button" onClick={() => onRemove(item.id)} title="Remove selection" aria-label="Remove selection">
        <CloseIcon />
      </button>
    </div>
  );
}

export default function AIAssistant({ open, onClose, onOpen, selecting, onToggleSelect, selections, onRemoveSelection }) {
  const [providers, setProviders] = useState([]);
  const [provider, setProvider] = useState("gemini");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    aiApi.getProviders()
      .then((payload) => {
        const nextProviders = payload?.providers || [];
        setProviders(nextProviders);
        setProvider((current) => {
          const available = nextProviders.find((item) => item.id === current && item.configured);
          if (available) return current;
          return nextProviders.find((item) => item.configured)?.id || nextProviders[0]?.id || current;
        });
      })
      .catch((requestError) => setError(requestError.message || "Unable to load AI providers."));
  }, [open]);

  const selectedCountLabel = useMemo(() => `${selections.length} selected`, [selections.length]);

  async function submitQuestion(event) {
    event?.preventDefault();
    const prompt = question.trim();
    if (!prompt || loading) return;
    if (!selections.length) {
      setError("Select at least one PDF or detail element before sending a question.");
      return;
    }

    setError("");
    const nextMessages = [...messages, { role: "user", content: prompt }];
    setMessages(nextMessages);
    setQuestion("");
    setLoading(true);

    try {
      const response = await aiApi.chat({
        provider,
        messages: nextMessages,
        selections,
      });
      setMessages((current) => [...current, { role: "assistant", content: normalizeAiAnswer(response.answer || "No response returned.") }]);
    } catch (requestError) {
      if (nextMessages[nextMessages.length - 1]?.role === "user") {
        setMessages(messages);
        setQuestion(prompt);
      }
      setError(requestError.message || "Unable to get an AI response.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {!open && (
        <button type="button" className="ai-floating-button" onClick={onOpen} title="Open AI assistant" aria-label="Open AI assistant">
          <BotIcon />
        </button>
      )}

      <aside className={`ai-sidebar ${open ? "ai-sidebar-open" : ""}`} aria-hidden={!open}>
        <div className="ai-sidebar-header">
          <div className="ai-sidebar-title-wrap">
            <div className="ai-sidebar-icon"><BotIcon /></div>
            <div><div className="ai-sidebar-eyebrow">AI ASSISTANT</div><div className="ai-sidebar-title">Ask about selected details</div></div>
          </div>
          <button type="button" className="ai-close-button" onClick={onClose} title="Close AI assistant" aria-label="Close AI assistant"><CloseIcon /></button>
        </div>

        <div className="ai-sidebar-toolbar">
          <label className="ai-provider-control">
            <span>Provider</span>
            <select value={provider} onChange={(event) => setProvider(event.target.value)} disabled={loading || selecting}>
              {providers.length ? providers.map((item) => <option key={item.id} value={item.id} disabled={!item.configured}>{item.name}{item.configured ? "" : " (not configured)"}</option>) : <><option value="gemini">Gemini</option><option value="groq">Groq</option></>}
            </select>
          </label>
          <button type="button" className={`ai-select-button ${selecting ? "active" : ""}`} onClick={onToggleSelect} disabled={loading}>
            <PlusIcon />
            {selecting ? "Done selecting" : "Select"}
          </button>
        </div>

        {selecting && <div className="ai-select-banner">Selection mode is active. Single click selects a PDF or detail element. Double click opens, edits, or navigates it without adding a selection. PDF deletion is blocked while selecting.</div>}

        <div className="ai-selection-area">
          <div className="ai-section-label"><span>Context</span><span>{selectedCountLabel}</span></div>
          {selections.length === 0 ? (
            <div className="ai-empty-selection">Nothing selected yet. Use <strong>Select</strong> and pick the details you want the AI to use.</div>
          ) : (
            <div className="ai-selection-list">{selections.map((item) => <SelectionChip key={item.id} item={item} onRemove={onRemoveSelection} />)}</div>
          )}
        </div>

        <div className="ai-chat-history">
          {messages.length === 0 && <div className="ai-empty-chat">Select relevant details or PDFs, then ask a question such as “Summarize the incorporation filings” or “What changed between these selected records?”</div>}
          {messages.map((message, index) => <div key={`${message.role}-${index}`} className={`ai-message ai-message-${message.role}`}><div className="ai-message-role">{message.role === "user" ? "You" : "AI"}</div><div className="ai-message-body">{message.content}</div></div>)}
          {loading && <div className="ai-message ai-message-assistant"><div className="ai-message-role">AI</div><div className="ai-message-body ai-thinking">Thinking…</div></div>}
        </div>

        {error && <div className="ai-error">{error}</div>}

        <form className="ai-input-area" onSubmit={submitQuestion}>
          <textarea value={question} onChange={(event) => setQuestion(event.target.value)} placeholder={selections.length ? "Ask about the selected context…" : "Select context first…"} disabled={loading} rows={3} />
          <button type="submit" className="ai-send-button" disabled={loading || !question.trim() || !selections.length} title="Send question" aria-label="Send question"><SendIcon /></button>
        </form>
      </aside>
    </>
  );
}
