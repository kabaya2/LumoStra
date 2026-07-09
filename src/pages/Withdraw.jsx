import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBalance } from "../context/balanceContext";
import { useTransactions } from "../context/transactionContext";
import { useProfile } from "../context/profileContext";
// settings context
import { useSettings } from "../context/SettingsContext";

// Change: Remove "Approved" from 'success', so only "Completed" or "Success" are shown as "completed"
const WITHDRAW_STATUSES = {
  reviewing: ["Pending", "Reviewing", "In Review"],
  success: ["Completed", "Success"], // Removed "Approved"
  reject: ["Rejected", "Reject", "Failed"],
};
function normalizeStatus(status) {
  if (!status) return "reviewing";
  if (WITHDRAW_STATUSES.reviewing.some(s => status.toLowerCase().includes(s.toLowerCase()))) return "reviewing";
  if (WITHDRAW_STATUSES.success.some(s => status.toLowerCase().includes(s.toLowerCase()))) return "success";
  if (WITHDRAW_STATUSES.reject.some(s => status.toLowerCase().includes(s.toLowerCase()))) return "reject";
  // Handle "Approved" as a special case, display as "Completed"
  if (status.toLowerCase().includes("approved")) return "success";
  return "reviewing";
}

const START_BLUE = "#1fb6fc";
const BLACK_BG = "var(--db-card, #111)"; // use platform card color for header and primary elements

// Format date as YYYY-MM-DD HH:mm:ss in local time
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

export default function Withdraw() {
  const [tab, setTab] = useState("withdraw");
  const [historyTab, setHistoryTab] = useState("reviewing");
  const [amount, setAmount] = useState("");
  const [withdrawPassword, setWithdrawPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error"); // "error" or "success"
  const [showTxnModal, setShowTxnModal] = useState(false);
  const navigate = useNavigate();

  const { balance, refreshProfile } = useBalance();
  const { withdrawals, loading, refresh } = useTransactions();
  const { profile } = useProfile();

  // settings: currency string and format helper
  const { currency, formatAmount } = useSettings();
  // Map USDC -> USD and default to USD if nothing present
  const displayCurrency = currency && String(currency).toUpperCase() === "USDC" ? "USD" : (currency || "USD");

  const maxCardWidth = 640;

  // Filter withdrawals by normalized status for history tabs
  const filteredWithdrawals = (withdrawals || []).filter(
    w => normalizeStatus(w.status) === historyTab
  );

  // helper to format numeric amounts while keeping currency styling separate
  const fmtNum = (v) => {
    const n = Number(v || 0);
    if (!Number.isFinite(n)) return "";
    return n.toFixed(2);
  };

  // Called when user presses the large Withdraw button on the form.
  // Instead of directly submitting, open the modal exactly like the screenshot.
  const onOpenTxnModal = (e) => {
    e && e.preventDefault();
    setMessage("");
    setShowTxnModal(true);
  };

  // Actual withdraw submission performed by the modal's Submit button
  const performWithdraw = async () => {
    setMessage("");
    setMessageType("error");

    if (!amount || Number(amount) <= 0) {
      setMessage("Please enter a valid amount.");
      setShowTxnModal(false);
      return;
    }
    if (!withdrawPassword) {
      setMessage("Please enter your withdrawal password.");
      return;
    }
    const token = localStorage.getItem("authToken");
    const BASE_URL = "https://lumostra-admin.onrender.com";
    try {
      const res = await fetch(`${BASE_URL}/api/withdraw`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Token": token,
        },
        body: JSON.stringify({ amount, withdrawPassword }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage("Withdrawal request submitted and is under review.");
        setMessageType("success");
        setAmount("");
        setWithdrawPassword("");
        setShowTxnModal(false);
        try { refresh(); } catch (e) {}
        try { refreshProfile(); } catch (e) {}
      } else {
        setMessage(data.message || "Failed to withdraw.");
        setMessageType("error");
      }
    } catch (err) {
      setMessage("Network error. Please try again.");
      setMessageType("error");
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, var(--db-bg, #0A0A0A), #000)", color: "var(--db-text, #E6E6E6)", fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial", paddingBottom: 84 }}>
      {/* Header */}
      <div style={{
        background: BLACK_BG,
        color: "var(--db-text, #fff)",
        textAlign: "center",
        fontWeight: 800,
        fontSize: 20,
        padding: "14px 0",
        position: "relative"
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            position: "absolute", left: 14, top: "50%",
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
        <div style={{ fontSize: 20, fontWeight: 800, color: "var(--db-text, #E6E6E6)" }}>Withdraw</div>
      </div>

      {/* Tabs */}
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "transparent",
        borderBottom: "1px solid rgba(255,255,255,0.03)",
      }}>
        <button
          style={{
            flex: 1,
            padding: "18px 0 10px 0",
            fontWeight: 700,
            fontSize: 18,
            color: tab === "withdraw" ? "var(--db-text, #111)" : "var(--db-muted, #888)",
            background: "none",
            border: "none",
            borderBottom: tab === "withdraw" ? `3px solid var(--db-accent, #FFEA00)` : "3px solid transparent",
            cursor: "pointer"
          }}
          onClick={() => setTab("withdraw")}
        >
          Withdraw
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

      {/* Withdraw Tab */}
      {tab === "withdraw" ? (
        <>
          {/* Account card (dark rounded) */}
          <div
            style={{
              background: "var(--db-card, linear-gradient(180deg,#3a3a3b,#2a2a2a))",
              borderRadius: 14,
              margin: "20px auto",
              maxWidth: maxCardWidth,
              boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
              padding: 20,
              width: "94%",
              color: "var(--db-text, #fff)"
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.85)", marginBottom: 8 }}>Account Amount</div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
              <div style={{ fontSize: 34, fontWeight: 800, color: "var(--db-text, #fff)", lineHeight: 1 }}>
                {fmtNum(balance)}
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "rgba(255,255,255,0.8)", paddingBottom: 4 }}>{displayCurrency}</div>
            </div>
            <div style={{ color: "rgba(255,255,255,0.78)", marginTop: 10, fontSize: 14 }}>
              You will receive your withdrawal within an hour
            </div>
          </div>

          {/* Withdraw Form */}
          <form
            onSubmit={(e) => { e.preventDefault(); onOpenTxnModal(e); }}
            autoComplete="off"
            style={{
              margin: "0 auto",
              maxWidth: maxCardWidth,
              width: "94%",
              borderRadius: 8,
              background: "transparent",
              paddingTop: 6,
              display: "flex",
              flexDirection: "column",
              gap: 18
            }}
          >
            <div>
              <label style={{ display: "block", color: "var(--db-muted, #666)", fontWeight: 700, marginBottom: 8, fontSize: 16 }}>Withdraw Amount</label>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "12px 14px",
                    borderRadius: 6,
                    background: "var(--db-card)",
                    border: "1px solid rgba(255,255,255,0.03)",
                    fontSize: 16,
                    color: "var(--db-text)",
                    boxShadow: "0 1px 0 rgba(0,0,0,0.02)"
                  }}
                  placeholder="Withdraw Amount"
                  required
                />
                <button
                  type="button"
                  onClick={() => setAmount(String(fmtNum(balance)))}
                  style={{
                    background: "var(--db-card)",
                    color: "var(--db-text)",
                    borderRadius: 8,
                    padding: "10px 12px",
                    border: "none",
                    fontWeight: 800,
                    cursor: "pointer",
                    boxShadow: "0 4px 8px rgba(0,0,0,0.08)"
                  }}
                >
                  ALL
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: "block", color: "var(--db-muted, #666)", fontWeight: 700, marginBottom: 8, fontSize: 16 }}>Transaction Password</label>
              <input
                type="password"
                value={withdrawPassword}
                onChange={e => setWithdrawPassword(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 6,
                  background: "#eef6ff", // pale blue input background kept for clarity
                  border: "1px solid #eaeff7",
                  fontSize: 16,
                  color: "#222",
                }}
                placeholder="Transaction Password"
                required
              />
            </div>

            <button
              type="submit"
              style={{
                width: "100%",
                background: "var(--db-accent, #FFEA00)",
                color: "#111",
                fontWeight: 700,
                fontSize: 18,
                borderRadius: 10,
                border: "none",
                padding: "14px 0",
                marginTop: 6,
                cursor: "pointer",
                boxShadow: "0 6px 18px rgba(0,0,0,0.12)"
              }}
            >
              Withdraw
            </button>

            {message && (
              <div style={{ textAlign: "center", marginTop: 6, fontSize: 15, color: messageType === "success" ? "#18a93c" : "#b13636" }}>{message}</div>
            )}
          </form>
        </>
      ) : (
        // History Tab
        <div style={{ marginTop: 18, width: "100%", maxWidth: maxCardWidth, marginLeft: "auto", marginRight: "auto", padding: "0 8px 40px 8px" }}>
          {/* History Subtabs (styled like screenshot) */}
          <div style={{
            display: "flex",
            border: "1px solid rgba(255,255,255,0.03)",
            borderRadius: 6,
            marginBottom: 18,
            overflow: "hidden",
            background: "var(--db-card)"
          }}>
            {["reviewing", "success", "reject"].map(type => {
              const isActive = historyTab === type;
              return (
                <button
                  key={type}
                  style={{
                    flex: 1,
                    padding: "12px 10px",
                    fontWeight: 700,
                    fontSize: 16,
                    background: isActive ? "var(--db-card)" : "transparent",
                    color: isActive ? "var(--db-text)" : "var(--db-muted)",
                    outline: "none",
                    border: "none",
                    borderRight: type !== "reject" ? "1px solid rgba(255,255,255,0.03)" : "none",
                    cursor: "pointer"
                  }}
                  onClick={() => setHistoryTab(type)}
                >
                  {type === "reviewing" ? "Reviewing" : type === "success" ? "Success" : "Reject"}
                </button>
              );
            })}
          </div>

          {/* Filtered Withdrawals */}
          {loading ? (
            <p style={{ textAlign: "center", fontSize: 16, color: "var(--db-muted, #888)", marginTop: 30 }}>Loading...</p>
          ) : filteredWithdrawals.length === 0 ? (
            <p style={{ textAlign: "center", fontSize: 16, color: "var(--db-muted, #888)", marginTop: 30 }}>No more data...</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {filteredWithdrawals.slice().reverse().map((item, index) => {
                // Map fields to match screenshot layout
                const rawId = item.orderId || item.txId || item.id || item._id || "";
                const orderId = rawId ? String(rawId).toUpperCase() : "";
                const name = item.name || item.userName || item.username || profile?.username || "";
                const coin = item.coin || item.currency || item.asset || "";
                // Map USDC display to USD
                const coinDisplay = coin && String(coin).toUpperCase() === "USDC" ? "USD" : coin;
                const address = item.address || item.walletAddress || item.toAddress || item.receiver || "";
                const cryptoWallet = item.cryptoWallet || item.walletName || "";
                const withdrawFee = item.withdrawFee ?? item.fee ?? 0;
                const actualFee = item.actualFee ?? item.netAmount ?? item.amount ?? 0;
                const commissionFee = item.commissionFee ?? item.commission ?? 0;
                const commissionRate = item.commissionRate ?? item.commissionFeeRatio ?? 0;

                const statusKey = normalizeStatus(item.status);
                const statusColor =
                  statusKey === "success" ? "#18a93c" :
                  statusKey === "reject" ? "#b13636" : // maroon-ish
                  "#f0ad4e"; // reviewing yellow

                return (
                  <div
                    key={index}
                    style={{
                      background: "var(--db-card)",
                      boxShadow: "0 4px 12px 0 rgba(0,0,0,0.06)",
                      borderRadius: 10,
                      padding: "10px 12px",
                      fontSize: 14,
                      color: "var(--db-text)"
                    }}
                  >
                    {/* Order / tx id */}
                    <div style={{ color: "var(--db-muted)", fontSize: 13, marginBottom: 8, wordBreak: "break-all", fontWeight: 600 }}>{orderId}</div>

                    {/* thin divider */}
                    <div style={{ height: 1, background: "rgba(255,255,255,0.03)", margin: "6px 0 10px 0" }} />

                    {/* details grid (two columns: label on left, value on right) */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", rowGap: 8, columnGap: 12 }}>
                      <div style={{ color: "var(--db-muted)", fontWeight: 700, fontSize: 14 }}>Name</div>
                      <div style={{ color: "var(--db-text)", justifySelf: "end", fontSize: 14 }}>{name ? `: ${name}` : ":"}</div>

                      <div style={{ color: "var(--db-muted)", fontWeight: 700, fontSize: 14 }}>Coin</div>
                      <div style={{ color: "var(--db-text)", justifySelf: "end", fontSize: 14 }}>{coinDisplay ? `: ${coinDisplay}` : ":"}</div>

                      <div style={{ color: "var(--db-muted)", fontWeight: 700, fontSize: 14 }}>TRC-20 Wallet Address</div>
                      <div style={{ color: "var(--db-text)", justifySelf: "end", fontSize: 14 }}>{address ? `: ${address}` : ":"}</div>

                      <div style={{ color: "var(--db-muted)", fontWeight: 700, fontSize: 14 }}>Crypto Wallet</div>
                      <div style={{ color: "var(--db-text)", justifySelf: "end", fontSize: 14 }}>{cryptoWallet ? `: ${cryptoWallet}` : ":"}</div>

                      <div style={{ color: "var(--db-muted)", fontWeight: 700, fontSize: 14 }}>Withdraw Fee</div>
                      <div style={{ color: "var(--db-text)", justifySelf: "end", fontSize: 14 }}>{`: ${fmtNum(withdrawFee)}`}</div>

                      <div style={{ color: "var(--db-muted)", fontWeight: 700, fontSize: 14 }}>Actual Fee</div>
                      <div style={{ color: "var(--db-text)", justifySelf: "end", fontSize: 14 }}>{`: ${fmtNum(actualFee)}`}</div>

                      <div style={{ color: "var(--db-muted)", fontWeight: 700, fontSize: 14 }}>Commission Fee</div>
                      <div style={{ color: "var(--db-text)", justifySelf: "end", fontSize: 14 }}>{`: ${fmtNum(commissionFee)}`}</div>

                      <div style={{ color: "var(--db-muted)", fontWeight: 700, fontSize: 14 }}>Commission Fee Ratio</div>
                      <div style={{ color: "var(--db-text)", justifySelf: "end", fontSize: 14 }}>{`: ${commissionRate}%`}</div>

                      <div style={{ color: "var(--db-muted)", fontWeight: 700, fontSize: 14 }}>Status</div>
                      <div style={{ color: statusColor, fontWeight: 800, justifySelf: "end", fontSize: 14 }}>
                        {statusKey === "success" ? "Success" :
                          statusKey === "reject" ? (item.status || "Rejected") :
                          (item.status || "Reviewing")}
                      </div>

                      <div style={{ color: "var(--db-muted)", fontWeight: 700, fontSize: 14 }}>Created At</div>
                      <div style={{ color: "var(--db-text)", justifySelf: "end", fontSize: 14 }}>{formatDateISO(item.createdAt)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Transaction Password Modal (bottom sheet like screenshot) */}
      {showTxnModal && (
        <div
          onClick={() => setShowTxnModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 12000,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            padding: 0,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 900,
              background: "var(--db-card)",
              color: "var(--db-text)",
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              padding: 22,
              boxShadow: "0 -6px 30px rgba(0,0,0,0.18)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 18, color: "var(--db-text)" }}>Transaction Password</div>
              <button
                onClick={() => setShowTxnModal(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: 26,
                  color: "var(--db-muted)",
                  cursor: "pointer"
                }}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div style={{ marginTop: 8, marginBottom: 18 }}>
              <input
                type="password"
                value={withdrawPassword}
                onChange={e => setWithdrawPassword(e.target.value)}
                placeholder="•••••"
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 8,
                  background: "#eef6ff",
                  border: "1px solid #eaeff7",
                  fontSize: 16,
                  color: "#222",
                }}
                autoFocus
              />
            </div>

            <div style={{ padding: "6px 0 12px 0" }}>
              <button
                onClick={performWithdraw}
                style={{
                  width: "100%",
                  background: "var(--db-accent)",
                  color: "#111",
                  fontWeight: 700,
                  fontSize: 18,
                  borderRadius: 999,
                  border: "none",
                  padding: "14px 0",
                  cursor: "pointer",
                  boxShadow: "0 8px 24px rgba(255,234,0,0.12)"
                }}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
