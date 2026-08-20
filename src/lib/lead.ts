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

export type LeadInput = {
  name: string;
  business: string;
  phone: string;
  email: string;
  need: string;
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
