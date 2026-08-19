import { useState, useEffect, useRef } from "react";

const PHONE_RE = /^\+[1-9]\d{7,14}$/;

// TEMPORARY — WhatsApp OTP is paused while Twilio reviews our business
// profile. When true: hides the "WhatsApp code" method inside Log in and
// swaps the Sign up form for a "paused" notice. Flip to `false` alongside
// the matching constant in server/routes/auth.js once approval lands.
const OTP_DISABLED = true;

// Exact copy the user agrees to when ticking the alerts checkbox at signup.
// Stored verbatim on User.messagingConsent.copy so we can prove what was shown
// if Meta ever audits the sender.
const ALERTS_CONSENT_COPY =
  "Send me price updates, market alerts, and daily digests on WhatsApp from Agribridge. I can reply STOP anytime to unsubscribe.";

// Small fine-print notice shown wherever we send a WhatsApp OTP. Transactional
// codes are covered by implied consent (Meta OTP policy) — this text just makes
// the terms visible to the user.
function OtpConsentNotice() {
  return (
    <p style={{ fontSize: 11, color: "#9ca3af", margin: "-4px 0 0", lineHeight: 1.55 }}>
      By continuing, you agree to receive a one-time verification code on
      WhatsApp from Agribridge. Standard message rates may apply. See our{" "}
      <a href="#" style={{ color: "#1f8a3e", textDecoration: "none" }}>Terms</a>
      {" "}and{" "}
      <a href="#" style={{ color: "#1f8a3e", textDecoration: "none" }}>Privacy Policy</a>.
    </p>
  );
}

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

const normalizePhone = (v) => {
  const stripped = v.replace(/\s/g, "");
  if (stripped && !stripped.startsWith("+")) return "+" + stripped;
  return stripped;
};

// Shared OTP entry step. Fires onVerifyStart on mount (opt-in via autoSend)
// then submits the code to onVerifyCheck. On success calls onVerified(response).
function OtpStep({ phone, onVerifyStart, onVerifyCheck, onVerified, onCancel, subtitle, autoSend = true }) {
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const autoSentRef = useRef(false);

  const sendCode = async () => {
    setError("");
    setStatus("");
    setSending(true);
    try {
      await onVerifyStart(phone);
      setStatus("Code sent — check WhatsApp");
    } catch (err) {
      setError(err.message || "Could not send code");
    } finally {
      setSending(false);
    }
  };

  // Auto-send once on mount when the parent requested it.
  useEffect(() => {
    if (autoSend && !autoSentRef.current) {
      autoSentRef.current = true;
      sendCode();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!/^\d{4,10}$/.test(code.trim())) {
      setError("Enter the digits from the WhatsApp message");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const res = await onVerifyCheck(phone, code.trim());
      onVerified(res);
    } catch (err) {
      setError(err.message || "Invalid or expired code");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.55 }}>
        {subtitle || "We sent a code to your WhatsApp."}
        <div style={{ marginTop: 4, color: "#6b7280" }}>
          <strong style={{ color: "#111827" }}>{phone}</strong>
        </div>
      </div>
      <Field
        label="WhatsApp code"
        type="text"
        value={code}
        onChange={setCode}
        placeholder="6-digit code"
        error={error && !status ? error : undefined}
        autoComplete="one-time-code"
      />
      {status && !error && (
        <div style={{ fontSize: 12, color: "#166534" }}>{status}</div>
      )}
      {error && (
        <div style={{ padding: "8px 12px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 7, fontSize: 13, color: "#dc2626" }}>
          {error}
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
        }}
      >
        {submitting ? "Verifying…" : "Verify"}
      </button>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
        <button
          type="button"
          onClick={sendCode}
          disabled={sending}
          style={{ background: "none", border: "none", color: "#1f8a3e", cursor: sending ? "wait" : "pointer", fontWeight: 500, padding: 0, fontFamily: "inherit" }}
        >
          {sending ? "Sending…" : "Resend code"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", padding: 0, fontFamily: "inherit" }}
          >
            Use a different number
          </button>
        )}
      </div>
    </form>
  );
}

function LoginForm({ onLogin, onVerifyStart, onVerifyCheck }) {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  // When admin/staff hit "Phone not verified", we drop into the OTP step and
  // retry login once the phone is verified.
  const [needsVerify, setNeedsVerify] = useState(false);

  const validate = () => {
    const e = {};
    if (!PHONE_RE.test(phone)) e.phone = "Enter a valid phone number (e.g. +256700000000)";
    if (!password) e.password = "Password is required";
    return e;
  };

  const doLogin = async () => {
    setSubmitting(true);
    try {
      await onLogin(phone, password);
    } catch (err) {
      const msg = err.message || "Invalid credentials";
      if (/not verified/i.test(msg)) {
        setNeedsVerify(true);
      } else {
        setServerError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setServerError("");
    await doLogin();
  };

  if (needsVerify) {
    return (
      <OtpStep
        phone={phone}
        onVerifyStart={onVerifyStart}
        onVerifyCheck={onVerifyCheck}
        subtitle="Your phone needs to be verified before you can log in."
        onVerified={async () => {
          setNeedsVerify(false);
          await doLogin();
        }}
        onCancel={() => setNeedsVerify(false)}
      />
    );
  }

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

function SignupForm({ onSignup, onVerifyStart, onVerifyCheck }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [alertsOptIn, setAlertsOptIn] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [awaitingOtp, setAwaitingOtp] = useState(false);
  const [serverError, setServerError] = useState("");

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
      const messagingConsent = alertsOptIn
        ? { optedIn: true, copy: ALERTS_CONSENT_COPY }
        : { optedIn: false };
      await onSignup(name.trim(), phone, messagingConsent);
      setAwaitingOtp(true);
    } catch (err) {
      setServerError(err.message || "Signup failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (awaitingOtp) {
    return (
      <OtpStep
        phone={phone}
        onVerifyStart={onVerifyStart}
        onVerifyCheck={onVerifyCheck}
        subtitle="Verify your WhatsApp number to activate your farmer account."
        onVerified={() => {
          // For farmer role, verifyCheck returns a token → useAuth logs the user in
          // and App.jsx will re-render into FarmerPortal. Nothing more to do here.
        }}
        onCancel={() => setAwaitingOtp(false)}
      />
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
      <label
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          padding: "12px 14px",
          background: "#f9fafb",
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          cursor: "pointer",
          fontSize: 12,
          color: "#374151",
          lineHeight: 1.55,
        }}
      >
        <input
          type="checkbox"
          checked={alertsOptIn}
          onChange={(e) => setAlertsOptIn(e.target.checked)}
          style={{ marginTop: 2, accentColor: "#1f8a3e", flexShrink: 0 }}
        />
        <span>{ALERTS_CONSENT_COPY}</span>
      </label>
      <OtpConsentNotice />
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

function FarmerLoginForm({ onVerifyStart, onVerifyCheck }) {
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [awaitingOtp, setAwaitingOtp] = useState(false);
  const [serverError, setServerError] = useState("");

  const validate = () => {
    const e = {};
    if (!PHONE_RE.test(phone)) e.phone = "Enter a valid phone number (e.g. +256700000000)";
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setServerError("");
    setSending(true);
    try {
      await onVerifyStart(phone);
      setAwaitingOtp(true);
    } catch (err) {
      setServerError(err.message || "Could not send code");
    } finally {
      setSending(false);
    }
  };

  if (awaitingOtp) {
    return (
      <OtpStep
        phone={phone}
        onVerifyStart={onVerifyStart}
        onVerifyCheck={onVerifyCheck}
        subtitle="Enter the code we just sent on WhatsApp to log in."
        autoSend={false}
        onVerified={() => {
          // Farmer/broker → token issued → App re-renders into their portal.
        }}
        onCancel={() => setAwaitingOtp(false)}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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
        We'll send you a one-time code on WhatsApp. No password needed.
      </p>
      <OtpConsentNotice />
      {serverError && (
        <div style={{ padding: "8px 12px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 7, fontSize: 13, color: "#dc2626" }}>
          {serverError}
        </div>
      )}
      <button
        type="submit"
        disabled={sending}
        style={{
          marginTop: 4,
          padding: "10px 0",
          background: sending ? "#6b7280" : "#1f8a3e",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 600,
          cursor: sending ? "not-allowed" : "pointer",
          fontFamily: "inherit",
        }}
      >
        {sending ? "Sending code…" : "Send WhatsApp code"}
      </button>
    </form>
  );
}

// Single "Log in" tab that lets the user pick their auth method. Splitting by
// method (not audience) means we never do a server-side phone → role lookup,
// so there's no enumeration oracle. While OTP is paused, we render only the
// password form — no method toggle.
function UnifiedLoginForm({ onLogin, onVerifyStart, onVerifyCheck }) {
  const [method, setMethod] = useState("password");
  if (OTP_DISABLED) {
    return (
      <LoginForm
        onLogin={onLogin}
        onVerifyStart={onVerifyStart}
        onVerifyCheck={onVerifyCheck}
      />
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div className="auth-method-toggle" role="tablist" aria-label="Log in method">
        {[
          { key: "password", label: "Password" },
          { key: "code",     label: "WhatsApp code" },
        ].map(({ key, label }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={method === key}
            onClick={() => setMethod(key)}
            className={`auth-method${method === key ? " active" : ""}`}
          >
            {label}
          </button>
        ))}
      </div>
      {method === "password" ? (
        <LoginForm
          onLogin={onLogin}
          onVerifyStart={onVerifyStart}
          onVerifyCheck={onVerifyCheck}
        />
      ) : (
        <FarmerLoginForm
          onVerifyStart={onVerifyStart}
          onVerifyCheck={onVerifyCheck}
        />
      )}
    </div>
  );
}

// Shown in place of the Sign up form while OTP is paused. Signup can't be
// completed without a working verification channel, so we surface the pause
// clearly rather than letting the flow dead-end at the OTP step.
function SignupPausedNotice() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: "18px 16px",
        background: "#fff8e1",
        border: "1px solid #fde68a",
        borderRadius: 8,
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 600, color: "#78350f" }}>
        Sign-up temporarily paused
      </div>
      <p style={{ fontSize: 13, color: "#78350f", margin: 0, lineHeight: 1.55 }}>
        Farmer registration is on hold while WhatsApp verification is under
        review. Please check back soon — existing accounts can still log in.
      </p>
    </div>
  );
}

export default function AuthScreen({ onLogin, onSignup, onVerifyStart, onVerifyCheck }) {
  const [tab, setTab] = useState("login");
  // Network Information API is Chrome/Android-only, which is our target for
  // farmers. When it reports 2G or Data Saver, we drop the accent-bar animation
  // to save CPU/battery. Falls back to always-animated on unsupported browsers;
  // prefers-reduced-motion is handled purely in CSS.
  const [slowConnection, setSlowConnection] = useState(false);
  useEffect(() => {
    const c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!c) return;
    const check = () => {
      const et = c.effectiveType || "";
      setSlowConnection(!!c.saveData || et === "slow-2g" || et === "2g");
    };
    check();
    c.addEventListener?.("change", check);
    return () => c.removeEventListener?.("change", check);
  }, []);

  const FEATURES = [
    { label: "Price data",      desc: "Live from 40+ markets" },
    { label: "WhatsApp alerts", desc: "Daily digest + urgent warnings" },
    { label: "Payments",        desc: "Mobile money receipts" },
  ];

  return (
    <div className={`auth-root${slowConnection ? " auth-slow-net" : ""}`}>
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
              Real-time commodity prices, transaction tracking, payments, and WhatsApp alerts — built for farmers and agribusiness operators.
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
        {/* Mobile-only logo — the left brand panel is hidden below 640px */}
        <div className="auth-logo-mobile" role="img" aria-label="Agribridge" />
        <div className="auth-form-card">
          {/* Tab toggle */}
          <div className="auth-tabs">
            {[
              { key: "login",  label: "Log in" },
              { key: "signup", label: "Sign up" },
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
              {tab === "signup" ? "Get started" : "Welcome back"}
            </div>
            <div className="auth-heading-sub">
              {tab === "login" && (OTP_DISABLED
                ? "Sign in with your Agribridge password."
                : "Pick a method to sign in to Agribridge.")}
              {tab === "signup" && (OTP_DISABLED
                ? "Registration is paused while WhatsApp verification is reviewed."
                : "Register your phone to receive WhatsApp updates.")}
            </div>
          </div>

          {/* All forms mounted — grid overlay keeps container height stable */}
          <div style={{ display: "grid" }}>
            {[
              {
                key: "login",
                form: (
                  <UnifiedLoginForm
                    onLogin={onLogin}
                    onVerifyStart={onVerifyStart}
                    onVerifyCheck={onVerifyCheck}
                  />
                ),
                hint: "Password: staff, admin, broker. WhatsApp code: farmer.",
              },
              {
                key: "signup",
                form: OTP_DISABLED ? (
                  <SignupPausedNotice />
                ) : (
                  <SignupForm
                    onSignup={onSignup}
                    onVerifyStart={onVerifyStart}
                    onVerifyCheck={onVerifyCheck}
                  />
                ),
                hint: OTP_DISABLED
                  ? "Sign-ups resume once WhatsApp verification is back online."
                  : "You'll get a one-time code on WhatsApp to finish signup.",
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

      {/* Mobile-only animated accent bar — pinned to bottom of viewport */}
      <div className="auth-accent-bar" aria-hidden="true" />

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

        /* Method picker inside the Log in tab (Password vs WhatsApp code). */
        .auth-method-toggle {
          display: flex;
          background: #f3f4f6;
          border-radius: 8px;
          padding: 2px;
        }
        .auth-method {
          flex: 1;
          padding: 6px 0;
          border: none;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.15s;
          background: transparent;
          color: #6b7280;
        }
        .auth-method.active {
          background: #fff;
          color: #111827;
          box-shadow: 0 1px 2px rgba(0,0,0,0.06);
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

        /* Mobile-only brand elements — hidden by default, shown ≤640px */
        .auth-logo-mobile { display: none; }
        .auth-accent-bar { display: none; }

        /* ── Mobile (≤640px): single column, no left panel ── */
        @media (max-width: 640px) {
          .auth-root { flex-direction: column; }
          .auth-left { display: none; }
          .auth-right {
            /* Lock viewport height & clip overflow so signup/login always
               fits on one screen. dvh handles collapsing mobile URL bar. */
            min-height: 100vh;
            min-height: 100dvh;
            max-height: 100vh;
            max-height: 100dvh;
            overflow: hidden;
            padding: 32px 20px 40px;
            flex-direction: column;
            align-items: stretch;
            justify-content: flex-start;
          }
          .auth-form-card {
            max-width: 100%;
            /* Auto margins push the card visually down while leaving the logo
               anchored at the top. */
            margin-top: auto;
            margin-bottom: auto;
          }
          .auth-heading-title { font-size: 22px; }
          /* Trim internal spacing on mobile so the signup form fits without
             feeling cramped on small phones. */
          .auth-tabs        { margin-bottom: 20px; }
          .auth-heading     { margin-bottom: 18px; min-height: 0; }

          /* Mask-based tint: the source SVG has fill:#fff, so we recolor it
             via CSS mask to sit on the light mobile background. */
          .auth-logo-mobile {
            display: block;
            width: 132px;
            height: 32px;
            margin: 0 auto 24px;
            flex-shrink: 0;
            background-color: #0d3b1a;
            -webkit-mask: url('/assets/agribridge-logo-white.svg') no-repeat center / contain;
                    mask: url('/assets/agribridge-logo-white.svg') no-repeat center / contain;
          }

          .auth-accent-bar {
            display: block;
            position: fixed;
            left: 0;
            right: 0;
            bottom: 0;
            width: 100%;
            height: 22px;
            z-index: 10;
            pointer-events: none;
            background: linear-gradient(
              90deg,
              #0d3b1a 0%,
              #1f8a3e 25%,
              #4ec96b 50%,
              #1f8a3e 75%,
              #0d3b1a 100%
            );
            background-size: 200% 100%;
            animation: auth-accent-shimmer 3.5s linear infinite;
          }
        }

        @keyframes auth-accent-shimmer {
          0%   { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }

        /* Disable the animation for OS-level reduced motion or when JS has
           detected a slow / data-saver connection. */
        @media (prefers-reduced-motion: reduce) {
          .auth-accent-bar { animation: none; }
        }
        .auth-slow-net .auth-accent-bar { animation: none; }
      `}</style>
    </div>
  );
}
