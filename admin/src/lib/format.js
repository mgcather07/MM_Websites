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
