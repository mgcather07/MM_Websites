import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ref, onValue, push, set, update } from "firebase/database";
import { db } from "../firebase";
import { money, dateShort, toList } from "../lib/format";
import CopyButton from "../components/CopyButton";

const QUOTE_LINK_BASE = "https://mmwebsites.com/quote?id=";

// A quote's total, handling both flat and phased quotes plus a % discount.
function quoteTotal(q) {
  const pct = Number(q.discountPercent || 0);
  const disc = (n) => (pct > 0 ? Math.round((n * (100 - pct)) / 100) : n);
  const sumItems = (items) =>
    (Array.isArray(items) ? items.filter(Boolean) : Object.values(items || {})).reduce(
      (a, it) => a + Number((it && it.price) || 0),
      0,
    );
  const phases = (Array.isArray(q.phases) ? q.phases.filter(Boolean) : Object.values(q.phases || {})).filter(
    (p) => p && p.id,
  );
  if (phases.length) return phases.reduce((s, ph) => s + disc(sumItems(ph.items)), 0);
  return disc(sumItems(q.items));
}

// Turn a quote's status into a plain-English "have they approved it?" answer.
function quoteStatusMeta(q) {
  const s = q.status || "draft";
  if (s === "paid") return { label: "Approved · paid in full", cls: "pill-paid" };
  if (s === "accepted") return { label: "Approved · deposit paid", cls: "pill-paid" };
  if (s === "sent") return { label: "Awaiting approval", cls: "pill-building" };
  return { label: "Not sent yet", cls: "pill-unpaid" };
}

export default function ClientDetail() {
  const { id } = useParams();
  const [client, setClient] = useState(undefined); // undefined=loading, null=missing
  const [projects, setProjects] = useState([]);
  const [payments, setPayments] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [showProject, setShowProject] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [editing, setEditing] = useState(false);

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
      onValue(ref(db, "quotes"), (s) =>
        setQuotes(toList(s.val()).filter((qq) => qq.clientId === id)),
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

  const sortedQuotes = [...quotes].sort(
    (a, b) => (b.createdAt || 0) - (a.createdAt || 0),
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
        {!editing && (
          <button
            className="btn btn-outline btn-sm"
            onClick={() => setEditing(true)}
          >
            Edit client
          </button>
        )}
      </header>

      {editing && (
        <ClientForm
          id={id}
          client={client}
          onDone={() => setEditing(false)}
        />
      )}

      {client.notes && !editing && (
        <p className="client-notes">{client.notes}</p>
      )}

      {/* Quotes */}
      <section className="panel">
        <div className="panel-head">
          <h2>Quotes</h2>
          <Link
            className="btn btn-outline btn-sm"
            to={`/quotes/new?client=${id}`}
          >
            + New quote
          </Link>
        </div>
        {sortedQuotes.length === 0 ? (
          <p className="muted">
            No quotes for this client yet. Create one to send them a price.
          </p>
        ) : (
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Quote</th>
                  <th>Total</th>
                  <th>Approval</th>
                  <th className="right">Link</th>
                </tr>
              </thead>
              <tbody>
                {sortedQuotes.map((qq) => {
                  const meta = quoteStatusMeta(qq);
                  return (
                    <tr key={qq.id}>
                      <td>
                        <Link className="link strong" to={`/quotes/${qq.id}`}>
                          {qq.quoteNumber || "Quote"}
                        </Link>
                        {qq.subtitle && (
                          <div className="muted sub-line">{qq.subtitle}</div>
                        )}
                        <div className="muted sub-line">
                          {qq.emailedAt
                            ? `Emailed ${dateShort(qq.emailedAt)}`
                            : "Not emailed"}
                        </div>
                      </td>
                      <td className="num strong">{money(quoteTotal(qq))}</td>
                      <td>
                        <span className={`pill ${meta.cls}`}>{meta.label}</span>
                      </td>
                      <td className="right">
                        <div className="row-actions">
                          <a
                            className="link"
                            href={QUOTE_LINK_BASE + qq.id}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open
                          </a>
                          <CopyButton
                            text={QUOTE_LINK_BASE + qq.id}
                            className="btn btn-outline btn-sm"
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

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

function ClientForm({ id, client, onDone }) {
  const [f, setF] = useState({
    businessName: client.businessName || "",
    contactName: client.contactName || "",
    email: client.email || "",
    phone: client.phone || "",
    notes: client.notes || "",
  });
  const [busy, setBusy] = useState(false);
  const on = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    if (!f.businessName.trim()) return;
    setBusy(true);
    await update(ref(db, "clients/" + id), {
      businessName: f.businessName.trim(),
      contactName: f.contactName.trim(),
      email: f.email.trim(),
      phone: f.phone.trim(),
      notes: f.notes.trim(),
      updatedAt: Date.now(),
    });
    setBusy(false);
    onDone();
  };

  return (
    <form className="panel add-form" onSubmit={save}>
      <div className="grid-2">
        <label className="field">
          <span>Business name *</span>
          <input value={f.businessName} onChange={on("businessName")} required autoFocus />
        </label>
        <label className="field">
          <span>Contact name</span>
          <input value={f.contactName} onChange={on("contactName")} />
        </label>
        <label className="field">
          <span>Email</span>
          <input type="email" value={f.email} onChange={on("email")} />
        </label>
        <label className="field">
          <span>Phone</span>
          <input value={f.phone} onChange={on("phone")} />
        </label>
      </div>
      <label className="field" style={{ marginTop: 14 }}>
        <span>Notes</span>
        <textarea rows={2} value={f.notes} onChange={on("notes")} placeholder="Anything worth remembering about this client" />
      </label>
      <div className="save-bar" style={{ position: "static", padding: "16px 0 0" }}>
        <button type="button" className="btn btn-outline" onClick={onDone}>
          Cancel
        </button>
        <button className="btn btn-maroon" disabled={busy}>
          {busy ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
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
