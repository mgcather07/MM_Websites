import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

function Splash({ children }) {
  return (
    <div className="splash">
      <div className="splash-mark" aria-hidden="true">
        M&amp;M
      </div>
      <div>{children}</div>
    </div>
  );
}

// Gate the whole authenticated area: signed in AND an allow-listed admin.
export function RequireAuth({ children }) {
  const { status, user, logout } = useAuth();
  const location = useLocation();

  if (status === "loading") return <Splash>Loading…</Splash>;
  if (status === "unauth")
    return <Navigate to="/login" replace state={{ from: location }} />;
  if (status === "error")
    return (
      <Splash>
        <p>
          Couldn&apos;t reach the database. Make sure the Realtime Database is
          enabled for this project, then refresh.
        </p>
      </Splash>
    );
  if (status === "unauthorized")
    return (
      <div className="splash">
        <div className="splash-mark" aria-hidden="true">
          M&amp;M
        </div>
        <h2>Not authorized</h2>
        <p>
          You&apos;re signed in as <strong>{user?.email}</strong>, but this
          account isn&apos;t on the admin list.
        </p>
        <button className="btn btn-outline" onClick={logout}>
          Sign out
        </button>
      </div>
    );
  return children;
}
