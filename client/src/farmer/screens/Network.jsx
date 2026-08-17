import { Screen, BackButton, ProgressBar, PrimaryButton, InitialsAvatar, Checkmark, EmptyCircle, C } from '../shared';
import { MOCK_FARMERS } from '../data';

export default function Network({ selectedCrops, connectedFarmers, setConnectedFarmers, goBack, navigate, postSetup, onProducer }) {
  const toggle = (id) => {
    setConnectedFarmers(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const cropList = selectedCrops.length
    ? selectedCrops.join(', ')
    : 'all crops';

  const visible = MOCK_FARMERS.filter(f =>
    selectedCrops.length === 0 ||
    f.crops.some(c => selectedCrops.includes(c))
  );

  const count = connectedFarmers.length;

  return (
    <Screen>
      <ProgressBar step={3} total={5} />

      <div style={{ flex: 1, minHeight: 0, padding: '16px 20px 20px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
          <BackButton onBack={goBack} />
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: C.text, margin: '0 0 4px' }}>
              Connect with farmers
            </h1>
            <p style={{ fontSize: 13, color: C.grey, margin: 0 }}>
              {visible.length} farmer{visible.length !== 1 ? 's' : ''} growing {cropList}
            </p>
          </div>
        </div>

        {/* Farmer list */}
        <div style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          margin: '16px -4px 16px',
          padding: '0 4px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}>
          {visible.map(farmer => {
            const sel = connectedFarmers.includes(farmer.id);
            return (
              <button
                key={farmer.id}
                onClick={() => postSetup ? onProducer(farmer) : toggle(farmer.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 14px',
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
                <InitialsAvatar initials={farmer.initials} selected={sel} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 2 }}>
                    {farmer.name}
                  </div>
                  <div style={{ fontSize: 12, color: C.grey, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {farmer.district} · {farmer.village} · {farmer.kg.toLocaleString()} kg · grade {farmer.grade}
                  </div>
                </div>
                <div style={{ flexShrink: 0 }}>
                  {postSetup
                    ? <span style={{ fontSize: 18, color: '#d1cec8' }}>›</span>
                    : sel ? <Checkmark /> : <EmptyCircle />
                  }
                </div>
              </button>
            );
          })}
        </div>

        {!postSetup && (
          <PrimaryButton onClick={() => navigate(5)} disabled={count === 0}>
            {count > 0 ? `Continue · ${count}` : 'Select at least one farmer'}
          </PrimaryButton>
        )}
      </div>
    </Screen>
  );
}
