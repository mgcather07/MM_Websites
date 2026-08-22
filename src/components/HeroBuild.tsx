"use client";

/**
 * HeroBuild — the animated hero graphic: the real M&M site building itself.
 *
 * Recreates the layout from the brand mockup (public/images/hero/hero.jpg) as
 * live DOM, then assembles it on an 11s loop:
 *
 *   0–1s   nav (MM WEBSITES + HOME/SERVICES/WORK/ABOUT/CONTACT) drops in
 *   1–2s   "Clean websites." / "Fast results." / "Built for you." rise in turn
 *   2–3s   body copy, then the two buttons pop
 *   3–5s   the project photo panel scales in, caption + LEARN MORE follow
 *   5–7s   the four feature blurbs cascade
 *   7–8s   a cursor travels to "Get my free quote" and clicks (ripple)
 *   8–10s  the phone slides in showing the same page
 *   10–11s everything fades and the loop restarts
 *
 * The photo inside the mock is `/images/hero/house-crop.png` — the house from the
 * brand mockup with no text on the garage door, so "QUALITY WORK. TRUSTED LOCAL."
 * appears only once (as the animated overlay). Ship house-crop.png with this file.
 *
 * Decorative — aria-hidden. Styles in heroBuild.css.
 */

import "./heroBuild.css";

const NAV = ["HOME", "SERVICES", "WORK", "ABOUT", "CONTACT"];

const FEATURES = [
  { title: "Custom Design", w: "72%" },
  { title: "Mobile Friendly", w: "64%" },
  { title: "Fast & Reliable", w: "70%" },
  { title: "Local & Personal", w: "66%" },
];

export default function HeroBuild() {
  return (
    <div className="hb" aria-hidden="true">
      <div className="hb-window">
        <div className="hb-chrome">
          <span className="hb-dot" />
          <span className="hb-dot" />
          <span className="hb-dot" />
          <span className="hb-url" />
        </div>

        <div className="hb-page">
          <div className="hb-nav">
            <div className="hb-brand">
              <img src="/images/logo/mm-mark.png" alt="" className="hb-mark" />
              <span className="hb-brand-word">WEBSITES</span>
            </div>
            <div className="hb-navlinks">
              {NAV.map((item, i) => (
                <span key={item} className={i === 0 ? "hb-navlink-active" : undefined}>
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="hb-split">
            <div className="hb-copy">
              <div className="hb-h1 hb-h1-1">Clean websites.</div>
              <div className="hb-h1 hb-h1-2">Fast results.</div>
              <div className="hb-h1 hb-h1-3 hb-maroon">Built for you.</div>
              <p className="hb-body">
                We design modern, easy to use websites that help your business look
                professional and get more customers.
              </p>
              <div className="hb-btns">
                <div className="hb-btn-wrap">
                  <span className="hb-btn-primary">Get my free quote</span>
                  <span className="hb-ripple" />
                  <span className="hb-cursor" />
                </div>
                <span className="hb-btn-ghost">See our work</span>
              </div>
            </div>

            <div className="hb-shot">
              <img src="/images/hero/house-crop.png" alt="" className="hb-shot-img" />
              <span className="hb-shot-scrim" />
              <div className="hb-shot-cap">
                <div className="hb-shot-head">
                  QUALITY WORK.
                  <br />
                  TRUSTED LOCAL.
                </div>
                <span className="hb-shot-btn">LEARN MORE</span>
              </div>
            </div>
          </div>

          <div className="hb-features">
            {FEATURES.map((f, i) => (
              <div key={f.title} className={`hb-feat hb-feat-${i + 1}`}>
                <span className="hb-feat-icon" />
                <span className="hb-feat-title">{f.title}</span>
                <span className="hb-feat-line" />
                <span className="hb-feat-line" style={{ width: f.w }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="hb-phone">
        <div className="hb-phone-screen">
          <div className="hb-p-nav">
            <img src="/images/logo/mm-mark.png" alt="" className="hb-p-mark" />
            <span className="hb-p-burger">
              <i /><i /><i />
            </span>
          </div>
          <div className="hb-p-body">
            <div className="hb-p-h1">Clean websites.</div>
            <div className="hb-p-h1">Fast results.</div>
            <div className="hb-p-h1 hb-maroon">Built for you.</div>
            <span className="hb-p-line" />
            <span className="hb-p-line hb-p-short" />
            <span className="hb-p-cta">Get my free quote</span>
            <span className="hb-p-ghost">See our work</span>
          </div>
          <div className="hb-p-shot">
            <img src="/images/hero/house-crop.png" alt="" className="hb-shot-img" />
            <span className="hb-p-shot-scrim" />
          </div>
        </div>
      </div>

      <div className="hb-tag">
        <span className="hb-tag-dot" />
        Looks right on every screen
      </div>
    </div>
  );
}
