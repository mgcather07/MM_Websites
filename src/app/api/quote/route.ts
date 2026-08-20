import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "@/lib/firebaseAdmin";
import { sendLeadEmail } from "@/lib/email";
import { validateLead, type LeadInput } from "@/lib/lead";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX = 5000;
const clip = (v: unknown, n = 500) =>
  typeof v === "string" ? v.trim().slice(0, n) : "";

export async function POST(req: Request) {
  let body: Partial<LeadInput>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  // Honeypot: real users leave it empty. Pretend success for bots.
  if (clip(body.website)) {
    return NextResponse.json({ ok: true });
  }

  const lead: LeadInput = {
    name: clip(body.name, 120),
    business: clip(body.business, 160),
    phone: clip(body.phone, 40),
    email: clip(body.email, 200),
    need: clip(body.need, 60),
    details: clip(body.details, MAX),
  };

  const errors = validateLead(lead);
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ ok: false, error: "invalid", errors }, { status: 422 });
  }

  // Persist to Firestore (best-effort) and email the studio (best-effort).
  // As long as one channel succeeds we report success to the visitor.
  let stored = false;
  let emailed = false;

  const db = getDb();
  if (db) {
    try {
      await db.collection("leads").add({
        ...lead,
        createdAt: FieldValue.serverTimestamp(),
        source: "homepage-quote-form",
        userAgent: req.headers.get("user-agent") ?? null,
      });
      stored = true;
    } catch (err) {
      console.error("[quote] Firestore write failed:", err);
    }
  }

  emailed = await sendLeadEmail(lead);

  if (!stored && !emailed) {
    return NextResponse.json({ ok: false, error: "delivery_failed" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
