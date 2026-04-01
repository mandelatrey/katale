export default function FilterPills({ options, value, onChange }) {
  const pillStyle = (active) => ({
    padding: '4px 12px',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
    border: active ? '1px solid rgba(26,107,48,0.3)' : '1px solid #e5e7eb',
    backgroundColor: active ? '#e6f2ea' : '#fff',
    color: active ? '#0d3b1a' : '#4b5563',
    transition: 'all 0.15s',
  });

  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
      {options.map(opt => (
        <button
          key={opt.value}
          style={pillStyle(value === opt.value)}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
