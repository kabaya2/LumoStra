name=Records.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTaskRecords } from "../context/TaskRecordsContext";
import { useBalance } from "../context/balanceContext";
import "./Records.css";

// settings (currency)
import { useSettings } from "../context/SettingsContext";

import BottomNav from "../components/BottomNav.jsx"; // shared BottomNav

const tabs = ["All", "Pending", "Completed"];

// Match the palette used on the updated Tasks page
const START_ACCENT = "#FFEA00";
const BLACK_BG = "#0A0A0A";
const CARD_SURFACE = "#2F2F31";
const TEXT_LIGHT = "#E6E6E6";
const MUTED = "#AAB0B6";

const TAB_BAR_HEIGHT = 72;

function SpinnerOverlay({ show }) {
  if (!show) return null;
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 11000,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          border: "6px solid rgba(255,255,255,0.06)",
          borderTop: `6px solid ${START_ACCENT}`,
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function GreyToast({ show, message }) {
  if (!show) return null;
  return (
    <div
      style={{
        position: "fixed",
        left: "50%",
        top: "22%",
        transform: "translateX(-50%)",
        background: CARD_SURFACE,
        color: TEXT_LIGHT,
        borderRadius: 10,
        padding: "10px 28px",
        fontWeight: 500,
        fontSize: 15.5,
        boxShadow: "0 6px 24px rgba(0,0,0,0.6)",
        zIndex: 99999,
        minWidth: 210,
        maxWidth: "80vw",
        display: "flex",
        alignItems: "center",
      }}
    >
      <span
        style={{
          width: 22,
          height: 22,
          border: "3px solid rgba(255,255,255,0.06)",
          borderTop: "3px solid #bbb",
          borderRadius: "50%",
          marginRight: 13,
          display: "inline-block",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <span>{message}</span>
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// Hoisted function component to avoid TDZ/circular import issues
export default function Records() {
  // inject palette variables so CSS using var(--db-*) matches Tasks page palette
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--db-bg", BLACK_BG);
    root.style.setProperty("--db-card", CARD_SURFACE);
    root.style.setProperty("--db-accent", START_ACCENT);
    root.style.setProperty("--db-text", TEXT_LIGHT);
    root.style.setProperty("--db-muted", MUTED);
    root.style.setProperty("--glass", "rgba(255,255,255,0.03)");

    // apply a safe fallback body background to ensure page matches
    document.body.style.background = `linear-gradient(180deg, ${BLACK_BG}, #000)`;
    document.body.style.color = TEXT_LIGHT;
  }, []);

  const [activeTab, setActiveTab] = useState("All");
  const navigate = useNavigate();
  const { records, submitTaskRecord, refreshRecords } = useTaskRecords();
  const { balance, refreshProfile } = useBalance();
  const [submitting, setSubmitting] = useState({});
  const [submitted, setSubmitted] = useState({});
  const [greyToast, setGreyToast] = useState({ show: false, message: "" });
  const [showSpinner, setShowSpinner] = useState(false);
  const [tabAnimating, setTabAnimating] = useState(false);
  const [pageEnterAnim, setPageEnterAnim] = useState(false);

  const { currency } = useSettings();

  const scheduleNonBlocking = (fn) => {
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      try {
        window.requestIdleCallback(fn, { timeout: 500 });
      } catch {
        setTimeout(fn, 0);
      }
    } else {
      setTimeout(fn, 0);
    }
  };

  useEffect(() => {
    if (refreshRecords) {
      scheduleNonBlocking(() => {
        try {
          refreshRecords();
        } catch (e) {}
      });
    }

    setGreyToast({ show: true, message: "Refresh success" });
    const hideToast = setTimeout(() => setGreyToast({ show: false, message: "" }), 800);

    setPageEnterAnim(true);
    const t = setTimeout(() => setPageEnterAnim(false), 800);

    return () => {
      clearTimeout(t);
      clearTimeout(hideToast);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      scheduleNonBlocking(() => {
        refreshRecords && refreshRecords();
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [refreshRecords]);

  const augmentedRecords = useMemo(() => {
    if (!Array.isArray(records)) return [];
    return records.map((r) => {
      const raw = r.startedAt || r.createdAt || r.completedAt || r.addedAt || r.updatedAt || null;
      const ts = raw ? Date.parse(raw) || 0 : 0;
      return { __ts: ts, ...r };
    });
  }, [records]);

  const pendingComboGroups = useMemo(() => {
    const groups = {};
    for (const rec of augmentedRecords) {
      if (String(rec.status || "").toLowerCase() === "pending" && rec.comboGroupId) {
        if (!groups[rec.comboGroupId]) groups[rec.comboGroupId] = [];
        groups[rec.comboGroupId].push(rec);
      }
    }
    Object.values(groups).forEach((arr) => arr.sort((a, b) => (a.__ts || 0) - (b.__ts || 0)));
    return groups;
  }, [augmentedRecords]);

  const lastPendingComboTaskCodes = useMemo(() => {
    return Object.values(pendingComboGroups)
      .map((comboRecords) => (comboRecords && comboRecords.length ? comboRecords[comboRecords.length - 1].taskCode : null))
      .filter(Boolean);
  }, [pendingComboGroups]);

  const filteredRecords = useMemo(() => {
    if (!Array.isArray(augmentedRecords)) return [];
    const at = (activeTab || "").toLowerCase();
    return augmentedRecords.filter((record) => {
      if (at === "all" || !activeTab) return true;
      return record.status && String(record.status).toLowerCase() === at;
    });
  }, [augmentedRecords, activeTab]);

  const sortedRecords = useMemo(() => {
    const arr = [...filteredRecords];
    arr.sort((a, b) => {
      if (
        a.comboGroupId &&
        b.comboGroupId &&
        a.comboGroupId === b.comboGroupId &&
        String(a.status || "").toLowerCase() === "pending" &&
        String(b.status || "").toLowerCase() === "pending"
      ) {
        return (b.canSubmit ? 1 : 0) - (a.canSubmit ? 1 : 0);
      }
      return (b.__ts || 0) - (a.__ts || 0);
    });
    return arr;
  }, [filteredRecords]);

  const getRecordKey = (record, i) => {
    if (record.isCombo && typeof record.comboIndex !== "undefined") {
      return `${record.taskCode || record._id || "noid"}-combo-${record.comboIndex}`;
    }
    return record.taskCode || record._id || `idx-${i}`;
  };

  const showGrey = (message, duration = 1600) => {
    setGreyToast({ show: true, message });
    setTimeout(() => setGreyToast({ show: false, message: "" }), duration);
  };

  const handleSubmit = async (task) => {
    if (task.isCombo && task.canSubmit && balance < 0) {
      showGrey("Insufficient Balance.");
      setTimeout(() => {
        navigate("/deposit");
      }, 1600);
      return;
    }
    setSubmitting((prev) => ({ ...prev, [task.taskCode]: true }));
    setSubmitted((prev) => ({ ...prev, [task.taskCode]: false }));
    try {
      const result = await submitTaskRecord(task.taskCode);
      setSubmitting((prev) => ({ ...prev, [task.taskCode]: false }));
      if (!result.success && result.mustDeposit) {
        showGrey("Insufficient Balance.");
        setTimeout(() => {
          navigate("/deposit");
        }, 1600);
        return;
      }
      if (!result.success) {
        alert(result.message || "Failed to submit task.");
      } else {
        setSubmitted((prev) => ({ ...prev, [task.taskCode]: true }));
        await refreshProfile();
        scheduleNonBlocking(() => {
          refreshRecords && refreshRecords();
        });
        setTimeout(() => {
          setSubmitted((prev) => ({ ...prev, [task.taskCode]: false }));
        }, 1500);
      }
    } catch (err) {
      setSubmitting((prev) => ({ ...prev, [task.taskCode]: false }));
      alert("Submission failed");
    }
  };

  const getRecordImage = (product) => {
    if (product && typeof product.image === "string" && product.image.trim() !== "" && product.image !== "null") {
      return product.image;
    }
    return "/assets/images/products/default.png";
  };

  const fmtNum = (v) => {
    const n = Number(v || 0);
    if (!Number.isFinite(n)) return "";
    return n.toFixed(2);
  };

  const onTabClick = (tab) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    showGrey("Refresh success", 800);
    setTabAnimating(true);
    setTimeout(() => setTabAnimating(false), 300);
    scheduleNonBlocking(() => {
      try {
        refreshRecords && refreshRecords();
      } catch (e) {
        console.error("refreshRecords error on tab click:", e);
      }
    });
  };

  const renderProductRecord = (record, i) => {
    const dateStr = record.completedAt
      ? new Date(record.completedAt).toLocaleString()
      : record.startedAt
      ? new Date(record.startedAt).toLocaleString()
      : record.createdAt
      ? new Date(record.createdAt).toLocaleString()
      : "";

    const isPendingButton = String(record.status || "").toLowerCase() === "pending";

    return (
      <div key={getRecordKey(record, i)} style={{ marginBottom: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "0 8px 8px" }}>
          <div style={{ color: "var(--db-muted)", fontSize: 13, fontWeight: 700 }}>{dateStr}</div>

          <div>
            <span
              style={{
                padding: "6px 12px",
                borderRadius: 10,
                background: record.status === "Completed" ? "#1f1f1f" : CARD_SURFACE,
                color: "#fff",
                fontWeight: 700,
                fontSize: 12,
                display: "inline-block",
              }}
            >
              {record.status}
            </span>
          </div>
        </div>

        <div
          className={`record-card ${tabAnimating || pageEnterAnim ? "animate-fade" : ""}`}
          style={{
            background: "var(--db-card)",
            borderRadius: 12,
            boxShadow: "0 8px 26px rgba(0,0,0,0.6)",
            marginBottom: 6,
            padding: "12px 12px",
            position: "relative",
          }}
        >
          <div className="record-content" style={{ marginBottom: 8 }}>
            <img
              src={getRecordImage(record.product)}
              alt={record.product?.name || "Product"}
              className="record-img"
              style={{
                width: 84,
                height: 84,
                borderRadius: 12,
                objectFit: "cover",
                background: "#161616",
                border: "1px solid rgba(255,255,255,0.03)",
                flex: "0 0 84px",
              }}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "/assets/images/products/default.png";
              }}
            />
            <div className="record-info" style={{ marginLeft: 12 }}>
              <div className="truncate" style={{ fontSize: 17, fontWeight: 800, color: "var(--db-text)", marginBottom: 6 }}>
                {record.product?.name}
              </div>

              <div style={{ color: "var(--db-muted)", fontSize: 13, marginBottom: 6 }}>
                {currency || ""} {fmtNum(record.product?.price)}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ color: "#FFD54A", fontSize: 14, lineHeight: 1 }}>
                  <span>★</span>
                  <span>★</span>
                  <span>★</span>
                  <span>★</span>
                  <span>★</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid rgba(255,255,255,0.02)", paddingTop: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: "var(--db-muted)", fontSize: 12, marginBottom: 6 }}>Total Amount</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "var(--db-text)" }}>
                {currency || ""} {fmtNum(record.product?.price)}
              </div>
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ color: "var(--db-muted)", fontSize: 12, marginBottom: 6 }}>Commission</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "var(--db-text)" }}>
                {currency || ""} {fmtNum(record.product?.commission)}
              </div>
            </div>
          </div>

          {(
            ((record.status === "Pending" && (!record.isCombo || record.canSubmit)) ||
              (submitted[record.taskCode] && record.status === "Completed"))
          ) && (
            (!record.comboGroupId ||
              lastPendingComboTaskCodes.includes(record.taskCode) ||
              record.canSubmit) && (
              <div style={{ marginTop: 10 }}>
                <button
                  className="submit-btn"
                  style={{
                    width: "100%",
                    borderRadius: 12,
                    padding: "10px 0",
                    fontWeight: 700,
                    fontSize: 15,
                    background: isPendingButton ? BLACK_BG : START_ACCENT,
                    color: isPendingButton ? "#fff" : "#111",
                    opacity: submitting[record.taskCode] ? 0.8 : 1,
                    boxShadow: `0 4px 14px ${isPendingButton ? `${BLACK_BG}22` : `${START_ACCENT}22`}`,
                  }}
                  onClick={() => handleSubmit(record)}
                  disabled={submitting[record.taskCode] || submitted[record.taskCode]}
                >
                  {submitting[record.taskCode] ? "Submitting..." : submitted[record.taskCode] ? "Submitted" : "Submit"}
                </button>
              </div>
            )
          )}
        </div>
      </div>
    );
  };

  const inlineAnimStyles = (
    <style>{`
      .animate-fade { animation: fadeEffect 1000ms ease; }
      @keyframes fadeEffect {
        0% { opacity: 0.55; transform: translateY(6px); }
        50% { opacity: 1; transform: translateY(0); }
        100% { opacity: 1; transform: translateY(0); }
      }
      .records-container { -webkit-overflow-scrolling: touch; }
    `}</style>
  );

  return (
    <div className="records-container" style={{ minHeight: "100vh", paddingBottom: 78 }}>
      {inlineAnimStyles}
      <SpinnerOverlay show={showSpinner} />
      <GreyToast show={greyToast.show} message={greyToast.message} />

      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: TAB_BAR_HEIGHT,
          background: "var(--db-card)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1200,
          boxShadow: "0 2px 12px rgba(0,0,0,0.24)",
          borderBottom: "1px solid rgba(255,255,255,0.02)"
        }}
      >
        <div className="tabs" style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", width: "100%", maxWidth: 980 }}>
          {tabs.map((tab) => (
            <div
              key={tab}
              className={`tab ${activeTab === tab ? "active" : ""}`}
              style={{
                cursor: "pointer",
                padding: "10px 6px",
                textAlign: "center",
                borderRadius: 18,
                fontWeight: activeTab === tab ? 800 : 700,
                fontSize: 16,
                flex: 1,
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
                color: activeTab === tab ? "var(--db-accent)" : "var(--db-muted)"
              }}
              onClick={() => onTabClick(tab)}
              data-i18n={tab}
            >
              <div style={{ paddingBottom: activeTab === tab ? 6 : 12, borderBottom: activeTab === tab ? `4px solid var(--db-accent)` : "4px solid transparent" }}>
                {tab}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ height: TAB_BAR_HEIGHT }} />
      <div style={{ height: 6 }} />

      <div className={`record-list px-2 ${tabAnimating || pageEnterAnim ? "animate-fade" : ""}`} style={{ gap: 10 }}>
        {showSpinner ? (
          <div style={{ height: "80px" }} />
        ) : sortedRecords.length === 0 ? (
          <p className="no-records" style={{ padding: 12, color: "var(--db-muted)" }} data-i18n="No records in this category.">
            No records in this category.
          </p>
        ) : (
          sortedRecords.map((record, i) => renderProductRecord(record, i))
        )}
      </div>

      <BottomNav />
    </div>
  );
}