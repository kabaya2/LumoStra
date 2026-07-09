name=Dashboard.jsx
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

// Header
import logo from "../assets/images/header/Logo9-removebg-preview.png";
import LanguageSwitcher from "../components/LanguageSwitcher";

// Video banner
import bannerVideo from "../assets/videos/home_bg_videos.mp4";

// Menu icons
import wfpIcon from "../assets/images/home/wfp-removebg-preview.png";
import serviceIcon from "../assets/images/home/service-removebg-preview.png";
import certificateIcon from "../assets/images/home/Certificate-removebg-preview.png";
import eventIcon from "../assets/images/home/Event-removebg-preview.png";
import withdrawIcon from "../assets/images/home/Withdraw-removebg-preview.png";
import depositIcon from "../assets/images/home/Deposit-removebg-preview.png";
import termsIcon from "../assets/images/home/T_C-removebg-preview.png";

// VIP images
import vip1 from "../assets/images/vip/VIP1Luno.png";
import vip2 from "../assets/images/vip/VIP2Luno.png";
import vip3 from "../assets/images/vip/VIP3Luno.png";
import vip4 from "../assets/images/vip/VIP4Luno.png";

import CustomerServiceModal from "../components/CustomerServiceModal";
import BottomNav from "../components/BottomNav.jsx"; // <-- added import for shared BottomNav

// Tab bar icons (ensure these imports exist so runtime processing won't crash)
import homeIcon from "../assets/images/tabBar/Homes.png";
import taskIcon from "../assets/images/tabBar/Start.png";
import recordsIcon from "../assets/images/tabBar/Record.png";
import profileIcon from "../assets/images/tabBar/My3.png";

// Partner logos (ensure this import exists)
import partnerRow from "../assets/images/home/partner_row.png";

const API_URL = "https://digitalblitz-backend.onrender.com";

/*
  Palette used across this page:
  --db-bg:       #0A0A0A  (page background)
  --db-card:     #2F2F31  (cards / panels)
  --db-accent:   #FFEA00  (primary lemon/yellow)
  --db-green:    #8BE13E
  --db-blue:     #5570A6
  --db-text:     #E6E6E6
  --db-muted:    #AAB0B6
*/

/* WithdrawPasswordModal kept as a bottom sheet - colors updated to palette */
function WithdrawPasswordModal({
  open,
  onClose,
  onSubmit,
  withdrawPassword,
  setWithdrawPassword,
  errorMsg,
  submitting,
}) {
  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 12000,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        pointerEvents: "auto",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 900,
          background: "var(--db-card)",
          color: "var(--db-text)",
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          padding: 22,
          boxShadow: "0 -6px 30px rgba(0,0,0,0.5)",
          border: "1px solid rgba(255,255,255,0.03)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 18, color: "var(--db-text)" }}>Withdrawal Password</div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              fontSize: 26,
              color: "var(--db-muted)",
              cursor: "pointer",
            }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <div style={{ marginTop: 8, marginBottom: 18 }}>
            <input
              type="password"
              value={withdrawPassword}
              onChange={(e) => setWithdrawPassword(e.target.value)}
              placeholder="•••••"
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 8,
                background: "#23272f",
                border: "1px solid rgba(255,255,255,0.03)",
                fontSize: 16,
                color: "var(--db-text)",
              }}
              autoFocus
              disabled={submitting}
            />
          </div>

          {errorMsg && (
            <div style={{ color: "#ff6b6b", marginBottom: 12, fontSize: 13 }}>
              {errorMsg}
            </div>
          )}

          <div style={{ padding: "6px 0 12px 0" }}>
            <button
              type="submit"
              disabled={submitting}
              style={{
                width: "100%",
                background: "var(--db-accent)",
                color: "#111",
                fontWeight: 700,
                fontSize: 18,
                borderRadius: 999,
                border: "none",
                padding: "14px 0",
                cursor: submitting ? "not-allowed" : "pointer",
                boxShadow: "0 8px 24px rgba(255,234,0,0.12)",
                opacity: submitting ? 0.9 : 1,
              }}
            >
              {submitting ? "Verifying..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();

  // -------------------------
  // Hooks (declare all here)
  // -------------------------
  const [user, setUser] = useState(null);
  const [vipLevel, setVipLevel] = useState(1);
  const [showServiceModal, setShowServiceModal] = useState(false);

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawPassword, setWithdrawPassword] = useState("");
  const [withdrawError, setWithdrawError] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  const vipImages = [vip1, vip2, vip3, vip4];
  const [vipIndex, setVipIndex] = useState(0);
  const vipIntervalRef = useRef(null);

  const menuRef = useRef(null);

  // processed icon data-urls (active/inactive) for bottom tabs
  const [processedIcons, setProcessedIcons] = useState({
    home: null,
    starting: null,
    records: null,
    profile: null,
  });

  // processed menu icons with transparent backgrounds (mask)
  const [processedMenuIcons, setProcessedMenuIcons] = useState({
    wfp: null,
    service: null,
    certificate: null,
    event: null,
    withdraw: null,
    deposit: null,
    terms: null,
  });

  // -------------------------
  // Ensure palette is applied at runtime (helps override cached global styles)
  // -------------------------
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--db-bg", "#0A0A0A");
    root.style.setProperty("--db-card", "#2F2F31");
    root.style.setProperty("--db-accent", "#FFEA00");
    root.style.setProperty("--db-green", "#8BE13E");
    root.style.setProperty("--db-blue", "#5570A6");
    root.style.setProperty("--db-text", "#E6E6E6");
    root.style.setProperty("--db-muted", "#AAB0B6");

    // Force body background/color so it shows even if global CSS is cached/overrides
    document.body.style.background = "linear-gradient(180deg, var(--db-bg), #000)";
    document.body.style.color = "var(--db-text)";

    // Inject a small global stylesheet to override likely components (BottomNav etc.)
    const css = `
      :root {
        --db-bg: #0A0A0A;
        --db-card: #2F2F31;
        --db-accent: #FFEA00;
        --db-green: #8BE13E;
        --db-blue: #5570A6;
        --db-text: #E6E6E6;
        --db-muted: #AAB0B6;
      }
      html, body {
        background: linear-gradient(180deg, var(--db-bg), #000) !important;
        color: var(--db-text) !important;
      }
      header {
        background: linear-gradient(90deg, var(--db-bg), #000) !important;
        color: var(--db-text) !important;
        border-bottom: 1px solid rgba(255,255,255,0.03) !important;
      }
      .menu-scroll button {
        background: var(--db-card) !important;
        border-radius: 12px !important;
        padding: 10px !important;
        box-shadow: 0 6px 14px rgba(0,0,0,0.5) !important;
        border: 1px solid rgba(255,255,255,0.02) !important;
      }
      .menu-scroll span { color: var(--db-accent) !important; font-weight: 700 !important; }
      .vip-card { background: var(--db-card) !important; box-shadow: 0 8px 30px rgba(0,0,0,0.6) !important; }
      .bottom-nav, .bottom-navigation, nav.bottom-nav, footer.bottom-nav, .bn, .bottom-nav-wrapper {
        background: var(--db-card) !important;
        border-top: 1px solid rgba(255,255,255,0.03) !important;
        color: var(--db-muted) !important;
        box-shadow: 0 -6px 30px rgba(0,0,0,0.6) !important;
      }
      .bottom-nav a.active, .bottom-navigation a.active, .bottom-nav .nav-item.active, .bn a.active {
        color: var(--db-accent) !important;
      }

      /* Reduce the overall height of the menu row so icons + labels look neat */
      .menu-button { align-items: center !important; justify-content: center !important; min-height: 92px !important; padding: 10px 12px !important; }
      .menu-button .icon-wrap { width: 56px !important; height: 56px !important; display:flex; align-items:center; justify-content:center; overflow: visible !important; }
      .menu-button .icon-wrap img { max-width: 48px !important; max-height: 48px !important; object-fit: contain !important; display:block !important; vertical-align: middle; }

      /* Make the "View More" control in VIP section green to match platform */
      .vip-view-more { color: var(--db-green) !important; font-weight: 700 !important; }

      /* OPPOSITE behavior: make VIP artwork expand to fill the card horizontally and grow with viewport.
         The artwork will fill the card area (width:100%, height:100%) and use object-fit: cover so it
         grows (and may crop) as the card grows. It will still be centered inside the card. */
      .vip-artwork {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0;
        pointer-events: none;
      }
      .vip-artwork img {
        width: 100%;
        height: 100%;
        object-fit: cover; /* fills and grows with the container */
        display: block;
        border-radius: 12px;
      }
    `;
    const styleEl = document.createElement("style");
    styleEl.setAttribute("data-injected-theme", "digital-blitz-black-yellow");
    styleEl.innerHTML = css;
    document.head.appendChild(styleEl);

    return () => {
      if (styleEl && styleEl.parentNode) styleEl.parentNode.removeChild(styleEl);
    };
  }, []);

  // -------------------------
  // Effects / other hooks
  // -------------------------
  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser");

    if (!storedUser) {
      navigate("/login");
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);

    fetch(`${API_URL}/api/user-profile`, {
      headers: { "x-auth-token": parsedUser.token },
    })
      .then((res) => res.json())
      .then((data) => {
        setVipLevel(data.user?.vipLevel || 1);
      })
      .catch(() => {});
  }, [navigate]);

  useEffect(() => {
    vipIntervalRef.current = setInterval(() => {
      setVipIndex((prev) => (prev + 1) % vipImages.length);
    }, 3500);

    return () => clearInterval(vipIntervalRef.current);
  }, []);

  // Runtime icon processor effect (kept as fallback; we render original icons by default)
  useEffect(() => {
    let mounted = true;

    async function processIcon(src) {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          try {
            const w = img.width || 64;
            const h = img.height || 64;
            const canvas = document.createElement("canvas");
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext("2d");
            ctx.clearRect(0, 0, w, h);
            ctx.drawImage(img, 0, 0, w, h);

            let imageData = ctx.getImageData(0, 0, w, h);
            let data = imageData.data;

            // Sample corner pixels to estimate background color
            function samplePixel(x, y) {
              const idx = (y * w + x) * 4;
              return [data[idx], data[idx + 1], data[idx + 2], data[idx + 3]];
            }

            const px1 = samplePixel(1, 1);
            const px2 = samplePixel(Math.max(1, w - 2), 1);
            const px3 = samplePixel(1, Math.max(1, h - 2));
            const px4 = samplePixel(Math.max(1, w - 2), Math.max(1, h - 2));

            const avgBg = [
              Math.round((px1[0] + px2[0] + px3[0] + px4[0]) / 4),
              Math.round((px1[1] + px2[1] + px3[1] + px4[1]) / 4),
              Math.round((px1[2] + px2[2] + px3[2] + px4[2]) / 4),
              Math.round((px1[3] + px2[3] + px3[3] + px4[3]) / 4),
            ];

            const threshold = 30; // color closeness threshold

            // Make background-like pixels transparent
            for (let i = 0; i < data.length; i += 4) {
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];
              const a = data[i + 3];

              const dr = Math.abs(r - avgBg[0]);
              const dg = Math.abs(g - avgBg[1]);
              const db = Math.abs(b - avgBg[2]);

              if (a > 0 && dr < threshold && dg < threshold && db < threshold) {
                data[i + 3] = 0;
              }
            }

            ctx.putImageData(imageData, 0, 0);

            // capture mask image (original colors, background stripped)
            const maskData = canvas.toDataURL();

            // Helper to tint non-transparent pixels to a given RGB color
            function tintedDataURL(targetRGB) {
              const c2 = document.createElement("canvas");
              c2.width = w;
              c2.height = h;
              const cctx = c2.getContext("2d");

              // draw the mask (image with transparent background)
              cctx.clearRect(0, 0, w, h);
              cctx.drawImage(canvas, 0, 0, w, h);

              const d = cctx.getImageData(0, 0, w, h);
              const dd = d.data;

              for (let i = 0; i < dd.length; i += 4) {
                const alpha = dd[i + 3];
                if (alpha > 0) {
                  dd[i] = targetRGB[0];
                  dd[i + 1] = targetRGB[1];
                  dd[i + 2] = targetRGB[2];
                }
              }

              cctx.putImageData(d, 0, 0);
              return c2.toDataURL();
            }

            const activeData = tintedDataURL([230, 230, 230]); // light
            const inactiveData = tintedDataURL([122, 122, 122]); // gray

            resolve({ mask: maskData, active: activeData, inactive: inactiveData });
          } catch (err) {
            resolve(null);
          }
        };

        img.onerror = () => {
          resolve(null);
        };

        img.src = src;
      });
    }

    async function runProcessing() {
      const tabEntries = await Promise.all([
        processIcon(homeIcon),
        processIcon(taskIcon),
        processIcon(recordsIcon),
        processIcon(profileIcon),
      ]);

      if (!mounted) return;

      setProcessedIcons({
        home: tabEntries[0],
        starting: tabEntries[1],
        records: tabEntries[2],
        profile: tabEntries[3],
      });

      const menuEntries = await Promise.all([
        processIcon(wfpIcon),
        processIcon(serviceIcon),
        processIcon(certificateIcon),
        processIcon(eventIcon),
        processIcon(withdrawIcon),
        processIcon(depositIcon),
        processIcon(termsIcon),
      ]);

      if (!mounted) return;

      setProcessedMenuIcons({
        wfp: menuEntries[0] ? menuEntries[0].mask : null,
        service: menuEntries[1] ? menuEntries[1].mask : null,
        certificate: menuEntries[2] ? menuEntries[2].mask : null,
        event: menuEntries[3] ? menuEntries[3].mask : null,
        withdraw: menuEntries[4] ? menuEntries[4].mask : null,
        deposit: menuEntries[5] ? menuEntries[5].mask : null,
        terms: menuEntries[6] ? menuEntries[6].mask : null,
      });
    }

    runProcessing();

    return () => {
      mounted = false;
    };
  }, []);

  // -------------------------
  // Non-hook helpers (safe to define after hooks)
  // -------------------------
  const handleWithdrawClick = () => {
    setWithdrawPassword("");
    setWithdrawError("");
    setShowWithdrawModal(true);
  };

  const submitWithdrawPassword = async (e) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();

    setWithdrawError("");
    setWithdrawLoading(true);
    try {
      const token = localStorage.getItem("authToken") || (user && user.token);
      if (!token) {
        setWithdrawError("You are not signed in — please log in and try again.");
        setWithdrawLoading(false);
        return;
      }

      const res = await fetch(`${API_URL}/api/verify-withdraw-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Token": token,
        },
        body: JSON.stringify({ password: withdrawPassword }),
      });

      const data = await res.json();

      if (data.success) {
        setShowWithdrawModal(false);
        navigate("/withdraw");
      } else {
        setWithdrawError(data.message || "Verification failed.");
      }
    } catch (err) {
      setWithdrawError("Verification failed.");
    } finally {
      setWithdrawLoading(false);
    }
  };

  // Add menu items (include key for processedMenuIcons mapping)
  const menuItems = [
    { key: "wfp", label: "WFP", icon: wfpIcon, path: "/wfp" },
    { key: "service", label: "Service", icon: serviceIcon, path: "/service" },
    { key: "certificate", label: "Certificate", icon: certificateIcon, path: "/certificate" },
    { key: "event", label: "Event", icon: eventIcon, path: "/events" },
    { key: "withdraw", label: "Withdrawal", icon: withdrawIcon, path: "/withdraw" },
    { key: "deposit", label: "Deposit", icon: depositIcon, path: "/deposit" },
    { key: "terms", label: "T & C", icon: termsIcon, path: "/terms" },
  ];

  // At this point all hooks have been declared, so early return is safe:
  if (!user) return null;

  const scrollMenu = (distance = 120) => {
    if (!menuRef.current) return;
    menuRef.current.scrollBy({ left: distance, behavior: "smooth" });
  };

  // derive active tab from current path (no extra imports or new state)
  const currentPath = typeof window !== "undefined" ? window.location.pathname : "";
  const isActive = (tabKey) => {
    if (tabKey === "home") return currentPath === "/" || currentPath === "/dashboard";
    if (tabKey === "starting") return currentPath.startsWith("/tasks") || currentPath.startsWith("/starting");
    if (tabKey === "records") return currentPath.startsWith("/records");
    if (tabKey === "profile") return currentPath.startsWith("/profile");
    return false;
  };

  // Inline styles and small CSS for animation effects so you don't need to change the separate CSS file
  const inlineAnimStyles = (
    <style>{`
      .animate-fade {
        animation: fadeEffect 1000ms ease;
      }
      @keyframes fadeEffect {
        0% { opacity: 0.55; transform: translateY(6px); }
        50% { opacity: 1; transform: translateY(0); }
        100% { opacity: 1; transform: translateY(0); }
      }
      /* small helper to ensure content scrolls under fixed header smoothly */
      .records-container { -webkit-overflow-scrolling: touch; }
    `}</style>
  );

  // small styles for menu button hover/label transitions to make it neat
  const menuStyles = (
    <style>{`
      .menu-button {
        transition: transform 220ms cubic-bezier(.2,.9,.24,1), box-shadow 220ms ease, background 220ms ease;
      }
      .menu-button:hover {
        transform: translateY(-6px);
        box-shadow: 0 10px 30px rgba(0,0,0,0.55);
      }
      .menu-label {
        transition: color 180ms ease, transform 180ms ease, opacity 180ms ease;
        font-weight: 700;
        font-size: 12px;
        letter-spacing: 0.28px;
        text-shadow: 0 1px 0 rgba(0,0,0,0.3);
      }
    `}</style>
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        paddingBottom: "74px",
        background:
          "radial-gradient(ellipse at 50% 8%, rgba(255,255,255,0.02) 0%, transparent 18%), linear-gradient(180deg, var(--db-bg) 0%, #0A0A0A 100%)",
        fontFamily: "system-ui, sans-serif",
        color: "var(--db-text)",
      }}
    >
      {inlineAnimStyles}
      {menuStyles}

      {/* HEADER */}
      <header
        className="text-white"
        style={{
          padding: "10px 16px",
          background: "linear-gradient(90deg,var(--db-bg),#0A0A0A)",
          boxShadow: "inset 0 -1px 0 rgba(255,255,255,0.02)",
          borderBottom: "1px solid rgba(255,255,255,0.02)",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              style={{
                background: "transparent",
                padding: "4px 6px",
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <img
                src={logo}
                alt="Logo"
                style={{ height: 52, objectFit: "contain", display: "block", opacity: 0.95 }}
              />
            </div>
            <span
              style={{
                fontSize: "20px",
                fontWeight: 800,
                letterSpacing: "1px",
                color: "var(--db-text)",
              }}
            >
              LumoStra
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                background: "transparent",
                padding: "6px 10px",
                borderRadius: 12,
                color: "var(--db-accent)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.35)",
                border: "1px solid rgba(255,255,255,0.02)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", color: "var(--db-accent)" }}>
                <LanguageSwitcher />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* HERO - increased height as requested (280px in provided file) */}
      <video
        src={bannerVideo}
        autoPlay
        muted
        loop
        playsInline
        style={{
          width: "100%",
          height: 280,
          objectFit: "cover",
          display: "block",
          background: "var(--db-bg)",
        }}
      />

      {/* ICON MENU */}
      <div
        style={{
          background: "linear-gradient(180deg, rgba(47,47,49,0.85), rgba(47,47,49,0.7))",
          padding: "6px 0 4px", // reduce overall vertical padding
          position: "relative",
          borderBottom: "1px solid rgba(255,255,255,0.02)",
        }}
      >
        {/* invisible left scroll button */}
        <button
          onClick={() => scrollMenu(-140)}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 40,
            background: "transparent",
            border: "none",
            zIndex: 10,
            cursor: "pointer",
          }}
          aria-hidden="true"
        />

        {/* icon scroll container */}
        <div
          ref={menuRef}
          style={{
            display: "flex",
            gap: 12,
            padding: "6px 44px",
            overflowX: "auto",
            scrollBehavior: "smooth",
            WebkitOverflowScrolling: "touch",
            msOverflowStyle: "none",
            scrollbarWidth: "none",
          }}
          className="menu-scroll"
        >
          <style>{`.menu-scroll::-webkit-scrollbar { display: none; }`}</style>

          {menuItems.map((item, i) => {
            return (
              <button
                key={i}
                onClick={() => {
                  if (item.key === "wfp") {
                    // navigate current tab to external WFP site (same-tab navigation)
                    window.location.href = "https://www.wfp.org/";
                    return;
                  }

                  if (item.key === "service") {
                    setShowServiceModal(true);
                    return;
                  }

                  if (item.key === "withdraw") {
                    handleWithdrawClick();
                    return;
                  }

                  navigate(item.path);
                }}
                className="menu-button flex flex-col items-center"
                style={{
                  background: "var(--db-card)",
                  border: "1px solid rgba(255,255,255,0.02)",
                  borderRadius: 12,
                  padding: "8px 12px",
                  minWidth: 88,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                  cursor: "pointer",
                }}
              >
                {/* icon-wrap ensures full icon is visible and centered; prefer original PNG */}
                <div className="icon-wrap" aria-hidden="true" style={{ width: 56, height: 56, display: "flex", alignItems: "center", justifyContent: "center", overflow: "visible" }}>
                  <img
                    src={item.icon || processedMenuIcons[item.key] || item.icon}
                    alt={item.label}
                    style={{
                      maxWidth: 48,
                      maxHeight: 48,
                      objectFit: "contain",
                      display: "block",
                      verticalAlign: "middle",
                    }}
                  />
                </div>

                <span
                  className="menu-label"
                  style={{
                    color: "var(--db-accent)",
                    fontWeight: 800,
                    textTransform: "none",
                    fontSize: 13,
                    marginTop: 2,
                  }}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* invisible right scroll button */}
        <button
          onClick={() => scrollMenu(140)}
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            width: 40,
            background: "transparent",
            border: "none",
            zIndex: 10,
            cursor: "pointer",
          }}
          aria-hidden="true"
        />
      </div>

      {/* VIP */}
      <div
        style={{
          width: "100%",
          boxSizing: "border-box",
          marginTop: 12, // tighten spacing
        }}
      >
        <div
          style={{
            background: "transparent",
            borderRadius: "20px 20px 0 0",
            paddingTop: 8,
            paddingBottom: 8,
            boxSizing: "border-box",
          }}
        >
          <div style={{ padding: "0 16px 8px", boxSizing: "border-box", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h3 className="text-white" style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Vip Levels</h3>
            </div>
            <button
              onClick={() => navigate("/premium")}
              className="vip-view-more"
              style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--db-green)", fontSize: 14, fontWeight: 700 }}
              aria-label="View more VIP levels"
            >
              View More &gt;
            </button>
          </div>

          {/* Inner card area (inset) */}
          <div
            style={{
              width: "100%",
              boxSizing: "border-box",
              display: "flex",
              justifyContent: "center",
              padding: "0 16px",
            }}
          >
            <div
              style={{
                width: "100%",
                maxWidth: 980,
                boxSizing: "border-box",
                padding: 0,
                margin: 0,
              }}
            >
              {/* BIGGER inner rounded card so VIP image is larger */}
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  overflow: "hidden",
                  borderRadius: 14,
                  height: 260, // slightly reduced height to tighten layout
                  background: "var(--db-card)",
                  boxShadow: "0 6px 18px rgba(0,0,0,0.55)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {/* carousel track */}
                <div
                  style={{
                    display: "flex",
                    height: "100%",
                    width: `${vipImages.length * 100}%`,
                    transform: `translateX(-${vipIndex * 100}%)`,
                    transition: "transform 420ms cubic-bezier(.22,.9,.32,1)",
                  }}
                >
                  {vipImages.map((img, i) => (
                    <div
                      key={i}
                      style={{
                        flex: `0 0 100%`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxSizing: "border-box",
                        padding: 0,
                        margin: 0,
                      }}
                      aria-hidden={vipIndex !== i}
                    >
                      {/* VIP image artwork wrapper: OPPOSITE behavior (fill card horizontally) */}
                      <div className="vip-artwork" aria-hidden={vipIndex !== i}>
                        <img
                          src={img}
                          alt={`vip-${i}`}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* indicators inside card bottom center */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 8,
                    left: "50%",
                    transform: "translateX(-50%)",
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    justifyContent: "center",
                    pointerEvents: "auto",
                  }}
                >
                  {vipImages.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setVipIndex(i)}
                      aria-label={`Go to slide ${i + 1}`}
                      style={{
                        width: vipIndex === i ? 28 : 8,
                        height: 8,
                        borderRadius: 20,
                        background:
                          vipIndex === i ? "var(--db-accent)" : "rgba(255,255,255,0.18)",
                        border: "none",
                        cursor: "pointer",
                        transition: "width 160ms ease",
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <section
        style={{
          background: "transparent",
          padding: "12px 8px 28px",
        }}
      >
        {/* Working With The Best image — responsive */}
        <div style={{ textAlign: "center", marginBottom: 18}}>
          <img
            src={partnerRow}
            alt="Partners"
            style={{
              width: "100%",
              height: "auto",
              maxWidth: 760,
              margin: "0 auto",
              display: "block",
              filter: "brightness(0.95)",
            }}
          />
        </div>

        <div
          style={{
            textAlign: "center",
            marginTop: 8,
            color: "var(--db-muted)",
            fontSize: 14,
          }}
        >
          2025—2026.
        </div>
      </section>

      {/* MODALS */}
      <WithdrawPasswordModal
        open={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        onSubmit={submitWithdrawPassword}
        withdrawPassword={withdrawPassword}
        setWithdrawPassword={setWithdrawPassword}
        errorMsg={withdrawError}
        submitting={withdrawLoading}
      />

      <CustomerServiceModal
        open={showServiceModal}
        onClose={() => setShowServiceModal(false)}
      />

      {/* Use the shared BottomNav component instead of the local inline nav */}
      <BottomNav />
    </div>
  );
}