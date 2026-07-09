import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBalance } from "../context/balanceContext";
import { useTransactions } from "../context/transactionContext";
// new: settings context
import { useSettings } from "../context/SettingsContext";
// Import CustomerServiceModal so Contact button opens it
import CustomerServiceModal from "../components/CustomerServiceModal";

// Set your contact URLs here
const TELEGRAM_URL = "https://t.me/your_customer_service";
const WHATSAPP_URL = "https://wa.me/1234567890"; // replace with your WhatsApp number

const START_BLUE = "#1fb6fc";

/* Utility: format date as YYYY-MM-DD HH:mm:ss (local) */
function formatDateISO(dateValue) {
  if (!dateValue) return "";
  try {
    const d = typeof dateValue === "string" || typeof dateValue === "number" ? new Date(dateValue) : dateValue;
    if (isNaN(d.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    const seconds = pad(d.getSeconds());
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  } catch (e) {
    return "";
  }
}

/* Helper to format amount like screenshot:
   - If integer, show without decimals
   - Otherwise show two decimals
*/
function fmtNum(v) {
  const n = Number(v || 0);
  if (!Number.isFinite(n)) return "0";
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

export default function Deposit() {
  const [tab, setTab] = useState("deposit");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  const { balance, refreshProfile } = useBalance();
  const { deposits, loading } = useTransactions();

  // settings context
  const { currency } = useSettings();

  // Map USDC -> USD and default to USD if nothing present
  const displayCurrency = currency && String(currency).toUpperCase() === "USDC" ? "USD" : (currency || "USD");

  const maxCardWidth = 680;

  // When Deposit is clicked, show modal (now opens CustomerServiceModal)
  const handleDeposit = (e) => {
    e && e.preventDefault();
    setShowModal(true);
  };

  const handleContact = (platform) => {
    setShowModal(false);
    if (platform === "telegram") {
      window.open(TELEGRAM_URL, "_blank");
    } else if (platform === "whatsapp") {
      window.open(WHATSAPP_URL, "_blank");
    }
  };

  // Compose all deposit-like entries (normal deposit + admin_add_balance, etc)
  const allDeposits = (deposits || []).filter(
    (deposit) =>
      deposit.type === "deposit" ||
      deposit.type === "admin_add_balance" ||
      deposit.type === "admin_add_funds" ||
      deposit.type === "add_balance_admin" ||
      !deposit.type // fallback: if type is missing, assume user deposit
  );

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, var(--db-bg, #0A0A0A), #000)", color: "var(--db-text, #E6E6E6)", fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial", paddingBottom: 84 }}>
      {/* Header */}
      <div
        style={{
          background: "var(--db-card, #111)",
          color: "var(--db-text, white)",
          textAlign: "center",
          fontWeight: 800,
          fontSize: 20,
          padding: "14px 0",
          position: "relative",
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{
            position: "absolute",
            left: 14,
            top: "50%",
            transform: "translateY(-50%)",
            background: "transparent",
            border: "none",
            padding: 0,
            margin: 0,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
          }}
          aria-label="Back"
        >
          <svg width={20} height={20} viewBox="0 0 24 24" style={{ color: "var(--db-text, #fff)" }}>
            <polyline
              points="15 6 9 12 15 18"
              fill="none"
              stroke="var(--db-text, #fff)"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <div style={{ fontSize: 20, fontWeight: 800, color: "var(--db-text, #E6E6E6)" }}>Deposit</div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          borderBottom: "1px solid rgba(255,255,255,0.03)",
          background: "transparent",
        }}
      >
        <button
          style={{
            flex: 1,
            padding: "18px 0 10px 0",
            fontWeight: 700,
            fontSize: 18,
            color: tab === "deposit" ? "var(--db-text, #111)" : "var(--db-muted, #888)",
            background: "none",
            border: "none",
            borderBottom: tab === "deposit" ? `3px solid var(--db-accent, #FFEA00)` : "3px solid transparent",
            cursor: "pointer"
          }}
          onClick={() => setTab("deposit")}
        >
          Deposit
        </button>

        <button
          style={{
            flex: 1,
            padding: "18px 0 10px 0",
            fontWeight: 700,
            fontSize: 18,
            color: tab === "history" ? "var(--db-text, #111)" : "var(--db-muted, #888)",
            background: "none",
            border: "none",
            borderBottom: tab === "history" ? `3px solid var(--db-accent, #FFEA00)` : "3px solid transparent",
            cursor: "pointer"
          }}
          onClick={() => setTab("history")}
        >
          History
        </button>
      </div>

      {/* Deposit Tab */}
      {tab === "deposit" ? (
        <>
          <div style={{ margin: "22px auto", width: "94%", maxWidth: maxCardWidth }}>
            {/* Account card (dark rounded with big left padding) */}
            <div
              style={{
                background: "var(--db-card, linear-gradient(180deg,#3a3a3b,#2a2a2a))",
                borderRadius: 14,
                padding: "20px 22px",
                boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
                color: "var(--db-text)"
              }}
            >
              <div style={{ color: "rgba(255,255,255,0.85)", fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Account Amount</div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
                <div style={{ fontSize: 34, fontWeight: 800, color: "var(--db-text)", lineHeight: 1 }}>{Number(balance || 0).toFixed(2)}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "rgba(255,255,255,0.8)", paddingBottom: 4 }}>{displayCurrency}</div>
              </div>
            </div>

            {/* Big Contact button (rounded accent) */}
            <div style={{ marginTop: 28 }}>
              <button
                onClick={handleDeposit}
                style={{
                  width: "100%",
                  background: "var(--db-accent, #FFEA00)",
                  color: "#111",
                  fontWeight: 800,
                  fontSize: 18,
                  padding: "18px 20px",
                  borderRadius: 999,
                  border: "none",
                  boxShadow: "0 8px 24px rgba(255,234,0,0.12)",
                  cursor: "pointer",
                }}
              >
                Contact Customer Service
              </button>
            </div>
          </div>

          <CustomerServiceModal open={showModal} onClose={() => setShowModal(false)} onContact={handleContact} />
        </>
      ) : (
        // History Tab (cards stacked, dark card, rounded, shadow; amount on right)
        <div style={{ marginTop: 18, width: "100%", maxWidth: maxCardWidth, marginLeft: "auto", marginRight: "auto", padding: "0 10px 40px 10px" }}>
          {loading ? (
            <p style={{ textAlign: "center", fontSize: 16, color: "var(--db-muted, #888)", marginTop: 30 }}>Loading...</p>
          ) : allDeposits.length === 0 ? (
            <p style={{ textAlign: "center", fontSize: 16, color: "var(--db-muted, #888)", marginTop: 30 }}>No deposit records found.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {allDeposits.slice().reverse().map((deposit, index) => {
                const idRaw = deposit.orderId || deposit.txId || deposit.id || deposit._id || "";
                const id = String(idRaw || "").toUpperCase(); // CODE IN CAPITAL LETTERS
                const createdAt = deposit.createdAt ? formatDateISO(deposit.createdAt) : (deposit.date ? formatDateISO(deposit.date) : "");
                const amountStr = fmtNum(Number(deposit.amount || 0));
                const rightAmount = `+${amountStr}`;

                return (
                  <div
                    key={index}
                    style={{
                      background: "var(--db-card)",
                      borderRadius: 12,
                      padding: "16px 18px",
                      boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      color: "var(--db-text)"
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: "var(--db-text)", marginBottom: 8, wordBreak: "break-all" }}>{id}</div>
                      <div style={{ fontSize: 13, color: "var(--db-muted)" }}>{createdAt}</div>
                    </div>
                    <div style={{ marginLeft: 12, fontWeight: 800, fontSize: 18, color: "var(--db-accent)" }}>{rightAmount}</div>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ textAlign: "center", color: "var(--db-muted)", marginTop: 24 }}>No more data...</div>
        </div>
      )}
    </div>
  );
}