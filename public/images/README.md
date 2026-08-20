# Drop your images here

Anything in this folder gets published to the website on the next deploy.
After adding or replacing images, run **`npm run deploy`** from the project root
(or just ask Claude to publish) — the site is static, so images go live only
after a deploy, not the moment the file is saved.

Formats: **JPG or WebP** for photos, **PNG or SVG** for logos. Keep files under
~500 KB each so the site stays fast (resize before dropping if needed).

---

## 📁 `work/` — portfolio screenshots (drop-and-go)

These fill the **"Recent builds"** section. Drop a screenshot named exactly like
the list below and it appears automatically — no code change needed. Until a file
exists, that card shows a neutral placeholder.

| Drop a file named… | Shows under |
|---|---|
| `ridgeline-roofing.jpg` | Ridgeline Roofing |
| `magnolia-salon.jpg` | Magnolia Salon |
| `cather-lawn.jpg` | Cather Lawn & Land |

- Best shape: **16:10, about 1200 × 750 px** (a browser screenshot of the site works great).
- To add a *new* portfolio entry (a 4th, 5th, …), drop its image here and tell
  Claude the business name + one line of detail — it's one line in
  `src/content/work.ts`.

## 📁 `hero/` — the big hero photo

`placeholder.svg` is the branded illustration currently showing. To use a real
photo (Michael & Mandy, or a laptop showing a finished site):

1. Drop it here, e.g. `hero.jpg`.
2. Tell Claude to use it (one-line swap in `src/components/Hero.tsx`), or do it
   yourself: change the hero `src` to `/images/hero/hero.jpg`.

- Best shape: **portrait-ish, about 1000 × 840 px** (the slot is 420 px tall).

## 📁 `logo/` — a real logo mark (optional)

The "M&M" square in the nav/footer is type-set. If you get a real logo, drop it
here (`logo.svg` or `logo.png`, square, transparent background ~200 × 200) and
ask Claude to place it.
