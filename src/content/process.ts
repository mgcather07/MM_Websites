export type Step = {
  title: string;
  body: string;
};

export const process: Step[] = [
  {
    title: "Free quote",
    body: "Tell us about the business. We send a flat price, usually same day.",
  },
  {
    title: "Content & photos",
    body: "You send what you have. We write and organize the rest.",
  },
  {
    title: "Build & review",
    body: "You see it live in about a week and tell us what to change.",
  },
  {
    title: "Launch",
    body: "We point the domain, submit to Google and hand you the keys.",
  },
];
