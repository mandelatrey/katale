import { useState, useMemo } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';

export default function TransportCalculator({ fromMarket, allMarkets = [] }) {
  const [selectedTo, setSelectedTo] = useState('');
  const [destinationQuery, setDestinationQuery] = useState('');
  const [result, setResult] = useState(null);
  const [calculating, setCalculating] = useState(false);

  // Derive destination markets from prop instead of fetching (Fix #6)
  const toMarkets = useMemo(
    () => allMarkets.filter(m => m._id !== fromMarket._id),
    [allMarkets, fromMarket._id]
  );

  const filteredDestinations = destinationQuery
    ? toMarkets.filter(m =>
        `${m.name} ${m.district}`.toLowerCase().includes(destinationQuery.toLowerCase())
      ).slice(0, 8)
    : toMarkets.slice(0, 8);

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
        <div className="transport-destination">
          <Input
            type="text"
            className="transport-input"
            placeholder="Start typing town or market..."
            value={destinationQuery}
            onChange={e => {
              setDestinationQuery(e.target.value);
              setSelectedTo('');
            }}
          />
          {filteredDestinations.length > 0 && destinationQuery && (
            <div className="transport-suggestions">
              {filteredDestinations.map(m => (
                <Button
                  key={m._id}
                  type="button"
                  variant="ghost"
                  className="transport-suggestion"
                  onClick={() => {
                    setSelectedTo(m._id);
                    setDestinationQuery(`${m.name} (${m.district})`);
                  }}
                >
                  <span className="transport-suggestion-name">{m.name}</span>
                  <span className="transport-suggestion-meta">{m.district}</span>
                </Button>
              ))}
            </div>
          )}
        </div>
        <Button
          className="transport-btn"
          onClick={handleCalculate}
          disabled={!selectedTo || calculating}
        >
          {calculating ? '...' : 'Calculate'}
        </Button>
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