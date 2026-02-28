import { useState, useEffect, useRef } from 'react';
import PriceChart from './PriceChart';
import TransportCalculator from './TransportCalculator';
import { Button } from './ui/button';
import { commodities as allCommodities } from '../constants';

export default function Popup({ market, prices, onClose, allMarkets }) {
  const [activeTab, setActiveTab] = useState('prices');
  const [marketPrices, setMarketPrices] = useState([]);
  const [loadingPrices, setLoadingPrices] = useState(true);
  const priceCache = useRef({}); // Fix #11: cache prices per market

  useEffect(() => {
    // Return cached data if we already fetched this market
    if (priceCache.current[market._id]) {
      setMarketPrices(priceCache.current[market._id]);
      setLoadingPrices(false);
      return;
    }

    setLoadingPrices(true);
    fetch(`/api/prices/market/${market._id}?days=30`)
      .then(r => r.json())
      .then(data => {
        priceCache.current[market._id] = data; // cache it
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
    return {
      value: price.price.toLocaleString(),
      unit: price.unit,
      source: price.source
    };
  };

  const tabs = [
    { key: 'prices', label: '💰 Prices' },
    { key: 'info', label: 'ℹ️ Info' },
    { key: 'transport', label: '🚛 Transport' },
    { key: 'trends', label: '📈 Trends' }
  ];

  return (
    <div 
      className="popup" 
      style={{ top: 20, right: 20 }}
      onPointerDown={e => e.stopPropagation()}
      onPointerMove={e => e.stopPropagation()}
      onWheel={e => e.stopPropagation()}
    >
      <div className="popup-header">
        <div>
          <div className="popup-title">{market.name}</div>
          <div className="popup-subtitle">{market.district}, {market.region} Region</div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="popup-close"
          onClick={onClose}
          aria-label="Close details"
        >
          ×
        </Button>
      </div>

      <div className="popup-tabs">
        {tabs.map(tab => (
          <Button
            key={tab.key}
            type="button"
            variant={activeTab === tab.key ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab(tab.key)}
            className={`popup-tab ${activeTab === tab.key ? 'active' : ''}`}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {activeTab === 'prices' && (
        <div className="popup-section">
          <h4>Current Prices (UGX/kg)</h4>
          {loadingPrices ? (
            <div className="loading">
              <div className="loading-spinner"></div>
              <div>Loading...</div>
            </div>
          ) : (
            <>
              {allCommodities.map(c => {
                const priceData = getPrice(c.key);
                return (
                  <div key={c.key} className="price-row">
                    <span className="commodity">
                      {c.icon} {c.label}
                    </span>
                    <span className="value">
                      {priceData ? `${priceData.value}` : '—'}
                    </span>
                  </div>
                );
              })}
              <div className="data-source-tag">
                📊 Sources: Farmgain Africa, AgroMarketDay, UCDA
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'info' && (
        <div className="popup-section">
          <h4>Market Information</h4>
          <div className="market-info-grid">
            <div className="market-info-item">
              <label>Type</label>
              <span>{market.marketType || 'N/A'}</span>
            </div>
            <div className="market-info-item">
              <label>District</label>
              <span>{market.district}</span>
            </div>
            <div className="market-info-item">
              <label>Region</label>
              <span>{market.region}</span>
            </div>
            <div className="market-info-item">
              <label>Open Days</label>
              <span>{market.operatingDays?.length || 0} days/week</span>
            </div>
          </div>

          {market.operatingDays?.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <h4>Operating Days</h4>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                {market.operatingDays.map(day => (
                  <span key={day} className="market-tag" style={{ padding: '3px 8px' }}>
                    {day.slice(0, 3)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {market.specialties?.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <h4>Specialties</h4>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                {market.specialties.map(s => (
                  <span key={s} className="market-tag" style={{ padding: '3px 8px', background: '#e6f7eb', color: '#145226' }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {market.description && (
            <div style={{ marginTop: 12 }}>
              <h4>Description</h4>
              <p style={{ fontSize: 12, color: '#4b5563', lineHeight: 1.5 }}>{market.description}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'transport' && (
        <TransportCalculator fromMarket={market} allMarkets={allMarkets} />
      )}

      {activeTab === 'trends' && (
        <div>
          <h4 style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
            Price Trends (30 Days)
          </h4>
          <PriceChart prices={marketPrices} />
        </div>
      )}
    </div>
  );
}