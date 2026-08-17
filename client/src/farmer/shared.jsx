export const C = {
  green:       '#1f8a3e',
  greenDark:   '#0d3b1a',
  greenLight:  '#e8f5ec',
  greenMid:    '#1a6b30',
  grey:        '#6b7280',
  greyLight:   '#f9fafb',
  greyBorder:  '#e5e7eb',
  text:        '#111827',
  disabled:    '#ccc9c2',
  disabledTxt: '#9c9892',
};

export function Screen({ children, style }) {
  return (
    <div style={{
      height: '100dvh',
      overflow: 'hidden',
      background: '#fff',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'IBM Plex Sans', system-ui, -apple-system, sans-serif",
      maxWidth: 430,
      margin: '0 auto',
      WebkitFontSmoothing: 'antialiased',
      ...style,
    }}>
      {children}
    </div>
  );
}

export function AgribridgeMark({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="9" fill="#1f8a3e" />
      <path d="M20 10L29 30H11L20 10Z" stroke="white" strokeWidth="2.5" strokeLinejoin="round" fill="none" />
      <path d="M15 23h10" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function BackButton({ onBack }) {
  return (
    <button
      onClick={onBack}
      style={{
        width: 36, height: 36,
        borderRadius: 10,
        background: '#f3f4f6',
        border: 'none',
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22,
        color: C.text,
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        flexShrink: 0,
        lineHeight: 1,
        paddingBottom: 2,
      }}
    >
      ‹
    </button>
  );
}

export function ProgressBar({ step, total = 5 }) {
  return (
    <div style={{ display: 'flex', gap: 4, padding: '10px 20px 0' }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          flex: 1, height: 3, borderRadius: 2,
          background: i < step ? C.green : '#dbd8d0',
          transition: 'background 0.3s',
        }} />
      ))}
    </div>
  );
}

export function Keypad({ onDigit, onBackspace }) {
  const keys = ['1','2','3','4','5','6','7','8','9','','0','⌫'];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
      {keys.map((k, i) => {
        if (k === '') return <div key={i} />;
        const isBack = k === '⌫';
        return (
          <button
            key={i}
            onPointerDown={(e) => { e.preventDefault(); isBack ? onBackspace() : onDigit(k); }}
            style={{
              height: 60,
              border: '1.5px solid #eae7e0',
              borderRadius: 14,
              background: '#fff',
              fontSize: isBack ? 20 : 24,
              fontWeight: 400,
              color: C.text,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              touchAction: 'manipulation',
              userSelect: 'none',
              WebkitTapHighlightColor: 'transparent',
              fontFamily: 'inherit',
            }}
          >
            {k}
          </button>
        );
      })}
    </div>
  );
}

export function PrimaryButton({ children, onClick, disabled, style }) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={{
        width: '100%',
        padding: '17px 24px',
        background: disabled ? C.disabled : C.green,
        color: disabled ? C.disabledTxt : '#fff',
        border: 'none',
        borderRadius: 16,
        fontSize: 16,
        fontWeight: 600,
        cursor: disabled ? 'default' : 'pointer',
        fontFamily: 'inherit',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        transition: 'background 0.15s',
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function Toggle({ on, onChange }) {
  return (
    <div
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      style={{
        width: 48, height: 28,
        borderRadius: 14,
        background: on ? C.green : '#d1d5db',
        position: 'relative',
        cursor: 'pointer',
        transition: 'background 0.2s',
        flexShrink: 0,
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <div style={{
        position: 'absolute',
        top: 3,
        left: on ? 23 : 3,
        width: 22, height: 22,
        borderRadius: '50%',
        background: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        transition: 'left 0.2s',
      }} />
    </div>
  );
}

export function Checkmark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="9" fill="#1f8a3e" />
      <path d="M5 9.5l3 3 5-5.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function EmptyCircle() {
  return (
    <div style={{
      width: 22, height: 22,
      borderRadius: '50%',
      border: '1.5px solid #d1cec8',
      background: '#fff',
    }} />
  );
}

export function InitialsAvatar({ initials, selected, size = 40 }) {
  return (
    <div style={{
      width: size, height: size,
      borderRadius: 12,
      background: selected ? C.green : '#e9e6e0',
      color: selected ? '#fff' : '#6b7280',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35,
      fontWeight: 700,
      flexShrink: 0,
      transition: 'background 0.15s, color 0.15s',
    }}>
      {initials}
    </div>
  );
}
