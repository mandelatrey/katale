export default function FarmerPortal({ user, onLogout }) {
  const initial = user?.name?.charAt(0)?.toUpperCase() ?? "F";

  return (
    <div style={{
      minHeight: "100vh",
      background: "#fafafa",
      fontFamily: "'Geist', system-ui, sans-serif",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Header */}
      <div style={{
        background: "#0d3b1a",
        padding: "14px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <img
          src="/assets/agribridge-logo-white.svg"
          alt="Agribridge"
          style={{ height: 24, width: "auto", filter: "brightness(0) invert(1) opacity(0.8)" }}
        />
        <button
          onClick={onLogout}
          style={{
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.15)",
            color: "rgba(255,255,255,0.7)",
            padding: "5px 12px",
            borderRadius: 7,
            fontSize: 12,
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Log out
        </button>
      </div>

      {/* Body */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
        gap: 32,
      }}>

        {/* Avatar + greeting */}
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: "#1f8a3e",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontSize: 22, fontWeight: 700,
            margin: "0 auto 16px",
          }}>
            {initial}
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#111827", letterSpacing: "-0.2px", marginBottom: 4 }}>
            {user?.name ?? "Farmer"}
          </div>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            padding: "3px 10px",
            background: "#e6f2ea",
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 600,
            color: "#1a6b30",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}>
            Farmer account
          </div>
        </div>

        {/* Status card */}
        <div style={{
          width: "100%", maxWidth: 400,
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 16,
          padding: "24px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: "#22c55e",
              boxShadow: "0 0 0 3px rgba(34,197,94,0.2)",
              flexShrink: 0,
            }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>Account active</span>
          </div>
          <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.65, margin: "0 0 16px" }}>
            Your Agribridge farmer account is set up. Use WhatsApp to check prices, receive daily market updates, and manage orders.
          </p>
          <div style={{
            padding: "12px 14px",
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#166534", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>
                WhatsApp number
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#111827", fontFamily: "'IBM Plex Mono', monospace" }}>
                +256 700 000 000
              </div>
            </div>
            <div style={{ fontSize: 11, color: "#16a34a" }}>Message us</div>
          </div>
        </div>

        {/* Quick commands */}
        <div style={{ width: "100%", maxWidth: 400 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
            Reply keywords
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {[
              { word: "PRICE", desc: "Today's prices", color: "#e6f2ea", text: "#1a6b30" },
              { word: "STOCK", desc: "Network stock", color: "#e6f2ea", text: "#1a6b30" },
              { word: "MORE",  desc: "See more",       color: "#e6f2ea", text: "#1a6b30" },
              { word: "HELP",  desc: "All commands",   color: "#f3f4f6", text: "#4b5563" },
              { word: "STOP",  desc: "Pause alerts",   color: "#fef3c7", text: "#92400e" },
            ].map(({ word, desc, color, text }) => (
              <div key={word} style={{
                padding: "6px 12px",
                background: color,
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}>
                <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", color: text }}>{word}</span>
                <span style={{ fontSize: 11, color: "#9ca3af" }}>— {desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
