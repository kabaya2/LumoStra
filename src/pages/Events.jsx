import React from "react";

// Event images (kept in dashboard images folder)
import event1 from "../assets/images/events/Events225.png";
import event2 from "../assets/images/events/Events.png";

/**
 * Events.jsx
 *
 * - Displays the event images as one continuous page (no frames, no gaps).
 * - Uses platform color variables where available, with sensible fallbacks.
 * - Only renders event1 and event2 (third image removed as requested).
 * - Images are edge-to-edge within the content column with no padding
 *   between them so they appear as a single long page.
 */

const styles = {
  page: {
    // Use platform dark background if available, otherwise fall back to a neutral dark gradient
    background: "linear-gradient(180deg, var(--db-bg, #0A0A0A), #000)",
    minHeight: "100vh",
    paddingBottom: 60, // room for global footer
    color: "var(--db-text, #E6E6E6)",
    WebkitFontSmoothing: "antialiased",
    MozOsxFontSmoothing: "grayscale",
  },
  container: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "18px 16px",
    boxSizing: "border-box",
  },
  titleRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 8,
    paddingBottom: 12,
  },
  backButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    padding: "6px 10px",
    background: "transparent",
    border: "none",
    color: "#F7E017", // lemon yellow
    fontWeight: 800, // bold
    fontSize: 20,
    lineHeight: 1,
    cursor: "pointer",
  },
  title: {
    fontSize: 22,
    fontWeight: 800,
    color: "var(--db-text, #E6E6E6)",
    margin: 0,
  },

  // The images wrapper removes any gap/padding/border between the images
  imagesWrap: {
    width: "100%",
    display: "block",
    margin: 0,
    padding: 0,
    background: "transparent",
  },

  // Each image fills the content width and sits flush with neighbors
  image: {
    display: "block",
    width: "100%",
    height: "auto",
    objectFit: "cover",
    margin: 0,
    padding: 0,
    border: "none",
    // subtle shadow to match platform aesthetic when images have transparent edges
    boxShadow: "0 6px 20px rgba(0,0,0,0.45)",
  },
};

export default function Events() {
  const eventImages = [event1, event2];

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.titleRow}>
          <button
            type="button"
            onClick={() => window.history.back()}
            aria-label="Go back"
            style={styles.backButton}
          >
            {/* bold arrow character for a clear back affordance */}
            <span aria-hidden="true">←</span>
          </button>

          <h1 style={styles.title}>Latest Events</h1>
        </div>

        <div style={styles.imagesWrap} aria-hidden={false}>
          {eventImages.map((src, idx) => (
            <img
              key={idx}
              src={src}
              alt={`Event poster ${idx + 1}`}
              style={styles.image}
              // prevent draggable default which can show ghost image gaps on some browsers
              draggable={false}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
