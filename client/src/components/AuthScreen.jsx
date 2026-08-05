import { useState } from "react";

const PHONE_RE = /^\+[1-9]\d{7,14}$/;

function Field({ label, type = "text", value, onChange, placeholder, error, autoComplete }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: "#374151", letterSpacing: "0.05em", textTransform: "uppercase" }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        style={{
          padding: "9px 12px",
          fontSize: 14,
          border: `1px solid ${error ? "#dc2626" : "#e5e7eb"}`,
          borderRadius: 8,
          outline: "none",
          background: "#fff",
          color: "#111827",
          fontFamily: "inherit",
          transition: "border-color 0.15s",
        }}
        onFocus={(e) => { if (!error) e.target.style.borderColor = "#1f8a3e"; }}
        onBlur={(e) => { if (!error) e.target.style.borderColor = "#e5e7eb"; }}
      />
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

  const validate = () => {
    const e = {};
    if (!PHONE_RE.test(phone)) e.phone = "Enter a valid phone number starting with + (e.g. +256700000000)";
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
        onChange={setPhone}
        placeholder="+256700000000"
        error={errors.phone}
        autoComplete="tel"
      />
      <Field
        label="Password"
        type="password"
        value={password}
        onChange={setPassword}
        placeholder="••••••••"
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

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = "Name is required";
    if (!PHONE_RE.test(phone)) e.phone = "Enter a valid phone number starting with + (e.g. +256700000000)";
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
        onChange={setPhone}
        placeholder="+256700000000"
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

  return (
    <div style={{
      display: "flex",
      minHeight: "100vh",
      fontFamily: "'Geist', system-ui, sans-serif",
    }}>
      {/* ── Left panel — brand ── */}
      <div style={{
        width: 320,
        flexShrink: 0,
        background: "#0d3b1a",
        display: "flex",
        flexDirection: "column",
        padding: "48px 40px",
        position: "relative",
        overflow: "hidden",
      }}
        className="auth-left-panel"
      >
        {/* subtle grid texture */}
        <div style={{
          position: "absolute", inset: 0, opacity: 0.04,
          backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          pointerEvents: "none",
        }} />

        <div style={{ position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column" }}>
          <img
            src="/assets/agribridge-logo-white.svg"
            alt="Agribridge"
            style={{ height: 28, width: "auto", objectFit: "contain", objectPosition: "left", filter: "brightness(0) invert(1) opacity(0.85)", marginBottom: 48 }}
          />

          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#fff", lineHeight: 1.35, marginBottom: 12, letterSpacing: "-0.3px" }}>
              Agricultural intelligence<br />for Uganda's markets.
            </div>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.65, margin: 0 }}>
              Real-time commodity prices, carrier tracking, payments, and WhatsApp alerts — built for farmers and agribusiness operators.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: "auto" }}>
            {[
              { label: "Price data", desc: "Live from 40+ markets" },
              { label: "WhatsApp alerts", desc: "Daily digest + urgent warnings" },
              { label: "Payments", desc: "Mobile money receipts" },
            ].map((item) => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ec96b", flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>
                  <span style={{ color: "rgba(255,255,255,0.85)", fontWeight: 500 }}>{item.label}</span> — {item.desc}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div style={{
        flex: 1,
        background: "#fafafa",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
      }}>
        <div style={{ width: "100%", maxWidth: 380 }}>

          {/* Tab toggle */}
          <div style={{
            display: "flex",
            background: "#f3f4f6",
            borderRadius: 10,
            padding: 3,
            marginBottom: 28,
          }}>
            {[
              { key: "login", label: "Log in" },
              { key: "signup", label: "Create account" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                style={{
                  flex: 1,
                  padding: "7px 0",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "all 0.15s",
                  background: tab === key ? "#fff" : "transparent",
                  color: tab === key ? "#111827" : "#6b7280",
                  boxShadow: tab === key ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Heading */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#111827", letterSpacing: "-0.3px", marginBottom: 4 }}>
              {tab === "login" ? "Welcome back" : "Get started"}
            </div>
            <div style={{ fontSize: 13, color: "#6b7280" }}>
              {tab === "login"
                ? "Log in to the Agribridge dashboard."
                : "Register your phone to receive WhatsApp updates."}
            </div>
          </div>

          {tab === "login"
            ? <LoginForm onLogin={onLogin} />
            : <SignupForm onSignup={onSignup} />}

          {/* Role hint */}
          <p style={{ marginTop: 20, fontSize: 11, color: "#9ca3af", textAlign: "center", lineHeight: 1.5 }}>
            {tab === "login"
              ? "Dashboard access is for admin accounts only."
              : "Farmer accounts access Agribridge via WhatsApp, not the web."}
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .auth-left-panel { display: none !important; }
        }
      `}</style>
    </div>
  );
}
