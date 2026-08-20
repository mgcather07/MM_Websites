/**
 * Site-wide content and contact details.
 *
 * PLACEHOLDERS — replace these before launch (see design handoff "Content to
 * replace"). Phone, email, and social URLs are stand-ins.
 */
export const site = {
  name: "M&M Websites",
  owners: "Michael & Mandy",
  town: "Gardendale, Alabama",
  serviceArea:
    "Gardendale, AL — serving Fultondale, Mt. Olive, Morris, Warrior and greater Birmingham.",
  startingPrice: "$500",
  copyrightYear: 2026,

  // Contact — PLACEHOLDERS, replace before launch.
  phone: "(205) 555-0142",
  phoneHref: "tel:+12055550142",
  email: "hello@mmwebsites.com",
  facebookUrl: "https://facebook.com/",
  instagramUrl: "https://instagram.com/",
} as const;

export const nav = [
  { label: "Services", href: "#services" },
  { label: "Our work", href: "#work" },
  { label: "How it works", href: "#process" },
] as const;
