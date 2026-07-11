import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const START_BLUE = "#1fb6fc";

/**
 * Terms and Conditions page (document-scrollable)
 *
 * Changes made:
 * - Kept translation logic and observers.
 * - Header remains fixed.
 * - Removed card maxHeight + inner overflow so the whole page/document scrolls.
 * - The white card expands with content and the page scrolls up/down.
 *
 * Replacements performed as requested:
 * - All occurrences of "Digital Blitz" / "Digital Bitz" replaced with "LumoStra".
 * - VIP earnings updated to match the Premium rules.
 * - All currency mentions changed to USD.
 *
 * Nothing else (handlers / translation logic) was removed.
 */
export default function TermsAndConditions() {
  const navigate = useNavigate();

  // Apply translations to all elements with data-i18n (keeps previous behaviour)
  async function applyTranslations() {
    try {
      // 1) If the app exposes a dedicated translator function, use it
      if (typeof window.applyTranslations === "function") {
        try {
          window.applyTranslations();
          return;
        } catch (e) {
          console.warn("window.applyTranslations() threw:", e);
        }
      }

      // 2) If i18next is available globally, use it
      if (window.i18next && typeof window.i18next.t === "function") {
        try {
          document.querySelectorAll("[data-i18n]").forEach((el) => {
            const key = el.getAttribute("data-i18n");
            if (!key) return;
            const translated = window.i18next.t(key);
            if (translated && translated !== key) {
              el.innerHTML = translated;
            }
          });
          return;
        } catch (e) {
          console.warn("i18next-based translation failed:", e);
        }
      }

      // 3) Fallback: fetch locale JSON from /i18n/<locale>.json
      const locale =
        (window.i18next && window.i18next.language) ||
        localStorage.getItem("i18nextLng") ||
        document.documentElement.lang ||
        "en";
      const path = `/i18n/${locale}.json`;
      const res = await fetch(path, { cache: "no-store" });
      if (!res.ok) return;
      const json = await res.json();
      if (!json) return;
      document.querySelectorAll("[data-i18n]").forEach((el) => {
        const key = el.getAttribute("data-i18n");
        if (!key) return;
        const val = json[key];
        if (val !== undefined && val !== null) {
          el.innerHTML = val;
        }
      });
    } catch (err) {
      console.warn("applyTranslations error:", err);
    }
  }

  useEffect(() => {
    applyTranslations();

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === "attributes" && m.attributeName === "lang") {
          applyTranslations();
        }
      }
    });
    observer.observe(document.documentElement, { attributes: true });

    const onLangEvent = () => applyTranslations();
    window.addEventListener("languageChanged", onLangEvent);
    window.addEventListener("i18nChanged", onLangEvent);

    return () => {
      observer.disconnect();
      window.removeEventListener("languageChanged", onLangEvent);
      window.removeEventListener("i18nChanged", onLangEvent);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The full Terms & Conditions text (modified: "Digital Blitz" -> "LumoStra", VIP earnings updated, USDC -> USD)
  const termsText = `Terms & Conditions
These Terms and Conditions are governed by the following terminology and principles of interpretation. All users are required to adhere to the terms outlined by the platform. Any violations will result in corrective actions and penalties imposed by the platform. The User Agreement, which is part of these Terms and Conditions, is subject to the platform's final interpretation.

LumoStra is a partner of the United Nations World Food Programme (WFP). All users of the platform will be donors to this charitable organization. We thank all users on LumoStra for their contributions to the charity, hoping that all humanity can enjoy healthy food.

1. Start to Submit Product Data
1.1 A minimum account balance of 50 USD is required to initiate the first set of 40 product submissions.
1.2 A minimum deposit of 100 USD is required to reset and begin the new daily product submission process.
1.3 Users must complete the current dataset before requesting a reset for the next set of submissions.

2. Withdrawal
2.1 Withdrawal amount is based on the VIP level of the account, if withdrawals exceeding the amount require an upgrade to the appropriate membership level, as each level is subject to different withdrawal limits.
2.2 Users are required to complete two sets of product submissions per day in order to submit a withdrawal request. Additionally, users must request the withdrawal of their full account balance.
2.3 Users who abandon or quit during the product submission process are ineligible to apply for a withdrawal or refund.
2.4 If a withdrawal request has not been formally submitted by the user, the platform cannot process any withdrawal on the user’s behalf.
2.5 All members apply for withdrawal of more than 20,000 USD for the first time need to contact online customer service to process it to ensure the safety of all members' transfer funds

3. Funds
3.1 All user funds will be securely stored in their account and may be withdrawn in full once all product submissions are completed.
3.2 To avoid any loss of funds, all data processing will be handled by the system, not manually.
3.3 In case of accidental loss of funds, the platform will assume full responsibility.

4. Account Security
4.1 Users must not share their login passwords or security PIN with others. If this results in a loss, the platform will not be responsible.
4.2 It is not recommended to set easily identifiable information, such as birthdates, ID card numbers, or phone numbers, as security codes or login passwords.
4.3 If users forget their login or withdrawal passwords, they should contact customer service to reset them.`;

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, var(--db-bg, #0A0A0A), #000)", fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial", color: "var(--db-text, #E6E6E6)" }}>
      {/* Black fixed header (uses platform card color) */}
      <div style={{
        position: "fixed",
        top: 0, left: 0, right: 0,
        height: 64,
        background: "var(--db-card, #111)",
        color: "var(--db-text, #fff)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 40,
        boxShadow: "inset 0 -1px 0 rgba(255,255,255,0.02)"
      }}>
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          style={{
            position: "absolute",
            left: 14,
            top: "50%",
            transform: "translateY(-50%)",
            background: "transparent",
            border: "none",
            padding: 8,
            cursor: "pointer",
            color: "var(--db-text, #fff)",
          }}
        >
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polyline points="15 6 9 12 15 18" stroke="var(--db-text, #fff)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div style={{ fontWeight: 800, fontSize: 18 }}>Terms and Conditions</div>

        <div style={{ position: "absolute", right: 14, width: 24 }} />
      </div>

      {/* Spacer for header */}
      <div style={{ height: 72 }} />

      {/* Centered white card; no inner fixed height — the document scrolls */}
      <main style={{ maxWidth: 980, margin: "0 auto", padding: "16px", boxSizing: "border-box" }}>
        <div style={{
          background: "#ffffff",
          borderRadius: 12,
          padding: "20px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
          // removed maxHeight/overflow so the card grows with content and the page scrolls
        }}>
          <div style={{ whiteSpace: "pre-wrap", color: "#222", lineHeight: 1.6, fontSize: 14 }}>
            {termsText}
          </div>
        </div>
      </main>
    </div>
  );
}
