import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ref, onValue, push, set } from "firebase/database";
import { db } from "../firebase";
import { toList, dateShort } from "../lib/format";
import CopyButton from "../components/CopyButton";

const blank = { businessName: "", contactName: "", email: "", phone: "" };
const FREE_QUOTE_LINK = "https://mmwebsites.com/#quote";

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [q, setQ] = useState("");
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState(false);

  useEffect(
    () => onValue(ref(db, "clients"), (s) => setClients(toList(s.val()))),
    [],
  );

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = [...clients].sort((a, b) =>
      (a.businessName || "").localeCompare(b.businessName || ""),
    );
    if (!term) return list;
    return list.filter((c) =>
      [c.businessName, c.contactName, c.email, c.phone]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(term)),
    );
  }, [clients, q]);

  const setField = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    if (!form.businessName.trim()) return;
    setBusy(true);
    const node = push(ref(db, "clients"));
    await set(node, {
      businessName: form.businessName.trim(),
      contactName: form.contactName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      status: "active",
      notes: "",
      createdAt: Date.now(),
    });
    setForm(blank);
    setAdding(false);
    setBusy(false);
  };

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">People</p>
          <h1>Clients</h1>
        </div>
        <div className="head-actions">
          <CopyButton
            text={FREE_QUOTE_LINK}
            label="Copy free-quote link"
            copiedLabel="Copied!"
            className="btn btn-outline"
          />
          <button className="btn btn-maroon" onClick={() => setAdding((v) => !v)}>
            {adding ? "Cancel" : "+ Add client"}
          </button>
        </div>
      </header>

      {adding && (
        <form className="panel add-form" onSubmit={save}>
          <div className="grid-2">
            <label className="field">
              <span>Business name *</span>
              <input value={form.businessName} onChange={setField("businessName")} required autoFocus />
            </label>
            <label className="field">
              <span>Contact name</span>
              <input value={form.contactName} onChange={setField("contactName")} />
            </label>
            <label className="field">
              <span>Email</span>
              <input type="email" value={form.email} onChange={setField("email")} />
            </label>
            <label className="field">
              <span>Phone</span>
              <input value={form.phone} onChange={setField("phone")} />
            </label>
          </div>
          <button className="btn btn-maroon" disabled={busy}>
            {busy ? "Saving…" : "Save client"}
          </button>
        </form>
      )}

      <div className="toolbar">
        <input
          className="search"
          placeholder="Search clients…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <span className="muted">{filtered.length} of {clients.length}</span>
      </div>

      <div className="panel">
        {filtered.length === 0 ? (
          <p className="muted">
            {clients.length === 0
              ? "No clients yet — add your first one above."
              : "No clients match that search."}
          </p>
        ) : (
          <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th>Business</th>
                <th>Contact</th>
                <th>Phone</th>
                <th>Added</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link className="link strong" to={`/clients/${c.id}`}>
                      {c.businessName}
                    </Link>
                  </td>
                  <td>{c.contactName || "—"}</td>
                  <td>{c.phone || "—"}</td>
                  <td>{dateShort(c.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
}
