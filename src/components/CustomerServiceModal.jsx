import React, { useEffect, useState } from "react";

// Logo imports (place your images at these paths)
import telegramLogo from "../assets/images/contact/telegram.png";
import signalLogo from "../assets/images/contact/signal.png";
import whatsappLogo from "../assets/images/contact/whatsapp.png";

const API_BASE = "https://digitalblitz-backend.onrender.com";
// Platform color variables with sensible fallbacks
const ACCENT = "var(--db-accent, #FFEA00)"; // lemon yellow
const CARD_BG = "var(--db-card, #111)";     // dark card
const HEADER_DARK = "var(--db-header-dark, #1f1f1f)"; // marked header/footer darker grey
const OVERLAY = "rgba(0,0,0,0.6)";
const TEXT = "var(--db-text, #E6E6E6)";
const MUTED = "var(--db-muted, #9aa0a6)";

/**
 * CustomerServiceModal
 * - Visual tweaks only:
 *   * Header and footer marked areas are darker grey.
 *   * Channel icons are larger and all the same size.
 * - Rows remain disabled when their specific link is missing. No "Not configured" text shown.
 *
 * Props:
 *  - open: boolean
 *  - onClose: function
 */
export default function CustomerServiceModal({ open, onClose }) {
  const [links, setLinks] = useState({
    telegram1: "",
    telegram2: "",
    customerService: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);

    // unchanged: fetch service links
    fetch(`${API_BASE}/service-links.json?ts=${Date.now()}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setLinks({
          telegram1: data.telegram1 || "",
          telegram2: data.telegram2 || "",
          customerService: data.whatsapp || data.customerService || "",
        });
      })
      .catch(() => {
        if (cancelled) return;
        setLinks({ telegram1: "", telegram2: "", customerService: "" });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

  if (!open) return null;

  // Right arrow affordance
  const Arrow = ({ color = ACCENT }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden style={{ flexShrink: 0 }}>
      <path
        d="M9 6l6 6-6 6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );

  // Bigger, uniform icon box
  const IconBox = ({ src, alt, disabled }) => (
    <div style={{
      width: 56,
      height: 56,
      borderRadius: 12,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      background: disabled ? "rgba(255,255,255,0.01)" : "linear-gradient(180deg, rgba(255,255,255,0.01), rgba(255,255,255,0.015))",
      border: "1px solid rgba(255,255,255,0.02)",
      marginRight: 14,
      flexShrink: 0
    }}>
      <img src={src} alt={alt} style={{ width: 36, height: 36, objectFit: "contain", display: "block", opacity: disabled ? 0.6 : 1 }} />
    </div>
  );

  // Open link (unchanged)
  const openLink = (url) => {
    if (!url) return;
    try {
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      window.location.href = url;
    }
    onClose && onClose();
  };

  // In-app chat fallback (kept but NOT used by rows)
  const handleChat = () => {
    const username = localStorage.getItem("user") || localStorage.getItem("currentUser") || "";
    if (!username) {
      alert("Please login first to start a chat with customer service.");
      return;
    }
    const chatUrl = `https://digitalblitz-cs.onrender.com/?user=${encodeURIComponent(username)}`;
    try {
      window.open(chatUrl, "_blank", "noopener,noreferrer");
    } catch {
      window.location.href = chatUrl;
    }
    onClose && onClose();
  };

  // Row renderer; disabled rows show no subtitle and look inactive
  const Row = ({ logo, label, linkKey }) => {
    const url = links[linkKey];
    const disabled = loading || !url;
    return (
      <button
        onClick={() => { if (!disabled) openLink(url); }}
        disabled={disabled}
        aria-label={`Contact via ${label}`}
        aria-disabled={disabled}
        style={{
          display: "flex",
          alignItems: "center",
          width: "100%",
          padding: "12px 16px",
          background: "transparent",
          border: "none",
          cursor: disabled ? "not-allowed" : "pointer",
          textAlign: "left",
          transition: "background 150ms ease, transform 120ms ease",
          outline: "none",
          opacity: disabled ? 0.55 : 1
        }}
        onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = "rgba(255,234,0,0.02)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        onFocus={(e) => { if (!disabled) e.currentTarget.style.boxShadow = `0 0 0 4px rgba(255,234,0,0.06)`; }}
        onBlur={(e) => { e.currentTarget.style.boxShadow = "none"; }}
      >
        <IconBox src={logo} alt={`${label} icon`} disabled={disabled} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: TEXT, lineHeight: 1 }}>{label}</div>
          {!disabled && (
            <div style={{ marginTop: 6, fontSize: 13, color: MUTED }}>
              Chat with our support team
            </div>
          )}
        </div>

        {/* Accent arrow in small circle */}
        <div style={{
          marginLeft: 12,
          width: 34,
          height: 34,
          borderRadius: 999,
          background: "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: `1px solid rgba(255,255,255,0.03)`
        }}>
          <div style={{
            width: 22, height: 22, borderRadius: 999,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: disabled ? "rgba(255,255,255,0.02)" : "transparent"
          }}>
            <Arrow />
          </div>
        </div>
      </button>
    );
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Customer Service"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1400,
        background: OVERLAY,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 18,
        WebkitFontSmoothing: "antialiased"
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 400,                // compact
          borderRadius: 14,
          overflow: "hidden",
          background: CARD_BG,
          border: `1px solid rgba(255,234,0,0.06)`,
          boxShadow: "0 12px 30px rgba(0,0,0,0.6)",
          color: TEXT,
          fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial"
        }}
      >
        {/* Header (make darker where marked) */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.03)",
          background: HEADER_DARK
        }}>
          <div style={{ color: ACCENT, fontWeight: 900, fontSize: 15, textTransform: "uppercase", letterSpacing: 0.8 }}>
            CONTACT SUPPORT
          </div>

          <button
            onClick={onClose}
            aria-label="Close customer service"
            style={{
              marginLeft: "auto",
              background: "transparent",
              border: "none",
              color: "rgba(255,255,255,0.6)",
              fontSize: 18,
              cursor: "pointer",
              padding: 6,
              lineHeight: 1
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Row logo={telegramLogo} label="Telegram" linkKey="telegram1" />
          <div style={{ height: 1, background: "rgba(255,255,255,0.01)" }} />
          <Row logo={signalLogo} label="Signal" linkKey="telegram2" />
          <div style={{ height: 1, background: "rgba(255,255,255,0.01)" }} />
          <Row logo={whatsappLogo} label="WhatsApp" linkKey="customerService" />
        </div>

        {/* Footer (make darker where marked) */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          padding: 14,
          borderTop: "1px solid rgba(255,255,255,0.03)",
          background: HEADER_DARK
        }}>
          <button
            onClick={onClose}
            style={{
              background: ACCENT,
              color: CARD_BG,
              border: "none",
              padding: "10px 28px",
              borderRadius: 999,
              fontWeight: 900,
              fontSize: 14,
              cursor: "pointer",
              boxShadow: "0 6px 18px rgba(255,234,0,0.08)",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}