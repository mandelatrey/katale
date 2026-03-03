import { useState, useMemo } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { MapPin, Package, Plus, Minus } from './Icons';

// Haversine distance formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Math.round(R * c);
}

export default function TransportCalculator({ fromMarket, allMarkets = [] }) {
  const [selectedTo, setSelectedTo] = useState('');
  const [destinationQuery, setDestinationQuery] = useState('');
  const [weight, setWeight] = useState('1');
  const [result, setResult] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState(null);

  const toMarkets = useMemo(
    () => allMarkets.filter(m => m._id !== fromMarket._id),
    [allMarkets, fromMarket._id]
  );

  const filteredDestinations = destinationQuery && !selectedTo
    ? toMarkets.filter(m =>
        `${m.name} ${m.district}`.toLowerCase().includes(destinationQuery.toLowerCase())
      ).slice(0, 5)
    : [];

  const handleCalculate = async () => {
    if (!destinationQuery) return;
    setCalculating(true);
    setError(null);
    setResult(null);

    try {
      let targetCoords = null;
      let targetName = '';

      // If a known market is selected via autocomplete
      if (selectedTo) {
        const market = toMarkets.find(m => m._id === selectedTo);
        if (market && market.location && market.location.coordinates) {
          targetCoords = { lon: market.location.coordinates[0], lat: market.location.coordinates[1] };
          targetName = market.name;
        }
      }

      // If no valid DB market, fallback to openstreetmap geocoding
      if (!targetCoords) {
        // limit search bounds context generally to Uganda for better results
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(destinationQuery + ', Uganda')}&format=json&limit=1`);
        const data = await res.json();
        
        if (data && data.length > 0) {
          targetCoords = { lon: parseFloat(data[0].lon), lat: parseFloat(data[0].lat) };
          targetName = data[0].display_name.split(',')[0]; // simple name
        } else {
          throw new Error('Location not found');
        }
      }

      if (targetCoords && fromMarket.location?.coordinates) {
        const fromCoords = fromMarket.location.coordinates;
        const dist = calculateDistance(
          fromCoords[1], fromCoords[0],
          targetCoords.lat, targetCoords.lon
        );
        
        const numericWeight = parseFloat(weight) || 1;
        const costPerKmPerTon = 500; // standard UGX rate per km per ton
        const estimatedCost = dist * costPerKmPerTon * numericWeight;
        
        setResult({
          from: { name: fromMarket.name },
          to: { name: targetName || destinationQuery },
          distance: dist,
          weight: numericWeight,
          travelTime: Math.round(dist / 60) || 1, // ~60km/h avg
          estimatedCost
        });
      }

    } catch (err) {
      setError('Could not calculate distance. Please try a different location name.');
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
      <div className="transport-form" style={{ flexDirection: 'column', gap: 8 }}>
        <div className="transport-destination" style={{ width: '100%' }}>
          <div style={{ position: 'relative' }}>
            <MapPin style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: '#9ca3af' }} />
            <Input
              type="text"
              className="transport-input"
              style={{ paddingLeft: 28 }}
              placeholder="Search any town, city or market..."
              value={destinationQuery}
              onChange={e => {
                setDestinationQuery(e.target.value);
                setSelectedTo('');
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') handleCalculate();
              }}
            />
          </div>
          {filteredDestinations.length > 0 && (
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
        
        <div style={{ display: 'flex', gap: 8, width: '100%' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            width: '130px', 
            flexShrink: 0, 
            background: '#fff', 
            border: '1px solid #e5e7eb', 
            borderRadius: 'var(--radius-sm)',
            overflow: 'hidden',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}>
            <button
              type="button"
              onClick={() => setWeight(w => String(Math.max(0.1, (parseFloat(w) || 1) - 0.5)))}
              style={{ width: '34px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', borderRight: '1px solid #e5e7eb', background: '#f9fafb', cursor: 'pointer', border: 'none', outline: 'none' }}
              onMouseOver={e => e.currentTarget.style.background = '#f3f4f6'}
              onMouseOut={e => e.currentTarget.style.background = '#f9fafb'}
            >
              <Minus style={{ width: 14, height: 14 }} />
            </button>
            <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Input
                type="number"
                min="0.1"
                step="0.1"
                className="transport-input no-spinners"
                style={{ padding: '0', border: 'none', textAlign: 'center', height: '36px', width: '100%', boxShadow: 'none', background: 'transparent', fontWeight: 500, color: '#111827' }}
                value={weight}
                onChange={e => setWeight(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleCalculate();
                }}
              />
              <span style={{ position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: '#9ca3af', pointerEvents: 'none' }}>
                t
              </span>
            </div>
            <button
              type="button"
              onClick={() => setWeight(w => String((parseFloat(w) || 0) + 0.5))}
              style={{ width: '34px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', borderLeft: '1px solid #e5e7eb', background: '#f9fafb', cursor: 'pointer', border: 'none', outline: 'none' }}
              onMouseOver={e => e.currentTarget.style.background = '#f3f4f6'}
              onMouseOut={e => e.currentTarget.style.background = '#f9fafb'}
            >
              <Plus style={{ width: 14, height: 14 }} />
            </button>
          </div>
          <Button
            className="transport-btn"
            style={{ flex: 1 }}
            onClick={handleCalculate}
            disabled={!destinationQuery || calculating || !weight}
          >
            {calculating ? 'Calculating...' : 'Calculate'}
          </Button>
        </div>
      </div>

      {error && (
        <div style={{ marginTop: 10, fontSize: 11, color: '#ef4444' }}>{error}</div>
      )}

      {result && (
        <div className="transport-result">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <div><strong style={{ color: '#4b5563' }}>From:</strong> <span style={{ color: '#111827' }}>{result.from.name}</span></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 10, borderBottom: '1px dashed #d1d5db' }}>
            <div><strong style={{ color: '#4b5563' }}>To:</strong> <span style={{ color: '#111827' }}>{result.to.name}</span></div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase' }}>Weight</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#111827', fontFamily: 'var(--font-mono)' }}>{result.weight} tons</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase' }}>Distance</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#111827', fontFamily: 'var(--font-mono)' }}>{result.distance} km</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase' }}>Time</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#111827', fontFamily: 'var(--font-mono)' }}>~{result.travelTime} hr</div>
            </div>
          </div>
          
          <div className="cost" style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
            <span style={{ fontSize: 11, color: '#4b5563', paddingBottom: 2 }}>Est. Cost:</span> 
            <span className="price-mono" style={{ fontSize: 22, color: '#15803d', fontWeight: 700, letterSpacing: '-0.5px', fontFamily: 'var(--font-mono)' }}>
              {result.estimatedCost.toLocaleString()}
            </span>
            <span style={{ fontSize: 11, color: '#15803d', fontWeight: 600, paddingBottom: 2 }}>UGX</span>
          </div>
          <div style={{ fontSize: 9, color: '#9ca3af', marginTop: 6, fontStyle: 'italic' }}>
            *Calculations are estimates based on standard 500 UGX/km per ton rates.
          </div>
        </div>
      )}
    </div>
  );
}