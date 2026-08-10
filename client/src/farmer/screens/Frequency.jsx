import { Screen, BackButton, ProgressBar, PrimaryButton, C } from '../shared';

const OPTIONS = [
  { id: 'daily',   label: 'Every day',     desc: 'One message each morning' },
  { id: 'twice',   label: 'Twice a week',  desc: 'Monday and Thursday' },
  { id: 'urgent',  label: 'Urgent only',   desc: 'Rain warnings and new orders' },
];

export default function Frequency({ frequency, setFrequency, goBack, navigate, postSetup }) {
  const { option, timeOfDay } = frequency;
  const set = (k, v) => setFrequency(prev => ({ ...prev, [k]: v }));

  const timeLabel = timeOfDay === 'morning' ? '07:00' : '18:00';

  return (
    <Screen>
      <ProgressBar step={5} total={5} />

      <div style={{ flex: 1, minHeight: 0, padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 8, flexShrink: 0 }}>
          <BackButton onBack={goBack} />
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: C.text, margin: '0 0 4px' }}>
              How often?
            </h1>
            <p style={{ fontSize: 13, color: C.grey, margin: 0 }}>
              You can change this any time
            </p>
          </div>
        </div>

        {/* Frequency options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
          {OPTIONS.map(opt => {
            const sel = option === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => set('option', opt.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '16px 18px',
                  border: `1.5px solid ${sel ? C.green : '#eae7e0'}`,
                  borderRadius: 16,
                  background: sel ? C.greenLight : '#fff',
                  cursor: 'pointer',
                  textAlign: 'left',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  transition: 'border-color 0.15s, background 0.15s',
                  fontFamily: 'inherit',
                  width: '100%',
                }}
              >
                {/* Radio indicator */}
                <div style={{
                  width: 22, height: 22,
                  borderRadius: '50%',
                  border: `2px solid ${sel ? C.green : '#d4d0c8'}`,
                  background: sel ? C.green : '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'border-color 0.15s, background 0.15s',
                }}>
                  {sel && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 6.5l2.5 2.5L9.5 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 2 }}>
                    {opt.label}
                  </div>
                  <div style={{ fontSize: 13, color: C.grey }}>
                    {opt.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Time of day */}
        <div style={{
          marginTop: 16,
          border: '1.5px solid #eae7e0',
          borderRadius: 16,
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
              Time of day
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: C.text, fontFamily: "'IBM Plex Mono', monospace" }}>
              {timeLabel}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['morning', 'evening'].map(tod => {
              const active = timeOfDay === tod;
              return (
                <button
                  key={tod}
                  onClick={() => set('timeOfDay', tod)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 10,
                    border: `1.5px solid ${active ? C.green : '#eae7e0'}`,
                    background: active ? C.greenLight : '#fff',
                    color: active ? C.greenMid : C.grey,
                    fontSize: 13,
                    fontWeight: active ? 600 : 400,
                    cursor: 'pointer',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                    fontFamily: 'inherit',
                    transition: 'border-color 0.15s, background 0.15s',
                    textTransform: 'capitalize',
                  }}
                >
                  {tod.charAt(0).toUpperCase() + tod.slice(1)}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ flex: 1, minHeight: 20 }} />

        <PrimaryButton onClick={() => navigate(7)}>
          {postSetup ? 'Save' : 'Finish setup'}
        </PrimaryButton>
      </div>
    </Screen>
  );
}
