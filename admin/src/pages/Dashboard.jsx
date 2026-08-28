import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ref, onValue } from "firebase/database";
import { db } from "../firebase";
import { money, dateShort, toList } from "../lib/format";
import { useAuth } from "../auth/AuthContext";

const DAY = 86400000;
const ymd = (d) => new Date(d).toISOString().slice(0, 10);

function timeAgo(ts) {
  if (!ts) return "";
  const s = (Date.now() - ts) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return Math.floor(s / 60) + "m ago";
  if (s < 86400) return Math.floor(s / 3600) + "h ago";
  const d = Math.floor(s / 86400);
  if (d < 30) return d + "d ago";
  return dateShort(ts);
}

function MiniBars({ data }) {
  const w = 460;
  const h = 60;
  const max = Math.max(1, ...data.map((d) => d.value));
  const bw = w / data.length;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="60" role="img" aria-label="Pageviews">
      {data.map((d, i) => {
        const bh = (h * d.value) / max;
        return (
          <rect
            key={d.date}
            x={i * bw + 1}
            y={h - bh}
            width={Math.max(1, bw - 2)}
            height={bh}
            rx="1.5"
            fill="#7a1b2e"
            opacity={d.value ? 0.9 : 0.13}
          >
            <title>{d.date}: {d.value} views</title>
          </rect>
        );
      })}
    </svg>
  );
}

const STAGE_LABEL = { planning: "Planning", building: "Building", review: "Review", live: "Live" };

export default function Dashboard() {
  const { profile } = useAuth();
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [payments, setPayments] = useState([]);
  const [leads, setLeads] = useState([]);
  const [ndas, setNdas] = useState([]);
  const [domains, setDomains] = useState([]);
  const [daily, setDaily] = useState([]);
  const [summary, setSummary] = useState({});

  useEffect(() => {
    const subs = [
      onValue(ref(db, "clients"), (s) => setClients(toList(s.val()))),
      onValue(ref(db, "projects"), (s) => setProjects(toList(s.val()))),
      onValue(ref(db, "payments"), (s) => setPayments(toList(s.val()))),
      onValue(ref(db, "leads"), (s) => setLeads(toList(s.val()))),
      onValue(ref(db, "ndas"), (s) => setNdas(toList(s.val()))),
      onValue(ref(db, "domains"), (s) => setDomains(toList(s.val()))),
      onValue(ref(db, "analytics/daily"), (s) => setDaily(toList(s.val()))),
      onValue(ref(db, "analytics/summary"), (s) => setSummary(s.val() || {})),
    ];
    return () => subs.forEach((u) => u());
  }, []);

  const clientName = (id) => clients.find((c) => c.id === id)?.businessName || "—";

  const newLeads = leads.filter((l) => (l.status || "new") === "new").length;
  const activeProjects = projects.filter((p) => p.stage !== "live");
  const revenue = payments.filter((p) => p.status === "paid").reduce((s, p) => s + Number(p.amount || 0), 0);
  const unpaid = payments.filter((p) => p.status === "unpaid");
  const unpaidTotal = unpaid.reduce((s, p) => s + Number(p.amount || 0), 0);
  const signedNdas = ndas.filter((n) => n.signature).length;

  const traffic = useMemo(() => {
    const byDate = Object.fromEntries(daily.map((d) => [d.id, d]));
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const date = ymd(Date.now() - i * DAY);
      days.push({ date, value: Number(byDate[date]?.pageviews || 0) });
    }
    const last7 = days.slice(-7).reduce((s, d) => s + d.value, 0);
    return { days, last7 };
  }, [daily]);

  const recentLeads = useMemo(
    () => [...leads].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 5),
    [leads],
  );

  const upcomingRenewals = useMemo(() => {
    return domains
      .map((d) => {
        const t = d.expiresAt ? new Date(d.expiresAt + "T00:00:00").getTime() : null;
        return { ...d, t, days: t ? Math.round((t - Date.now()) / DAY) : null };
      })
      .filter((d) => d.days !== null && d.days <= 60)
      .sort((a, b) => a.t - b.t)
      .slice(0, 5);
  }, [domains]);

  const activity = useMemo(() => {
    const items = [];
    leads.forEach((l) =>
      items.push({ ts: l.createdAt, icon: "📨", text: `New lead — ${l.business || l.name || "website"}`, to: "/leads" }),
    );
    payments
      .filter((p) => p.status === "paid")
      .forEach((p) => items.push({ ts: p.paidAt, icon: "💰", text: `Payment received — ${money(p.amount)}`, to: `/clients/${p.clientId}` }));
    ndas
      .filter((n) => n.signature)
      .forEach((n) => items.push({ ts: n.signedAt || n.signature.agreedAt, icon: "✍️", text: `NDA signed — ${n.signature.name}`, to: `/ndas/${n.id}` }));
    return items.filter((i) => i.ts).sort((a, b) => b.ts - a.ts).slice(0, 8);
  }, [leads, payments, ndas]);

  const notes = [];
  if (newLeads > 0) notes.push(`${newLeads} new ${newLeads === 1 ? "lead" : "leads"}`);
  if (unpaid.length > 0) notes.push(`${unpaid.length} unpaid ${unpaid.length === 1 ? "invoice" : "invoices"}`);
  if (upcomingRenewals.length > 0) notes.push(`${upcomingRenewals.length} domain ${upcomingRenewals.length === 1 ? "renewal" : "renewals"} soon`);
  const subtitle = notes.length ? `You have ${notes.join(", ")} to look at.` : "You're all caught up. 🎉";

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1>Welcome, {profile?.name || "there"}</h1>
          <p className="page-sub">{subtitle}</p>
        </div>
      </header>

      {/* Quick actions */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
        <Link to="/quotes/new" className="btn btn-maroon btn-sm">+ New quote</Link>
        <Link to="/ndas/new" className="btn btn-outline btn-sm">+ New NDA</Link>
        <Link to="/projects" className="btn btn-outline btn-sm">+ New project</Link>
        <Link to="/clients" className="btn btn-outline btn-sm">+ Add client</Link>
      </div>

      {newLeads > 0 && (
        <div className="leads-banner">
          <span className="t">📨 {newLeads} new {newLeads === 1 ? "lead" : "leads"} from the website</span>
          <Link to="/leads" className="btn btn-maroon btn-sm">Review leads</Link>
        </div>
      )}

      <div className="tiles">
        <div className="tile tile-accent">
          <div className="tile-label">Revenue to date</div>
          <div className="tile-value">{money(revenue)}</div>
        </div>
        <div className="tile">
          <div className="tile-label">Clients</div>
          <div className="tile-value">{clients.length}</div>
        </div>
        <div className="tile">
          <div className="tile-label">Active projects</div>
          <div className="tile-value">{activeProjects.length}</div>
        </div>
        <div className="tile">
          <div className="tile-label">New leads</div>
          <div className="tile-value">{newLeads}</div>
        </div>
        <div className="tile">
          <div className="tile-label">Signed NDAs</div>
          <div className="tile-value">{signedNdas}</div>
        </div>
        <div className="tile">
          <div className="tile-label">Unpaid</div>
          <div className="tile-value">
            {unpaid.length}
            {unpaid.length > 0 && <span className="tile-sub"> · {money(unpaidTotal)}</span>}
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Recent leads */}
        <section className="panel">
          <div className="panel-head">
            <h2>Recent leads</h2>
            <Link className="link" to="/leads">View all</Link>
          </div>
          {recentLeads.length === 0 ? (
            <p className="muted">No leads yet — they'll land here from the quote form.</p>
          ) : (
            <table className="table">
              <tbody>
                {recentLeads.map((l) => (
                  <tr key={l.id}>
                    <td>
                      <span className="strong">{l.business || l.name}</span>
                      <div className="muted" style={{ fontSize: 13 }}>{l.need}</div>
                    </td>
                    <td className="right muted" style={{ fontSize: 13, whiteSpace: "nowrap" }}>
                      {timeAgo(l.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* Active projects */}
        <section className="panel">
          <div className="panel-head">
            <h2>Projects in progress</h2>
            <Link className="link" to="/projects">View all</Link>
          </div>
          {activeProjects.length === 0 ? (
            <p className="muted">No active builds. Add a project to start tracking one.</p>
          ) : (
            <table className="table">
              <tbody>
                {activeProjects.slice(0, 6).map((p) => (
                  <tr key={p.id}>
                    <td>
                      <span className="strong">{p.title || "Untitled"}</span>
                      <div className="muted" style={{ fontSize: 13 }}>{clientName(p.clientId)}</div>
                    </td>
                    <td className="right">
                      <span className="pill pill-building">{STAGE_LABEL[p.stage] || p.stage || "building"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>

      <div className="grid-2">
        {/* Website traffic */}
        <section className="panel">
          <div className="panel-head">
            <h2>Website traffic</h2>
            <Link className="link" to="/analytics">Analytics</Link>
          </div>
          <div style={{ display: "flex", gap: 20, alignItems: "baseline", marginBottom: 8 }}>
            <div>
              <div className="tile-value" style={{ fontSize: 26 }}>{traffic.last7.toLocaleString()}</div>
              <div className="muted" style={{ fontSize: 12 }}>views · last 7 days</div>
            </div>
            <div>
              <div className="tile-value" style={{ fontSize: 26 }}>{Number(summary.visits || 0).toLocaleString()}</div>
              <div className="muted" style={{ fontSize: 12 }}>visitors · all time</div>
            </div>
          </div>
          {traffic.days.some((d) => d.value) ? (
            <MiniBars data={traffic.days} />
          ) : (
            <p className="muted">No traffic recorded yet — data appears as people visit the site.</p>
          )}
        </section>

        {/* Upcoming renewals */}
        <section className="panel">
          <div className="panel-head">
            <h2>Upcoming renewals</h2>
            <Link className="link" to="/domains">Domains</Link>
          </div>
          {upcomingRenewals.length === 0 ? (
            <p className="muted">No domain renewals in the next 60 days.</p>
          ) : (
            <table className="table">
              <tbody>
                {upcomingRenewals.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <span className="strong">{d.domain}</span>
                      <div className="muted" style={{ fontSize: 13 }}>{clientName(d.clientId)}</div>
                    </td>
                    <td className="right">
                      <span className={`pill ${d.days <= 14 ? "pill-unpaid" : "pill-building"}`}>
                        {d.days < 0 ? "Expired" : `${d.days}d`}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>

      {/* Outstanding invoices */}
      <section className="panel">
        <h2>Outstanding invoices</h2>
        {unpaid.length === 0 ? (
          <p className="muted">Nothing outstanding — everyone's paid up. 🎉</p>
        ) : (
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr><th>Client</th><th>Amount</th><th>Invoiced</th><th></th></tr>
              </thead>
              <tbody>
                {unpaid
                  .sort((a, b) => (a.invoicedAt || 0) - (b.invoicedAt || 0))
                  .map((p) => (
                    <tr key={p.id}>
                      <td>{clientName(p.clientId)}</td>
                      <td className="num">{money(p.amount)}</td>
                      <td>{dateShort(p.invoicedAt)}</td>
                      <td className="right">
                        <Link className="link" to={`/clients/${p.clientId}`}>Open</Link>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Activity feed */}
      <section className="panel">
        <h2>Recent activity</h2>
        {activity.length === 0 ? (
          <p className="muted">Activity — new leads, payments, and signed NDAs — will show up here.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {activity.map((a, i) => (
              <Link
                key={i}
                to={a.to}
                className="link"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "11px 2px",
                  borderTop: i ? "1px solid var(--line)" : "none",
                  color: "inherit",
                }}
              >
                <span style={{ fontSize: 18 }}>{a.icon}</span>
                <span style={{ flex: 1 }}>{a.text}</span>
                <span className="muted" style={{ fontSize: 13, whiteSpace: "nowrap" }}>{timeAgo(a.ts)}</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
