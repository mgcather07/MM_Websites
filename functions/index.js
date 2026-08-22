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
      const { quoteId, mode } = req.body || {};
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
      const total = totalOf(q);
      const amountPaid = Number(q.amountPaid || 0);

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
        res.status(400).json({ error: "Nothing left to pay on this quote." });
        return;
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
                name: `M&M Websites — ${q.quoteNumber || "Quote"} · ${label}`,
                description: q.subtitle || undefined,
              },
            },
          },
        ],
        metadata: {
          quoteId,
          kind: mode === "deposit" ? "deposit" : "balance",
        },
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
      const kind = (s.metadata && s.metadata.kind) || "payment";
      const amount = (s.amount_total || 0) / 100;
      if (quoteId && amount > 0) {
        try {
          const ref = db.ref("quotes/" + quoteId);
          const snap = await ref.get();
          if (snap.exists()) {
            const q = snap.val();
            const total = totalOf(q);
            const amountPaid = Number(q.amountPaid || 0) + amount;
            const paidInFull = amountPaid >= total;
            await ref.update({
              amountPaid,
              status: paidInFull ? "paid" : "accepted",
              lastPaidAt: Date.now(),
            });
            await db.ref("payments").push({
              quoteId,
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
            const name =
              (q.preparedFor && q.preparedFor.name) ||
              (s.customer_details && s.customer_details.name) ||
              "";
            const info = {
              name,
              amount,
              paidInFull,
              remaining: Math.max(0, total - amountPaid),
              quoteNumber: q.quoteNumber || "",
              quoteId,
            };
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
