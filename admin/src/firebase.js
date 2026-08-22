import { initializeApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFunctions } from "firebase/functions";

// Public web config for project mm-websites. These values are NOT secrets (they
// identify the project to clients); real protection comes from Firebase Auth +
// Realtime Database security rules (+ App Check once its key is set below).
export const firebaseConfig = {
  apiKey: "AIzaSyBQKlz3UZH3yLtZmwi2an3X1oGdNGeUMkM",
  authDomain: "mm-websites.firebaseapp.com",
  databaseURL: "https://mm-websites-default-rtdb.firebaseio.com",
  projectId: "mm-websites",
  storageBucket: "mm-websites.firebasestorage.app",
  messagingSenderId: "667616152120",
  appId: "1:667616152120:web:e54b2a6f39d1da4610f4cd",
  measurementId: "G-K6865R9GF3",
};

export const app = initializeApp(firebaseConfig);

// App Check (reCAPTCHA v3) — attaches an attestation token so only the real
// admin app can hit Firebase once enforcement is on. No-op until a real site
// key is pasted here (we'll set it up near the end, like BAA).
const APPCHECK_SITE_KEY = "6LcA3pAtAAAAAPRUdCDmN70r1DvDwdDhwJkOVVdO";
if (APPCHECK_SITE_KEY && !APPCHECK_SITE_KEY.startsWith("REPLACE")) {
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(APPCHECK_SITE_KEY),
      isTokenAutoRefreshEnabled: true,
    });
  } catch {
    /* never break the admin */
  }
}

export const auth = getAuth(app);
export const db = getDatabase(app);
// Cloud Functions (us-central1) — used for the "Email quote to client" action.
export const functions = getFunctions(app);
