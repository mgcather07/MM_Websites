import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ref, onValue } from "firebase/database";
import { db } from "../firebase";
import { money, dateShort, toList } from "../lib/format";

export default function Dashboard() {
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    const subs = [
      onValue(ref(db, "clients"), (s) => setClients(toList(s.val()))),
      onValue(ref(db, "projects"), (s) => setProjects(toList(s.val()))),
      onValue(ref(db, "payments"), (s) => setPayments(toList(s.val()))),
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

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Overview</p>
          <h1>Dashboard</h1>
        </div>
        <Link to="/clients" className="btn btn-maroon">
          View clients
        </Link>
      </header>

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
