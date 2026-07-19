import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const BACKEND_API = "https://lumostra-admins.onrender.com/api";

export default function BindWallet() {
  // Platform color tokens (adjust if needed)
  const COLORS = {
    pageBg: "linear-gradient(180deg, #0A0A0A, #000)",
    cardBg: "#0f1113",
    inputBg: "#0b0d0f",
    inputBorder: "#1f2528",
    text: "#E6E6E6",
    muted: "#9aa0a6",
    accent: "#FFD400",
    accentText: "#111",
    success: "#16a34a",
    shadow: "rgba(0,0,0,0.5)",
  };

  const [fullName, setFullName] = useState("");
  const [walletName, setWalletName] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem("currentUser");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed);
        setFullName(parsed.fullName || "");
        setWalletName(parsed.exchange || parsed.walletName || "");
        setWalletAddress(parsed.walletAddress || parsed.wallet || "");
      } catch (e) {
        // Malformed localStorage — force re-login
        localStorage.removeItem("currentUser");
        navigate("/login");
      }
    } else {
      // Not logged in
      navigate("/login");
    }
  }, [navigate]);

  const handleUpdate = async () => {
    if (!fullName.trim()) {
      alert("Please enter your full name.");
      return;
    }
    if (!walletName.trim()) {
      alert("Please enter wallet name.");
      return;
    }
    if (!walletAddress.trim()) {
      alert("Please enter wallet address.");
      return;
    }

    setLoading(true);

    try {
      // Prefer global auth token key, fallback to token in currentUser
      const token = localStorage.getItem("authToken") || user?.token;
      if (!token) {
        setLoading(false);
        alert("Authentication token missing. Please log in again.");
        navigate("/login");
        return;
      }

      const res = await fetch(`${BACKEND_API}/bind-wallet`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": token,
        },
        body: JSON.stringify({
          fullName,
          exchange: walletName,
          walletAddress,
        }),
      });

      if (res.status === 401 || res.status === 403) {
        setLoading(false);
        alert("Not authorized. Please log in again.");
        navigate("/login");
        return;
      }

      const data = await res.json();
      setLoading(false);

      if (data.success) {
        const updatedUser = {
          ...user,
          fullName,
          exchange: walletName,
          walletAddress,
        };
        try {
          localStorage.setItem("currentUser", JSON.stringify(updatedUser));
        } catch (e) {
          // ignore localStorage errors
        }
        setUser(updatedUser);
        setShowToast(true);
        setTimeout(() => {
          setShowToast(false);
          navigate("/profile");
        }, 1400);
      } else {
        alert(data.message || "Failed to update wallet details.");
      }
    } catch (err) {
      setLoading(false);
      alert("Network error — failed to update wallet details.");
    }
  };

  if (!user) return null;

  const baseInputStyle = {
    width: "100%",
    padding: "14px 16px",
    borderRadius: 8,
    border: `1px solid ${COLORS.inputBorder}`,
    background: COLORS.inputBg,
    fontSize: 15,
    fontWeight: 600,
    boxSizing: "border-box",
    color: COLORS.text,
    outline: "none",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: COLORS.pageBg,
        position: "relative",
        fontFamily: "Inter, Arial, sans-serif",
        color: COLORS.text,
        WebkitFontSmoothing: "antialiased",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "#000",
          color: COLORS.text,
          padding: "14px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "sticky",
          top: 0,
          zIndex: 40,
          boxSizing: "border-box",
          borderBottom: `1px solid ${COLORS.inputBorder}`,
        }}
      >
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          style={{
            position: "absolute",
            left: 12,
            top: "50%",
            transform: "translateY(-50%)",
            background: "transparent",
            border: "none",
            padding: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden>
            <polyline
              points="15 6 9 12 15 18"
              stroke={COLORS.text}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <div style={{ fontSize: 20, fontWeight: 800 }}>Bind Wallet</div>
      </div>

      {/* Content */}
      <div style={{ padding: 22, maxWidth: 720, margin: "0 auto", boxSizing: "border-box" }}>
        <div
          style={{
            background: COLORS.cardBg,
            padding: 20,
            borderRadius: 12,
            border: `1px solid ${COLORS.inputBorder}`,
            boxShadow: `0 8px 28px ${COLORS.shadow}`,
          }}
        >
          {/* Full Name */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: "block", fontWeight: 800, fontSize: 16, marginBottom: 8, color: COLORS.text }}>
              Full Name
            </label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Full Name"
              style={baseInputStyle}
            />
          </div>

          {/* Wallet Name */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: "block", fontWeight: 800, fontSize: 16, marginBottom: 8, color: COLORS.text }}>
              Wallet Name
            </label>
            <input
              value={walletName}
              onChange={(e) => setWalletName(e.target.value)}
              placeholder="Wallet Name (e.g., Binance, Trust Wallet)"
              style={baseInputStyle}
            />
          </div>

          {/* Wallet Address */}
          <div style={{ marginBottom: 6 }}>
            <label style={{ display: "block", fontWeight: 800, fontSize: 16, marginBottom: 8, color: COLORS.text }}>
              Wallet Address
            </label>
            <input
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="Wallet Address"
              style={baseInputStyle}
            />
          </div>

          <div style={{ marginTop: 18 }}>
            <button
              onClick={handleUpdate}
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: 10,
                background: loading ? "#777" : COLORS.accent,
                color: COLORS.accentText,
                fontSize: 16,
                fontWeight: 800,
                border: "none",
                cursor: loading ? "default" : "pointer",
                boxShadow: `0 10px 24px ${COLORS.shadow}`,
              }}
            >
              {loading ? "Updating..." : "Update"}
            </button>
          </div>
        </div>
      </div>

      {/* Success Toast */}
      {showToast && (
        <div
          role="status"
          style={{
            position: "fixed",
            bottom: 18,
            left: "50%",
            transform: "translateX(-50%)",
            background: COLORS.success,
            color: "#fff",
            padding: "10px 14px",
            borderRadius: 8,
            fontWeight: 700,
            boxShadow: "0 6px 18px rgba(0,0,0,0.18)",
            zIndex: 80,
          }}
        >
          ✅ Wallet updated successfully!
        </div>
      )}
    </div>
  );
}
