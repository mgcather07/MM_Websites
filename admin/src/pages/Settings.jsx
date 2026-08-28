import { useEffect, useState } from "react";
import { ref, onValue, update } from "firebase/database";
import { db } from "../firebase";
import { toList } from "../lib/format";
import { useAuth } from "../auth/AuthContext";

function SavedTag({ show }) {
  if (!show) return null;
  return (
    <span className="muted" style={{ color: "#2e7d5b", fontSize: 13, fontWeight: 600 }}>
      ✓ Saved
    </span>
  );
}

export default function Settings() {
  const { user, profile } = useAuth();
  const [name, setName] = useState("");
  const [business, setBusiness] = useState({});
  const [defaults, setDefaults] = useState({});
  const [admins, setAdmins] = useState([]);
  const [saved, setSaved] = useState("");
  const [busy, setBusy] = useState("");

  useEffect(() => {
    const subs = [
      onValue(ref(db, "settings/business"), (s) => setBusiness(s.val() || {})),
      onValue(ref(db, "settings/defaults"), (s) => setDefaults(s.val() || {})),
      onValue(ref(db, "admins"), (s) => setAdmins(toList(s.val()))),
    ];
    return () => subs.forEach((u) => u());
  }, []);

  useEffect(() => {
    if (profile?.name) setName((cur) => cur || profile.name);
  }, [profile]);

  const flash = (key) => {
    setSaved(key);
    setBusy("");
    setTimeout(() => setSaved((s) => (s === key ? "" : s)), 2000);
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    if (!user) return;
    setBusy("profile");
    await update(ref(db, "admins/" + user.uid), { name: name.trim() });
    flash("profile");
  };
  const saveBusiness = async (e) => {
    e.preventDefault();
    setBusy("business");
    await update(ref(db, "settings/business"), {
      businessName: (business.businessName || "").trim(),
      phone: (business.phone || "").trim(),
      email: (business.email || "").trim(),
      town: (business.town || "").trim(),
      tagline: (business.tagline || "").trim(),
    });
    flash("business");
  };
  const saveDefaults = async (e) => {
    e.preventDefault();
    setBusy("defaults");
    await update(ref(db, "settings/defaults"), {
      ndaSignatory: (defaults.ndaSignatory || "").trim(),
      depositPercent: Number(defaults.depositPercent) || 40,
      supportRate: (defaults.supportRate || "").trim(),
    });
    flash("defaults");
  };

  const setB = (k) => (e) => setBusiness((b) => ({ ...b, [k]: e.target.value }));
  const setD = (k) => (e) => setDefaults((d) => ({ ...d, [k]: e.target.value }));

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Settings</h1>
          <p className="page-sub">Your profile, business details, and document defaults.</p>
        </div>
      </header>

      {/* Your profile */}
      <section className="panel">
        <div className="panel-head">
          <h2>Your profile</h2>
          <SavedTag show={saved === "profile"} />
        </div>
        <form onSubmit={saveProfile}>
          <div className="grid-2">
            <label className="field">
              <span>Display name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            </label>
            <label className="field">
              <span>Email (sign-in)</span>
              <input value={profile?.email || user?.email || ""} disabled />
            </label>
          </div>
          <p className="muted" style={{ fontSize: 13, marginTop: 10 }}>
            Role: <strong>{profile?.role === "master" ? "Master admin" : "Admin"}</strong>
          </p>
          <div className="save-bar">
            <button className="btn btn-maroon" disabled={busy === "profile"}>
              {busy === "profile" ? "Saving…" : "Save profile"}
            </button>
          </div>
        </form>
      </section>

      {/* Business details */}
      <section className="panel">
        <div className="panel-head">
          <h2>Business details</h2>
          <SavedTag show={saved === "business"} />
        </div>
        <p className="muted" style={{ fontSize: 13, marginTop: -6, marginBottom: 12 }}>
          Used across the admin. (The public marketing site&apos;s copy is managed separately in code.)
        </p>
        <form onSubmit={saveBusiness}>
          <div className="grid-2">
            <label className="field">
              <span>Business name</span>
              <input value={business.businessName || ""} onChange={setB("businessName")} placeholder="M&amp;M Websites" />
            </label>
            <label className="field">
              <span>Town</span>
              <input value={business.town || ""} onChange={setB("town")} placeholder="Gardendale, Alabama" />
            </label>
          </div>
          <div className="grid-2" style={{ marginTop: 14 }}>
            <label className="field">
              <span>Phone</span>
              <input value={business.phone || ""} onChange={setB("phone")} placeholder="(205) 914-1019" />
            </label>
            <label className="field">
              <span>Contact email</span>
              <input value={business.email || ""} onChange={setB("email")} placeholder="MMWebsites26@gmail.com" />
            </label>
          </div>
          <label className="field" style={{ marginTop: 14 }}>
            <span>Tagline</span>
            <input value={business.tagline || ""} onChange={setB("tagline")} placeholder="Professional Websites. Built for Business." />
          </label>
          <div className="save-bar">
            <button className="btn btn-maroon" disabled={busy === "business"}>
              {busy === "business" ? "Saving…" : "Save business details"}
            </button>
          </div>
        </form>
      </section>

      {/* Document defaults */}
      <section className="panel">
        <div className="panel-head">
          <h2>Document defaults</h2>
          <SavedTag show={saved === "defaults"} />
        </div>
        <form onSubmit={saveDefaults}>
          <div className="grid-2">
            <label className="field">
              <span>Default NDA signatory (M&amp;M)</span>
              <input value={defaults.ndaSignatory || ""} onChange={setD("ndaSignatory")} placeholder="Michael Cather" />
            </label>
            <label className="field">
              <span>Default deposit %</span>
              <input type="number" min="0" max="100" value={defaults.depositPercent ?? ""} onChange={setD("depositPercent")} placeholder="40" />
            </label>
          </div>
          <label className="field" style={{ marginTop: 14 }}>
            <span>Ongoing support rate</span>
            <input value={defaults.supportRate || ""} onChange={setD("supportRate")} placeholder="$75/month" />
          </label>
          <p className="muted" style={{ fontSize: 13, marginTop: 10 }}>
            The NDA signatory pre-fills new NDAs. Deposit % and support rate are references for your quotes.
          </p>
          <div className="save-bar">
            <button className="btn btn-maroon" disabled={busy === "defaults"}>
              {busy === "defaults" ? "Saving…" : "Save defaults"}
            </button>
          </div>
        </form>
      </section>

      {/* Team */}
      <section className="panel">
        <h2>Team</h2>
        {admins.length === 0 ? (
          <p className="muted">No team members found.</p>
        ) : (
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((a) => (
                  <tr key={a.id}>
                    <td className="strong">{a.name || "—"}</td>
                    <td>{a.email || "—"}</td>
                    <td>
                      <span className={`pill ${a.role === "master" ? "pill-paid" : "pill-building"}`}>
                        {a.role === "master" ? "Master" : "Admin"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="muted" style={{ fontSize: 13, marginTop: 12 }}>
          Adding a new team member requires creating their sign-in account — ask your developer to
          set one up.
        </p>
      </section>
    </div>
  );
}
