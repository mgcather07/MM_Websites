import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ref, onValue } from "firebase/database";
import { db } from "../firebase";
import { money, dateShort, toList } from "../lib/format";
import { useAuth } from "../auth/AuthContext";

export default function Dashboard() {
  const { profile } = useAuth();
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [payments, setPayments] = useState([]);
  const [newLeads, setNewLeads] = useState(0);

  useEffect(() => {
    const subs = [
      onValue(ref(db, "clients"), (s) => setClients(toList(s.val()))),
      onValue(ref(db, "projects"), (s) => setProjects(toList(s.val()))),
      onValue(ref(db, "payments"), (s) => setPayments(toList(s.val()))),
      onValue(ref(db, "leads"), (s) =>
        setNewLeads(
          toList(s.val()).filter((l) => (l.status || "new") === "new").length,
        ),
      ),
    ];
    return () => subs.forEach((u) => u());
  }, []);

  const activeProjects = projects.filter((p) => p.stage !== "live").length;
  const revenue = payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const unpaid = payments.filter((p) => p.status === "unpaid");
  const unpaidTotal = unpaid.reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const clientName = (id) =>
    clients.find((c) => c.id === id)?.businessName || "—";

  const notes = [];
  if (newLeads > 0)
    notes.push(`${newLeads} new ${newLeads === 1 ? "lead" : "leads"}`);
  if (unpaid.length > 0)
    notes.push(
      `${unpaid.length} unpaid ${unpaid.length === 1 ? "invoice" : "invoices"}`,
    );
  const subtitle = notes.length
    ? `You have ${notes.join(" and ")} waiting.`
    : "You're all caught up. 🎉";

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Overview</p>
          <h1>Welcome, {profile?.name || "there"}</h1>
          <p className="page-sub">{subtitle}</p>
        </div>
        <Link to="/clients" className="btn btn-maroon">
          View clients
        </Link>
      </header>

      {newLeads > 0 && (
        <div className="leads-banner">
          <span className="t">
            📨 {newLeads} new {newLeads === 1 ? "lead" : "leads"} from the website
          </span>
          <Link to="/leads" className="btn btn-maroon btn-sm">
            Review leads
          </Link>
        </div>
      )}

      <div className="tiles">
        <div className="tile">
          <div className="tile-label">Clients</div>
          <div className="tile-value">{clients.length}</div>
        </div>
        <div className="tile">
          <div className="tile-label">Active projects</div>
          <div className="tile-value">{activeProjects}</div>
        </div>
        <div className="tile tile-accent">
          <div className="tile-label">Revenue to date</div>
          <div className="tile-value">{money(revenue)}</div>
        </div>
        <div className="tile">
          <div className="tile-label">Unpaid</div>
          <div className="tile-value">
            {unpaid.length}
            {unpaid.length > 0 && (
              <span className="tile-sub"> · {money(unpaidTotal)} owed</span>
            )}
          </div>
        </div>
      </div>

      <section className="panel">
        <h2>Outstanding invoices</h2>
        {unpaid.length === 0 ? (
          <p className="muted">Nothing outstanding — everyone's paid up. 🎉</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Amount</th>
                <th>Invoiced</th>
                <th></th>
              </tr>
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
                      <Link className="link" to={`/clients/${p.clientId}`}>
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
