import { useEffect, useMemo, useState } from "react";
import { ref, onValue, push, set, remove } from "firebase/database";
import { db } from "../firebase";
import { toList, dateShort } from "../lib/format";

const DAY = 86400000;
const blank = () => ({
  domain: "",
  clientId: "",
  registrar: "",
  hosting: "",
  expiresAt: "",
  autoRenew: false,
  notes: "",
});

function expiryInfo(expiresAt) {
  if (!expiresAt) return { label: "—", tone: "muted", days: null };
  const t = new Date(expiresAt + "T00:00:00").getTime();
  const days = Math.round((t - Date.now()) / DAY);
  if (days < 0) return { label: "Expired", tone: "pill-unpaid", days };
  if (days <= 30) return { label: `${days} days`, tone: "pill-building", days };
  return { label: dateShort(t), tone: "pill-live", days };
}

export default function Domains() {
  const [domains, setDomains] = useState([]);
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState(blank());
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const subs = [
      onValue(ref(db, "domains"), (s) => setDomains(toList(s.val()))),
      onValue(ref(db, "clients"), (s) => setClients(toList(s.val()))),
    ];
    return () => subs.forEach((u) => u());
  }, []);

  const clientName = (id) => clients.find((c) => c.id === id)?.businessName || "—";
  const setF = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: k === "autoRenew" ? e.target.checked : e.target.value }));

  const sorted = useMemo(
    () =>
      [...domains].sort((a, b) => {
        const ax = a.expiresAt ? new Date(a.expiresAt).getTime() : Infinity;
        const bx = b.expiresAt ? new Date(b.expiresAt).getTime() : Infinity;
        return ax - bx;
      }),
    [domains],
  );

  const expiringSoon = domains.filter((d) => {
    const i = expiryInfo(d.expiresAt);
    return i.days !== null && i.days <= 30;
  }).length;

  async function addDomain(e) {
    e.preventDefault();
    if (!form.domain.trim()) return;
    const node = push(ref(db, "domains"));
    await set(node, {
      domain: form.domain.trim().replace(/^https?:\/\//, ""),
      clientId: form.clientId || "",
      registrar: form.registrar.trim(),
      hosting: form.hosting.trim(),
      expiresAt: form.expiresAt || "",
      autoRenew: !!form.autoRenew,
      notes: form.notes.trim(),
      createdAt: Date.now(),
    });
    setForm(blank());
    setAdding(false);
  }

  const del = (d) => {
    if (window.confirm("Remove this domain from the tracker?")) remove(ref(db, "domains/" + d.id));
  };

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Infrastructure</p>
          <h1>Domains &amp; hosting</h1>
          <p className="page-sub">Track client domains, hosts, and renewal dates.</p>
        </div>
        <button className="btn btn-maroon" onClick={() => setAdding((a) => !a)}>
          {adding ? "Close" : "+ Add domain"}
        </button>
      </header>

      <div className="tiles">
        <div className="tile">
          <div className="tile-label">Domains tracked</div>
          <div className="tile-value">{domains.length}</div>
        </div>
        <div className={`tile ${expiringSoon > 0 ? "tile-accent" : ""}`}>
          <div className="tile-label">Renewing within 30 days</div>
          <div className="tile-value">{expiringSoon}</div>
        </div>
      </div>

      {adding && (
        <section className="panel">
          <h2>Add domain</h2>
          <form onSubmit={addDomain}>
            <div className="grid-2">
              <label className="field">
                <span>Domain</span>
                <input value={form.domain} onChange={setF("domain")} placeholder="smithplumbing.com" autoFocus />
              </label>
              <label className="field">
                <span>Client</span>
                <select value={form.clientId} onChange={setF("clientId")}>
                  <option value="">— None —</option>
                  {clients
                    .slice()
                    .sort((a, b) => (a.businessName || "").localeCompare(b.businessName || ""))
                    .map((c) => (
                      <option key={c.id} value={c.id}>{c.businessName}</option>
                    ))}
                </select>
              </label>
            </div>
            <div className="grid-2" style={{ marginTop: 14 }}>
              <label className="field">
                <span>Registrar</span>
                <input value={form.registrar} onChange={setF("registrar")} placeholder="GoDaddy, Namecheap, Squarespace…" />
              </label>
              <label className="field">
                <span>Hosting</span>
                <input value={form.hosting} onChange={setF("hosting")} placeholder="Firebase, Vercel…" />
              </label>
            </div>
            <div className="grid-2" style={{ marginTop: 14 }}>
              <label className="field">
                <span>Expires / renews on</span>
                <input type="date" value={form.expiresAt} onChange={setF("expiresAt")} />
              </label>
              <label className="field" style={{ justifyContent: "flex-end" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input type="checkbox" checked={form.autoRenew} onChange={setF("autoRenew")} style={{ width: 18, height: 18 }} />
                  Auto-renew is on
                </span>
              </label>
            </div>
            <label className="field" style={{ marginTop: 14 }}>
              <span>Notes</span>
              <input value={form.notes} onChange={setF("notes")} placeholder="Login, DNS notes, who pays…" />
            </label>
            <div className="save-bar">
              <button className="btn btn-maroon">Save domain</button>
            </div>
          </form>
        </section>
      )}

      <section className="panel">
        {sorted.length === 0 ? (
          <p className="muted">No domains tracked yet. Add your clients&apos; domains to keep an eye on renewals.</p>
        ) : (
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Domain</th>
                  <th>Client</th>
                  <th>Registrar</th>
                  <th>Hosting</th>
                  <th>Renews</th>
                  <th>Auto</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((d) => {
                  const info = expiryInfo(d.expiresAt);
                  return (
                    <tr key={d.id}>
                      <td>
                        <a className="link strong" href={`https://${d.domain}`} target="_blank" rel="noreferrer">
                          {d.domain}
                        </a>
                      </td>
                      <td>{clientName(d.clientId)}</td>
                      <td>{d.registrar || "—"}</td>
                      <td>{d.hosting || "—"}</td>
                      <td>
                        {info.tone === "muted" ? (
                          <span className="muted">—</span>
                        ) : (
                          <span className={`pill ${info.tone}`}>{info.label}</span>
                        )}
                      </td>
                      <td>{d.autoRenew ? "✓" : "—"}</td>
                      <td className="right">
                        <button className="btn btn-outline btn-sm" onClick={() => del(d)}>
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
