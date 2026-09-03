// Currency: $500, $1,250, $1,499.50
export function money(n) {
  const v = Number(n || 0);
  return v.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: v % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

// Short date: Aug 20, 2026
export function dateShort(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Turn a Firebase object-of-objects into an array with the key as `id`.
export function toList(obj) {
  if (!obj) return [];
  return Object.entries(obj).map(([id, v]) => ({ id, ...v }));
}

// A quote's total, handling both flat and phased quotes plus a % discount.
// Phased quotes keep their line items inside `phases`, with a top-level
// `items: []`, so summing `items` alone would read $0.
export function quoteTotal(q) {
  if (!q) return 0;
  const pct = Number(q.discountPercent || 0);
  const disc = (n) => (pct > 0 ? Math.round((n * (100 - pct)) / 100) : n);
  const sumItems = (items) =>
    (Array.isArray(items) ? items.filter(Boolean) : Object.values(items || {})).reduce(
      (a, it) => a + Number((it && it.price) || 0),
      0,
    );
  const phases = (
    Array.isArray(q.phases) ? q.phases.filter(Boolean) : Object.values(q.phases || {})
  ).filter((p) => p && p.id);
  if (phases.length) return phases.reduce((s, ph) => s + disc(sumItems(ph.items)), 0);
  return disc(sumItems(q.items));
}

// Friendly messages for Firebase Auth error codes.
export function authError(code) {
  switch (code) {
    case "auth/invalid-email":
      return "That doesn't look like a valid email.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Email or password is incorrect.";
    case "auth/too-many-requests":
      return "Too many attempts. Wait a minute and try again.";
    case "auth/network-request-failed":
      return "Network problem — check your connection and try again.";
    default:
      return "Couldn't sign in. Please try again.";
  }
}
