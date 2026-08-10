import { Screen, AgribridgeMark, Keypad, PrimaryButton, C } from '../shared';

export default function ConnectNumber({ phone, setPhone, navigate }) {
  const add = (d) => { if (phone.length < 9) setPhone(p => p + d); };
  const del = () => setPhone(p => p.slice(0, -1));
  const valid = phone.length === 9;

  const segments = [
    phone.slice(0, 3).padEnd(3, '\u00a0'),
    phone.slice(3, 6).padEnd(3, '\u00a0'),
    phone.slice(6, 9).padEnd(3, '\u00a0'),
  ];

  return (
    <Screen>
      <div style={{ flex: 1, minHeight: 0, padding: '28px 20px 20px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <div style={{ marginBottom: 36 }}>
          <AgribridgeMark size={40} />
        </div>

        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: C.text, lineHeight: 1.2, margin: '0 0 10px' }}>
            Get farm updates<br />on WhatsApp
          </h1>
          <p style={{ fontSize: 14, color: C.grey, margin: 0 }}>
            Enter the number you use for WhatsApp.
          </p>
        </div>

        {/* Phone number display */}
        <div style={{
          border: `1.5px solid ${C.greyBorder}`,
          borderRadius: 12,
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          background: '#fff',
          marginBottom: 'auto',
        }}>
          <span style={{
            fontSize: 16, fontWeight: 600, color: C.text,
            fontFamily: "'IBM Plex Mono', monospace",
            flexShrink: 0,
          }}>
            +256
          </span>
          <div style={{ width: 1, height: 22, background: C.greyBorder, flexShrink: 0 }} />
          <div style={{
            display: 'flex', gap: 8,
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 16,
            letterSpacing: 2,
          }}>
            {segments.map((seg, si) => (
              <span key={si}>
                {seg.split('').map((ch, ci) => {
                  const pos = si * 3 + ci;
                  const filled = pos < phone.length;
                  return (
                    <span key={ci} style={{ color: filled ? C.text : '#c5c1ba' }}>
                      {filled ? ch : '0'}
                    </span>
                  );
                })}
              </span>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, minHeight: 32 }} />

        <div style={{ marginBottom: 12 }}>
          <Keypad onDigit={add} onBackspace={del} />
        </div>

        <PrimaryButton onClick={() => navigate(2)} disabled={!valid}>
          {valid ? 'Continue' : 'Enter 9 digits'}
        </PrimaryButton>
      </div>
    </Screen>
  );
}
