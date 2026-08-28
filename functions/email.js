/**
 * Transactional email for M&M Websites, sent via Resend.
 *
 * Two events trigger mail (see index.js):
 *   1. A new quote request (lead) comes in  -> confirm to the client + alert us.
 *   2. A Stripe payment succeeds             -> receipt to the client + alert us.
 *
 * The Resend API key lives in Secret Manager (RESEND_API_KEY); nothing secret
 * is ever committed. Sending failures are logged but never throw — a hiccup in
 * email must not break a lead save or a payment.
 */
const { Resend } = require("resend");
const logger = require("firebase-functions/logger");

// Branded sender (mmwebsites.com must be verified in Resend). Replies to the
// studio's real inbox so a customer can just hit "reply".
const FROM = "M&M Websites <quotes@mmwebsites.com>";
const REPLY_TO = "MMWebsites26@gmail.com";
const STUDIO_INBOX = "MMWebsites26@gmail.com";
const SITE = "https://mmwebsites.com";

const MAROON = "#7A1B2E";

const money = (n) =>
  "$" +
  Number(n || 0).toLocaleString("en-US", {
    maximumFractionDigits: Number(n || 0) % 1 ? 2 : 0,
  });

const esc = (s) =>
  String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

/** Wrap body content in the branded shell (maroon header + footer). */
function shell(title, innerHtml) {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#eceae7;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(
      title,
    )}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eceae7;padding:24px 12px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,.08);font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1d1f21;">
          <tr><td style="background:${MAROON};padding:22px 32px;">
            <div style="color:#fff;font-size:20px;font-weight:800;letter-spacing:.3px;">M&amp;M Websites</div>
            <div style="color:rgba(255,255,255,.82);font-size:12px;margin-top:2px;">Professional Websites. Built for Business.</div>
          </td></tr>
          <tr><td style="padding:30px 32px;">${innerHtml}</td></tr>
          <tr><td style="padding:20px 32px;border-top:1px solid #ece9e6;color:#8a8f94;font-size:12.5px;line-height:1.6;">
            M&amp;M Websites · Gardendale, Alabama<br/>
            (205) 914-1019 · <a href="mailto:${STUDIO_INBOX}" style="color:${MAROON};">${STUDIO_INBOX}</a> · <a href="${SITE}" style="color:${MAROON};">mmwebsites.com</a>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

const btn = (href, label) =>
  `<a href="${href}" style="display:inline-block;background:${MAROON};color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:13px 24px;border-radius:9px;">${esc(
    label,
  )}</a>`;

const p = (html) =>
  `<p style="margin:0 0 14px;font-size:15.5px;line-height:1.6;color:#3a3e42;">${html}</p>`;

const h = (txt) =>
  `<h1 style="margin:0 0 16px;font-size:23px;line-height:1.25;color:#1d1f21;">${esc(
    txt,
  )}</h1>`;

/** A small label:value list for the studio alert emails. */
function rows(pairs) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:4px 0 18px;">${pairs
    .filter(([, v]) => v != null && String(v).trim() !== "")
    .map(
      ([k, v]) =>
        `<tr>
          <td style="padding:7px 0;border-bottom:1px solid #efedea;font-size:13px;color:#8a8f94;white-space:nowrap;vertical-align:top;">${esc(
            k,
          )}</td>
          <td style="padding:7px 0 7px 16px;border-bottom:1px solid #efedea;font-size:14.5px;color:#1d1f21;">${esc(
            v,
          )}</td>
        </tr>`,
    )
    .join("")}</table>`;
}

function itemsOf(q) {
  const items = (q && q.items) || [];
  return Array.isArray(items) ? items.filter(Boolean) : Object.values(items);
}
function totalOf(q) {
  return itemsOf(q).reduce((s, it) => s + Number((it && it.price) || 0), 0);
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

function quoteEmail(quote, link) {
  const pf = quote.preparedFor || {};
  const first = String(pf.name || "").trim().split(/\s+/)[0] || "there";
  const total = totalOf(quote);
  const lineRows = itemsOf(quote).map((it) => [it.title || "Item", money(it.price)]);
  const inner =
    h(`Your project quote is ready, ${first}`) +
    p(
      `Thanks for talking with us${
        pf.org ? ` about ${esc(pf.org)}` : ""
      } — we've put together a quote${
        quote.subtitle ? ` for <strong>${esc(quote.subtitle)}</strong>` : ""
      }.`,
    ) +
    rows([["Quote", quote.quoteNumber], ...lineRows, ["Project total", money(total)]]) +
    p(btn(link, "View & accept your quote")) +
    p(
      "You can review the full details and accept online — a 40% deposit gets us started, or you're welcome to pay in full.",
    ) +
    p(
      "Questions? Just reply to this email or call (205) 914-1019.<br/>Michael &amp; Mandy · M&amp;M Websites",
    );
  return {
    subject: `Your project quote — ${quote.quoteNumber || "M&M Websites"}`,
    html: shell("Your project quote", inner),
  };
}

function leadClientEmail(lead) {
  const first = String(lead.name || "").trim().split(/\s+/)[0] || "there";
  const inner =
    h(`Thanks, ${first} — we've got your request.`) +
    p(
      "We build professional small-business websites, and we read every request personally. We'll be in touch soon — usually within one business day — and we may follow up with a few questions before we put your quote together.",
    ) +
    p("Here's what you sent us:") +
    rows([
      ["What you need", lead.need],
      [
        "Features",
        Array.isArray(lead.features) ? lead.features.join(", ") : lead.features,
      ],
      ["Timeline", lead.timeline],
      ["Current website", lead.currentUrl],
      ["Details", lead.details],
    ]) +
    p("Talk soon,<br/>Michael &amp; Mandy · M&amp;M Websites");
  return {
    subject: "We got your request — M&M Websites",
    html: shell("We got your request", inner),
  };
}

function leadAdminEmail(lead) {
  const features = Array.isArray(lead.features)
    ? lead.features.join(", ")
    : lead.features;
  const inner =
    h("New quote request") +
    rows([
      ["Name", lead.name],
      ["Business", lead.business],
      ["Phone", lead.phone],
      ["Email", lead.email],
      ["Needs", lead.need],
      ["Wants", features],
      ["Timeline", lead.timeline],
      ["Budget", lead.budget],
      ["Logo/photos", lead.assets],
      ["Current site", lead.currentUrl],
      ["Details", lead.details],
    ]) +
    p(btn(`${SITE}/admin`, "Open the dashboard"));
  return {
    subject: `New quote request — ${lead.name || "Website lead"}${
      lead.business ? ` (${lead.business})` : ""
    }`,
    html: shell("New quote request", inner),
    replyTo: lead.email || undefined,
  };
}

function paymentClientEmail({ name, amount, paidInFull, remaining, quoteNumber }) {
  const first = String(name || "").trim().split(/\s+/)[0] || "there";
  const inner =
    h(`Payment received — thank you, ${first}!`) +
    p(
      paidInFull
        ? `We've received your payment of <strong>${money(
            amount,
          )}</strong>, and your project is now paid in full. 🎉`
        : `We've received your deposit of <strong>${money(
            amount,
          )}</strong> — thank you! That's our green light to get started.`,
    ) +
    rows([
      ["Quote", quoteNumber],
      ["Amount paid", money(amount)],
      [
        paidInFull ? "Status" : "Balance remaining",
        paidInFull ? "Paid in full" : money(remaining),
      ],
    ]) +
    p(
      paidInFull
        ? "We'll be in touch shortly with next steps. Thanks for trusting us with your website."
        : "We'll be in touch shortly to kick things off. You can pay the remaining balance any time from your quote link.",
    ) +
    p("Michael &amp; Mandy · M&amp;M Websites");
  return {
    subject: paidInFull
      ? "Payment received — paid in full · M&M Websites"
      : "Deposit received — thank you! · M&M Websites",
    html: shell("Payment received", inner),
  };
}

function paymentAdminEmail({ name, amount, paidInFull, remaining, quoteNumber, quoteId }) {
  const inner =
    h(paidInFull ? "Paid in full 🎉" : "Deposit received 💰") +
    rows([
      ["Client", name],
      ["Quote", quoteNumber],
      ["Amount", money(amount)],
      ["Status", paidInFull ? "Paid in full" : `${money(remaining)} remaining`],
    ]) +
    p(btn(`${SITE}/quote?id=${quoteId}`, "View the quote"));
  return {
    subject: `${paidInFull ? "Paid in full" : "Payment received"} — ${
      name || "client"
    } · ${money(amount)}`,
    html: shell("Payment received", inner),
  };
}

// ---------------------------------------------------------------------------
// Send
// ---------------------------------------------------------------------------

/**
 * Send one email. Never throws — logs and resolves false on failure so callers
 * (a lead save, a payment webhook) are never broken by an email problem.
 */
async function send(apiKey, { to, subject, html, replyTo }) {
  if (!to) return false;
  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: FROM,
      to,
      subject,
      html,
      replyTo: replyTo || REPLY_TO,
    });
    if (error) {
      logger.error("Resend send failed", error);
      return false;
    }
    return true;
  } catch (e) {
    logger.error("Resend threw", e);
    return false;
  }
}

module.exports = {
  send,
  STUDIO_INBOX,
  quoteEmail,
  leadClientEmail,
  leadAdminEmail,
  paymentClientEmail,
  paymentAdminEmail,
};
