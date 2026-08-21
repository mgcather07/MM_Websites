import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { ref, onValue } from "firebase/database";
import { db } from "../firebase";
import { toList } from "../lib/format";
import { useAuth } from "../auth/AuthContext";

export default function Layout() {
  const { profile, user, logout } = useAuth();
  const navigate = useNavigate();
  const [newLeads, setNewLeads] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(
    () =>
      onValue(ref(db, "leads"), (s) =>
        setNewLeads(
          toList(s.val()).filter((l) => (l.status || "new") === "new").length,
        ),
      ),
    [],
  );

  const doLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const initial = (profile?.name || user?.email || "?").slice(0, 1).toUpperCase();

  return (
    <div className="shell">
      <aside className={"sidebar" + (open ? " is-open" : "")}>
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <img src="/images/logo/mm-mark.png" alt="" />
          </span>
          <div className="brand-text">
            <strong>M&amp;M Admin</strong>
            <span>Management</span>
          </div>
        </div>

        <nav
          className="side-nav"
          aria-label="Sections"
          onClick={() => setOpen(false)}
        >
          <NavLink to="/" end>
            Overview
          </NavLink>
          <NavLink to="/leads">
            Leads
            {newLeads > 0 && <span className="nav-badge">{newLeads}</span>}
          </NavLink>
          <NavLink to="/clients">Clients</NavLink>
          <NavLink to="/quotes">Quotes</NavLink>
        </nav>

        <div className="side-foot">
          <div className="who">
            <div className="who-avatar" aria-hidden="true">
              {initial}
            </div>
            <div className="who-meta">
              <strong>{profile?.name || user?.email}</strong>
              <span className="who-role">
                {profile?.role === "master" ? "Master" : "Admin"}
              </span>
            </div>
          </div>
          <button
            className="iconbtn"
            title="Sign out"
            aria-label="Sign out"
            onClick={doLogout}
          >
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </aside>

      {open && <div className="scrim" onClick={() => setOpen(false)} />}

      <div className="main">
        <header className="topbar">
          <button
            className="hamburger"
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            <svg
              viewBox="0 0 24 24"
              width="22"
              height="22"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <a
            className="topbar-view"
            href="https://mmwebsites.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            View site ↗
          </a>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
