import { useState, useEffect } from 'react';
import { Screen, BackButton, Keypad, C } from '../shared';

export default function Verify({ phone, goBack, navigate }) {
  const [otp, setOtp] = useState('');

  useEffect(() => {
    if (otp.length === 4) {
      const t = setTimeout(() => navigate(3), 350);
      return () => clearTimeout(t);
    }
  }, [otp]);

  const add = (d) => { if (otp.length < 4) setOtp(p => p + d); };
  const del = () => setOtp(p => p.slice(0, -1));

  const fmt = phone
    ? `+256 ${phone.slice(0,3)} ${phone.slice(3,6)} ${phone.slice(6)}`
    : '+256 771 402 118';

  return (
    <Screen>
      <div style={{ flex: 1, minHeight: 0, padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <div style={{ marginBottom: 24 }}>
          <BackButton onBack={goBack} />
        </div>

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: C.text, margin: '0 0 8px' }}>
            Enter the code
          </h1>
          <p style={{ fontSize: 14, color: C.grey, margin: 0 }}>
            Sent on WhatsApp to {fmt}
          </p>
        </div>

        {/* OTP boxes */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          {[0,1,2,3].map(i => {
            const filled = i < otp.length;
            const active = i === otp.length && otp.length < 4;
            return (
              <div key={i} style={{
                flex: 1,
                height: 68,
                border: `2px solid ${filled ? C.green : active ? C.green : '#d4d0c8'}`,
                borderRadius: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 30,
                fontWeight: 700,
                color: C.text,
                background: filled ? C.greenLight : '#fff',
                transition: 'border-color 0.15s, background 0.15s',
                fontFamily: "'IBM Plex Mono', monospace",
              }}>
                {otp[i] ?? ''}
              </div>
            );
          })}
        </div>

        <p style={{ fontSize: 13, color: '#9ca3af', margin: '0 0 auto' }}>
          Any 4 digits work in this prototype
        </p>

        <div style={{ flex: 1, minHeight: 24 }} />

        <Keypad onDigit={add} onBackspace={del} />
      </div>
    </Screen>
  );
}
