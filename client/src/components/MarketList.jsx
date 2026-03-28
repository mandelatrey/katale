import { Store } from './Icons';

export default function MarketList({ markets, prices, selectedMarket, onSelect, getPriceForMarket, loading, commodityUnit, isMobile, currency = 'UGX' }) {
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 0', color: '#9ca3af' }}>
        <div style={{ width: 24, height: 24, border: '2px solid #e5e7eb', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: 12 }}></div>
        <div style={{ fontSize: 12 }}>Loading prices…</div>
      </div>
    );
  }

  const safeMarkets = Array.isArray(markets) ? markets : [];
  const sortedMarkets = [...safeMarkets].sort((a, b) => {
    const priceA = getPriceForMarket(a._id);
    const priceB = getPriceForMarket(b._id);
    if (priceA === 'N/A' && priceB === 'N/A') return 0;
    if (priceA === 'N/A') return 1;
    if (priceB === 'N/A') return -1;
    return priceA - priceB;
  });

  const fmt = (v) => {
    if (v === 'N/A') return '—';
    if (currency === 'USD') {
      return (v / 3700).toFixed(2);
    }
    return Math.round(v).toLocaleString();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {sortedMarkets.map((m) => {
        const price = getPriceForMarket(m._id);
        const isSelected = selectedMarket?._id === m._id;

        const retail     = price !== 'N/A' ? fmt(price * 1.05) : '—';
        const wholesale  = price !== 'N/A' ? fmt(price * 0.95) : '—';
        const discounted = price !== 'N/A' ? fmt(price) : '—';

        return (
          <div
            key={m._id}
            onClick={() => onSelect(m)}
            style={{
              borderRadius: 12,
              border: isSelected ? '1px solid rgba(26, 107, 48, 0.3)' : '1px solid #e5e7eb',
              padding: '12px 14px',
              cursor: 'pointer',
              backgroundColor: isSelected ? '#e6f2ea' : '#fff',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => { if (!isSelected) { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,.06)'; }}}
            onMouseLeave={(e) => { if (!isSelected) { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}}
          >
            {/* Row 1 — name + location tags */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <div style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Store style={{ width: 12, height: 12, color: '#6b7280' }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</span>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0, fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500, color: '#9ca3af' }}>
                <span>HWY: {m.region?.slice(0, 3)}</span>
                <span>LOC: {m.district}</span>
              </div>
            </div>

            {/* Row 2 — prices (single line) */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10, paddingTop: 8, borderTop: '1px dashed #e5e7eb' }}>
              <span>
                <span style={{ color: '#9ca3af' }}>Retail: </span>
                <span style={{ color: '#111827', fontWeight: 500, fontFamily: 'var(--font-mono)', fontSize: 11 }}>{retail}</span>
              </span>
              <span>
                <span style={{ color: '#9ca3af' }}>Wholesale: </span>
                <span style={{ fontWeight: 500, fontFamily: 'var(--font-mono)', fontSize: 11, color: isSelected ? '#1d4ed8' : '#dc2626' }}>{wholesale}</span>
              </span>
              <span>
                <span style={{ color: '#9ca3af' }}>Discounted: </span>
                <span style={{ color: '#15803d', fontWeight: 500, fontFamily: 'var(--font-mono)', fontSize: 11 }}>{discounted}</span>
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}