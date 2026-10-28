import { useState } from "react";
import { useAuth } from "../../04-hooks/auth";
import "./login.css";

export default function LoginScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true); setError("");
    try { await login({ username, password }); }
    catch (requestError) { setError(requestError.message || "Unable to sign in."); }
    finally { setSubmitting(false); }
  }

  return <main className="login-page"><form className="login-card" onSubmit={submit}>
    <div className="login-mark">PFCCL</div>
    <p className="login-eyebrow">SUBSIDIARIES REPOSITORY</p>
    <h1>Sign in</h1>
    <p>Use the administrator credentials assigned to you.</p>
    <label>Username<input autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required /></label>
    <label>Password<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
    {error && <div className="login-error" role="alert">{error}</div>}
    <button type="submit" disabled={submitting}>{submitting ? "Signing in…" : "Sign in"}</button>
  </form></main>;
}
