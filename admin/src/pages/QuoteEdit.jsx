import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ref,
  onValue,
  push,
  set,
  update,
  remove,
  runTransaction,
} from "firebase/database";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "../firebase";
import { toList, money } from "../lib/format";

const QUOTE_LINK_BASE = "https://mmwebsites.com/quote?id=";

const DEFAULTS = {
  terms:
    "40% deposit to begin  |  30% progress payment  |  30% due before launch",
  feesNote:
    "Third-party fees such as domain, hosting and payment processing are billed separately.",
  supportNote:
    "Website and booking-system maintenance: $75/month. Major new features quoted separately.",
};

const blankItem = () => ({ title: "", description: "", price: "" });

const emptyForm = () => ({
  subtitle: "",
  clientId: "",
  preparedFor: { name: "", org: "", location: "", email: "" },
  summary: "",
  items: [blankItem()],
  terms: DEFAULTS.terms,
  feesNote: DEFAULTS.feesNote,
  supportNote: DEFAULTS.supportNote,
  status: "draft",
});

export default function QuoteEdit() {
  const { id } = useParams(); // undefined on /quotes/new
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState(emptyForm());
  const [savedId, setSavedId] = useState(id || null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [emailing, setEmailing] = useState(false);
  const [emailMsg, setEmailMsg] = useState("");

  useEffect(
    () => onValue(ref(db, "clients"), (s) => setClients(toList(s.val()))),
    [],
  );

  // Load an existing quote once.
  useEffect(() => {
    if (!id) return;
    return onValue(ref(db, "quotes/" + id), (s) => {
      if (!s.exists()) return;
      const q = s.val();
      const items = (Array.isArray(q.items) ? q.items : Object.values(q.items || {}))
        .filter(Boolean)
        .map((it) => ({
          title: it.title || "",
          description: it.description || "",
          price: it.price == null ? "" : String(it.price),
        }));
      setForm({
        subtitle: q.subtitle || "",
        clientId: q.clientId || "",
        preparedFor: {
          name: "",
          org: "",
          location: "",
          email: "",
          ...(q.preparedFor || {}),
        },
        summary: q.summary || "",
        items: items.length ? items : [blankItem()],
        terms: q.terms ?? DEFAULTS.terms,
        feesNote: q.feesNote ?? DEFAULTS.feesNote,
        supportNote: q.supportNote ?? DEFAULTS.supportNote,
        status: q.status || "draft",
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const total = form.items.reduce((s, it) => s + Number(it.price || 0), 0);

  const setF = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setP = (k) => (e) =>
    setForm((f) => ({ ...f, preparedFor: { ...f.preparedFor, [k]: e.target.value } }));
  const setItem = (i, k) => (e) =>
    setForm((f) => {
      const items = f.items.map((it, idx) =>
        idx === i ? { ...it, [k]: e.target.value } : it,
      );
      return { ...f, items };
    });
  const addItem = () => setForm((f) => ({ ...f, items: [...f.items, blankItem()] }));
  const removeItem = (i) =>
    setForm((f) => ({
      ...f,
      items: f.items.length > 1 ? f.items.filter((_, idx) => idx !== i) : f.items,
    }));

  const pickClient = (cid) => {
    const c = clients.find((x) => x.id === cid);
    setForm((f) => ({
      ...f,
      clientId: cid,
      preparedFor: c
        ? {
            name: c.contactName || "",
            org: c.businessName || "",
            location: f.preparedFor.location,
            email: c.email || "",
          }
        : f.preparedFor,
    }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    const data = {
      subtitle: form.subtitle.trim(),
      clientId: form.clientId || "",
      preparedFor: {
        name: form.preparedFor.name.trim(),
        org: form.preparedFor.org.trim(),
        location: form.preparedFor.location.trim(),
        email: (form.preparedFor.email || "").trim(),
      },
      summary: form.summary.trim(),
      items: form.items
        .filter((it) => it.title.trim() || it.price)
        .map((it) => ({
          title: it.title.trim(),
          description: it.description.trim(),
          price: Number(it.price || 0),
        })),
      terms: form.terms.trim(),
      feesNote: form.feesNote.trim(),
      supportNote: form.supportNote.trim(),
      status: form.status,
      updatedAt: Date.now(),
    };

    const target = savedId || id;
    if (!target) {
      const res = await runTransaction(ref(db, "_meta/quoteSeq"), (cur) =>
        (cur || 1000) + 1,
      );
      data.quoteNumber = "MMW-" + String(res.snapshot.val()).padStart(4, "0");
      data.createdAt = Date.now();
      const node = push(ref(db, "quotes"));
      await set(node, data);
      setSavedId(node.key);
      navigate("/quotes/" + node.key, { replace: true });
    } else {
      await update(ref(db, "quotes/" + target), data);
      setSavedId(target);
    }
    setBusy(false);
  }

  async function handleDelete() {
    const target = savedId || id;
    if (!target) return;
    if (
      !window.confirm(
        "Delete this quote permanently? The shareable link will stop working.",
      )
    )
      return;
    await remove(ref(db, "quotes/" + target));
    navigate("/quotes", { replace: true });
  }

  const link = savedId ? QUOTE_LINK_BASE + savedId : null;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  };

  const emailToClient = async () => {
    if (!savedId) return;
    setEmailing(true);
    setEmailMsg("");
    try {
      const send = httpsCallable(functions, "sendQuoteEmail");
      const res = await send({ quoteId: savedId });
      setEmailMsg(`✓ Sent to ${res.data.to}`);
    } catch (e) {
      // Callable errors carry a friendly message from the function.
      setEmailMsg(e?.message || "Could not send. Please try again.");
    }
    setEmailing(false);
  };

  return (
    <div className="page">
      <Link className="back" to="/quotes">
        ← Quotes
      </Link>

      <header className="page-head">
        <div>
          <p className="eyebrow">Sales</p>
          <h1>{id ? "Edit quote" : "New quote"}</h1>
        </div>
        <div className="tabs">
          <span className="muted" style={{ fontSize: 13, alignSelf: "center" }}>
            Total
          </span>
          <span className="quote-total">{money(total)}</span>
        </div>
      </header>

      {link && (
        <div className="share-box">
          <div>
            <div className="share-label">Shareable link</div>
            <div className="share-url">{link}</div>
          </div>
          <div className="share-actions">
            <button type="button" className="btn btn-outline btn-sm" onClick={copyLink}>
              {copied ? "Copied!" : "Copy link"}
            </button>
            <a
              className="btn btn-outline btn-sm"
              href={link}
              target="_blank"
              rel="noreferrer"
            >
              Open
            </a>
            <button
              type="button"
              className="btn btn-maroon btn-sm"
              onClick={emailToClient}
              disabled={emailing}
            >
              {emailing ? "Sending…" : "Email to client"}
            </button>
          </div>
        </div>
      )}
      {emailMsg && (
        <p
          className="muted"
          style={{
            marginTop: -6,
            marginBottom: 18,
            fontSize: 13.5,
            color: emailMsg.startsWith("✓") ? "#2e7d5b" : "#b4632a",
          }}
        >
          {emailMsg}
        </p>
      )}

      <form onSubmit={handleSubmit}>
        <section className="panel">
          <h2>Prepared for</h2>
          <div className="field" style={{ marginBottom: 14 }}>
            <span>Existing client (optional)</span>
            <select value={form.clientId} onChange={(e) => pickClient(e.target.value)}>
              <option value="">— Enter manually —</option>
              {clients
                .slice()
                .sort((a, b) => (a.businessName || "").localeCompare(b.businessName || ""))
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.businessName}
                  </option>
                ))}
            </select>
          </div>
          <div className="grid-2">
            <label className="field">
              <span>Contact name</span>
              <input value={form.preparedFor.name} onChange={setP("name")} placeholder="Cindy Harper" />
            </label>
            <label className="field">
              <span>Business / venue</span>
              <input value={form.preparedFor.org} onChange={setP("org")} placeholder="Lake Martin Ranch & Venue" />
            </label>
          </div>
          <div className="grid-2" style={{ marginTop: 14 }}>
            <label className="field">
              <span>Location</span>
              <input value={form.preparedFor.location} onChange={setP("location")} placeholder="Dadeville / Lake Martin, Alabama" />
            </label>
            <label className="field">
              <span>Client email (for sending the quote)</span>
              <input
                type="email"
                value={form.preparedFor.email}
                onChange={setP("email")}
                placeholder="cindy@lakemartinranch.com"
              />
            </label>
          </div>
        </section>

        <section className="panel">
          <h2>Overview</h2>
          <label className="field">
            <span>Subtitle (project type)</span>
            <input value={form.subtitle} onChange={setF("subtitle")} placeholder="Website + Booking + Admin Management System" />
          </label>
          <label className="field" style={{ marginTop: 14 }}>
            <span>Summary</span>
            <textarea rows={3} value={form.summary} onChange={setF("summary")} placeholder="Custom website and online booking platform for…" />
          </label>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Line items</h2>
            <button type="button" className="btn btn-outline btn-sm" onClick={addItem}>
              + Add item
            </button>
          </div>
          <div className="qitems">
            {form.items.map((it, i) => (
              <div className="qitem" key={i}>
                <div className="qitem-fields">
                  <div className="qitem-row">
                    <input
                      className="qitem-title"
                      value={it.title}
                      onChange={setItem(i, "title")}
                      placeholder="Component (e.g. Website Design & Development)"
                    />
                    <div className="qitem-price">
                      <span>$</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={it.price}
                        onChange={setItem(i, "price")}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <input
                    className="qitem-desc"
                    value={it.description}
                    onChange={setItem(i, "description")}
                    placeholder="Short description of what's included"
                  />
                </div>
                <button
                  type="button"
                  className="qitem-remove"
                  onClick={() => removeItem(i)}
                  aria-label="Remove item"
                  title="Remove"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div className="qtotal-row">
            <span>Total</span>
            <span className="quote-total">{money(total)}</span>
          </div>
        </section>

        <section className="panel">
          <h2>Terms &amp; footer</h2>
          <label className="field">
            <span>Payment terms</span>
            <input value={form.terms} onChange={setF("terms")} />
          </label>
          <label className="field" style={{ marginTop: 14 }}>
            <span>Fees note</span>
            <input value={form.feesNote} onChange={setF("feesNote")} />
          </label>
          <label className="field" style={{ marginTop: 14 }}>
            <span>Ongoing support note</span>
            <input value={form.supportNote} onChange={setF("supportNote")} />
          </label>
          <label className="field" style={{ marginTop: 14, maxWidth: 220 }}>
            <span>Status</span>
            <select value={form.status} onChange={setF("status")}>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="accepted">Accepted</option>
              <option value="paid">Paid</option>
            </select>
          </label>
        </section>

        <div className="save-bar">
          {(id || savedId) && (
            <button type="button" className="btn-delete" onClick={handleDelete}>
              Delete quote
            </button>
          )}
          <button className="btn btn-maroon" disabled={busy}>
            {busy ? "Saving…" : id || savedId ? "Save changes" : "Create quote"}
          </button>
        </div>
      </form>
    </div>
  );
}
