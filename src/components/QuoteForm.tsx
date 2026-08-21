"use client";

import { useId, useRef, useState } from "react";
import { ref, push, set as rtdbSet } from "firebase/database";
import { rtdb } from "@/lib/firebaseClient";
import { site } from "@/content/site";
import { needOptions, validateLead, type FieldErrors, type LeadInput } from "@/lib/lead";
import styles from "./QuoteForm.module.css";

type Status = "idle" | "invalid" | "sending" | "success" | "error";

const empty: LeadInput = {
  name: "",
  business: "",
  phone: "",
  email: "",
  need: "",
  currentUrl: "",
  details: "",
  website: "",
};

export default function QuoteForm() {
  const [form, setForm] = useState<LeadInput>(empty);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<Status>("idle");
  const nameRef = useRef<HTMLInputElement>(null);
  const uid = useId();

  const set =
    (field: keyof LeadInput) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      const value = e.target.value;
      setForm((f) => ({ ...f, [field]: value }));
      // Clear the relevant error as the user edits.
      setErrors((prev) => {
        const next = { ...prev };
        if (field === "name") delete next.name;
        if (field === "phone" || field === "email") delete next.contact;
        if (field === "email") delete next.email;
        if (field === "need") delete next.need;
        return next;
      });
    };

  const validateNow = () => {
    const next = validateLead(form);
    setErrors(next);
    return next;
  };

  const onBlur = () => {
    // Re-validate on blur only once the user has attempted submit, to avoid
    // nagging before they've had a chance to fill things in.
    if (status !== "idle") validateNow();
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const found = validateNow();
    if (Object.keys(found).length > 0) {
      setStatus("invalid");
      return;
    }

    // Honeypot: bots fill this. Pretend success without recording anything.
    if (form.website?.trim()) {
      setStatus("success");
      return;
    }

    setStatus("sending");
    try {
      // Primary: write the lead into the admin dashboard (Realtime Database).
      const isRedesign = form.need === "Redesign of my current site";
      const currentUrl = form.currentUrl?.trim();
      const leadRef = push(ref(rtdb, "leads"));
      await rtdbSet(leadRef, {
        name: form.name.trim(),
        business: form.business.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        need: form.need,
        ...(isRedesign && currentUrl ? { currentUrl } : {}),
        details: form.details.trim(),
        status: "new",
        source: "website-quote-form",
        createdAt: Date.now(),
      });

      // Best-effort: also email the studio via Formsubmit so nothing is missed.
      // Don't fail the submission if the email hiccups — the lead is already saved.
      void fetch(`https://formsubmit.co/ajax/${site.email}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          Name: form.name,
          Business: form.business,
          Phone: form.phone,
          email: form.email, // lowercase: Formsubmit uses this as the reply-to
          "What they need": form.need,
          ...(isRedesign && currentUrl ? { "Current website": currentUrl } : {}),
          Details: form.details,
          _subject: `New quote request — ${form.name}${
            form.business ? ` (${form.business})` : ""
          }`,
          _template: "table",
          _captcha: "false",
        }),
      }).catch(() => {});

      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  const fieldId = (name: string) => `${uid}-${name}`;

  return (
    <section id="quote" className={`band ${styles.section}`} aria-labelledby="quote-title">
      <div className={`container ${styles.grid}`}>
        {/* Left — pitch + contact */}
        <div className={styles.info}>
          <h2 id="quote-title" className={`h2 ${styles.title}`}>
            Get a free quote
          </h2>
          <p className={styles.lede}>
            Tell us a little about your business and we&apos;ll come back with a
            flat price and a timeline. No pressure, no sales calls.
          </p>
          <div className={styles.contact}>
            <p>
              <b>Call or text</b> ·{" "}
              <a href={site.phoneHref}>{site.phone}</a>
            </p>
            <p>
              <b>Email</b> · <a href={`mailto:${site.email}`}>{site.email}</a>
            </p>
          </div>
        </div>

        {/* Right — form card, or success confirmation */}
        {status === "success" ? (
          <div className={styles.confirm} role="status" aria-live="polite">
            <p className={styles.confirmLead}>Thanks — we got it.</p>
            <p className={styles.confirmBody}>
              We&apos;ll text or email you a flat price, usually within one
              business day.
            </p>
            <p className={styles.confirmContact}>
              Call or text · <a href={site.phoneHref}>{site.phone}</a>
            </p>
          </div>
        ) : (
          <form className={styles.card} onSubmit={onSubmit} noValidate>
            {/* Honeypot — visually hidden, must stay empty */}
            <div className={styles.hp} aria-hidden="true">
              <label htmlFor={fieldId("website")}>
                Website (leave blank)
                <input
                  id={fieldId("website")}
                  name="website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={form.website}
                  onChange={set("website")}
                />
              </label>
            </div>

            <div className={styles.row}>
              <Field
                id={fieldId("name")}
                label="Name"
                error={errors.name}
              >
                <input
                  ref={nameRef}
                  id={fieldId("name")}
                  type="text"
                  placeholder="Jane Smith"
                  autoComplete="name"
                  value={form.name}
                  onChange={set("name")}
                  onBlur={onBlur}
                  aria-invalid={!!errors.name}
                />
              </Field>

              <Field id={fieldId("business")} label="Business">
                <input
                  id={fieldId("business")}
                  type="text"
                  placeholder="Smith Plumbing"
                  autoComplete="organization"
                  value={form.business}
                  onChange={set("business")}
                />
              </Field>

              <Field
                id={fieldId("phone")}
                label="Phone"
                error={errors.contact}
              >
                <input
                  id={fieldId("phone")}
                  type="tel"
                  placeholder="(205) 555-0000"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={set("phone")}
                  onBlur={onBlur}
                  aria-invalid={!!errors.contact}
                />
              </Field>

              <Field
                id={fieldId("email")}
                label="Email"
                error={errors.email}
              >
                <input
                  id={fieldId("email")}
                  type="email"
                  placeholder="jane@smithplumbing.com"
                  autoComplete="email"
                  value={form.email}
                  onChange={set("email")}
                  onBlur={onBlur}
                  aria-invalid={!!(errors.email || errors.contact)}
                />
              </Field>
            </div>

            <Field id={fieldId("need")} label="What can we help with?" error={errors.need}>
              <select
                id={fieldId("need")}
                value={form.need}
                onChange={set("need")}
                onBlur={onBlur}
                aria-invalid={!!errors.need}
                className={form.need ? "" : styles.placeholder}
              >
                <option value="" disabled>
                  Select one…
                </option>
                {needOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </Field>

            {form.need === "Redesign of my current site" && (
              <Field id={fieldId("currentUrl")} label="Your current website">
                <input
                  id={fieldId("currentUrl")}
                  type="text"
                  inputMode="url"
                  placeholder="yoursite.com"
                  value={form.currentUrl ?? ""}
                  onChange={set("currentUrl")}
                />
              </Field>
            )}

            <Field id={fieldId("details")} label="Tell us about it">
              <textarea
                id={fieldId("details")}
                rows={4}
                placeholder="What you do, who you serve, and anything you already have."
                value={form.details}
                onChange={set("details")}
              />
            </Field>

            {status === "error" && (
              <p className={styles.formError} role="alert">
                Something went wrong sending that. Call or text us at{" "}
                <a href={site.phoneHref}>{site.phone}</a> and we&apos;ll take it
                from there.
              </p>
            )}

            <button
              type="submit"
              className={`btn btn-maroon ${styles.submit}`}
              disabled={status === "sending"}
            >
              {status === "sending" ? "Sending…" : "Send my request"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      {children}
      {error && (
        <span className={styles.error} id={`${id}-error`}>
          {error}
        </span>
      )}
    </div>
  );
}
