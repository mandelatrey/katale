import { useState, useEffect, useRef } from 'react';
import { fromLonLat } from 'ol/proj';
import PriceChart from './PriceChart';
import TransportCalculator from './TransportCalculator';
import { Store, Banknote, Info, Truck, TrendingUp } from './Icons';
import { commodities as allCommodities } from '../constants';

export default function Popup({ map, market, prices, onClose, allMarkets, isMobile }) {
  const [activeTab, setActiveTab] = useState('prices');
  const [currency, setCurrency] = useState('UGX');
  const [marketPrices, setMarketPrices] = useState([]);
  
  const formatPriceVal = (rawVal) => {
    if (currency === 'USD') {
      return (rawVal / 3700).toFixed(2);
    }
    return Math.round(rawVal).toLocaleString();
  };
  const [loadingPrices, setLoadingPrices] = useState(true);
  const priceCache = useRef({});

  useEffect(() => {
    if (priceCache.current[market._id]) {
      setMarketPrices(priceCache.current[market._id]);
      setLoadingPrices(false);
      return;
    }
    setLoadingPrices(true);
    fetch(`/api/prices/market/${market._id}?limit=30`)
      .then(r => r.json())
      .then(data => {
        priceCache.current[market._id] = data;
        setMarketPrices(data);
        setLoadingPrices(false);
      })
      .catch(err => {
        console.error(err);
        setLoadingPrices(false);
      });
  }, [market._id]);

  const getPrice = (commodity) => {
    const price = marketPrices.find(p => p.commodity === commodity);
    if (!price) return null;
    return { value: price.price.toLocaleString(), unit: price.unit, source: price.source };
  };

  const [pixel, setPixel] = useState(null);

  useEffect(() => {
    if (!isMobile || !map || !market?.location?.coordinates) return;
    const coord = fromLonLat(market.location.coordinates);
    
    const updatePixel = () => {
      const px = map.getPixelFromCoordinate(coord);
      if (px) setPixel(px);
    };
    
    updatePixel();
    map.on('postrender', updatePixel);
    return () => {
      map.un('postrender', updatePixel);
    };
  }, [map, market, isMobile]);

  const tabs = [
    { key: 'prices', label: 'Prices', icon: Banknote },
    { key: 'info', label: 'Info', icon: Info },
    { key: 'transport', label: 'Transport', icon: Truck },
    { key: 'trends', label: 'Trends', icon: TrendingUp },
  ];

  const s = {
    card: { backgroundColor: '#fff', borderRadius: 'var(--radius-lg)', padding: 20, boxShadow: '0 8px 30px rgba(0,0,0,.12)', border: '1px solid #f0f0f0', width: 336, height: 480, display: 'flex', flexDirection: 'column', fontFamily: 'inherit', overflow: 'hidden' },
    header: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12, flexShrink: 0 },
    icon: { width: 28, height: 28, borderRadius: 'var(--radius-md)', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    title: { fontSize: 14, fontWeight: 700, color: '#111827', marginLeft: 8 },
    close: { width: 24, height: 24, borderRadius: 'var(--radius-sm)', border: '1px solid #e5e7eb', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 16, color: '#9ca3af', lineHeight: 1 },
    meta: { display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 12px', marginBottom: 14, fontSize: 11, flexShrink: 0 },
    metaLabel: { color: '#9ca3af' },
    metaValue: { color: '#111827', fontWeight: 500, textTransform: 'capitalize' },
    tabRow: { display: 'flex', gap: 4, marginBottom: 0, paddingBottom: 12, overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none', flexShrink: 0, borderBottom: '1px solid #f0f0f0' },
    tab: (active) => ({ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 'var(--radius-sm)', border: 'none', fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', backgroundColor: active ? '#111827' : '#f3f4f6', color: active ? '#fff' : '#6b7280', transition: 'all 0.15s ease', whiteSpace: 'nowrap' }),
    commodityCard: { padding: '10px 12px', backgroundColor: '#fafafa', borderRadius: 'var(--radius-md)', border: '1px solid #f0f0f0', marginBottom: 8 },
    commodityName: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#111827', marginBottom: 6 },
    priceRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10, paddingTop: 6, borderTop: '1px dashed #e5e7eb' },
    priceLabel: { color: '#9ca3af', marginRight: 3 },
    priceRetail: { color: '#111827', fontWeight: 500, fontFamily: 'var(--font-mono)', fontSize: 11 },
    priceWholesale: { color: '#1d4ed8', fontWeight: 500, fontFamily: 'var(--font-mono)', fontSize: 11 },
    priceAvg: { color: '#15803d', fontWeight: 500, fontFamily: 'var(--font-mono)', fontSize: 11 },
      // pastel green ↑
  };

  const content = (
    <>
      {/* Header */}
      <div style={s.header}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={s.icon}><Store style={{ width: 13, height: 13, color: '#6b7280' }} /></div>
          <span style={s.title}>{market.name}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button 
            onClick={() => setCurrency(currency === 'UGX' ? 'USD' : 'UGX')}
            style={{ padding: '2px 6px', fontSize: 10, fontWeight: 600, border: '1px solid #e5e7eb', borderRadius: 'var(--radius-sm)', backgroundColor: '#fff', color: '#4b5563', cursor: 'pointer' }}
          >
            {currency}
          </button>
          <button style={s.close} onClick={onClose}>&times;</button>
        </div>
      </div>

      {/* Meta info */}
      <div style={s.meta}>
        <span style={s.metaLabel}>Location:</span>
        <span style={s.metaValue}>{market.district}, {market.region}</span>

        <span style={s.metaLabel}>Network:</span>
        <span style={s.metaValue}>Agribridge Net</span>

        <span style={s.metaLabel}>Type:</span>
        <span style={s.metaValue}>{market.marketType || 'wholesale'}</span>
      </div>

      {/* Tabs */}
      <div style={s.tabRow}>
        {tabs.map(tab => (
          <button key={tab.key} style={s.tab(activeTab === tab.key)} onClick={() => setActiveTab(tab.key)}>
            <tab.icon size={12} />
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4, paddingTop: 12, scrollbarWidth: 'thin' }}>
        {/* Prices tab */}
        {activeTab === 'prices' && (
          <div>
            {loadingPrices ? (
              <div style={{ textAlign: 'center', padding: 24, color: '#9ca3af', fontSize: 12 }}>Loading…</div>
            ) : (
              allCommodities.map(c => {
                const priceData = getPrice(c.key);
                if (!priceData) return null;
                const raw = parseInt(priceData.value.replace(/,/g, ''));
                const retail = formatPriceVal(raw * 1.05);
                const wholesale = formatPriceVal(raw * 0.95);
                const avg = formatPriceVal(raw);
                return (
                  <div key={c.key} style={s.commodityCard}>
                    <div style={s.commodityName}><span>{c.icon}</span> <span>{c.label}</span></div>
                    <div style={s.priceRow}>
                      <span><span style={s.priceLabel}>Retail</span><span style={s.priceRetail}>{retail}</span></span>
                      <span><span style={s.priceLabel}>Wholesale</span><span style={s.priceWholesale}>{wholesale}</span></span>
                      <span><span style={s.priceLabel}>Average</span><span style={s.priceAvg}>{avg}</span></span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Info tab */}
        {activeTab === 'info' && (
          <div>
            <h4 style={{ fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Market Information</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px', fontSize: 11 }}>
              {[
                ['Type', market.marketType || 'N/A'],
                ['District', market.district],
                ['Region', market.region],
                ['Open Days', `${market.operatingDays?.length || 0} days/week`],
              ].map(([label, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#9ca3af' }}>{label}</span>
                  <span style={{ color: '#111827', fontWeight: 500, fontFamily: 'var(--font-mono)' }}>{val}</span>
                </div>
              ))}
            </div>

            {market.operatingDays?.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <h4 style={{ fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Operating Days</h4>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {market.operatingDays.map(day => (
                    <span key={day} style={{ padding: '3px 8px', fontSize: 10, fontWeight: 500, borderRadius: 'var(--radius-sm)', backgroundColor: '#f3f4f6', color: '#374151' }}>{day.slice(0, 3)}</span>
                  ))}
                </div>
              </div>
            )}

            {market.specialties?.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <h4 style={{ fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Specialties</h4>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {market.specialties.map(sp => (
                    <span key={sp} style={{ padding: '3px 8px', fontSize: 10, fontWeight: 500, borderRadius: 'var(--radius-sm)', backgroundColor: '#e6f2ea', color: '#1a6b30' }}>{sp}</span>
                  ))}
                </div>
              </div>
            )}

            {market.description && (
              <div style={{ marginTop: 12 }}>
                <h4 style={{ fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Description</h4>
                <p style={{ fontSize: 12, color: '#4b5563', lineHeight: 1.5 }}>{market.description}</p>
              </div>
            )}
          </div>
        )}

        {/* Transport tab */}
        {activeTab === 'transport' && <TransportCalculator fromMarket={market} allMarkets={allMarkets} />}

        {/* Trends tab */}
        {activeTab === 'trends' && (
          <div>
            <h4 style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
              Price Trends (30 Days)
            </h4>
            <PriceChart prices={marketPrices} isMobile={isMobile} currency={currency} />
          </div>
        )}
      </div>

      {['prices', 'trends'].includes(activeTab) && (
        <div style={{ textAlign: 'center', marginTop: 12, flexShrink: 0 }}>
          <span style={{ fontSize: 9, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Prices are in {currency} per KG</span>
        </div>
      )}
    </>
  );

  if (isMobile) {
    if (!pixel) return null; // hide until pixel is calculated
    return (
      <div
        style={{ ...s.card, position: 'absolute', left: pixel[0], top: pixel[1], transform: 'translate(-50%, calc(-100% - 20px))', zIndex: 1100, width: 'calc(100vw - 32px)', maxWidth: 368, padding: 20, height: '65vh' }}
        onPointerDown={e => e.stopPropagation()}
        onPointerMove={e => e.stopPropagation()}
        onWheel={e => e.stopPropagation()}
      >
        {content}
      </div>
    );
  }

  return (
    <div
      style={{ ...s.card, position: 'absolute', top: 20, right: 20, zIndex: 500 }}
      onPointerDown={e => e.stopPropagation()}
      onPointerMove={e => e.stopPropagation()}
      onWheel={e => e.stopPropagation()}
    >
      {content}
    </div>
  );
}