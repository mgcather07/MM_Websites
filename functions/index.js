const { onRequest, onCall, HttpsError } = require("firebase-functions/v2/https");
const { onValueCreated } = require("firebase-functions/v2/database");
const { defineSecret } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const Stripe = require("stripe");
const mail = require("./email");

admin.initializeApp();
const db = admin.database();

const STRIPE_SECRET_KEY = defineSecret("STRIPE_SECRET_KEY");
const STRIPE_WEBHOOK_SECRET = defineSecret("STRIPE_WEBHOOK_SECRET");
const RESEND_API_KEY = defineSecret("RESEND_API_KEY");

const RTDB_INSTANCE = "mm-websites-default-rtdb";

const SITE = "https://mmwebsites.com";
const REGION = "us-central1";

function itemsOf(q) {
  const items = q.items || [];
  return Array.isArray(items) ? items.filter(Boolean) : Object.values(items);
}
function totalOf(q) {
  return itemsOf(q).reduce((s, it) => s + Number((it && it.price) || 0), 0);
}
/** The amount actually owed: item subtotal minus any percentage discount. */
function discountedTotalOf(q) {
  const subtotal = totalOf(q);
  const pct = Number((q && q.discountPercent) || 0);
  if (!(pct > 0)) return subtotal;
  return Math.round(subtotal * (1 - pct / 100));
}

// --- Phased quotes -------------------------------------------------------
// A quote may be split into independently-payable phases. Each phase carries
// its own line items and a stable `id`. Per-phase payment progress is stored
// separately under quotes/{id}/phasePay/{phaseId} so re-saving the quote
// definition never overwrites a client's payment state.
function phasesOf(q) {
  const ph = (q && q.phases) || [];
  const list = Array.isArray(ph) ? ph.filter(Boolean) : Object.values(ph);
  return list.filter((p) => p && p.id);
}
function isPhased(q) {
  return phasesOf(q).length > 0;
}
function phaseSubtotal(ph) {
  const items = (ph && ph.items) || [];
  const list = Array.isArray(items) ? items.filter(Boolean) : Object.values(items);
  return list.reduce((s, it) => s + Number((it && it.price) || 0), 0);
}
/** A single phase's owed amount: its subtotal minus the quote's percentage discount. */
function discountedPhaseTotal(q, ph) {
  const subtotal = phaseSubtotal(ph);
  const pct = Number((q && q.discountPercent) || 0);
  if (!(pct > 0)) return subtotal;
  return Math.round(subtotal * (1 - pct / 100));
}
function phaseAmountPaid(q, phaseId) {
  return Number(
    (q && q.phasePay && q.phasePay[phaseId] && q.phasePay[phaseId].amountPaid) || 0,
  );
}

/**
 * Create a Stripe Checkout Session for a quote. The browser sends only the
 * quoteId + mode; the server reads the real amount from the database, so the
 * price can't be tampered with.
 *   POST { quoteId, mode: "deposit" | "full" } -> { url }
 */
exports.createQuoteCheckout = onRequest(
  { secrets: [STRIPE_SECRET_KEY], region: REGION, cors: true },
  async (req, res) => {
    try {
      if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed" });
        return;
      }
      const { quoteId, mode, phaseId } = req.body || {};
      if (!quoteId) {
        res.status(400).json({ error: "Missing quoteId" });
        return;
      }

      const snap = await db.ref("quotes/" + quoteId).get();
      if (!snap.exists()) {
        res.status(404).json({ error: "Quote not found" });
        return;
      }
      const q = snap.val();

      // Resolve the amount owed. For a phased quote the client pays one phase
      // at a time; otherwise it's the whole quote (original behavior).
      let total;
      let amountPaid;
      let productName;
      let metadata;
      let phaseLabel = "Phase";

      if (phaseId) {
        const phase = phasesOf(q).find((p) => p.id === phaseId);
        if (!phase) {
          res.status(404).json({ error: "Phase not found" });
          return;
        }
        total = discountedPhaseTotal(q, phase);
        amountPaid = phaseAmountPaid(q, phaseId);
        phaseLabel = phase.name || "Phase";
      } else {
        total = discountedTotalOf(q);
        amountPaid = Number(q.amountPaid || 0);
      }

      let amount;
      let label;
      if (mode === "deposit") {
        amount = Math.round(total * 0.4);
        label = "40% Deposit";
      } else {
        amount = Math.round(total - amountPaid);
        label = amountPaid > 0 ? "Remaining Balance" : "Full Payment";
      }
      if (!(amount > 0)) {
        res.status(400).json({
          error: phaseId
            ? "Nothing left to pay on this phase."
            : "Nothing left to pay on this quote.",
        });
        return;
      }

      if (phaseId) {
        productName = `M&M Websites — ${q.quoteNumber || "Quote"} · ${phaseLabel} · ${label}`;
        metadata = { quoteId, phaseId, kind: mode === "deposit" ? "deposit" : "balance" };
      } else {
        productName = `M&M Websites — ${q.quoteNumber || "Quote"} · ${label}`;
        metadata = { quoteId, kind: mode === "deposit" ? "deposit" : "balance" };
      }

      const stripe = Stripe(STRIPE_SECRET_KEY.value());
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "usd",
              unit_amount: amount * 100,
              product_data: {
                name: productName,
                description: q.subtitle || undefined,
              },
            },
          },
        ],
        metadata,
        success_url: `${SITE}/quote?id=${quoteId}&paid=1`,
        cancel_url: `${SITE}/quote?id=${quoteId}`,
      });

      res.json({ url: session.url });
    } catch (e) {
      logger.error("createQuoteCheckout failed", e);
      res.status(500).json({ error: "Could not start checkout. Please try again." });
    }
  },
);

/**
 * Stripe webhook. On a successful payment, marks the quote paid/accepted and
 * records the payment so the dashboard revenue updates automatically.
 */
exports.stripeWebhook = onRequest(
  { secrets: [STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, RESEND_API_KEY], region: REGION },
  async (req, res) => {
    const stripe = Stripe(STRIPE_SECRET_KEY.value());
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        req.headers["stripe-signature"],
        STRIPE_WEBHOOK_SECRET.value(),
      );
    } catch (e) {
      logger.error("Webhook signature verification failed", e.message);
      res.status(400).send(`Webhook Error: ${e.message}`);
      return;
    }

    if (event.type === "checkout.session.completed") {
      const s = event.data.object;
      const quoteId = s.metadata && s.metadata.quoteId;
      const phaseId = s.metadata && s.metadata.phaseId;
      const kind = (s.metadata && s.metadata.kind) || "payment";
      const amount = (s.amount_total || 0) / 100;
      if (quoteId && amount > 0) {
        try {
          const ref = db.ref("quotes/" + quoteId);
          const snap = await ref.get();
          if (snap.exists()) {
            const q = snap.val();

            // `info` describes the payment for the receipt emails; `updates`
            // is applied to the quote. The two payment models — a phased
            // quote (pay one phase) and a flat quote (pay the whole thing) —
            // fill these in differently.
            let info;
            const updates = { lastPaidAt: Date.now() };

            if (phaseId) {
              const phase = phasesOf(q).find((p) => p.id === phaseId);
              if (!phase) {
                logger.warn("Webhook: phase not found on quote", { quoteId, phaseId });
              }
              const phaseTotal = discountedPhaseTotal(q, phase || {});
              const phasePaid = phaseAmountPaid(q, phaseId) + amount;
              const phasePaidInFull = phasePaid >= phaseTotal;

              // Roll the quote's overall status/total up across all phases,
              // treating this phase's new paid amount as already applied.
              const phases = phasesOf(q);
              const grandPaid = phases.reduce((sum, p) => {
                const paid =
                  p.id === phaseId ? phasePaid : phaseAmountPaid(q, p.id);
                return sum + paid;
              }, 0);
              const allPaid = phases.every((p) => {
                const t = discountedPhaseTotal(q, p);
                const paid =
                  p.id === phaseId ? phasePaid : phaseAmountPaid(q, p.id);
                return paid >= t;
              });

              updates[`phasePay/${phaseId}/amountPaid`] = phasePaid;
              updates[`phasePay/${phaseId}/status`] = phasePaidInFull
                ? "paid"
                : "accepted";
              updates[`phasePay/${phaseId}/lastPaidAt`] = Date.now();
              updates.amountPaid = grandPaid;
              updates.status = allPaid ? "paid" : "accepted";

              info = {
                name:
                  (q.preparedFor && q.preparedFor.name) ||
                  (s.customer_details && s.customer_details.name) ||
                  "",
                amount,
                paidInFull: phasePaidInFull,
                remaining: Math.max(0, phaseTotal - phasePaid),
                quoteNumber: q.quoteNumber || "",
                quoteId,
                phaseName: (phase && phase.name) || "",
              };
            } else {
              const total = discountedTotalOf(q);
              const amountPaid = Number(q.amountPaid || 0) + amount;
              const paidInFull = amountPaid >= total;
              updates.amountPaid = amountPaid;
              updates.status = paidInFull ? "paid" : "accepted";
              info = {
                name:
                  (q.preparedFor && q.preparedFor.name) ||
                  (s.customer_details && s.customer_details.name) ||
                  "",
                amount,
                paidInFull,
                remaining: Math.max(0, total - amountPaid),
                quoteNumber: q.quoteNumber || "",
                quoteId,
              };
            }

            await ref.update(updates);
            await db.ref("payments").push({
              quoteId,
              ...(phaseId ? { phaseId } : {}),
              clientId: q.clientId || "",
              amount,
              status: "paid",
              method: "stripe",
              kind,
              invoicedAt: Date.now(),
              paidAt: Date.now(),
            });

            // Receipt to the client + alert to the studio (best-effort).
            const clientEmail =
              (s.customer_details && s.customer_details.email) ||
              s.customer_email ||
              q.clientEmail ||
              (q.preparedFor && q.preparedFor.email) ||
              "";
            const key = RESEND_API_KEY.value();
            const c = mail.paymentClientEmail(info);
            const a = mail.paymentAdminEmail(info);
            await Promise.all([
              mail.send(key, { to: clientEmail, ...c }),
              mail.send(key, { to: mail.STUDIO_INBOX, ...a }),
            ]);
          }
        } catch (e) {
          logger.error("Webhook DB update / email failed", e);
        }
      }
    }

    res.json({ received: true });
  },
);

/**
 * When a new quote-request (lead) is written to the database from the public
 * form, send a confirmation to the customer and an alert to the studio.
 */
exports.onLeadCreated = onValueCreated(
  {
    ref: "/leads/{leadId}",
    instance: RTDB_INSTANCE,
    region: REGION,
    secrets: [RESEND_API_KEY],
  },
  async (event) => {
    const lead = event.data.val() || {};
    if (lead.source && lead.source !== "website-quote-form") return;

    const key = RESEND_API_KEY.value();
    const c = mail.leadClientEmail(lead);
    const a = mail.leadAdminEmail(lead);
    await Promise.all([
      mail.send(key, { to: lead.email, ...c }),
      mail.send(key, { to: mail.STUDIO_INBOX, ...a }),
    ]);
  },
);

/**
 * Email a saved quote's link to the client. Called from the admin "Email to
 * client" button (authenticated admin only). Reads the client's email from the
 * quote (or the linked client record), sends the branded quote email, and marks
 * the quote as sent.
 */
exports.sendQuoteEmail = onCall(
  { secrets: [RESEND_API_KEY], region: REGION },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Please sign in.");
    }
    const adminSnap = await db.ref("admins/" + request.auth.uid).get();
    if (!adminSnap.exists()) {
      throw new HttpsError("permission-denied", "Admins only.");
    }
    const quoteId = request.data && request.data.quoteId;
    if (!quoteId) {
      throw new HttpsError("invalid-argument", "Missing quoteId.");
    }
    const snap = await db.ref("quotes/" + quoteId).get();
    if (!snap.exists()) {
      throw new HttpsError("not-found", "Quote not found.");
    }
    const q = snap.val();

    let email = (q.preparedFor && q.preparedFor.email) || "";
    if (!email && q.clientId) {
      const c = await db.ref("clients/" + q.clientId).get();
      if (c.exists()) email = (c.val() && c.val().email) || "";
    }
    if (!email) {
      throw new HttpsError(
        "failed-precondition",
        "No client email on this quote. Add the client's email, save, then send.",
      );
    }

    const link = `${SITE}/quote?id=${quoteId}`;
    const msg = mail.quoteEmail(q, link);
    const ok = await mail.send(RESEND_API_KEY.value(), { to: email, ...msg });
    if (!ok) {
      throw new HttpsError("internal", "Email failed to send. Please try again.");
    }

    await db.ref("quotes/" + quoteId).update({
      emailedAt: Date.now(),
      ...(q.status === "draft" ? { status: "sent" } : {}),
    });
    return { ok: true, to: email };
  },
);

/**
 * Email an NDA's signing link to the client (admin "Email to client" button).
 */
exports.sendNdaEmail = onCall(
  { secrets: [RESEND_API_KEY], region: REGION },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Please sign in.");
    }
    const adminSnap = await db.ref("admins/" + request.auth.uid).get();
    if (!adminSnap.exists()) {
      throw new HttpsError("permission-denied", "Admins only.");
    }
    const ndaId = request.data && request.data.ndaId;
    if (!ndaId) {
      throw new HttpsError("invalid-argument", "Missing ndaId.");
    }
    const snap = await db.ref("ndas/" + ndaId).get();
    if (!snap.exists()) {
      throw new HttpsError("not-found", "NDA not found.");
    }
    const nda = snap.val();
    const email = (nda.preparedFor && nda.preparedFor.email) || "";
    if (!email) {
      throw new HttpsError(
        "failed-precondition",
        "No client email on this NDA. Add the client's email, save, then send.",
      );
    }

    const link = `${SITE}/nda?id=${ndaId}`;
    const msg = mail.ndaInviteEmail(nda, link);
    const ok = await mail.send(RESEND_API_KEY.value(), { to: email, ...msg });
    if (!ok) {
      throw new HttpsError("internal", "Email failed to send. Please try again.");
    }

    await db.ref("ndas/" + ndaId).update({
      emailedAt: Date.now(),
      ...(nda.status === "draft" ? { status: "sent" } : {}),
    });
    return { ok: true, to: email };
  },
);

/**
 * When a client e-signs an NDA, mark it signed and notify both sides.
 */
exports.onNdaSigned = onValueCreated(
  {
    ref: "/ndas/{ndaId}/signature",
    instance: RTDB_INSTANCE,
    region: REGION,
    secrets: [RESEND_API_KEY],
  },
  async (event) => {
    const ndaId = event.params.ndaId;
    const sig = event.data.val() || {};
    const ref = db.ref("ndas/" + ndaId);
    const snap = await ref.get();
    if (!snap.exists()) return;
    const nda = snap.val();

    // The signer's email is bound authoritatively to the address the NDA was
    // issued to — set here (admin) so a signer can't submit or change it.
    const boundEmail = (nda.preparedFor && nda.preparedFor.email) || "";
    await ref.update({
      status: "signed",
      signedAt: Date.now(),
      ...(boundEmail ? { "signature/email": boundEmail } : {}),
    });

    const link = `${SITE}/nda?id=${ndaId}`;
    const info = {
      ndaNumber: nda.ndaNumber,
      name: sig.name,
      email: boundEmail,
      org: nda.preparedFor && nda.preparedFor.org,
      link,
    };
    const key = RESEND_API_KEY.value();
    const clientEmail = (nda.preparedFor && nda.preparedFor.email) || "";
    await Promise.all([
      mail.send(key, { to: mail.STUDIO_INBOX, ...mail.ndaSignedAdminEmail(info) }),
      clientEmail
        ? mail.send(key, { to: clientEmail, ...mail.ndaSignedClientEmail(info) })
        : Promise.resolve(),
    ]);
  },
);

/**
 * Roll each raw pageview event into daily + summary aggregates, then delete the
 * raw event so /analytics/events never grows unbounded. The admin reads only
 * the small aggregates.
 */
exports.onAnalyticsEvent = onValueCreated(
  { ref: "/analytics/events/{id}", instance: RTDB_INSTANCE, region: REGION },
  async (event) => {
    const ev = event.data.val() || {};
    const ts = Number(ev.ts) || Date.now();
    const date = new Date(ts).toISOString().slice(0, 10);
    const w = Number(ev.w) || 0;
    const device = w > 0 && w < 768 ? "mobile" : "desktop";
    const safe = (s, max) =>
      String(s || "")
        .replace(/[.#$/[\]]/g, "-")
        .slice(0, max) || "unknown";
    const page = safe(ev.page || "home", 60);
    const src = safe(ev.ref || "direct", 30);
    const inc = admin.database.ServerValue.increment(1);

    const updates = {};
    updates[`analytics/daily/${date}/pageviews`] = inc;
    updates[`analytics/daily/${date}/pages/${page}`] = inc;
    updates[`analytics/daily/${date}/refs/${src}`] = inc;
    updates[`analytics/daily/${date}/devices/${device}`] = inc;
    updates[`analytics/summary/pageviews`] = inc;
    if (ev.newSession) {
      updates[`analytics/daily/${date}/visits`] = inc;
      updates[`analytics/summary/visits`] = inc;
    }
    updates[`analytics/summary/updatedAt`] = ts;
    // Drop the processed raw event.
    updates[`analytics/events/${event.params.id}`] = null;

    await db.ref().update(updates);
  },
);
