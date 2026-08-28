import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ref, onValue, push, set, update, remove, runTransaction } from "firebase/database";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "../firebase";
import { toList, dateShort } from "../lib/format";

const NDA_LINK_BASE = "https://mmwebsites.com/nda?id=";

// Standard plain-English confidentiality agreement. Editable per NDA.
// NOTE: this is a template, not legal advice — have a lawyer review before relying on it.
const DEFAULT_BODY = `This Confidentiality Agreement ("Agreement") is made between M&M Websites ("Service Provider") and the Client named above, effective on the date signed below.

In the course of designing, building, hosting, and maintaining a website and related services for the Client, the Service Provider may be given access to confidential information belonging to the Client. The Service Provider agrees to protect that information as set out below.

1. Confidential Information. "Confidential Information" means any non-public information the Client shares with the Service Provider — including business plans, customer and contact lists, pricing, financial details, login credentials, unpublished content and images, and anything a reasonable person would understand to be confidential.

2. Confidentiality. The Service Provider will keep the Client's Confidential Information private, will not share it with anyone outside M&M Websites without the Client's permission, and will use it only to perform the agreed work for the Client.

3. Protection. The Service Provider will take reasonable steps to safeguard the Client's Confidential Information and will limit access to only those who need it to do the work.

4. Exclusions. This Agreement does not cover information that is already public through no fault of the Service Provider, that the Service Provider already lawfully had, or that must be disclosed by law.

5. Return or Deletion. When the project ends, or at the Client's request, the Service Provider will return or securely delete the Client's Confidential Information, apart from routine backups or copies it is required to keep.

6. Ownership. Nothing in this Agreement gives the Service Provider any ownership of the Client's Confidential Information.

7. Term. These confidentiality obligations continue for two (2) years after the working relationship ends.

8. General. This Agreement is governed by the laws of the State of Alabama and is the entire understanding between the parties regarding confidentiality.`;

const today = () => new Date().toISOString().slice(0, 10);

const emptyForm = () => ({
  clientId: "",
  preparedFor: { name: "", org: "", email: "" },
  effectiveDate: today(),
  providerSignatory: "",
  body: DEFAULT_BODY,
  status: "draft",
});

export default function NdaEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState(emptyForm());
  const [saved, setSaved] = useState(null); // full saved NDA (for status/signature)
  const [savedId, setSavedId] = useState(id || null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [emailing, setEmailing] = useState(false);
  const [emailMsg, setEmailMsg] = useState("");

  useEffect(
    () => onValue(ref(db, "clients"), (s) => setClients(toList(s.val()))),
    [],
  );

  // Pre-fill a new NDA's M&M signatory from Settings → Document defaults.
  useEffect(() => {
    if (id) return;
    return onValue(ref(db, "settings/defaults/ndaSignatory"), (s) => {
      const v = s.val();
      if (v) setForm((f) => (f.providerSignatory ? f : { ...f, providerSignatory: v }));
    });
  }, [id]);

  useEffect(() => {
    if (!id) return;
    return onValue(ref(db, "ndas/" + id), (s) => {
      if (!s.exists()) return;
      const n = s.val();
      setSaved(n);
      setForm({
        clientId: n.clientId || "",
        preparedFor: { name: "", org: "", email: "", ...(n.preparedFor || {}) },
        effectiveDate: n.effectiveDate || today(),
        providerSignatory: n.providerSignatory || "",
        body: n.body || DEFAULT_BODY,
        status: n.status || "draft",
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const setP = (k) => (e) =>
    setForm((f) => ({ ...f, preparedFor: { ...f.preparedFor, [k]: e.target.value } }));
  const setF = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const pickClient = (cid) => {
    const c = clients.find((x) => x.id === cid);
    setForm((f) => ({
      ...f,
      clientId: cid,
      preparedFor: c
        ? { name: c.contactName || "", org: c.businessName || "", email: c.email || "" }
        : f.preparedFor,
    }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    const data = {
      clientId: form.clientId || "",
      preparedFor: {
        name: form.preparedFor.name.trim(),
        org: form.preparedFor.org.trim(),
        email: (form.preparedFor.email || "").trim(),
      },
      effectiveDate: form.effectiveDate || today(),
      providerSignatory: form.providerSignatory.trim(),
      body: form.body.trim(),
      status: form.status,
      updatedAt: Date.now(),
    };

    const target = savedId || id;
    if (!target) {
      const res = await runTransaction(ref(db, "_meta/ndaSeq"), (cur) => (cur || 1000) + 1);
      data.ndaNumber = "NDA-" + String(res.snapshot.val()).padStart(4, "0");
      data.createdAt = Date.now();
      const node = push(ref(db, "ndas"));
      await set(node, data);
      setSavedId(node.key);
      navigate("/ndas/" + node.key, { replace: true });
    } else {
      await update(ref(db, "ndas/" + target), data);
      setSavedId(target);
    }
    setBusy(false);
  }

  async function handleDelete() {
    const target = savedId || id;
    if (!target) return;
    const isSigned = !!saved?.signature;
    const msg = isSigned
      ? "⚠️ This NDA has been SIGNED. Deleting it permanently destroys the executed agreement and breaks the client's link — this cannot be undone.\n\nDelete this signed agreement anyway?"
      : "Delete this NDA permanently? The link will stop working.";
    if (!window.confirm(msg)) return;
    if (isSigned && !window.confirm("Are you sure? A signed agreement is a legal record. Delete it?")) {
      return;
    }
    await remove(ref(db, "ndas/" + target));
    navigate("/ndas", { replace: true });
  }

  const link = savedId ? NDA_LINK_BASE + savedId : null;
  const signature = saved?.signature;

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
      const send = httpsCallable(functions, "sendNdaEmail");
      const res = await send({ ndaId: savedId });
      setEmailMsg(`✓ Sent to ${res.data.to}`);
    } catch (e) {
      setEmailMsg(e?.message || "Could not send. Please try again.");
    }
    setEmailing(false);
  };

  return (
    <div className="page">
      <Link className="back" to="/ndas">
        ← NDAs
      </Link>

      <header className="page-head">
        <div>
          <p className="eyebrow">Confidentiality</p>
          <h1>{id ? "Edit NDA" : "New NDA"}</h1>
        </div>
        {saved?.status && (
          <span
            className={`pill ${signature ? "pill-paid" : saved.status === "sent" ? "pill-building" : "pill-unpaid"}`}
          >
            {signature ? "signed" : saved.status}
          </span>
        )}
      </header>

      {signature && (
        <div className="panel" style={{ borderLeft: "3px solid #2e7d5b" }}>
          <strong>Signed</strong> by {signature.name}
          {signature.email ? ` (${signature.email})` : ""}
          {signature.agreedAt ? ` on ${dateShort(signature.agreedAt)}` : ""}. This NDA is now
          locked as executed.
        </div>
      )}

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
            <a className="btn btn-outline btn-sm" href={link} target="_blank" rel="noreferrer">
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
          <h2>For</h2>
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
              <span>Client contact name</span>
              <input value={form.preparedFor.name} onChange={setP("name")} placeholder="Cindy Harper" />
            </label>
            <label className="field">
              <span>Business / organization</span>
              <input value={form.preparedFor.org} onChange={setP("org")} placeholder="Lake Martin Ranch" />
            </label>
          </div>
          <div className="grid-2" style={{ marginTop: 14 }}>
            <label className="field">
              <span>Client email (for sending)</span>
              <input type="email" value={form.preparedFor.email} onChange={setP("email")} placeholder="cindy@example.com" />
            </label>
            <label className="field">
              <span>Effective date</span>
              <input type="date" value={form.effectiveDate} onChange={setF("effectiveDate")} />
            </label>
          </div>
          <label className="field" style={{ marginTop: 14, maxWidth: 320 }}>
            <span>Signed by (M&amp;M Websites)</span>
            <input
              value={form.providerSignatory}
              onChange={setF("providerSignatory")}
              placeholder="Michael Cather"
            />
          </label>
        </section>

        <section className="panel">
          <h2>Agreement text</h2>
          <p className="muted" style={{ marginTop: -6, marginBottom: 12, fontSize: 13.5 }}>
            This is a standard template — edit as needed. It is not legal advice; consider having
            a lawyer review it.
          </p>
          <label className="field">
            <textarea
              rows={18}
              value={form.body}
              onChange={setF("body")}
              style={{ fontFamily: "inherit", lineHeight: 1.5 }}
            />
          </label>
        </section>

        <section className="panel">
          <label className="field" style={{ maxWidth: 220 }}>
            <span>Status</span>
            <select value={form.status} onChange={setF("status")}>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="signed">Signed</option>
            </select>
          </label>
        </section>

        <div className="save-bar">
          {(id || savedId) && (
            <button type="button" className="btn-delete" onClick={handleDelete}>
              Delete NDA
            </button>
          )}
          <button className="btn btn-maroon" disabled={busy}>
            {busy ? "Saving…" : id || savedId ? "Save changes" : "Create NDA"}
          </button>
        </div>
      </form>
    </div>
  );
}
