# M&M Websites

Marketing homepage for **M&M Websites** — a two-person web design studio in
Gardendale, Alabama (Michael & Mandy) that builds custom small-business websites
starting at $500. Single-page site whose one goal is the **free quote form**.

Built to the approved design direction **1A "Hometown Bold"** (maroon/gray/white,
Archivo type). Fidelity is high — colors, spacing, copy, and layout follow the
design handoff exactly.

## Stack

- **Next.js 16** (App Router, TypeScript) + React 19
- **CSS Modules** with design tokens in [`globals.css`](src/app/globals.css)
- **Firebase App Hosting** for deploy (auto-builds from GitHub)
- **Cloud Firestore** stores leads; **Resend** emails them to the studio
- Fonts self-optimized via `next/font` (Archivo)

## Project layout

```
src/
  app/
    layout.tsx          # fonts, SEO metadata, viewport
    page.tsx            # composes the sections + JSON-LD local business schema
    globals.css         # design tokens, reset, shared button/band styles
    robots.ts, sitemap.ts
    api/quote/route.ts  # POST handler: validate → Firestore + email
  components/           # Nav, Hero, Services, Work, Process, QuoteForm, Footer (+ .module.css each)
  content/              # site.ts, services.ts, work.ts, process.ts  ← edit these
  lib/
    lead.ts             # shared lead type + validation (client & server)
    firebaseAdmin.ts    # Firestore Admin init (graceful if no creds)
    email.ts            # Resend sender (graceful if no key)
```

The **services, recent work, and process steps are data arrays** in `src/content/`
so new portfolio pieces can be added without touching markup.

## Local development

```bash
npm install
cp .env.local.example .env.local   # fill in as needed (see below)
npm run dev                        # http://localhost:3000
```

Without credentials the site renders fully; only the quote form's delivery step
needs Firebase/Resend (a valid submission returns `delivery_failed` locally until
you add them — see below).

### Environment variables

| Var | Purpose |
|---|---|
| `FIREBASE_PROJECT_ID` | Firestore project (default `mm-websites`) |
| `GOOGLE_APPLICATION_CREDENTIALS` **or** `FIREBASE_SERVICE_ACCOUNT` | Admin creds for local Firestore writes. Not needed on App Hosting. |
| `RESEND_API_KEY` | Enables lead emails. Without it, leads still save to Firestore. |
| `LEAD_TO_EMAIL` | Inbox that receives leads (default `hello@mmwebsites.com`) |
| `LEAD_FROM_EMAIL` | A **verified** Resend sender |

## The quote form

`POST /api/quote` with `{ name, business, phone, email, need, details }`:

1. Honeypot (`website` field) — filled → silent success (bot).
2. Validate — required: **Name**, **Phone or Email**, and **What do you need?**.
3. Write to the `leads` Firestore collection (best-effort).
4. Email the studio via Resend (best-effort).
5. Success if either channel worked; otherwise `502`.

Firestore is locked down in [`firestore.rules`](firestore.rules) — no client
read/write. All writes go through the server (Admin SDK).

## Deploy (Firebase App Hosting)

1. In the [Firebase console](https://console.firebase.google.com/project/mm-websites/apphosting),
   create an App Hosting backend and connect the GitHub repo `mgcather07/MM_Websites`
   (branch `main`). Requires the **Blaze** plan.
2. Enable **Cloud Firestore** in the same project.
3. Add the Resend secret and grant the backend access:
   ```bash
   firebase apphosting:secrets:set RESEND_API_KEY
   firebase apphosting:secrets:grantaccess RESEND_API_KEY --backend <backend-id>
   ```
   Then uncomment the `RESEND_API_KEY` / `LEAD_FROM_EMAIL` blocks in
   [`apphosting.yaml`](apphosting.yaml).
4. Deploy Firestore rules: `firebase deploy --only firestore:rules`.
5. Push to `main` — App Hosting builds and deploys automatically.

## Before launch — content to replace

All placeholders live in `src/content/site.ts` and `src/content/work.ts`:

- Phone `(205) 555-0142`, email `hello@mmwebsites.com`, Facebook/Instagram URLs
- The three portfolio entries + screenshots (drop images in `public/`, set `image` in `work.ts`)
- Hero photo (place in `public/`, pass `src` to the hero `ImageSlot`)
- Copyright year

Voice for any new copy: plain, local, no hype, no exclamation points.
