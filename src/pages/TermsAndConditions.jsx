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
4.3 If users forget their login or withdrawal passwords, they should contact customer service to reset them.

5. Single Mission
5.1 VIP 1 users can complete 2 sets of product submissions per day with a 0.5% commission for each normal product data.
5.2 VIP 2 users can complete 2 sets of product submissions per day with a 1.0% commission for each normal product data.
5.3 VIP 3 users can complete 2 sets of product submissions per day with a 1.5% commission for each normal product data.
5.4 VIP 4 users can complete 2 sets of product submissions per day with a 2.0% commission for each normal product data.
5.5 Upon successful submission of product data, the commission will be automatically credited to the user’s account balance.
5.6 The system will randomly assign product data to the user’s account based on their account balance.
5.7 Once the data is assigned to the user’s account, it cannot be canceled, skipped, or exchanged.
6. Combo Mission
6.1 Merged product consists of 2 to 3 product data sets. Users may not necessarily receive 3 product data sets; the system will randomly assign product data within the merged product, with a higher likelihood of receiving 1 product data set.
6.2 Users will earn ten times the commission for each product in the merged product compared to normal product data.
6.3 Upon receiving merged product, all funds will be placed on hold until the submission of each pending merged product is completed. These funds will be returned to the user’s account after the submissions are finalized.
6.4 The system will randomly assign merged product to the user’s account based on the total balance in the user’s account.
6.5 Once merged product is assigned to the user’s account, it cannot be canceled, skipped, or exchanged.
6.6 A user can receive a maximum of 3 merged product sets per set of product submission.

7. Advance Payments
7.1 The amount for advance payment is determined by the user. The platform does not set specific amounts for the user, but recommends users make advance payments based on their financial capacity or after becoming familiar with the platform.
7.2 If a user needs to make an advance payment upon receiving merged product, it is advised that the user pays according to the negative balance indicated in their account.
7.3 Before making an advance payment, users must contact customer service to request advance payment details and confirm the merchant’s wallet address.
7.4 The platform will not assume responsibility for any loss resulting from payments made to incorrect wallet addresses.

8. Merchant Cooperation
8.1 Data availability on the platform fluctuates. If product is not processed in a timely manner, merchants may be unable to offload it, affecting their progress. Users are encouraged to complete their submissions and apply for withdrawals promptly to avoid hindering merchant progress. Users must complete all submissions within 24 hours to avoid complaints from merchants and order freezes.
8.2 Merchants will provide users with wallet addresses to facilitate advance payments.

9. Invitation
9.1 Users may invite other users to the platform using the invitation code linked to their account.
9.2 Referral invitations are limited to once per user per month.
9.3 To be eligible to use an invitation code to invite referrals, a user must first complete 15 days of work after registration.
9.4 Referrers will receive 20% of the referee's daily earnings as a commission.

10. Credit Score
10.1 Users must complete all sets of product data submissions to maintain a 100% credit score.
10.2 Failure to complete the submissions will result in a decrease in the user's credit score.
10.3 The credit score is determined by the number of incomplete orders and the timeliness of their completion.
10.4 A decrease in credit score may affect a user's ability to request withdrawals.

11. Operating Hours
11.1 The platform operates from 10:00 -23:00 (EST).
11.2 Customer service is available from 10:00 -23:00 (EST).
11.3 Platform withdrawal hours are from 10:00 -23:00 (EST).
The final right of interpretation belongs to Lumostra`;

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
