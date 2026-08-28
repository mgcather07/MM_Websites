import { useEffect, useMemo, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../firebase";
import { toList, dateShort } from "../lib/format";

const DAY = 86400000;
const ymd = (d) => new Date(d).toISOString().slice(0, 10);

// Merge a bunch of {key: count} maps into one, summed.
function mergeCounts(maps) {
  const out = {};
  for (const m of maps) {
    if (!m) continue;
    for (const [k, v] of Object.entries(m)) out[k] = (out[k] || 0) + Number(v || 0);
  }
  return out;
}
const topEntries = (obj, n = 6) =>
  Object.entries(obj)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n);

const SOURCE_LABEL = {
  direct: "Direct / typed",
  google: "Google",
  bing: "Bing",
  yahoo: "Yahoo",
  duckduckgo: "DuckDuckGo",
  facebook: "Facebook",
  instagram: "Instagram",
  twitter: "Twitter / X",
  linkedin: "LinkedIn",
  referral: "Other sites",
  internal: "On-site",
};
const PAGE_LABEL = { home: "Home", quote: "Quote page", nda: "NDA page" };
const titleCase = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function BarChart({ data }) {
  // data: [{ date, value }]
  const w = 720;
  const h = 150;
  const pad = { l: 4, r: 4, t: 10, b: 18 };
  const max = Math.max(1, ...data.map((d) => d.value));
  const bw = (w - pad.l - pad.r) / data.length;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" role="img" aria-label="Pageviews, last 30 days">
      {data.map((d, i) => {
        const bh = ((h - pad.t - pad.b) * d.value) / max;
        const x = pad.l + i * bw;
        const y = h - pad.b - bh;
        return (
          <g key={d.date}>
            <rect
              x={x + 1.5}
              y={y}
              width={Math.max(1, bw - 3)}
              height={Math.max(0, bh)}
              rx="2"
              fill="#7a1b2e"
              opacity={d.value ? 0.9 : 0.12}
            >
              <title>
                {d.date}: {d.value} views
              </title>
            </rect>
            {i % 5 === 0 && (
              <text x={x + bw / 2} y={h - 5} fontSize="9" fill="#8a8f94" textAnchor="middle">
                {d.date.slice(5)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export default function Analytics() {
  const [daily, setDaily] = useState([]);
  const [summary, setSummary] = useState({});
  const [leads, setLeads] = useState([]);

  useEffect(() => {
    const subs = [
      onValue(ref(db, "analytics/daily"), (s) => setDaily(toList(s.val()))),
      onValue(ref(db, "analytics/summary"), (s) => setSummary(s.val() || {})),
      onValue(ref(db, "leads"), (s) => setLeads(toList(s.val()))),
    ];
    return () => subs.forEach((u) => u());
  }, []);

  const view = useMemo(() => {
    const byDate = Object.fromEntries(daily.map((d) => [d.id, d]));
    const today = Date.now();
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const date = ymd(today - i * DAY);
      const d = byDate[date] || {};
      days.push({ date, value: Number(d.pageviews || 0), row: d });
    }
    const last7 = days.slice(-7).reduce((s, d) => s + d.value, 0);
    const last30 = days.reduce((s, d) => s + d.value, 0);
    const pages = mergeCounts(days.map((d) => d.row.pages));
    const refs = mergeCounts(days.map((d) => d.row.refs));
    const devices = mergeCounts(days.map((d) => d.row.devices));
    const deviceTotal = (devices.mobile || 0) + (devices.desktop || 0) || 1;
    return { days, last7, last30, pages, refs, devices, deviceTotal };
  }, [daily]);

  const totalViews = Number(summary.pageviews || 0);
  const totalVisits = Number(summary.visits || 0);
  const totalLeads = leads.length;
  const conv = totalVisits ? ((totalLeads / totalVisits) * 100).toFixed(1) : "0.0";

  const noData = totalViews === 0;

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Insights</p>
          <h1>Analytics</h1>
          <p className="page-sub">
            First-party website traffic{summary.updatedAt ? ` · updated ${dateShort(summary.updatedAt)}` : ""}
          </p>
        </div>
      </header>

      <div className="tiles">
        <div className="tile tile-accent">
          <div className="tile-label">Pageviews (all time)</div>
          <div className="tile-value">{totalViews.toLocaleString()}</div>
        </div>
        <div className="tile">
          <div className="tile-label">Visitors (all time)</div>
          <div className="tile-value">{totalVisits.toLocaleString()}</div>
        </div>
        <div className="tile">
          <div className="tile-label">Views · last 7 days</div>
          <div className="tile-value">{view.last7.toLocaleString()}</div>
        </div>
        <div className="tile">
          <div className="tile-label">Quote leads</div>
          <div className="tile-value">
            {totalLeads}
            <span className="tile-sub"> · {conv}% of visitors</span>
          </div>
        </div>
      </div>

      <section className="panel">
        <div className="panel-head">
          <h2>Pageviews · last 30 days</h2>
          <span className="muted" style={{ fontSize: 13 }}>{view.last30.toLocaleString()} total</span>
        </div>
        {noData ? (
          <p className="muted">
            No traffic recorded yet. Data appears here as people visit the site — give it a little
            time after launch.
          </p>
        ) : (
          <BarChart data={view.days} />
        )}
      </section>

      <div className="grid-2">
        <section className="panel">
          <h2>Top pages</h2>
          {topEntries(view.pages).length === 0 ? (
            <p className="muted">No data yet.</p>
          ) : (
            <table className="table">
              <tbody>
                {topEntries(view.pages).map(([k, v]) => (
                  <tr key={k}>
                    <td>{PAGE_LABEL[k] || "/" + k}</td>
                    <td className="num strong">{v.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="panel">
          <h2>Traffic sources</h2>
          {topEntries(view.refs).length === 0 ? (
            <p className="muted">No data yet.</p>
          ) : (
            <table className="table">
              <tbody>
                {topEntries(view.refs).map(([k, v]) => (
                  <tr key={k}>
                    <td>{SOURCE_LABEL[k] || titleCase(k)}</td>
                    <td className="num strong">{v.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>

      <section className="panel">
        <h2>Devices · last 30 days</h2>
        {view.devices.mobile || view.devices.desktop ? (
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            {["mobile", "desktop"].map((dv) => {
              const n = view.devices[dv] || 0;
              const pct = Math.round((n / view.deviceTotal) * 100);
              return (
                <div key={dv} style={{ flex: "1 1 200px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                    <span>{titleCase(dv)}</span>
                    <span className="strong">{pct}%</span>
                  </div>
                  <div style={{ height: 8, background: "#eceae7", borderRadius: 6, marginTop: 6 }}>
                    <div
                      style={{
                        width: pct + "%",
                        height: "100%",
                        background: "#7a1b2e",
                        borderRadius: 6,
                      }}
                    />
                  </div>
                  <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                    {n.toLocaleString()} views
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="muted">No data yet.</p>
        )}
      </section>
    </div>
  );
}
