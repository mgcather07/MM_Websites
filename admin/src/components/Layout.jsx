import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { ref, onValue } from "firebase/database";
import { db } from "../firebase";
import { toList } from "../lib/format";
import { useAuth } from "../auth/AuthContext";

export default function Layout() {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const [newLeads, setNewLeads] = useState(0);

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

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">M&amp;M</span>
          <span className="brand-word">Admin</span>
        </div>

        <nav className="side-nav" aria-label="Sections">
          <NavLink to="/" end>
            Overview
          </NavLink>
          <NavLink to="/leads">
            Leads
            {newLeads > 0 && <span className="nav-badge">{newLeads}</span>}
          </NavLink>
          <NavLink to="/clients">Clients</NavLink>
        </nav>

        <div className="side-foot">
          <div className="who">
            <div className="who-name">{profile?.name || "Admin"}</div>
            <div className="who-role">{profile?.role || ""}</div>
          </div>
          <button className="btn btn-outline btn-sm" onClick={doLogout}>
            Sign out
          </button>
        </div>
      </aside>

      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
