"use client";

import { useEffect, useState } from "react";
import { ref, onValue, set as rtdbSet } from "firebase/database";
import { rtdb } from "@/lib/firebaseClient";
import { site } from "@/content/site";
import styles from "./Nda.module.css";

type Signature = { name?: string; email?: string; agreedAt?: number };

type Nda = {
  ndaNumber?: string;
  status?: string;
  preparedFor?: { name?: string; org?: string; email?: string };
  effectiveDate?: string;
  providerSignatory?: string;
  body?: string;
  signature?: Signature;
};

const prettyDate = (v?: string | number) => {
  if (!v) return "";
  const d = typeof v === "number" ? new Date(v) : new Date(v + "T00:00:00");
  if (isNaN(d.getTime())) return String(v);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
};

export default function NdaPage() {
  const [id, setId] = useState<string | null>(null);
  const [nda, setNda] = useState<Nda | null | undefined>(undefined);
  const [signName, setSignName] = useState("");
  const [agree, setAgree] = useState(false);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("id");
    setId(q);
    if (!q) {
      setNda(null);
      return;
    }
    return onValue(
      ref(rtdb, "ndas/" + q),
      (s) => setNda(s.exists() ? (s.val() as Nda) : null),
      () => setNda(null),
    );
  }, []);

  async function sign(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const name = signName.trim();
    if (!name) {
      setError("Please type your full name to sign.");
      return;
    }
    if (!agree) {
      setError("Please check the box to agree before signing.");
      return;
    }
    setSigning(true);
    try {
      // The signer's email is NOT taken from any input — it is bound server-side
      // to the address the NDA was issued to (see the onNdaSigned function).
      await rtdbSet(ref(rtdb, "ndas/" + id + "/signature"), {
        name,
        agree: true,
        agreedAt: Date.now(),
        userAgent: navigator.userAgent.slice(0, 400),
      });
      // The onValue subscription flips the page to the signed state automatically.
    } catch {
      setError(
        "Sorry — we couldn't record your signature. Please try again, or call us and we'll help.",
      );
      setSigning(false);
    }
  }

  if (nda === undefined) {
    return <div className={styles.state}>Loading agreement…</div>;
  }
  if (nda === null) {
    return (
      <div className={styles.state}>
        <h1>Agreement not found</h1>
        <p>
          This link isn&apos;t valid. Please check with M&amp;M Websites at{" "}
          <a href={site.phoneHref}>{site.phone}</a>.
        </p>
      </div>
    );
  }

  const pf = nda.preparedFor || {};
  const clientLine = [pf.name, pf.org].filter(Boolean).join(" / ") || "Client";
  const paragraphs = (nda.body || "").split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const isSigned = !!nda.signature?.name;

  return (
    <div className={styles.wrap}>
      <div className={styles.actions}>
        <button className={styles.printBtn} onClick={() => window.print()}>
          Print / Save as PDF
        </button>
      </div>

      <article className={styles.sheet}>
        <div className={styles.topbar} />

        <header className={styles.head}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={styles.logo} src="/images/logo/logo-full.png" alt="M&M Websites" />
          <div className={styles.headRight}>
            <h1 className={styles.title}>CONFIDENTIALITY AGREEMENT</h1>
            <p className={styles.subtitle}>
              {nda.ndaNumber ? `${nda.ndaNumber} · ` : ""}Non-Disclosure Agreement
            </p>
          </div>
        </header>

        <hr className={styles.rule} />

        <section className={styles.parties}>
          <div>
            <p className={styles.label}>Between</p>
            <p className={styles.partyName}>M&amp;M Websites</p>
            <p className={styles.partySub}>Service Provider</p>
          </div>
          <div className={styles.by}>
            <p className={styles.label}>And</p>
            <p className={styles.partyName}>{clientLine}</p>
            <p className={styles.partySub}>Client</p>
          </div>
        </section>

        {nda.effectiveDate && (
          <p className={styles.effective}>
            Effective date: <strong>{prettyDate(nda.effectiveDate)}</strong>
          </p>
        )}

        <div className={styles.body}>
          {paragraphs.map((p, i) => (
            <p key={i} className={styles.para}>
              {p}
            </p>
          ))}
        </div>

        <section className={styles.signatures}>
          <div className={styles.sigBlock}>
            <p className={styles.sigLabel}>Service Provider</p>
            <div className={styles.sigLine}>
              <span className={styles.sigScript}>M&amp;M Websites</span>
            </div>
            <p className={styles.sigSub}>
              M&amp;M Websites
              {nda.providerSignatory ? ` · By: ${nda.providerSignatory}` : ""}
            </p>
          </div>
          <div className={styles.sigBlock}>
            <p className={styles.sigLabel}>Client</p>
            <div className={styles.sigLine}>
              {isSigned ? (
                <span className={styles.sigScript}>{nda.signature?.name}</span>
              ) : (
                <span className={styles.sigPending}>Awaiting signature</span>
              )}
            </div>
            {isSigned ? (
              <>
                <p className={styles.sigSub}>
                  {nda.signature?.name}
                  {nda.signature?.email || pf.email
                    ? ` · ${nda.signature?.email || pf.email}`
                    : ""}
                </p>
                <p className={styles.sigSub}>
                  Signed {prettyDate(nda.signature?.agreedAt)}
                </p>
              </>
            ) : (
              <p className={styles.sigSub}>Client</p>
            )}
          </div>
        </section>

        <footer className={styles.foot}>
          <p className={styles.tagline}>Professional Websites. Built for Business.</p>
        </footer>
      </article>

      {isSigned ? (
        <div className={styles.signedCard}>
          <div className={styles.signedCheck}>✓</div>
          <div>
            <div className={styles.signedTitle}>Signed — thank you.</div>
            <div className={styles.signedSub}>
              Signed by {nda.signature?.name}
              {nda.signature?.email || pf.email
                ? ` (${nda.signature?.email || pf.email})`
                : ""}{" "}
              on {prettyDate(nda.signature?.agreedAt)}. Your information is safe with us. Feel
              free to print or save this page for your records.
            </div>
          </div>
        </div>
      ) : (
        <form className={styles.signCard} onSubmit={sign}>
          <h2 className={styles.signHead}>Review &amp; sign</h2>
          <p className={styles.signIntro}>
            Type your full name below to sign this Confidentiality Agreement electronically.
          </p>

          {error && <div className={styles.signError}>{error}</div>}

          <label className={styles.signField}>
            <span>Your full name</span>
            <input
              type="text"
              value={signName}
              onChange={(e) => setSignName(e.target.value)}
              placeholder="Type your full legal name"
              autoComplete="name"
            />
          </label>

          {pf.email && (
            <div className={styles.signBound}>
              <span className={styles.signBoundLabel}>Signing as</span>
              <span className={styles.signBoundEmail}>{pf.email}</span>
            </div>
          )}

          {signName.trim() && (
            <div className={styles.sigPreview}>
              <span className={styles.sigPreviewLabel}>Your signature</span>
              <span className={styles.sigScript}>{signName.trim()}</span>
            </div>
          )}

          <label className={styles.agree}>
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
            />
            <span>
              I have read and agree to this Confidentiality Agreement, and I understand that
              typing my name serves as my electronic signature.
            </span>
          </label>

          <button type="submit" className={styles.signBtn} disabled={signing}>
            {signing ? "Signing…" : "Sign agreement"}
          </button>
          <p className={styles.signSecure}>🔒 Your signature is recorded securely with a timestamp.</p>
        </form>
      )}
    </div>
  );
}
