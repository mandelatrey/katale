import { useState, useEffect } from 'react';

export default function TransportCalculator({ fromMarket }) {
  const [toMarkets, setToMarkets] = useState([]);
  const [selectedTo, setSelectedTo] = useState('');
  const [result, setResult] = useState(null);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    fetch('/api/markets')
      .then(r => r.json())
      .then(markets => setToMarkets(markets.filter(m => m._id !== fromMarket._id)))
      .catch(console.error);
  }, [fromMarket._id]);

  const handleCalculate = async () => {
    if (!selectedTo) return;
    setCalculating(true);
    try {
      const res = await fetch(`/api/prices/transport/${fromMarket._id}/${selectedTo}`);
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setCalculating(false);
    }
  };

  return (
    <div>
      <h4 style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
        Estimate Transport Cost
      </h4>
      <div className="transport-form">
        <select value={selectedTo} onChange={e => setSelectedTo(e.target.value)}>
          <option value="">Select destination...</option>
          {toMarkets.map(m => (
            <option key={m._id} value={m._id}>{m.name} ({m.district})</option>
          ))}
        </select>
        <button
          className="transport-btn"
          onClick={handleCalculate}
          disabled={!selectedTo || calculating}
        >
          {calculating ? '...' : 'Calculate'}
        </button>
      </div>

      {result && (
        <div className="transport-result">
          <div><strong>From:</strong> {result.from.name}</div>
          <div><strong>To:</strong> {result.to.name}</div>
          <div><strong>Distance:</strong> {result.distance} km</div>
          <div><strong>Travel Time:</strong> ~{result.travelTime} hours</div>
          <div className="cost">
            Est. Cost: {result.estimatedCost.toLocaleString()} UGX
          </div>
        </div>
      )}
    </div>
  );
}