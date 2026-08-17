import { useState } from "react";

const PHONE_RE = /^\+[1-9]\d{7,14}$/;

function EyeIcon({ open }) {
  return open ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

function Field({ label, type = "text", value, onChange, placeholder, error, autoComplete }) {
  const [revealed, setRevealed] = useState(false);
  const isPassword = type === "password";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: "#374151", letterSpacing: "0.05em", textTransform: "uppercase" }}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <input
          type={isPassword && revealed ? "text" : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          style={{
            width: "100%",
            padding: isPassword ? "9px 38px 9px 12px" : "9px 12px",
            fontSize: 14,
            border: `1px solid ${error ? "#dc2626" : "#e5e7eb"}`,
            borderRadius: 8,
            outline: "none",
            background: "#fff",
            color: "#111827",
            fontFamily: "inherit",
            transition: "border-color 0.15s",
            boxSizing: "border-box",
          }}
          onFocus={(e) => { if (!error) e.target.style.borderColor = "#1f8a3e"; }}
          onBlur={(e) => { if (!error) e.target.style.borderColor = "#e5e7eb"; }}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed(v => !v)}
            style={{
              position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", cursor: "pointer",
              color: "#9ca3af", display: "flex", alignItems: "center", padding: 2,
              transition: "color 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.color = "#374151"}
            onMouseLeave={e => e.currentTarget.style.color = "#9ca3af"}
            tabIndex={-1}
          >
            <EyeIcon open={revealed} />
          </button>
        )}
      </div>
      {error && <span style={{ fontSize: 11, color: "#dc2626" }}>{error}</span>}
    </div>
  );
}

function LoginForm({ onLogin }) {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  const normalizePhone = (v) => {
    const stripped = v.replace(/\s/g, "");
    if (stripped && !stripped.startsWith("+")) return "+" + stripped;
    return stripped;
  };

  const validate = () => {
    const e = {};
    if (!PHONE_RE.test(phone)) e.phone = "Enter a valid phone number (e.g. +256700000000)";
    if (!password) e.password = "Password is required";
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setServerError("");
    setSubmitting(true);
    try {
      await onLogin(phone, password);
    } catch (err) {
      setServerError(err.message || "Invalid credentials");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Field
        label="Phone number"
        type="tel"
        value={phone}
        onChange={(v) => setPhone(normalizePhone(v))}
        placeholder="Add your whatsapp number"
        error={errors.phone}
        autoComplete="tel"
      />
      <Field
        label="Password"
        type="password"
        value={password}
        onChange={setPassword}
        placeholder="Enter your password"
        error={errors.password}
        autoComplete="current-password"
      />
      {serverError && (
        <div style={{ padding: "8px 12px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 7, fontSize: 13, color: "#dc2626" }}>
          {serverError}
        </div>
      )}
      <button
        type="submit"
        disabled={submitting}
        style={{
          marginTop: 4,
          padding: "10px 0",
          background: submitting ? "#6b7280" : "#1f8a3e",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 600,
          cursor: submitting ? "not-allowed" : "pointer",
          fontFamily: "inherit",
          transition: "background 0.15s",
        }}
      >
        {submitting ? "Logging in…" : "Log in"}
      </button>
    </form>
  );
}

function SignupForm({ onSignup }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState("");

  const normalizePhone = (v) => {
    const stripped = v.replace(/\s/g, "");
    if (stripped && !stripped.startsWith("+")) return "+" + stripped;
    return stripped;
  };

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = "Name is required";
    if (!PHONE_RE.test(phone)) e.phone = "Enter a valid phone number (e.g. +256700000000)";
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setServerError("");
    setSubmitting(true);
    try {
      await onSignup(name.trim(), phone);
      setSuccess(true);
    } catch (err) {
      setServerError(err.message || "Signup failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16, textAlign: "center" }}>
        <div style={{
          width: 48, height: 48, borderRadius: "50%",
          background: "#e6f2ea", display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto",
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1f8a3e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#111827", marginBottom: 6 }}>Account created</div>
          <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6 }}>
            Your Agribridge farmer account is active.<br />
            Send a WhatsApp message to get started.
          </div>
        </div>
        <div style={{
          padding: "12px 16px",
          background: "#f0fdf4",
          border: "1px solid #bbf7d0",
          borderRadius: 10,
          fontSize: 13,
          color: "#166534",
          fontWeight: 500,
        }}>
          WhatsApp: +256 700 000 000
        </div>
        <div style={{ fontSize: 12, color: "#9ca3af" }}>
          Reply HELP to see what you can ask
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Field
        label="Full name"
        value={name}
        onChange={setName}
        placeholder="e.g. Wanyama Joseph"
        error={errors.name}
        autoComplete="name"
      />
      <Field
        label="WhatsApp number"
        type="tel"
        value={phone}
        onChange={(v) => setPhone(normalizePhone(v))}
        placeholder="Add your whatsapp number"
        error={errors.phone}
        autoComplete="tel"
      />
      <p style={{ fontSize: 12, color: "#9ca3af", margin: 0, lineHeight: 1.5 }}>
        This number is how we identify you on WhatsApp. No password needed.
      </p>
      {serverError && (
        <div style={{ padding: "8px 12px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 7, fontSize: 13, color: "#dc2626" }}>
          {serverError}
        </div>
      )}
      <button
        type="submit"
        disabled={submitting}
        style={{
          marginTop: 4,
          padding: "10px 0",
          background: submitting ? "#6b7280" : "#1f8a3e",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 600,
          cursor: submitting ? "not-allowed" : "pointer",
          fontFamily: "inherit",
          transition: "background 0.15s",
        }}
      >
        {submitting ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}

export default function AuthScreen({ onLogin, onSignup }) {
  const [tab, setTab] = useState("login");

  const FEATURES = [
    { label: "Price data",      desc: "Live from 40+ markets" },
    { label: "WhatsApp alerts", desc: "Daily digest + urgent warnings" },
    { label: "Payments",        desc: "Mobile money receipts" },
  ];

  return (
    <div className="auth-root">
      {/* ── Left panel — brand ── */}
      <div className="auth-left">
        <div style={{
          position: "absolute", inset: 0, opacity: 0.04,
          backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "32px 32px", pointerEvents: "none",
        }} />
        <div className="auth-left-inner">
          <img
            src="/assets/agribridge-logo-white.svg"
            alt="Agribridge"
            className="auth-logo"
          />
          <div className="auth-left-body">
            <div className="auth-headline">
              Agricultural intelligence<br />for Uganda's markets.
            </div>
            <p className="auth-tagline">
              Real-time commodity prices, carrier tracking, payments, and WhatsApp alerts — built for farmers and agribusiness operators.
            </p>
          </div>
          <div className="auth-features">
            {FEATURES.map((item) => (
              <div key={item.label} className="auth-feature-row">
                <div className="auth-feature-dot" />
                <span className="auth-feature-text">
                  <span className="auth-feature-label">{item.label}</span> — {item.desc}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div className="auth-right">
        <div className="auth-form-card">
          {/* Tab toggle */}
          <div className="auth-tabs">
            {[
              { key: "login",  label: "Log in" },
              { key: "signup", label: "Farmer sign up" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`auth-tab${tab === key ? " active" : ""}`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Heading */}
          <div className="auth-heading">
            <div className="auth-heading-title">
              {tab === "login" ? "Welcome back" : "Get started"}
            </div>
            <div className="auth-heading-sub">
              {tab === "login"
                ? "Log in to the Agribridge dashboard."
                : "Register your phone to receive WhatsApp updates."}
            </div>
          </div>

          {/* Both forms always mounted — grid overlay keeps container height stable */}
          <div style={{ display: "grid" }}>
            {[
              {
                key: "login",
                form: <LoginForm onLogin={onLogin} />,
                hint: "Dashboard access is for admin accounts only.",
              },
              {
                key: "signup",
                form: <SignupForm onSignup={onSignup} />,
                hint: "Farmer accounts access Agribridge via WhatsApp, not the web.",
              },
            ].map(({ key, form, hint }) => (
              <div
                key={key}
                style={{
                  gridColumn: 1, gridRow: 1,
                  opacity: tab === key ? 1 : 0,
                  pointerEvents: tab === key ? "auto" : "none",
                  transition: "opacity 0.18s ease",
                  display: "flex", flexDirection: "column",
                }}
              >
                {form}
                <p className="auth-hint">{hint}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .auth-root {
          display: flex;
          min-height: 100vh;
          font-family: 'Geist', system-ui, sans-serif;
        }

        /* ── Left panel ── */
        .auth-left {
          width: 38%;
          max-width: 480px;
          min-width: 280px;
          flex-shrink: 0;
          background: #0d3b1a;
          display: flex;
          flex-direction: column;
          padding: 48px 44px;
          position: relative;
          overflow: hidden;
        }
        .auth-left-inner {
          position: relative;
          z-index: 1;
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .auth-logo {
          height: 28px;
          width: auto;
          object-fit: contain;
          object-position: left;
          filter: brightness(0) invert(1) opacity(0.85);
          margin-bottom: 52px;
        }
        .auth-left-body { flex: 1; }
        .auth-headline {
          font-size: clamp(18px, 2vw, 24px);
          font-weight: 700;
          color: #fff;
          line-height: 1.35;
          margin-bottom: 14px;
          letter-spacing: -0.3px;
        }
        .auth-tagline {
          font-size: 13px;
          color: rgba(255,255,255,0.5);
          line-height: 1.65;
          margin: 0;
        }
        .auth-features {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: auto;
          padding-top: 40px;
        }
        .auth-feature-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .auth-feature-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #4ec96b;
          flex-shrink: 0;
        }
        .auth-feature-text { font-size: 12px; color: rgba(255,255,255,0.55); }
        .auth-feature-label { color: rgba(255,255,255,0.85); font-weight: 500; }

        /* ── Right panel ── */
        .auth-right {
          flex: 1;
          background: #fafafa;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 24px;
          min-height: 100vh;
        }
        .auth-form-card {
          width: 100%;
          max-width: 420px;
        }

        /* Tab toggle */
        .auth-tabs {
          display: flex;
          background: #f3f4f6;
          border-radius: 10px;
          padding: 3px;
          margin-bottom: 28px;
        }
        .auth-tab {
          flex: 1;
          padding: 8px 0;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.15s;
          background: transparent;
          color: #6b7280;
          box-shadow: none;
        }
        .auth-tab.active {
          background: #fff;
          color: #111827;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        }

        /* Heading */
        .auth-heading {
          margin-bottom: 24px;
          min-height: 52px;
        }
        .auth-heading-title {
          font-size: 20px;
          font-weight: 700;
          color: #111827;
          letter-spacing: -0.3px;
          margin-bottom: 4px;
        }
        .auth-heading-sub {
          font-size: 13px;
          color: #6b7280;
        }

        /* Hint below form */
        .auth-hint {
          margin-top: 20px;
          font-size: 11px;
          color: #9ca3af;
          text-align: center;
          line-height: 1.5;
        }

        /* ── Tablet (641px – 900px): compact two-column ── */
        @media (max-width: 900px) and (min-width: 641px) {
          .auth-left {
            width: 42%;
            min-width: 240px;
            padding: 36px 28px;
          }
          .auth-logo { margin-bottom: 36px; }
          .auth-headline { font-size: 17px; }
          .auth-features { padding-top: 28px; }
        }

        /* ── Mobile (≤640px): single column, no left panel ── */
        @media (max-width: 640px) {
          .auth-root { flex-direction: column; }
          .auth-left { display: none; }
          .auth-right {
            min-height: 100vh;
            padding: 32px 20px;
            align-items: flex-start;
            padding-top: 60px;
          }
          .auth-form-card { max-width: 100%; }
          .auth-heading-title { font-size: 22px; }
        }
      `}</style>
    </div>
  );
}
