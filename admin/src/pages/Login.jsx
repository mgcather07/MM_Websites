import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { authError } from "../lib/format";

export default function Login() {
  const { login, status } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  // Already signed in? Skip the form.
  if (status === "authorized") {
    return <Navigate to={location.state?.from?.pathname || "/"} replace />;
  }

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      await login(email.trim(), password);
      navigate(location.state?.from?.pathname || "/", { replace: true });
    } catch (e) {
      setErr(authError(e?.code));
      setBusy(false);
    }
  };

  return (
    <div className="login">
      <form className="login-card" onSubmit={submit}>
        <div className="login-mark" aria-hidden="true">
          M&amp;M
        </div>
        <h1>Admin sign in</h1>
        <p className="login-sub">M&amp;M Websites dashboard</p>

        {err && (
          <div className="login-err" role="alert">
            {err}
          </div>
        )}

        <label className="field">
          <span>Email</span>
          <input
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
        </label>

        <label className="field">
          <span>Password</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        <button className="btn btn-maroon btn-block" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
