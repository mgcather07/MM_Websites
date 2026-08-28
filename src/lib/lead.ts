/** Shared shape + validation for a quote-form lead. Used client and server. */

export type NeedOption =
  | "New website"
  | "Redesign of my current site"
  | "Online store"
  | "Logo & branding"
  | "Not sure yet";

export const needOptions: NeedOption[] = [
  "New website",
  "Redesign of my current site",
  "Online store",
  "Logo & branding",
  "Not sure yet",
];

/** Optional extras that help us scope and prioritize a quote. */
export const featureOptions = [
  "Contact form",
  "Online booking / scheduling",
  "Online store",
  "Photo gallery",
  "Customer reviews",
  "Blog / news",
  "Multiple locations",
] as const;

export const timelineOptions = [
  "As soon as possible",
  "In the next month",
  "1–3 months",
  "Just exploring for now",
] as const;

export const budgetOptions = [
  "Not sure yet",
  "$500 – $1,000",
  "$1,000 – $2,500",
  "$2,500+",
] as const;

export const assetsOptions = [
  "I have a logo and photos ready",
  "I have some of it",
  "I'll need help with logo and photos",
] as const;

export type LeadInput = {
  name: string;
  business: string;
  phone: string;
  email: string;
  need: string;
  /** Link to their existing site — shown only when need is a redesign. */
  currentUrl?: string;
  /** Features they want on the site (checkbox group). */
  features?: string[];
  /** How soon they need it. */
  timeline?: string;
  /** Rough budget. */
  budget?: string;
  /** Whether they have a logo/photos ready. */
  assets?: string;
  details: string;
  /** Honeypot — must stay empty. Bots fill it. */
  website?: string;
};

export type FieldErrors = Partial<
  Record<"name" | "contact" | "need" | "email", string>
>;

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate a lead. Required: Name, Phone OR Email, and "What do you need?".
 * Returns a map of field -> message; empty means valid.
 */
export function validateLead(input: Partial<LeadInput>): FieldErrors {
  const errors: FieldErrors = {};
  const name = (input.name ?? "").trim();
  const phone = (input.phone ?? "").trim();
  const email = (input.email ?? "").trim();
  const need = (input.need ?? "").trim();

  if (!name) errors.name = "Please tell us your name.";
  if (!phone && !email) {
    errors.contact = "Add a phone number or email so we can reach you.";
  }
  if (email && !emailRe.test(email)) {
    errors.email = "That email doesn't look right.";
  }
  if (!need || !needOptions.includes(need as NeedOption)) {
    errors.need = "Pick what you need so we can quote it.";
  }
  return errors;
}
