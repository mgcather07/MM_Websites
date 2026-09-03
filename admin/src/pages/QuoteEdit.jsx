import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
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

// A stable id lets a phase be paid independently (Stripe metadata carries it)
// and survive re-ordering/edits without losing its payment progress.
const newPhaseId = () =>
  "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const blankPhase = (name = "") => ({
  id: newPhaseId(),
  name,
  summary: "",
  items: [blankItem()],
});

const emptyForm = () => ({
  subtitle: "",
  clientId: "",
  preparedFor: { name: "", org: "", location: "", email: "" },
  summary: "",
  phased: false,
  items: [blankItem()],
  phases: [
    blankPhase("Phase 1 — Website Design & Development"),
    blankPhase("Phase 2 —"),
  ],
  terms: DEFAULTS.terms,
  feesNote: DEFAULTS.feesNote,
  supportNote: DEFAULTS.supportNote,
  discountPercent: "",
  discountReason: "",
  status: "draft",
});

const cleanItem = (it) => ({
  title: it.title || "",
  description: it.description || "",
  price: it.price == null ? "" : String(it.price),
});
const asArray = (v) =>
  Array.isArray(v) ? v.filter(Boolean) : Object.values(v || {});

export default function QuoteEdit() {
  const { id } = useParams(); // undefined on /quotes/new
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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
      const items = asArray(q.items).map(cleanItem);
      const loadedPhases = asArray(q.phases)
        .filter((ph) => ph && ph.id)
        .map((ph) => ({
          id: ph.id,
          name: ph.name || "",
          summary: ph.summary || "",
          items: asArray(ph.items).map(cleanItem).length
            ? asArray(ph.items).map(cleanItem)
            : [blankItem()],
        }));
      const phased = loadedPhases.length > 0;
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
        phased,
        items: items.length ? items : [blankItem()],
        phases: phased
          ? loadedPhases
          : [
              blankPhase("Phase 1 — Website Design & Development"),
              blankPhase("Phase 2 —"),
            ],
        terms: q.terms ?? DEFAULTS.terms,
        feesNote: q.feesNote ?? DEFAULTS.feesNote,
        supportNote: q.supportNote ?? DEFAULTS.supportNote,
        discountPercent: q.discountPercent == null ? "" : String(q.discountPercent),
        discountReason: q.discountReason ?? "",
        status: q.status || "draft",
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const discountPct = Number(form.discountPercent) || 0;
  const itemsSum = (list) =>
    list.reduce((s, it) => s + Number(it.price || 0), 0);
  const discountedOf = (sub) =>
    discountPct > 0 ? Math.round((sub * (100 - discountPct)) / 100) : sub;

  // Flat-quote figures.
  const subtotal = itemsSum(form.items);
  const discountAmt = discountPct > 0 ? Math.round((subtotal * discountPct) / 100) : 0;
  const flatTotal = subtotal - discountAmt;

  // Phased figures.
  const phaseSub = (ph) => itemsSum(ph.items);
  const phaseTotal = (ph) => discountedOf(phaseSub(ph));
  const phasedSubtotal = form.phases.reduce((s, ph) => s + phaseSub(ph), 0);
  const phasedTotal = form.phases.reduce((s, ph) => s + phaseTotal(ph), 0);

  const total = form.phased ? phasedTotal : flatTotal;

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

  // --- Phase editing ---
  const mapPhase = (f, pi, fn) => ({
    ...f,
    phases: f.phases.map((ph, idx) => (idx === pi ? fn(ph) : ph)),
  });
  const setPhaseField = (pi, k) => (e) =>
    setForm((f) => mapPhase(f, pi, (ph) => ({ ...ph, [k]: e.target.value })));
  const setPhaseItem = (pi, ii, k) => (e) =>
    setForm((f) =>
      mapPhase(f, pi, (ph) => ({
        ...ph,
        items: ph.items.map((it, idx) =>
          idx === ii ? { ...it, [k]: e.target.value } : it,
        ),
      })),
    );
  const addPhaseItem = (pi) =>
    setForm((f) => mapPhase(f, pi, (ph) => ({ ...ph, items: [...ph.items, blankItem()] })));
  const removePhaseItem = (pi, ii) =>
    setForm((f) =>
      mapPhase(f, pi, (ph) => ({
        ...ph,
        items: ph.items.length > 1 ? ph.items.filter((_, idx) => idx !== ii) : ph.items,
      })),
    );
  const addPhase = () =>
    setForm((f) => ({
      ...f,
      phases: [...f.phases, blankPhase(`Phase ${f.phases.length + 1} —`)],
    }));
  const removePhase = (pi) =>
    setForm((f) => ({
      ...f,
      phases: f.phases.length > 1 ? f.phases.filter((_, idx) => idx !== pi) : f.phases,
    }));
  const movePhase = (pi, dir) =>
    setForm((f) => {
      const j = pi + dir;
      if (j < 0 || j >= f.phases.length) return f;
      const phases = f.phases.slice();
      [phases[pi], phases[j]] = [phases[j], phases[pi]];
      return { ...f, phases };
    });

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

  // Pre-select the client when arriving from a client page (/quotes/new?client=…).
  const clientParam = searchParams.get("client");
  const [prefilled, setPrefilled] = useState(false);
  useEffect(() => {
    if (id || prefilled || !clientParam || clients.length === 0) return;
    if (clients.some((c) => c.id === clientParam)) {
      pickClient(clientParam);
      setPrefilled(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, clientParam, clients, prefilled]);

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
      terms: form.terms.trim(),
      feesNote: form.feesNote.trim(),
      supportNote: form.supportNote.trim(),
      discountPercent: Number(form.discountPercent) || 0,
      discountReason: discountPct > 0 ? form.discountReason.trim() : "",
      status: form.status,
      updatedAt: Date.now(),
    };

    const cleanItems = (list) =>
      list
        .filter((it) => it.title.trim() || it.price)
        .map((it) => ({
          title: it.title.trim(),
          description: it.description.trim(),
          price: Number(it.price || 0),
        }));

    if (form.phased) {
      // Phased quote: store phase definitions (keeping stable ids). Payment
      // progress lives under quotes/{id}/phasePay and is written only by the
      // Stripe webhook, so saving here never disturbs it. Clear the flat list.
      data.phases = form.phases
        .map((ph) => ({
          id: ph.id || newPhaseId(),
          name: ph.name.trim(),
          summary: ph.summary.trim(),
          items: cleanItems(ph.items),
        }))
        .filter((ph) => ph.name || ph.items.length);
      data.items = [];
    } else {
      data.items = cleanItems(form.items);
      data.phases = []; // clear any phases if switched back to a flat quote
    }

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
            <h2>Scope &amp; pricing</h2>
            {!form.phased && (
              <button type="button" className="btn btn-outline btn-sm" onClick={addItem}>
                + Add item
              </button>
            )}
          </div>

          <label className="phase-toggle">
            <input
              type="checkbox"
              checked={form.phased}
              onChange={(e) =>
                setForm((f) => ({ ...f, phased: e.target.checked }))
              }
            />
            <span>
              <strong>Break this quote into phases</strong>
              <em>
                Each phase is priced separately and the client can accept &amp; pay
                one phase at a time (e.g. build the site now, add booking later).
              </em>
            </span>
          </label>

          {form.phased ? (
            <div className="phases">
              {form.phases.map((ph, pi) => (
                <div className="phase-card" key={ph.id}>
                  <div className="phase-head">
                    <span className="phase-index">Phase {pi + 1}</span>
                    <div className="phase-move">
                      <button
                        type="button"
                        onClick={() => movePhase(pi, -1)}
                        disabled={pi === 0}
                        aria-label="Move phase up"
                        title="Move up"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => movePhase(pi, 1)}
                        disabled={pi === form.phases.length - 1}
                        aria-label="Move phase down"
                        title="Move down"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        className="phase-remove"
                        onClick={() => removePhase(pi)}
                        disabled={form.phases.length <= 1}
                        aria-label="Remove phase"
                        title="Remove phase"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  <label className="field">
                    <span>Phase name</span>
                    <input
                      value={ph.name}
                      onChange={setPhaseField(pi, "name")}
                      placeholder="Phase 1 — Website Design & Development"
                    />
                  </label>
                  <label className="field" style={{ marginTop: 12 }}>
                    <span>Phase summary (optional)</span>
                    <input
                      value={ph.summary}
                      onChange={setPhaseField(pi, "summary")}
                      placeholder="What this phase delivers"
                    />
                  </label>

                  <div className="qitems" style={{ marginTop: 14 }}>
                    {ph.items.map((it, ii) => (
                      <div className="qitem" key={ii}>
                        <div className="qitem-fields">
                          <div className="qitem-row">
                            <input
                              className="qitem-title"
                              value={it.title}
                              onChange={setPhaseItem(pi, ii, "title")}
                              placeholder="Component (e.g. Custom homepage design)"
                            />
                            <div className="qitem-price">
                              <span>$</span>
                              <input
                                type="number"
                                min="0"
                                step="1"
                                value={it.price}
                                onChange={setPhaseItem(pi, ii, "price")}
                                placeholder="0"
                              />
                            </div>
                          </div>
                          <input
                            className="qitem-desc"
                            value={it.description}
                            onChange={setPhaseItem(pi, ii, "description")}
                            placeholder="Short description of what's included"
                          />
                        </div>
                        <button
                          type="button"
                          className="qitem-remove"
                          onClick={() => removePhaseItem(pi, ii)}
                          aria-label="Remove item"
                          title="Remove"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="phase-foot">
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => addPhaseItem(pi)}
                    >
                      + Add item
                    </button>
                    <div className="phase-subtotal">
                      {discountPct > 0 ? (
                        <>
                          Subtotal {money(phaseSub(ph))} · −{discountPct}% ={" "}
                          <strong>{money(phaseTotal(ph))}</strong>
                        </>
                      ) : (
                        <>
                          Phase total <strong>{money(phaseTotal(ph))}</strong>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <button
                type="button"
                className="btn btn-outline btn-sm phase-add"
                onClick={addPhase}
              >
                + Add phase
              </button>
            </div>
          ) : (
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
          )}
          <div
            style={{
              display: "flex",
              gap: 14,
              marginTop: 16,
              alignItems: "flex-end",
              flexWrap: "wrap",
            }}
          >
            <label className="field" style={{ maxWidth: 150 }}>
              <span>Discount %</span>
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={form.discountPercent}
                onChange={setF("discountPercent")}
                placeholder="0"
              />
            </label>
            <label className="field" style={{ flex: 1, minWidth: 220 }}>
              <span>Reason for discount (shown on the quote)</span>
              <input
                value={form.discountReason}
                onChange={setF("discountReason")}
                placeholder="e.g. Friends &amp; family, referral, off-season rate"
              />
            </label>
          </div>

          {form.phased ? (
            <>
              {form.phases.map((ph, pi) => (
                <div
                  key={ph.id}
                  className="qtotal-row"
                  style={{ borderBottom: "none", paddingBottom: 2, paddingTop: 2 }}
                >
                  <span className="muted">
                    {ph.name?.trim() || `Phase ${pi + 1}`}
                  </span>
                  <span>{money(phaseTotal(ph))}</span>
                </div>
              ))}
              {discountPct > 0 && (
                <div className="qtotal-row" style={{ borderTop: "none", paddingTop: 2, paddingBottom: 2 }}>
                  <span className="muted">
                    Discount ({discountPct}%){" "}
                    <em style={{ fontStyle: "normal", opacity: 0.7 }}>
                      applied to each phase
                    </em>
                  </span>
                  <span style={{ color: "#2e7d5b" }}>
                    −{money(phasedSubtotal - phasedTotal)}
                  </span>
                </div>
              )}
              <div className="qtotal-row" style={{ borderTop: "none" }}>
                <span>All phases total</span>
                <span className="quote-total">{money(total)}</span>
              </div>
            </>
          ) : discountPct > 0 ? (
            <>
              <div className="qtotal-row" style={{ borderBottom: "none", paddingBottom: 2 }}>
                <span className="muted">Subtotal</span>
                <span>{money(subtotal)}</span>
              </div>
              <div className="qtotal-row" style={{ borderTop: "none", paddingTop: 2, paddingBottom: 2 }}>
                <span className="muted">Discount ({discountPct}%)</span>
                <span style={{ color: "#2e7d5b" }}>−{money(discountAmt)}</span>
              </div>
              <div className="qtotal-row" style={{ borderTop: "none" }}>
                <span>Total</span>
                <span className="quote-total">{money(total)}</span>
              </div>
            </>
          ) : (
            <div className="qtotal-row">
              <span>Total</span>
              <span className="quote-total">{money(total)}</span>
            </div>
          )}
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
