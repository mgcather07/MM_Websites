import "server-only";
import { Resend } from "resend";
import type { LeadInput } from "./lead";

/**
 * Email the lead to the studio inbox via Resend.
 *
 * Degrades gracefully: if RESEND_API_KEY is not set, this logs and returns
 * false rather than throwing, so a submission is never lost just because email
 * isn't configured yet. Set these env vars / App Hosting secrets to enable:
 *   RESEND_API_KEY   — your Resend API key
 *   LEAD_TO_EMAIL    — where leads should land (defaults to hello@mmwebsites.com)
 *   LEAD_FROM_EMAIL  — a verified Resend sender (defaults to onboarding@resend.dev)
 */
export async function sendLeadEmail(lead: LeadInput): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY not set — skipping email notification.");
    return false;
  }

  const to = process.env.LEAD_TO_EMAIL || "hello@mmwebsites.com";
  const from = process.env.LEAD_FROM_EMAIL || "M&M Websites <onboarding@resend.dev>";

  const rows: [string, string][] = [
    ["Name", lead.name],
    ["Business", lead.business || "—"],
    ["Phone", lead.phone || "—"],
    ["Email", lead.email || "—"],
    ["Needs", lead.need],
    ["Details", lead.details || "—"],
  ];

  const text = rows.map(([k, v]) => `${k}: ${v}`).join("\n");
  const html = `
    <h2 style="font-family:sans-serif;color:#7a1b2e;margin:0 0 12px">New quote request</h2>
    <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse">
      ${rows
        .map(
          ([k, v]) =>
            `<tr><td style="padding:6px 14px 6px 0;font-weight:700;vertical-align:top">${k}</td><td style="padding:6px 0">${escapeHtml(
              v,
            )}</td></tr>`,
        )
        .join("")}
    </table>`;

  try {
    const resend = new Resend(apiKey);
    const replyTo = lead.email || undefined;
    const { error } = await resend.emails.send({
      from,
      to,
      replyTo,
      subject: `New quote request — ${lead.name}${lead.business ? ` (${lead.business})` : ""}`,
      text,
      html,
    });
    if (error) {
      console.error("[email] Resend error:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[email] send failed:", err);
    return false;
  }
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
