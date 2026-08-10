import { Screen, BackButton, ProgressBar, PrimaryButton, Toggle, C } from '../shared';

const TOPIC_ITEMS = [
  {
    id: 'weather',
    label: 'Weather reports',
    desc: 'Rain warnings for your area',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
      </svg>
    ),
  },
  {
    id: 'stock',
    label: 'Stock reports',
    desc: 'What farmers in your network have',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      </svg>
    ),
  },
  {
    id: 'orders',
    label: 'Order alerts',
    desc: 'Buyers looking for your crop',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
    ),
  },
  {
    id: 'quality',
    label: 'Quality grades',
    desc: 'Grading results per batch',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
];

export default function Topics({ topics, setTopics, goBack, navigate, postSetup }) {
  const toggle = (id) => setTopics(prev => ({ ...prev, [id]: !prev[id] }));
  const onCount = Object.values(topics).filter(Boolean).length;

  return (
    <Screen>
      <ProgressBar step={4} total={5} />

      <div style={{ flex: 1, minHeight: 0, padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 8, flexShrink: 0 }}>
          <BackButton onBack={goBack} />
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: C.text, margin: '0 0 4px', lineHeight: 1.2 }}>
              What should<br />we send you?
            </h1>
            <p style={{ fontSize: 13, color: C.grey, margin: 0 }}>
              Turn off anything you don&apos;t need
            </p>
          </div>
        </div>

        {/* Toggle list */}
        <div style={{ marginTop: 20, flex: 1 }}>
          <div style={{
            background: '#fff',
            border: '1.5px solid #eae7e0',
            borderRadius: 16,
            overflow: 'hidden',
            marginBottom: 20,
          }}>
            {TOPIC_ITEMS.map((item, idx) => {
              const on = topics[item.id] ?? false;
              return (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '14px 16px',
                    borderTop: idx > 0 ? '1px solid #f3f3f0' : 'none',
                  }}
                >
                  {/* Icon */}
                  <div style={{
                    width: 38, height: 38,
                    borderRadius: 10,
                    background: on ? C.greenLight : '#f3f4f6',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: on ? C.green : '#9ca3af',
                    flexShrink: 0,
                    transition: 'background 0.15s, color 0.15s',
                  }}>
                    {item.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 15, fontWeight: 600,
                      color: on ? C.text : '#9ca3af',
                      marginBottom: 2,
                      transition: 'color 0.15s',
                    }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>{item.desc}</div>
                  </div>
                  <Toggle on={on} onChange={() => toggle(item.id)} />
                </div>
              );
            })}
          </div>

          {/* Locked: payments */}
          <div style={{
            fontSize: 10,
            fontWeight: 700,
            color: '#9ca3af',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 8,
            paddingLeft: 4,
          }}>
            Private to you
          </div>
          <div style={{
            border: '1.5px dashed #d4d0c8',
            borderRadius: 16,
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}>
            <div style={{
              width: 38, height: 38,
              borderRadius: 10,
              background: '#f3f4f6',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#9ca3af',
              flexShrink: 0,
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 3 }}>
                Your payments &amp; transactions
              </div>
              <div style={{ fontSize: 12, color: C.grey }}>
                Only ever sent to you — no one in the network can see these
              </div>
            </div>
          </div>
        </div>

        <div style={{ minHeight: 20 }} />

        <PrimaryButton onClick={() => navigate(postSetup ? 7 : 6)}>
          Continue
        </PrimaryButton>
      </div>
    </Screen>
  );
}
