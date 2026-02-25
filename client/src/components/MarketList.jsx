export default function MarketList({ markets, prices, selectedMarket, onSelect, getPriceForMarket, loading, commodityUnit }) {
  if (loading) {
    return (
      <div className="control-panel">
        <h3>Markets by Price</h3>
        <div className="loading">
          <div className="loading-spinner"></div>
          <div>Loading prices...</div>
        </div>
      </div>
    );
  }

  const sortedMarkets = [...markets].sort((a, b) => {
    const priceA = getPriceForMarket(a._id);
    const priceB = getPriceForMarket(b._id);
    if (priceA === 'N/A' && priceB === 'N/A') return 0;
    if (priceA === 'N/A') return 1;
    if (priceB === 'N/A') return -1;
    return priceA - priceB;
  });

  const formatPrice = (price) => {
    if (price === 'N/A') return 'N/A';
    return Number(price).toLocaleString();
  };

  return (
    <div className="control-panel">
      <h3>
        Markets by Price
        <span className="market-count">({sortedMarkets.length} markets)</span>
      </h3>
      <div className="market-list">
        {sortedMarkets.map((m, index) => {
          const price = getPriceForMarket(m._id);
          return (
            <div
              key={m._id}
              className={`market-card ${selectedMarket?._id === m._id ? 'selected' : ''}`}
              onClick={() => onSelect(m)}
            >
              <div className="market-card-header">
                <div>
                  <div className="market-name">{m.name}</div>
                  <div className="market-location">
                    {m.district}
                    <span className="market-tag">{m.marketType}</span>
                    <span className="market-tag">{m.region}</span>
                  </div>
                </div>
                {index < 3 && price !== 'N/A' && (
                  <div className={`rank-badge rank-${index + 1}`}>
                    {index === 0 ? '🏆' : `#${index + 1}`}
                  </div>
                )}
              </div>
              <div className="market-price">
                {price !== 'N/A' ? (
                  <>
                    {formatPrice(price)}
                    <span className="currency">UGX</span>
                    <span className="unit">/{commodityUnit}</span>
                  </>
                ) : (
                  <span style={{ fontSize: 13, color: '#9ca3af' }}>No price data</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}