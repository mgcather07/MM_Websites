/**
 * Expanded service content for the /services page. The short `services` array
 * (services.ts) still drives the homepage preview; this adds the longer
 * descriptions and "what's included" detail that the full page needs.
 */
export type ServiceDetail = {
  title: string;
  blurb: string;
  includes: string[];
};

export type ServiceGroup = {
  eyebrow: string;
  heading: string;
  intro: string;
  services: ServiceDetail[];
};

export const includedWithEverySite: { title: string; body: string }[] = [
  { title: "Mobile-friendly", body: "Looks right on phones, tablets and desktops — where most of your customers actually are." },
  { title: "Built to load fast", body: "Clean, lightweight pages so visitors don't wait around and leave." },
  { title: "SEO-ready", body: "Set up the way search engines expect, so you have a real shot at showing up." },
  { title: "Flat price, in writing", body: "You get the full price up front — no hourly meters, no surprise invoices." },
  { title: "You own it", body: "The site and the domain are yours once it's paid for. No lock-in." },
  { title: "Real people", body: "Call or text Michael or Mandy — you're not filing a ticket with a call center." },
];

export const serviceGroups: ServiceGroup[] = [
  {
    eyebrow: "Design & build",
    heading: "Your website, built from scratch",
    intro:
      "Every site is custom-built around your business — your services, your photos, your words — not a stock template a hundred other businesses are using.",
    services: [
      {
        title: "Custom website design",
        blurb:
          "A site designed around how your business actually works, and easy for your customers to use on any device.",
        includes: [
          "Three to six custom-designed pages",
          "Phone, tablet and desktop layouts",
          "Your branding, colors and photos",
          "Contact and quote forms that reach your inbox",
        ],
      },
      {
        title: "Website redesign",
        blurb:
          "Have a site that looks dated or loads slow? We rebuild it on a modern foundation and keep what's already working for you.",
        includes: [
          "A fresh, current design",
          "Faster load times",
          "Your existing content carried over and cleaned up",
          "Keep what works, fix what doesn't",
        ],
      },
      {
        title: "Online store",
        blurb:
          "Sell products, services or gift cards online with secure card payments and simple shipping — without a complicated dashboard.",
        includes: [
          "Product listings with photos and pricing",
          "Secure card checkout",
          "Simple shipping and pickup options",
          "Orders you can manage yourself",
        ],
      },
      {
        title: "Logo & branding",
        blurb:
          "A clean logo and a consistent look you can put on your site, a truck, a shirt and a sign.",
        includes: [
          "A custom logo mark",
          "Colors and fonts that match",
          "Files for web and print",
          "Ready to use anywhere",
        ],
      },
    ],
  },
  {
    eyebrow: "Get found online",
    heading: "Show up when customers search",
    intro:
      "A great website only helps if people can find it. We set you up to show up when folks in your area search for what you do.",
    services: [
      {
        title: "SEO & Google visibility",
        blurb:
          "We handle the technical groundwork search engines look for, aimed at the customers searching your service in your town.",
        includes: [
          "Page titles and descriptions written for search",
          "Fast, mobile-friendly, crawlable structure",
          "Local keywords for your area",
          "Submitted to Google so it gets indexed",
        ],
      },
      {
        title: "Google Business Profile",
        blurb:
          "That map listing with your hours, photos and reviews is often the first thing a customer sees. We claim it and fill it out right.",
        includes: [
          "Claimed and verified listing",
          "Hours, services and service area",
          "Photos and the right categories",
          "Kept consistent with your website",
        ],
      },
    ],
  },
  {
    eyebrow: "Keep it running",
    heading: "We handle the technical side",
    intro:
      "The parts most small-business owners don't want to deal with — the domain, the hosting, the updates — we take care of, so you can run your business.",
    services: [
      {
        title: "Hosting & domain setup",
        blurb:
          "We handle the domain, hosting and business email so you never have to touch a control panel or remember another login.",
        includes: [
          "Domain registration or transfer",
          "Fast, secure hosting with SSL",
          "Business email setup",
          "We manage the technical side",
        ],
      },
      {
        title: "Monthly maintenance",
        blurb:
          "Websites need small updates over time. Call or text a change and we take care of it — plus backups and security.",
        includes: [
          "Content edits and small changes",
          "Software updates and backups",
          "Security monitoring",
          "$75/month, cancel anytime",
        ],
      },
      {
        title: "Booking & forms",
        blurb:
          "Quote requests, appointment booking and contact forms that land straight in your inbox, so leads don't slip through.",
        includes: [
          "Custom quote and contact forms",
          "Appointment or booking requests",
          "Notifications to your email or phone",
          "Spam protection built in",
        ],
      },
    ],
  },
];

export const servicesFaq: { q: string; a: string }[] = [
  {
    q: "How much does a website cost?",
    a: "Most small-business sites start at $500. The final price depends on how many pages and features you need — we quote it flat and in writing before any work starts, so there are no surprises.",
  },
  {
    q: "How long does it take?",
    a: "Most sites go live in about two to three weeks. You'll see it and give feedback before it launches.",
  },
  {
    q: "Do I own my website?",
    a: "Yes. Once it's paid for, the site and the domain are yours — no lock-in and no holding your site hostage.",
  },
  {
    q: "What if I need changes later?",
    a: "Call or text and we'll take care of it. Small edits are quick; bigger features are quoted separately. Optional monthly maintenance keeps everything updated and backed up.",
  },
  {
    q: "Do you handle hosting and email?",
    a: "Yes — we can set up and manage your domain, hosting and business email so you never have to touch a control panel.",
  },
  {
    q: "Do I have to be local?",
    a: "We're based in Gardendale and love working with North Alabama businesses, but we build for clients wherever they are — everything can be done by phone, text and email.",
  },
];
