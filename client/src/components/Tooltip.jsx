import { useState } from 'react';

/**
 * Tooltip — shows plain-language help text on hover.
 * Usage: <Tooltip text="What this means"><span>Label</span></Tooltip>
 */
export default function Tooltip({ text, children }) {
  const [visible, setVisible] = useState(false);

  return (
    <span
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <span
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: 6,
            backgroundColor: '#111827',
            color: '#f9fafb',
            fontSize: 15,
            lineHeight: 1.4,
            fontWeight: 400,
            padding: '5px 9px',
            borderRadius: 6,
            whiteSpace: 'normal',
            width: 200,
            textAlign: 'center',
            zIndex: 9999,
            pointerEvents: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
            fontFamily: 'inherit',
            letterSpacing: 'normal',
            textTransform: 'none',
            paddingInline: 10,
          }}
        >
          {text}
          <span
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              borderWidth: '4px 4px 0 4px',
              borderStyle: 'solid',
              borderColor: '#111827 transparent transparent transparent',
            }}
          />
        </span>
      )}
    </span>
  );
}
