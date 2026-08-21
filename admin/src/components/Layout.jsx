import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Layout() {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();

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
