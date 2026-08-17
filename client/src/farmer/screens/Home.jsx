import { AgribridgeMark, Toggle, C } from '../shared';
import { MOCK_FARMERS, CROPS } from '../data';

const FREQ_LABEL = { daily: 'Every day', twice: 'Twice a week', urgent: 'Urgent only' };
const FREQ_SUB   = { daily: 'One message each morning', twice: 'Monday and Thursday', urgent: 'Rain warnings and new orders' };

function BottomTab({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 3, padding: '8px 0',
        background: 'none', border: 'none', cursor: 'pointer',
        color: active ? C.green : '#9ca3af',
        fontSize: 10, fontWeight: active ? 700 : 400,
        fontFamily: 'inherit',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {icon}
      {label}
    </button>
  );
}

export default function Home({
  user, onLogout,
  selectedCrops, connectedFarmers, topics, frequency, pauseAll, setPauseAll,
  navigate, homeTab, setHomeTab,
}) {
  const timeLabel = frequency.timeOfDay === 'morning' ? '07:00' : '18:00';
  const freqLabel = FREQ_LABEL[frequency.option] || 'Every day';
  const freqSub   = FREQ_SUB[frequency.option] || 'One message each morning';

  const cropNames = CROPS
    .filter(c => selectedCrops.includes(c.id))
    .map(c => c.label.toLowerCase());

  const connectedList = MOCK_FARMERS.filter(f => connectedFarmers.includes(f.id));
  const connectedNames = connectedList.map(f => f.name.split(' ')[0]);

  const onTopics = ['weather','stock','orders','quality'].filter(k => topics[k]);
  const topicNames = onTopics.map(k => ({ weather:'Weather', stock:'Stock', orders:'Orders', quality:'Quality' }[k]));

  const initial = user?.name?.slice(0,2)?.toUpperCase() ?? 'WK';

  const previewLines = [];
  if (topics.weather) previewLines.push(`Rain expected Bufumbo from 14:00.`);
  if (topics.stock && connectedList[0]) previewLines.push(`${connectedList[0].name.split(' ')[0]} has ${connectedList[0].kg.toLocaleString()} kg ${cropNames[0] || 'maize'}.`);
  if (topics.orders) previewLines.push(`A buyer wants 800 kg at 2,400/kg.`);
  const preview = previewLines.slice(0, 2).join(' ') || 'No messages scheduled — turn on a topic above.';

  const settingRows = [
    {
      badge: cropNames.length ? String(cropNames.length) : '0',
      title: 'Crops',
      sub: cropNames.length ? cropNames.join(', ') : 'None selected',
      onClick: () => navigate(3, { postSetup: true }),
    },
    {
      badge: String(connectedList.length),
      title: `Connected to ${connectedList.length} farmer${connectedList.length !== 1 ? 's' : ''}`,
      sub: connectedNames.length ? connectedNames.join(', ') : 'None connected',
      onClick: () => setHomeTab('network'),
      isNum: true,
    },
    {
      badge: 'bell',
      title: `${onTopics.length} alert type${onTopics.length !== 1 ? 's' : ''} on`,
      sub: topicNames.length ? topicNames.join(', ') : 'All off',
      onClick: () => navigate(5, { postSetup: true }),
      isBell: true,
    },
    {
      badge: timeLabel,
      title: freqLabel,
      sub: freqSub,
      onClick: () => navigate(6, { postSetup: true }),
      isTime: true,
    },
  ];

  return (
    <div style={{
      height: '100dvh',
      overflow: 'hidden',
      background: '#f6f4f0',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'IBM Plex Sans', system-ui, -apple-system, sans-serif",
      maxWidth: 430,
      margin: '0 auto',
      WebkitFontSmoothing: 'antialiased',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px 12px',
        background: '#fff',
        display: 'flex', alignItems: 'center', gap: 10,
        borderBottom: '1px solid #eae7e0',
      }}>
        <AgribridgeMark size={28} />
        <span style={{ fontSize: 16, fontWeight: 700, color: C.text, flex: 1 }}>Agribridge</span>
        <button
          onClick={onLogout}
          title="Log out"
          style={{
            width: 36, height: 36,
            borderRadius: 10,
            background: C.green,
            color: '#fff',
            border: 'none',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'inherit',
            touchAction: 'manipulation',
          }}
        >
          {initial}
        </button>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px 16px 0' }}>

        {/* Message preview card */}
        <div style={{
          background: C.greenDark,
          borderRadius: 18,
          padding: '14px 16px 16px',
          marginBottom: 20,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            marginBottom: 12,
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80', flexShrink: 0 }} />
            <span style={{
              fontSize: 11, fontWeight: 700, color: '#4ade80',
              textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>
              {pauseAll ? 'Paused' : `Sending ${freqLabel.toLowerCase()} · ${timeLabel}`}
            </span>
          </div>
          <div style={{
            background: C.greenLight,
            borderRadius: 12,
            padding: '12px 14px',
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.greenMid, marginBottom: 6 }}>
              Agribridge · today
            </div>
            <div style={{ fontSize: 14, color: C.text, lineHeight: 1.55 }}>
              {preview}
            </div>
          </div>
        </div>

        {/* Settings */}
        <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, paddingLeft: 4 }}>
          Your settings
        </div>

        <div style={{
          background: '#fff',
          borderRadius: 16,
          border: '1.5px solid #eae7e0',
          overflow: 'hidden',
          marginBottom: 14,
        }}>
          {settingRows.map((row, i) => (
            <button
              key={i}
              onClick={row.onClick}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '13px 16px',
                borderTop: i > 0 ? '1px solid #f3f3f0' : 'none',
                background: 'none', border: 'none', cursor: 'pointer', width: '100%',
                textAlign: 'left', fontFamily: 'inherit',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              }}
            >
              {/* Badge */}
              <div style={{
                width: 36, height: 36,
                borderRadius: 10,
                background: C.greenLight,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {row.isBell ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                ) : (
                  <span style={{ fontSize: row.isTime ? 9 : 14, fontWeight: 700, color: C.green, fontFamily: row.isTime ? "'IBM Plex Mono', monospace" : 'inherit' }}>
                    {row.badge}
                  </span>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 1 }}>{row.title}</div>
                <div style={{ fontSize: 12, color: C.grey, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.sub}</div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d1cec8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          ))}
        </div>

        {/* Pause toggle */}
        <div style={{
          background: '#fff',
          border: '1.5px solid #eae7e0',
          borderRadius: 16,
          padding: '14px 16px',
          display: 'flex', alignItems: 'center', gap: 12,
          marginBottom: 24,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 2 }}>
              Pause all messages
            </div>
            <div style={{ fontSize: 12, color: C.grey }}>
              Nothing sent until you turn it back on
            </div>
          </div>
          <Toggle on={pauseAll} onChange={setPauseAll} />
        </div>
      </div>

      {/* Bottom tab bar */}
      <div style={{
        background: '#fff',
        borderTop: '1px solid #eae7e0',
        display: 'flex',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}>
        <BottomTab
          label="Home"
          active={homeTab === 'home'}
          onClick={() => setHomeTab('home')}
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill={homeTab === 'home' ? C.green : 'none'} stroke={homeTab === 'home' ? C.green : '#9ca3af'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          }
        />
        <BottomTab
          label="Crops"
          active={homeTab === 'crops'}
          onClick={() => navigate(3, { postSetup: true })}
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={homeTab === 'crops' ? C.green : '#9ca3af'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22V12M12 12C12 12 7 11 7 6a5 5 0 0 1 10 0c0 5-5 6-5 6z" /><path d="M12 12C12 12 9 8 5 9" />
            </svg>
          }
        />
        <BottomTab
          label="Network"
          active={homeTab === 'network'}
          onClick={() => setHomeTab('network')}
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={homeTab === 'network' ? C.green : '#9ca3af'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
        />
      </div>
    </div>
  );
}
