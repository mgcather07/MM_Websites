/**
 * First-party, privacy-friendly page analytics.
 *
 * Records a lightweight pageview event to RTDB (/analytics/events). A Cloud
 * Function (onAnalyticsEvent) rolls each event into daily/summary aggregates
 * and deletes the raw event, so nothing grows unbounded and the admin reads
 * only small aggregates. No cookies, no PII — a random session id lives in
 * sessionStorage so a visit isn't counted twice.
 */
import { ref, push, set } from "firebase/database";
import { rtdb } from "./firebaseClient";

/** Group the referrer into a small, safe set of traffic sources. */
function sourceOf(referrer: string): string {
  if (!referrer) return "direct";
  try {
    const h = new URL(referrer).hostname.replace(/^www\./, "");
    if (h.endsWith("mmwebsites.com")) return "internal";
    if (/google\./.test(h)) return "google";
    if (/bing\./.test(h)) return "bing";
    if (/duckduckgo\./.test(h)) return "duckduckgo";
    if (/yahoo\./.test(h)) return "yahoo";
    if (/(facebook\.|fb\.)/.test(h)) return "facebook";
    if (/instagram\./.test(h)) return "instagram";
    if (/(twitter\.|t\.co|x\.com)/.test(h)) return "twitter";
    if (/linkedin\./.test(h)) return "linkedin";
    return "referral";
  } catch {
    return "direct";
  }
}

/** Turn a path into a safe RTDB key: "/" -> "home", "/quote" -> "quote". */
function pageKey(path: string): string {
  const p = path
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/[^a-z0-9-]/gi, "-")
    .toLowerCase();
  return p || "home";
}

export function trackPageview(): void {
  if (typeof window === "undefined") return;
  try {
    let sid = sessionStorage.getItem("mm_sid");
    let newSession = false;
    if (!sid) {
      sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem("mm_sid", sid);
      newSession = true;
    }
    const evRef = push(ref(rtdb, "analytics/events"));
    void set(evRef, {
      page: pageKey(window.location.pathname),
      ref: sourceOf(document.referrer),
      ts: Date.now(),
      w: window.innerWidth || 0,
      sid,
      newSession,
    });
  } catch {
    /* analytics must never break the page */
  }
}
