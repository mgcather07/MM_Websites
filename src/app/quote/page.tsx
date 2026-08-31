"use client";

import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { rtdb } from "@/lib/firebaseClient";
import { site } from "@/content/site";
import styles from "./Quote.module.css";

type QuoteItem = { title?: string; description?: string; price?: number };
type Phase = {
  id?: string;
  name?: string;
  summary?: string;
  items?: QuoteItem[] | Record<string, QuoteItem>;
};
type PhasePay = { amountPaid?: number; status?: string };

type Quote = {
  quoteNumber?: string;
  status?: string;
  subtitle?: string;
  preparedFor?: { name?: string; org?: string; location?: string };
  summary?: string;
  items?: QuoteItem[] | Record<string, QuoteItem>;
  phases?: Phase[] | Record<string, Phase>;
  phasePay?: Record<string, PhasePay>;
  terms?: string;
  feesNote?: string;
  supportNote?: string;
  discountPercent?: number;
  discountReason?: string;
  amountPaid?: number;
  createdAt?: number;
};

const money = (n?: number) =>
  "$" +
  Number(n || 0).toLocaleString("en-US", {
    maximumFractionDigits: Number(n || 0) % 1 ? 2 : 0,
  });

function itemList(items: QuoteItem[] | Record<string, QuoteItem> | undefined): QuoteItem[] {
  if (!items) return [];
  return Array.isArray(items) ? items.filter(Boolean) : Object.values(items);
}

function phaseList(phases: Quote["phases"]): Phase[] {
  if (!phases) return [];
  const arr = Array.isArray(phases) ? phases.filter(Boolean) : Object.values(phases);
  return arr.filter((p) => p && p.id);
}

export default function QuotePage() {
  const [id, setId] = useState<string | null>(null);
  const [quote, setQuote] = useState<Quote | null | undefined>(undefined);
  const [justPaid, setJustPaid] = useState(false);
  const [paying, setPaying] = useState<string | null>(null);
  const [payError, setPayError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("id");
    setJustPaid(params.get("paid") === "1");
    setId(q);
    if (!q) {
      setQuote(null);
      return;
    }
    return onValue(
      ref(rtdb, "quotes/" + q),
      (s) => setQuote(s.exists() ? (s.val() as Quote) : null),
      () => setQuote(null),
    );
  }, []);

  async function pay(mode: "deposit" | "full", phaseId?: string) {
    const key = phaseId ? `${phaseId}:${mode}` : mode;
    setPaying(key);
    setPayError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId: id, mode, phaseId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) throw new Error(data.error || "Checkout failed");
      window.location.href = data.url;
    } catch {
      setPayError(
        "Sorry — we couldn't start checkout. Please try again, or call us and we'll help.",
      );
      setPaying(null);
    }
  }

  if (quote === undefined) {
    return <div className={styles.state}>Loading quote…</div>;
  }
  if (quote === null) {
    return (
      <div className={styles.state}>
        <h1>Quote not found</h1>
        <p>
          This quote link isn&apos;t valid. Please check with M&amp;M Websites at{" "}
          <a href={site.phoneHref}>{site.phone}</a>.
        </p>
      </div>
    );
  }

  const discountPct = Number(quote.discountPercent || 0);
  const applyDiscount = (n: number) =>
    discountPct > 0 ? Math.round((n * (100 - discountPct)) / 100) : n;

  const phases = phaseList(quote.phases);
  const phased = phases.length > 0;

  // ---- Flat-quote figures (used only when not phased) ----
  const items = itemList(quote.items);
  const subtotal = items.reduce((sum, it) => sum + Number(it.price || 0), 0);
  const discountAmount = subtotal - applyDiscount(subtotal);
  const total = subtotal - discountAmount;
  const amountPaid = Number(quote.amountPaid || 0);
  const remaining = Math.max(0, total - amountPaid);
  const deposit = Math.round(total * 0.4);
  const isPaid = quote.status === "paid" || remaining <= 0;

  // ---- Phased figures ----
  const pay0 = quote.phasePay || {};
  const phaseInfo = phases.map((ph, i) => {
    const pSub = itemList(ph.items).reduce((s, it) => s + Number(it.price || 0), 0);
    const pTotal = applyDiscount(pSub);
    const paid = Number((pay0[ph.id as string] || {}).amountPaid || 0);
    const paidStatus = (pay0[ph.id as string] || {}).status;
    const pRemaining = Math.max(0, pTotal - paid);
    const pPaid = paidStatus === "paid" || (pTotal > 0 && pRemaining <= 0);
    return {
      phase: ph,
      index: i,
      name: ph.name?.trim() || `Phase ${i + 1}`,
      items: itemList(ph.items),
      subtotal: pSub,
      total: pTotal,
      paid,
      remaining: pRemaining,
      deposit: Math.round(pTotal * 0.4),
      isPaid: pPaid,
      hasPayment: paid > 0,
    };
  });
  const grandTotal = phaseInfo.reduce((s, p) => s + p.total, 0);
  const grandSubtotal = phaseInfo.reduce((s, p) => s + p.subtotal, 0);
  const allPhasesPaid = phased && phaseInfo.every((p) => p.isPaid);

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
            <h1 className={styles.title}>PROJECT QUOTE</h1>
            {quote.subtitle && <p className={styles.subtitle}>{quote.subtitle}</p>}
          </div>
        </header>

        <hr className={styles.rule} />

        <section className={styles.parties}>
          <div>
            <p className={styles.label}>Prepared for</p>
            <p className={styles.partyName}>
              {[quote.preparedFor?.name, quote.preparedFor?.org]
                .filter(Boolean)
                .join(" / ")}
            </p>
            {quote.preparedFor?.location && (
              <p className={styles.partySub}>{quote.preparedFor.location}</p>
            )}
          </div>
          <div className={styles.by}>
            <p className={styles.label}>Prepared by</p>
            <p className={styles.partyName}>M&amp;M Websites</p>
            <p className={styles.partySub}>
              {site.phone} &nbsp;|&nbsp; {site.email}
            </p>
            <p className={styles.partySub}>www.mmwebsites.com</p>
          </div>
        </section>

        {quote.summary && (
          <div className={styles.summary}>
            <p>{quote.summary}</p>
          </div>
        )}

        {phased && (
          <div className={styles.phaseNote}>
            This project is arranged in phases. You can start with Phase 1 now and
            take on the later phases whenever you&apos;re ready — each phase is
            accepted and paid separately.
          </div>
        )}

        {phased ? (
          <>
            {phaseInfo.map((p) => (
              <div className={styles.phaseBlock} key={p.phase.id}>
                <div className={styles.phaseBar}>
                  <div className={styles.phaseBarName}>
                    {p.name}
                    {p.isPaid && <span className={styles.phaseTag}>Paid</span>}
                  </div>
                  <div className={styles.phaseBarPrice}>{money(p.total)}</div>
                </div>
                {p.phase.summary && (
                  <p className={styles.phaseSummary}>{p.phase.summary}</p>
                )}
                <div className={styles.items}>
                  {p.items.map((it, i) => (
                    <div className={styles.item} key={i}>
                      <div className={styles.itemMain}>
                        <div className={styles.itemTitle}>{it.title}</div>
                        {it.description && (
                          <div className={styles.itemDesc}>{it.description}</div>
                        )}
                      </div>
                      <div className={styles.itemPrice}>{money(it.price)}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className={styles.total}>
              <div>
                <div className={styles.totalLabel}>All Phases Total</div>
                {discountPct > 0 && (
                  <div className={styles.terms}>
                    Includes your {discountPct}% discount
                    {quote.discountReason ? ` — ${quote.discountReason}` : ""} (you
                    save {money(grandSubtotal - grandTotal)}).
                  </div>
                )}
                {quote.terms && <div className={styles.terms}>{quote.terms}</div>}
                {quote.feesNote && <div className={styles.fees}>{quote.feesNote}</div>}
              </div>
              <div className={styles.totalValue}>{money(grandTotal)}</div>
            </div>
          </>
        ) : (
          <>
            <div className={styles.itemsHead}>
              <span>Project Component</span>
              <span>Price</span>
            </div>

            <div className={styles.items}>
              {items.map((it, i) => (
                <div className={styles.item} key={i}>
                  <div className={styles.itemMain}>
                    <div className={styles.itemTitle}>{it.title}</div>
                    {it.description && (
                      <div className={styles.itemDesc}>{it.description}</div>
                    )}
                  </div>
                  <div className={styles.itemPrice}>{money(it.price)}</div>
                </div>
              ))}
            </div>

            {discountPct > 0 && (
              <div className={styles.breakdown}>
                <div className={styles.breakRow}>
                  <span>Subtotal</span>
                  <span>{money(subtotal)}</span>
                </div>
                <div className={`${styles.breakRow} ${styles.breakDiscount}`}>
                  <span>
                    Discount
                    {quote.discountReason ? ` — ${quote.discountReason}` : ""} (
                    {discountPct}%)
                  </span>
                  <span>−{money(discountAmount)}</span>
                </div>
              </div>
            )}

            <div className={styles.total}>
              <div>
                <div className={styles.totalLabel}>Complete Project Total</div>
                {discountPct > 0 && quote.discountReason && (
                  <div className={styles.terms}>
                    Includes your {discountPct}% discount — {quote.discountReason}.
                  </div>
                )}
                {quote.terms && <div className={styles.terms}>{quote.terms}</div>}
                {quote.feesNote && <div className={styles.fees}>{quote.feesNote}</div>}
              </div>
              <div className={styles.totalValue}>{money(total)}</div>
            </div>
          </>
        )}

        <footer className={styles.foot}>
          <div>
            {quote.supportNote && (
              <>
                <p className={styles.label}>Optional ongoing support</p>
                <p className={styles.supportNote}>{quote.supportNote}</p>
              </>
            )}
          </div>
          <p className={styles.tagline}>Professional Websites. Built for Business.</p>
        </footer>
      </article>

      {/* ---- Payment ---- */}
      {justPaid && (
        <div className={`${styles.payCard} ${styles.confirmCard}`}>
          <div className={styles.confirming}>
            Confirming your payment… this page updates automatically once it
            clears.
          </div>
        </div>
      )}

      {phased ? (
        allPhasesPaid ? (
          <div className={styles.paidCard}>
            <div className={styles.paidCheck}>✓</div>
            <div>
              <div className={styles.paidTitle}>All phases paid — thank you!</div>
              <div className={styles.paidSub}>
                Every phase of your project is paid in full.
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.phasePayStack}>
            {phaseInfo.map((p) => (
              <div className={styles.phasePayCard} key={p.phase.id}>
                <div className={styles.phasePayHead}>
                  <div>
                    <div className={styles.phasePayName}>{p.name}</div>
                    <div className={styles.phasePayPrice}>{money(p.total)}</div>
                  </div>
                  {p.isPaid ? (
                    <span className={styles.phasePaidBadge}>✓ Paid</span>
                  ) : p.hasPayment ? (
                    <span className={styles.phaseDueBadge}>
                      {money(p.remaining)} due
                    </span>
                  ) : null}
                </div>

                {p.isPaid ? (
                  <p className={styles.phasePaySub}>
                    This phase is paid in full — thank you!
                  </p>
                ) : (
                  <>
                    <p className={styles.phasePaySub}>
                      {p.hasPayment ? (
                        <>
                          Deposit received: <strong>{money(p.paid)}</strong>.
                          Balance due: <strong>{money(p.remaining)}</strong>.
                        </>
                      ) : (
                        <>
                          Pay securely by card. A 40% deposit starts this phase,
                          or pay it in full.
                        </>
                      )}
                    </p>
                    <div className={styles.payButtons}>
                      {p.hasPayment ? (
                        <button
                          className={styles.payPrimary}
                          disabled={!!paying}
                          onClick={() => pay("full", p.phase.id)}
                        >
                          {paying === `${p.phase.id}:full`
                            ? "Starting…"
                            : `Pay balance · ${money(p.remaining)}`}
                        </button>
                      ) : (
                        <>
                          <button
                            className={styles.payPrimary}
                            disabled={!!paying}
                            onClick={() => pay("deposit", p.phase.id)}
                          >
                            {paying === `${p.phase.id}:deposit`
                              ? "Starting…"
                              : `Accept & pay 40% · ${money(p.deposit)}`}
                          </button>
                          <button
                            className={styles.paySecondary}
                            disabled={!!paying}
                            onClick={() => pay("full", p.phase.id)}
                          >
                            {paying === `${p.phase.id}:full`
                              ? "Starting…"
                              : `Pay in full · ${money(p.total)}`}
                          </button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
            {payError && <div className={styles.payError}>{payError}</div>}
            <p className={styles.paySecure}>🔒 Secure payment powered by Stripe</p>
          </div>
        )
      ) : isPaid ? (
        <div className={styles.paidCard}>
          <div className={styles.paidCheck}>✓</div>
          <div>
            <div className={styles.paidTitle}>Paid in full — thank you!</div>
            <div className={styles.paidSub}>
              We&apos;ll be in touch to get your project moving.
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.payCard}>
          <h2 className={styles.payTitle}>
            {amountPaid > 0 ? "Balance remaining" : "Ready to get started?"}
          </h2>
          <p className={styles.paySub}>
            {amountPaid > 0 ? (
              <>
                Deposit received: <strong>{money(amountPaid)}</strong>. Balance
                due: <strong>{money(remaining)}</strong>.
              </>
            ) : (
              <>Pay securely by card. Your project starts as soon as your deposit clears.</>
            )}
          </p>

          {payError && <div className={styles.payError}>{payError}</div>}

          <div className={styles.payButtons}>
            {amountPaid > 0 ? (
              <button
                className={styles.payPrimary}
                disabled={!!paying}
                onClick={() => pay("full")}
              >
                {paying ? "Starting…" : `Pay remaining balance · ${money(remaining)}`}
              </button>
            ) : (
              <>
                <button
                  className={styles.payPrimary}
                  disabled={!!paying}
                  onClick={() => pay("deposit")}
                >
                  {paying === "deposit"
                    ? "Starting…"
                    : `Accept & pay 40% deposit · ${money(deposit)}`}
                </button>
                <button
                  className={styles.paySecondary}
                  disabled={!!paying}
                  onClick={() => pay("full")}
                >
                  {paying === "full" ? "Starting…" : `Pay in full · ${money(total)}`}
                </button>
              </>
            )}
          </div>
          <p className={styles.paySecure}>🔒 Secure payment powered by Stripe</p>
        </div>
      )}
    </div>
  );
}
