import { Screen, BackButton, ProgressBar, PrimaryButton, Checkmark, EmptyCircle, C } from '../shared';
import { CROPS } from '../data';

export default function Crops({ selectedCrops, setSelectedCrops, goBack, navigate, postSetup }) {
  const toggle = (id) => {
    setSelectedCrops(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const count = selectedCrops.length;
  const canContinue = count > 0;

  return (
    <Screen>
      <ProgressBar step={2} total={5} />

      <div style={{ flex: 1, minHeight: 0, padding: '16px 20px 20px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 8, flexShrink: 0 }}>
          <BackButton onBack={goBack} />
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: C.text, margin: '0 0 4px', lineHeight: 1.2 }}>
              Which crops<br />do you grow?
            </h1>
            <p style={{ fontSize: 13, color: C.grey, margin: 0 }}>Tap as many as you like</p>
          </div>
        </div>

        {/* Crop grid — scrollable on small screens */}
        <div style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
          margin: '16px 0 12px',
          alignContent: 'start',
        }}>
          {CROPS.map(crop => {
            const sel = selectedCrops.includes(crop.id);
            return (
              <button
                key={crop.id}
                onClick={() => toggle(crop.id)}
                style={{
                  padding: '14px 14px 16px',
                  border: `1.5px solid ${sel ? C.green : '#e9e6e0'}`,
                  borderRadius: 16,
                  background: sel ? C.greenLight : '#fff',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  position: 'relative',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  transition: 'border-color 0.15s, background 0.15s',
                  fontFamily: 'inherit',
                }}
              >
                {/* Abbreviation badge */}
                <div style={{
                  width: 36, height: 36,
                  borderRadius: 10,
                  background: sel ? 'rgba(31,138,62,0.12)' : '#f3f4f6',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700,
                  color: sel ? C.greenMid : '#6b7280',
                }}>
                  {crop.abbr}
                </div>

                <span style={{
                  fontSize: 15, fontWeight: 600,
                  color: sel ? C.text : C.text,
                }}>
                  {crop.label}
                </span>

                {/* Checkbox */}
                <div style={{ position: 'absolute', top: 12, right: 12 }}>
                  {sel ? <Checkmark /> : <EmptyCircle />}
                </div>
              </button>
            );
          })}
        </div>

        <PrimaryButton onClick={() => navigate(postSetup ? 7 : 4)} disabled={!canContinue} style={{ flexShrink: 0 }}>
          {canContinue ? `Continue · ${count}` : 'Select at least one crop'}
        </PrimaryButton>
      </div>
    </Screen>
  );
}
