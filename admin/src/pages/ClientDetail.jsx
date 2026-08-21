import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ref, onValue, push, set, update } from "firebase/database";
import { db } from "../firebase";
import { money, dateShort, toList } from "../lib/format";

export default function ClientDetail() {
  const { id } = useParams();
  const [client, setClient] = useState(undefined); // undefined=loading, null=missing
  const [projects, setProjects] = useState([]);
  const [payments, setPayments] = useState([]);
  const [showProject, setShowProject] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
    const subs = [
      onValue(ref(db, "clients/" + id), (s) =>
        setClient(s.exists() ? s.val() : null),
      ),
      onValue(ref(db, "projects"), (s) =>
        setProjects(toList(s.val()).filter((p) => p.clientId === id)),
      ),
      onValue(ref(db, "payments"), (s) =>
        setPayments(toList(s.val()).filter((p) => p.clientId === id)),
      ),
    ];
    return () => subs.forEach((u) => u());
  }, [id]);

  const togglePaid = (p) =>
    update(ref(db, "payments/" + p.id), {
      status: p.status === "paid" ? "unpaid" : "paid",
      paidAt: p.status === "paid" ? null : Date.now(),
    });

  if (client === undefined) return <div className="page muted">Loading…</div>;
  if (client === null)
    return (
      <div className="page">
        <p className="muted">That client doesn&apos;t exist.</p>
        <Link className="link" to="/clients">
          ← Back to clients
        </Link>
      </div>
    );

  return (
    <div className="page">
      <Link className="back" to="/clients">
        ← Clients
      </Link>

      <header className="page-head">
        <div>
          <p className="eyebrow">Client</p>
          <h1>{client.businessName}</h1>
          <p className="muted contact-line">
            {[client.contactName, client.phone, client.email]
              .filter(Boolean)
              .join(" · ") || "No contact details yet"}
          </p>
        </div>
      </header>

      {/* Projects */}
      <section className="panel">
        <div className="panel-head">
          <h2>Projects</h2>
          <button className="btn btn-outline btn-sm" onClick={() => setShowProject((v) => !v)}>
            {showProject ? "Cancel" : "+ Project"}
          </button>
        </div>
        {showProject && (
          <ProjectForm clientId={id} onDone={() => setShowProject(false)} />
        )}
        {projects.length === 0 ? (
          <p className="muted">No projects yet.</p>
        ) : (
          <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th>Site</th>
                <th>Type</th>
                <th>Quoted</th>
                <th>Stage</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id}>
                  <td>
                    {p.liveUrl ? (
                      <a className="link strong" href={p.liveUrl} target="_blank" rel="noreferrer">
                        {p.siteName || p.liveUrl}
                      </a>
                    ) : (
                      <span className="strong">{p.siteName || "—"}</span>
                    )}
                  </td>
                  <td>{p.type || "—"}</td>
                  <td className="num">{p.priceQuoted ? money(p.priceQuoted) : "—"}</td>
                  <td>
                    <span className={`pill ${p.stage === "live" ? "pill-live" : "pill-building"}`}>
                      {p.stage || "building"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </section>

      {/* Payments */}
      <section className="panel">
        <div className="panel-head">
          <h2>Payments</h2>
          <button className="btn btn-outline btn-sm" onClick={() => setShowPayment((v) => !v)}>
            {showPayment ? "Cancel" : "+ Invoice"}
          </button>
        </div>
        {showPayment && (
          <PaymentForm clientId={id} onDone={() => setShowPayment(false)} />
        )}
        {payments.length === 0 ? (
          <p className="muted">No invoices yet.</p>
        ) : (
          <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th>Amount</th>
                <th>Invoiced</th>
                <th>Status</th>
                <th className="right">Action</th>
              </tr>
            </thead>
            <tbody>
              {payments
                .sort((a, b) => (b.invoicedAt || 0) - (a.invoicedAt || 0))
                .map((p) => (
                  <tr key={p.id}>
                    <td className="num strong">{money(p.amount)}</td>
                    <td>{dateShort(p.invoicedAt)}</td>
                    <td>
                      <span className={`pill ${p.status === "paid" ? "pill-paid" : "pill-unpaid"}`}>
                        {p.status === "paid"
                          ? `Paid · ${dateShort(p.paidAt)}`
                          : "Unpaid"}
                      </span>
                    </td>
                    <td className="right">
                      <button
                        className={`btn btn-sm ${p.status === "paid" ? "btn-outline" : "btn-maroon"}`}
                        onClick={() => togglePaid(p)}
                      >
                        {p.status === "paid" ? "Mark unpaid" : "Mark paid"}
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          </div>
        )}
      </section>
    </div>
  );
}

function ProjectForm({ clientId, onDone }) {
  const [f, setF] = useState({ siteName: "", liveUrl: "", type: "New website", priceQuoted: "" });
  const [busy, setBusy] = useState(false);
  const on = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    const node = push(ref(db, "projects"));
    await set(node, {
      clientId,
      siteName: f.siteName.trim(),
      liveUrl: f.liveUrl.trim(),
      type: f.type,
      priceQuoted: f.priceQuoted ? Number(f.priceQuoted) : 0,
      stage: "building",
      createdAt: Date.now(),
    });
    setBusy(false);
    onDone();
  };

  return (
    <form className="add-form" onSubmit={save}>
      <div className="grid-2">
        <label className="field">
          <span>Site name</span>
          <input value={f.siteName} onChange={on("siteName")} autoFocus />
        </label>
        <label className="field">
          <span>Live URL</span>
          <input value={f.liveUrl} onChange={on("liveUrl")} placeholder="https://" />
        </label>
        <label className="field">
          <span>Type</span>
          <select value={f.type} onChange={on("type")}>
            <option>New website</option>
            <option>Redesign</option>
            <option>Online store</option>
            <option>Logo &amp; branding</option>
          </select>
        </label>
        <label className="field">
          <span>Price quoted ($)</span>
          <input type="number" min="0" step="1" value={f.priceQuoted} onChange={on("priceQuoted")} />
        </label>
      </div>
      <button className="btn btn-maroon" disabled={busy}>
        {busy ? "Saving…" : "Save project"}
      </button>
    </form>
  );
}

function PaymentForm({ clientId, onDone }) {
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    if (!amount) return;
    setBusy(true);
    const node = push(ref(db, "payments"));
    await set(node, {
      clientId,
      amount: Number(amount),
      status: "unpaid",
      invoicedAt: Date.now(),
      paidAt: null,
    });
    setBusy(false);
    onDone();
  };

  return (
    <form className="add-form inline-form" onSubmit={save}>
      <label className="field">
        <span>Invoice amount ($)</span>
        <input type="number" min="0" step="1" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
      </label>
      <button className="btn btn-maroon" disabled={busy}>
        {busy ? "Adding…" : "Add invoice"}
      </button>
    </form>
  );
}
