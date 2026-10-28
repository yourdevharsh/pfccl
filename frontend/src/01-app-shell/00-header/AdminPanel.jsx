import { useEffect, useState } from "react";
import { authApi } from "../../05-services/api";

const emptyForm = { username: "", password: "", role: "MINOR" };
const roles = ["SUPER", "MAJOR", "MINOR"];
function unpack(response) { return response?.data ?? response; }

export default function AdminPanel({ onClose }) {
  const [admins, setAdmins] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true); setError("");
    try { setAdmins(unpack(await authApi.getAdmins()).users || []); }
    catch (requestError) { setError(requestError.message || "Unable to load administrators."); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);
  async function create(event) {
    event.preventDefault(); setError("");
    try { await authApi.createAdmin(form); setForm(emptyForm); await load(); }
    catch (requestError) { setError(requestError.message || "Unable to create administrator."); }
  }
  async function resetPassword(admin) {
    const password = window.prompt(`Set a new password for ${admin.username} (minimum 12 characters):`);
    if (!password) return;
    try { await authApi.updateAdmin(admin.id, { password }); await load(); }
    catch (requestError) { setError(requestError.message || "Unable to reset password."); }
  }
  async function remove(admin) {
    if (!window.confirm(`Delete administrator ${admin.username}?`)) return;
    try { await authApi.deleteAdmin(admin.id); await load(); }
    catch (requestError) { setError(requestError.message || "Unable to delete administrator."); }
  }
  return <div className="admin-panel-backdrop" role="presentation"><section className="admin-panel" role="dialog" aria-modal="true" aria-label="Administrator management">
    <div className="admin-panel-head"><div><p>SUPER ADMIN</p><h2>Administrators</h2></div><button type="button" onClick={onClose}>×</button></div>
    <form className="admin-create-form" onSubmit={create}><input placeholder="Username" value={form.username} onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))} required /><input type="password" placeholder="Temporary password (12+ characters)" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} required minLength="12" /><select value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}>{roles.map((role) => <option key={role}>{role}</option>)}</select><button type="submit">Add admin</button></form>
    {error && <div className="login-error">{error}</div>}
    {loading ? <p>Loading administrators…</p> : <div className="admin-list">{admins.map((admin) => <div className="admin-row" key={admin.id}><div><strong>{admin.username}</strong><span>{admin.role}</span></div><div><button type="button" onClick={() => resetPassword(admin)}>Reset password</button><button type="button" className="danger" onClick={() => remove(admin)}>Delete</button></div></div>)}</div>}
  </section></div>;
}
