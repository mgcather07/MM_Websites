/**
 * Site-wide content and contact details.
 */
export const site = {
  name: "M&M Websites",
  owners: "Michael & Mandy",
  town: "Gardendale, Alabama",
  startingPrice: "$500",
  copyrightYear: 2026,

  // Contact
  phone: "(205) 914-1019",
  phoneHref: "tel:+12059141019",
  // Temporary working inbox — will move to a branded address later.
  email: "mandywatts37@gmail.com",
} as const;

export const nav = [
  { label: "Services", href: "#services" },
  { label: "Our work", href: "#work" },
  { label: "How it works", href: "#process" },
] as const;
