import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ref, onValue } from "firebase/database";
import { db } from "../firebase";
import { toList, money, dateShort } from "../lib/format";

const itemsOf = (q) =>
  Array.isArray(q.items) ? q.items : Object.values(q.items || {});
const totalOf = (q) =>
  itemsOf(q).reduce((s, it) => s + Number(it?.price || 0), 0);

export default function Quotes() {
  const [quotes, setQuotes] = useState([]);

  useEffect(
    () => onValue(ref(db, "quotes"), (s) => setQuotes(toList(s.val()))),
    [],
  );

  const sorted = [...quotes].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Sales</p>
          <h1>Quotes</h1>
        </div>
        <Link to="/quotes/new" className="btn btn-maroon">
          + New quote
        </Link>
      </header>

      <div className="panel">
        {sorted.length === 0 ? (
          <p className="muted">
            No quotes yet. Create your first one — you&apos;ll get a link to send.
          </p>
        ) : (
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Prepared for</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((q) => (
                  <tr key={q.id}>
                    <td>
                      <Link className="link strong" to={`/quotes/${q.id}`}>
                        {q.preparedFor?.org || q.preparedFor?.name || "Untitled quote"}
                      </Link>
                      {q.subtitle && (
                        <div className="muted" style={{ fontSize: 13 }}>
                          {q.subtitle}
                        </div>
                      )}
                    </td>
                    <td className="num strong">{money(totalOf(q))}</td>
                    <td>
                      <span
                        className={`pill ${
                          q.status === "accepted" || q.status === "paid"
                            ? "pill-paid"
                            : q.status === "sent"
                              ? "pill-building"
                              : "pill-unpaid"
                        }`}
                      >
                        {q.status || "draft"}
                      </span>
                    </td>
                    <td>{dateShort(q.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
