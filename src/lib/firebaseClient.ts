import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { getDatabase } from "firebase/database";

// Public web config for project mm-websites (not secret — identifies the
// project to clients; protection comes from the RTDB security rules + App Check).
const firebaseConfig = {
  apiKey: "AIzaSyBQKlz3UZH3yLtZmwi2an3X1oGdNGeUMkM",
  authDomain: "mm-websites.firebaseapp.com",
  databaseURL: "https://mm-websites-default-rtdb.firebaseio.com",
  projectId: "mm-websites",
  storageBucket: "mm-websites.firebasestorage.app",
  messagingSenderId: "667616152120",
  appId: "1:667616152120:web:e54b2a6f39d1da4610f4cd",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// App Check (reCAPTCHA v3) — proves quote-form writes come from the real site.
// No-op until the site key is set. Must init before any database use, and only
// in the browser (this can be imported during the static build).
const APPCHECK_SITE_KEY = "6LcA3pAtAAAAAPRUdCDmN70r1DvDwdDhwJkOVVdO";
if (
  typeof window !== "undefined" &&
  APPCHECK_SITE_KEY &&
  !APPCHECK_SITE_KEY.startsWith("REPLACE")
) {
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(APPCHECK_SITE_KEY),
      isTokenAutoRefreshEnabled: true,
    });
  } catch {
    /* never break the public form */
  }
}

export const rtdb = getDatabase(app);
