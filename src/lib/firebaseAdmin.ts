import "server-only";
import { getApps, initializeApp, cert, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

/**
 * Firebase Admin, initialized once per server process.
 *
 * On Firebase App Hosting the runtime provides Application Default Credentials
 * automatically — no key needed. For local dev, set GOOGLE_APPLICATION_CREDENTIALS
 * to a service-account JSON path, or paste the JSON into FIREBASE_SERVICE_ACCOUNT.
 * If no credentials are available, `db` is null and callers skip the Firestore write.
 */
function initAdmin() {
  if (getApps().length) return true;

  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.GCLOUD_PROJECT ||
    "mm-websites";

  try {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (raw) {
      const sa = JSON.parse(raw);
      initializeApp({ credential: cert(sa), projectId: sa.project_id ?? projectId });
      return true;
    }
    // Application Default Credentials (App Hosting, or GOOGLE_APPLICATION_CREDENTIALS locally)
    initializeApp({ credential: applicationDefault(), projectId });
    return true;
  } catch (err) {
    console.error("[firebaseAdmin] init failed:", err);
    return false;
  }
}

export function getDb() {
  if (!initAdmin()) return null;
  try {
    return getFirestore();
  } catch (err) {
    console.error("[firebaseAdmin] getFirestore failed:", err);
    return null;
  }
}
