import { useEffect, useMemo, useState } from "react";
import { ref, onValue, push, set, update, remove } from "firebase/database";
import { db } from "../firebase";
import { toList, dateShort } from "../lib/format";

const STAGES = ["planning", "building", "review", "live"];
const STAGE_LABEL = {
  planning: "Planning",
  building: "Building",
  review: "Client review",
  live: "Live",
};

const blank = () => ({ title: "", clientId: "", stage: "planning", url: "", dueDate: "" });

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState(blank());
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const subs = [
      onValue(ref(db, "projects"), (s) => setProjects(toList(s.val()))),
      onValue(ref(db, "clients"), (s) => setClients(toList(s.val()))),
    ];
    return () => subs.forEach((u) => u());
  }, []);

  const clientName = (id) => clients.find((c) => c.id === id)?.businessName || "—";
  const setF = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const counts = useMemo(() => {
    const c = Object.fromEntries(STAGES.map((s) => [s, 0]));
    projects.forEach((p) => {
      const st = STAGES.includes(p.stage) ? p.stage : "building";
      c[st] = (c[st] || 0) + 1;
    });
    return c;
  }, [projects]);

  const sorted = [...projects].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  async function addProject(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    const node = push(ref(db, "projects"));
    await set(node, {
      title: form.title.trim(),
      clientId: form.clientId || "",
      stage: form.stage || "planning",
      url: form.url.trim(),
      dueDate: form.dueDate || "",
      createdAt: Date.now(),
    });
    setForm(blank());
    setAdding(false);
  }

  const setStage = (p, stage) => update(ref(db, "projects/" + p.id), { stage });
  const del = (p) => {
    if (window.confirm("Delete this project?")) remove(ref(db, "projects/" + p.id));
  };

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Delivery</p>
          <h1>Projects</h1>
          <p className="page-sub">Every website build, from kickoff to launch.</p>
        </div>
        <button className="btn btn-maroon" onClick={() => setAdding((a) => !a)}>
          {adding ? "Close" : "+ New project"}
        </button>
      </header>

      <div className="tiles">
        {STAGES.map((s) => (
          <div key={s} className={`tile ${s === "live" ? "tile-accent" : ""}`}>
            <div className="tile-label">{STAGE_LABEL[s]}</div>
            <div className="tile-value">{counts[s] || 0}</div>
          </div>
        ))}
      </div>

      {adding && (
        <section className="panel">
          <h2>New project</h2>
          <form onSubmit={addProject}>
            <div className="grid-2">
              <label className="field">
                <span>Project title</span>
                <input value={form.title} onChange={setF("title")} placeholder="Smith Plumbing — website" autoFocus />
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
                <span>Stage</span>
                <select value={form.stage} onChange={setF("stage")}>
                  {STAGES.map((s) => (
                    <option key={s} value={s}>{STAGE_LABEL[s]}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Target launch date</span>
                <input type="date" value={form.dueDate} onChange={setF("dueDate")} />
              </label>
            </div>
            <label className="field" style={{ marginTop: 14 }}>
              <span>Live / preview URL</span>
              <input value={form.url} onChange={setF("url")} placeholder="https://…" />
            </label>
            <div className="save-bar">
              <button className="btn btn-maroon">Save project</button>
            </div>
          </form>
        </section>
      )}

      <section className="panel">
        {sorted.length === 0 ? (
          <p className="muted">No projects yet. Add one to start tracking a build.</p>
        ) : (
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Client</th>
                  <th>Stage</th>
                  <th>Launch</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <span className="strong">{p.title || "Untitled"}</span>
                      {p.url && (
                        <div style={{ fontSize: 13 }}>
                          <a className="link" href={p.url} target="_blank" rel="noreferrer">
                            {p.url.replace(/^https?:\/\//, "")}
                          </a>
                        </div>
                      )}
                    </td>
                    <td>{clientName(p.clientId)}</td>
                    <td>
                      <select
                        value={STAGES.includes(p.stage) ? p.stage : "building"}
                        onChange={(e) => setStage(p, e.target.value)}
                        style={{ padding: "6px 8px", fontSize: 13 }}
                      >
                        {STAGES.map((s) => (
                          <option key={s} value={s}>{STAGE_LABEL[s]}</option>
                        ))}
                      </select>
                    </td>
                    <td>{p.dueDate ? dateShort(new Date(p.dueDate + "T00:00:00").getTime()) : "—"}</td>
                    <td className="right">
                      <button className="btn btn-outline btn-sm" onClick={() => del(p)}>
                        Delete
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
