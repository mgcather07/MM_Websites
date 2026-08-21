import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { ref, get, set, onValue } from "firebase/database";
import { auth, db } from "../firebase";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

// status: 'loading' | 'unauth' | 'authorized' | 'unauthorized' | 'error'
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let unsubProfile = null;
    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }
      if (!u) {
        setUser(null);
        setProfile(null);
        setStatus("unauth");
        return;
      }
      setUser(u);
      setStatus("loading");
      try {
        const adminsSnap = await get(ref(db, "admins"));

        // Bootstrap: if no admins exist yet, the first person to sign in
        // becomes the master. (The DB rules allow this one-time write.)
        if (!adminsSnap.exists()) {
          await set(ref(db, "admins/" + u.uid), {
            email: u.email,
            name: u.displayName || (u.email || "").split("@")[0],
            role: "master",
            createdAt: Date.now(),
          });
        }

        // Live subscription to my own admin record.
        unsubProfile = onValue(
          ref(db, "admins/" + u.uid),
          (meSnap) => {
            if (meSnap.exists()) {
              setProfile(meSnap.val());
              setStatus("authorized");
            } else {
              setProfile(null);
              setStatus("unauthorized");
            }
          },
          (err) => {
            console.error("Auth profile load failed:", err);
            setStatus("error");
          },
        );
      } catch (e) {
        console.error("Auth profile load failed:", e);
        setStatus("error");
      }
    });
    return () => {
      if (unsubProfile) unsubProfile();
      unsubAuth();
    };
  }, []);

  const login = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);
  const logout = () => signOut(auth);

  return (
    <AuthCtx.Provider value={{ user, profile, status, login, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}
