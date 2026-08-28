import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ref, onValue } from "firebase/database";
import { db } from "../firebase";
import { toList, dateShort } from "../lib/format";

export default function Ndas() {
  const [ndas, setNdas] = useState([]);

  useEffect(() => onValue(ref(db, "ndas"), (s) => setNdas(toList(s.val()))), []);

  const sorted = [...ndas].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Confidentiality</p>
          <h1>NDAs</h1>
        </div>
        <Link to="/ndas/new" className="btn btn-maroon">
          + New NDA
        </Link>
      </header>

      <div className="panel">
        {sorted.length === 0 ? (
          <p className="muted">
            No NDAs yet. Create one to send a client a link they can review and e-sign.
          </p>
        ) : (
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>For</th>
                  <th>Status</th>
                  <th>Signed by</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((n) => {
                  const signed = !!n.signature;
                  return (
                    <tr key={n.id}>
                      <td>
                        <Link className="link strong" to={`/ndas/${n.id}`}>
                          {n.preparedFor?.org || n.preparedFor?.name || "Untitled NDA"}
                        </Link>
                        {n.ndaNumber && (
                          <div className="muted" style={{ fontSize: 13 }}>
                            {n.ndaNumber}
                          </div>
                        )}
                      </td>
                      <td>
                        <span
                          className={`pill ${
                            signed
                              ? "pill-paid"
                              : n.status === "sent"
                                ? "pill-building"
                                : "pill-unpaid"
                          }`}
                        >
                          {signed ? "signed" : n.status || "draft"}
                        </span>
                      </td>
                      <td>
                        {signed ? (
                          <>
                            {n.signature.name}
                            {n.signature.agreedAt && (
                              <div className="muted" style={{ fontSize: 13 }}>
                                {dateShort(n.signature.agreedAt)}
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </td>
                      <td>{dateShort(n.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
