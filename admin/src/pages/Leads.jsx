import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ref, onValue, push, set, update } from "firebase/database";
import { db } from "../firebase";
import { toList, dateShort } from "../lib/format";

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [tab, setTab] = useState("new"); // new | all
  const navigate = useNavigate();

  useEffect(
    () => onValue(ref(db, "leads"), (s) => setLeads(toList(s.val()))),
    [],
  );

  const shown = useMemo(() => {
    const sorted = [...leads].sort(
      (a, b) => (b.createdAt || 0) - (a.createdAt || 0),
    );
    if (tab === "new") return sorted.filter((l) => (l.status || "new") === "new");
    return sorted;
  }, [leads, tab]);

  const newCount = leads.filter((l) => (l.status || "new") === "new").length;

  const convert = async (lead) => {
    const clientRef = push(ref(db, "clients"));
    await set(clientRef, {
      businessName: lead.business || lead.name,
      contactName: lead.name || "",
      email: lead.email || "",
      phone: lead.phone || "",
      status: "active",
      notes: lead.details || "",
      createdAt: Date.now(),
    });
    await update(ref(db, "leads/" + lead.id), {
      status: "converted",
      clientId: clientRef.key,
      handledAt: Date.now(),
    });
    navigate("/clients/" + clientRef.key);
  };

  const dismiss = (lead) =>
    update(ref(db, "leads/" + lead.id), {
      status: "dismissed",
      handledAt: Date.now(),
    });

  const reopen = (lead) =>
    update(ref(db, "leads/" + lead.id), { status: "new", handledAt: null });

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Inbox</p>
          <h1>Leads</h1>
        </div>
        <div className="tabs">
          <button
            className={`tab ${tab === "new" ? "tab-on" : ""}`}
            onClick={() => setTab("new")}
          >
            New {newCount > 0 && <span className="tab-count">{newCount}</span>}
          </button>
          <button
            className={`tab ${tab === "all" ? "tab-on" : ""}`}
            onClick={() => setTab("all")}
          >
            All
          </button>
        </div>
      </header>

      {shown.length === 0 ? (
        <div className="panel">
          <p className="muted">
            {tab === "new"
              ? "No new leads right now. Quote-form submissions land here."
              : "No leads yet."}
          </p>
        </div>
      ) : (
        <div className="lead-list">
          {shown.map((lead) => {
            const status = lead.status || "new";
            return (
              <article className="panel lead" key={lead.id}>
                <div className="lead-top">
                  <div>
                    <div className="lead-name">
                      {lead.business || lead.name}
                      {lead.business && lead.name && (
                        <span className="lead-contact"> · {lead.name}</span>
                      )}
                    </div>
                    <div className="lead-meta">
                      {lead.need} · {dateShort(lead.createdAt)}
                    </div>
                  </div>
                  {status !== "new" && (
                    <span className={`pill ${status === "converted" ? "pill-paid" : "pill-unpaid"}`}>
                      {status}
                    </span>
                  )}
                </div>

                <div className="lead-contacts">
                  {lead.phone && (
                    <a className="link" href={`tel:${lead.phone}`}>
                      {lead.phone}
                    </a>
                  )}
                  {lead.email && (
                    <a className="link" href={`mailto:${lead.email}`}>
                      {lead.email}
                    </a>
                  )}
                </div>

                {lead.currentUrl && (
                  <div className="lead-current">
                    Current site:{" "}
                    <a
                      className="link"
                      href={/^https?:\/\//.test(lead.currentUrl) ? lead.currentUrl : "https://" + lead.currentUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {lead.currentUrl}
                    </a>
                  </div>
                )}

                {lead.details && <p className="lead-details">{lead.details}</p>}

                <div className="lead-actions">
                  {status === "new" ? (
                    <>
                      <button className="btn btn-maroon btn-sm" onClick={() => convert(lead)}>
                        + Add as client
                      </button>
                      <button className="btn btn-outline btn-sm" onClick={() => dismiss(lead)}>
                        Dismiss
                      </button>
                    </>
                  ) : (
                    <>
                      {lead.clientId && (
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => navigate("/clients/" + lead.clientId)}
                        >
                          Open client
                        </button>
                      )}
                      <button className="btn btn-outline btn-sm" onClick={() => reopen(lead)}>
                        Reopen
                      </button>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
