import { Toggle, C } from '../shared';
import { DEFAULT_PRODUCER_SETTINGS } from '../data';

const SHARE_TOGGLES = [
  { id: 'stock',        label: 'Stock levels' },
  { id: 'timelines',    label: 'Crop timelines' },
  { id: 'quality',      label: 'Quality grade' },
  { id: 'availability', label: 'Availability' },
];

export default function Producer({
  selectedProducer: farmer,
  producerSettings, setProducerSettings,
  connectedFarmers, setConnectedFarmers,
  goBack,
}) {
  if (!farmer) return null;

  const settings = producerSettings[farmer.id] ?? DEFAULT_PRODUCER_SETTINGS;
  const setToggle = (key, val) => {
    setProducerSettings(prev => ({
      ...prev,
      [farmer.id]: { ...(prev[farmer.id] ?? DEFAULT_PRODUCER_SETTINGS), [key]: val },
    }));
  };

  const disconnect = () => {
    setConnectedFarmers(prev => prev.filter(id => id !== farmer.id));
    goBack();
  };

  const firstName = farmer.name.split(' ')[0];

  return (
    <div style={{
      height: '100dvh',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'IBM Plex Sans', system-ui, -apple-system, sans-serif",
      maxWidth: 430,
      margin: '0 auto',
      WebkitFontSmoothing: 'antialiased',
      background: '#f6f4f0',
    }}>
      {/* Dark header */}
      <div style={{
        background: C.greenDark,
        padding: '16px 20px 20px',
        color: '#fff',
      }}>
        <button
          onClick={goBack}
          style={{
            width: 34, height: 34,
            borderRadius: 10,
            background: 'rgba(255,255,255,0.12)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, color: '#fff',
            marginBottom: 16,
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            lineHeight: 1,
            paddingBottom: 2,
          }}
        >
          ‹
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
          <div style={{
            width: 52, height: 52,
            borderRadius: 14,
            background: C.green,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 800, color: '#fff',
            flexShrink: 0,
          }}>
            {farmer.initials}
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 2 }}>{farmer.name}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>
              {farmer.district} · {farmer.village}
            </div>
          </div>
        </div>

        {/* Crop tags */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {farmer.crops.map(c => (
            <span key={c} style={{
              padding: '4px 12px',
              borderRadius: 20,
              background: 'rgba(255,255,255,0.12)',
              fontSize: 12,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.85)',
            }}>
              {c}
            </span>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px 16px 24px', display: 'flex', flexDirection: 'column' }}>
        {/* Stat row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'In store', value: farmer.kg.toLocaleString(), unit: 'kg' },
            { label: 'Grade',    value: farmer.grade, unit: 'last batch', valueColor: C.green },
            { label: 'Away',     value: String(farmer.kmAway), unit: 'km' },
          ].map(stat => (
            <div key={stat.label} style={{
              background: '#fff',
              borderRadius: 14,
              padding: '12px 14px',
              border: '1.5px solid #eae7e0',
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                {stat.label}
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: stat.valueColor || C.text, marginBottom: 2 }}>
                {stat.value}
              </div>
              <div style={{ fontSize: 11, color: '#9ca3af' }}>{stat.unit}</div>
            </div>
          ))}
        </div>

        {/* Sharing toggles */}
        <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, paddingLeft: 4 }}>
          Updates from {firstName}
        </div>

        <div style={{
          background: '#fff',
          borderRadius: 16,
          border: '1.5px solid #eae7e0',
          overflow: 'hidden',
          marginBottom: 16,
        }}>
          {SHARE_TOGGLES.map((t, i) => (
            <div key={t.id} style={{
              display: 'flex', alignItems: 'center',
              padding: '15px 16px',
              borderTop: i > 0 ? '1px solid #f3f3f0' : 'none',
            }}>
              <span style={{
                flex: 1,
                fontSize: 15,
                fontWeight: 600,
                color: settings[t.id] ? C.text : '#9ca3af',
                transition: 'color 0.15s',
              }}>
                {t.label}
              </span>
              <Toggle on={settings[t.id]} onChange={v => setToggle(t.id, v)} />
            </div>
          ))}
        </div>

        {/* Disconnect */}
        <button
          onClick={disconnect}
          style={{
            width: '100%',
            padding: '16px',
            background: '#fff',
            border: '1.5px solid #fee2e2',
            borderRadius: 16,
            fontSize: 15,
            fontWeight: 700,
            color: '#dc2626',
            cursor: 'pointer',
            fontFamily: 'inherit',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          Disconnect from {firstName}
        </button>
      </div>
    </div>
  );
}
