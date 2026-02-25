import { useState, useEffect, useRef } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import OSM from 'ol/source/OSM';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { fromLonLat } from 'ol/proj';
import { Style, Circle, Fill, Stroke, Text } from 'ol/style';
import Popup from './components/Popup';
import PriceChart from './components/PriceChart';
import MarketList from './components/MarketList';
import TransportCalculator from './components/TransportCalculator';

const API_URL = '/api';

const commodities = [
  { key: 'maize', label: 'Maize', icon: '🌽' },
  { key: 'beans', label: 'Beans', icon: '🫘' },
  { key: 'coffee', label: 'Coffee', icon: '☕' },
  { key: 'matooke', label: 'Matooke', icon: '🍌' },
  { key: 'rice', label: 'Rice', icon: '🍚' },
  { key: 'groundnuts', label: 'G.Nuts', icon: '🥜' },
  { key: 'cassava', label: 'Cassava', icon: '🥔' },
  { key: 'sweet_potatoes', label: 'S.Potato', icon: '🍠' },
  { key: 'sorghum', label: 'Sorghum', icon: '🌾' },
  { key: 'millet', label: 'Millet', icon: '🌱' }
];

const regions = ['All', 'Central', 'Eastern', 'Northern', 'Western'];

function getMarkerStyle(price, allPrices, isSelected) {
  if (!allPrices.length || price === 'N/A') {
    return new Style({
      image: new Circle({
        radius: isSelected ? 10 : 7,
        fill: new Fill({ color: '#9ca3af' }),
        stroke: new Stroke({ color: 'white', width: 2 })
      })
    });
  }

  const values = allPrices.map(p => p.price).filter(Boolean);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const ratio = (price - min) / range;

  let color;
  if (ratio < 0.33) color = '#16a34a';      // green — cheap
  else if (ratio < 0.66) color = '#d97706';  // amber — medium
  else color = '#dc2626';                     // red — expensive

  return new Style({
    image: new Circle({
      radius: isSelected ? 11 : 7,
      fill: new Fill({ color }),
      stroke: new Stroke({ color: 'white', width: isSelected ? 3 : 2 })
    })
  });
}

function App() {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [markets, setMarkets] = useState([]);
  const [prices, setPrices] = useState([]);
  const [selectedCommodity, setSelectedCommodity] = useState('maize');
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [marketLayer, setMarketLayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [nearestMarkets, setNearestMarkets] = useState([]);

  useEffect(() => {
    const mapInstance = new Map({
      target: 'map',
      layers: [
        new TileLayer({ source: new OSM() })
      ],
      view: new View({ center: fromLonLat([32.3, 1.4]), zoom: 7 })
    });
    setMap(mapInstance);
    return () => mapInstance.setTarget(undefined);
  }, []);

  useEffect(() => {
    fetchMarkets();
    fetchPrices();
  }, [selectedCommodity]);

  useEffect(() => {
    if (!map || !markets.length) return;

    const filteredMarkets = selectedRegion === 'All'
      ? markets
      : markets.filter(m => m.region === selectedRegion);

    const source = new VectorSource({
      features: filteredMarkets.map(m => {
        const feature = new Feature({
          geometry: new Point(fromLonLat(m.location.coordinates)),
          ...m
        });
        feature.setId(m._id);

        const price = getPriceForMarket(m._id);
        const isSelected = selectedMarket?._id === m._id;
        feature.setStyle(getMarkerStyle(
          typeof price === 'number' ? price : 'N/A',
          prices,
          isSelected
        ));

        return feature;
      })
    });

    if (marketLayer) map.removeLayer(marketLayer);

    const layer = new VectorLayer({ source });
    map.addLayer(layer);
    setMarketLayer(layer);

    const clickListener = (e) => {
      const feature = map.forEachFeatureAtPixel(e.pixel, f => f);
      if (feature) {
        const props = feature.getProperties();
        delete props.geometry;
        setSelectedMarket(props);
      }
    };

    map.on('click', clickListener);

    return () => map.un('click', clickListener);
  }, [map, markets, prices, selectedRegion, selectedMarket]);

  const fetchMarkets = async () => {
    try {
      const res = await fetch(`${API_URL}/markets`);
      const data = await res.json();
      setMarkets(data);
    } catch (err) {
      setError('Failed to load markets');
    }
  };

  const fetchPrices = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/prices/latest?commodity=${selectedCommodity}`);
      const data = await res.json();
      setPrices(data);
    } catch (err) {
      setError('Failed to load prices');
    } finally {
      setLoading(false);
    }
  };

  const handleFindNearest = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation([longitude, latitude]);

        try {
          const res = await fetch(`${API_URL}/markets/nearest/${longitude}/${latitude}?maxDistance=100000`);
          const data = await res.json();
          setNearestMarkets(data);

          map.getView().animate({
            center: fromLonLat([longitude, latitude]),
            zoom: 9,
            duration: 800
          });
        } catch (err) {
          setError('Failed to find nearest markets');
        }
      });
    }
  };

  const getPriceForMarket = (marketId) => {
    const price = prices.find(p => p.market?._id === marketId || p.market === marketId);
    return price?.price || 'N/A';
  };

  const filteredMarkets = selectedRegion === 'All'
    ? markets
    : markets.filter(m => m.region === selectedRegion);

  const currentCommodity = commodities.find(c => c.key === selectedCommodity);

  return (
    <div className="app">
      <div className="sidebar">
        <div className="sidebar-header">
          <h1>🇺🇬 Uganda Market Map</h1>
          <p>Real agricultural commodity prices across Uganda</p>
        </div>

        <div className="sidebar-content">
          {error && (
            <div className="error">
              <span>⚠️</span> {error}
              <button onClick={() => setError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: 16 }}>×</button>
            </div>
          )}

          <div className="control-panel">
            <h3>Select Commodity</h3>
            <div className="commodity-selector">
              {commodities.map(c => (
                <button
                  key={c.key}
                  className={`commodity-btn ${selectedCommodity === c.key ? 'active' : ''}`}
                  onClick={() => setSelectedCommodity(c.key)}
                >
                  <span className="commodity-icon">{c.icon}</span>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="control-panel">
            <h3>Filter by Region</h3>
            <div className="region-filter">
              {regions.map(r => (
                <button
                  key={r}
                  className={`region-btn ${selectedRegion === r ? 'active' : ''}`}
                  onClick={() => setSelectedRegion(r)}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="control-panel">
            <h3>Your Location</h3>
            <button className="commodity-btn active" onClick={handleFindNearest}>
              📍 Find Nearest Markets
            </button>
            {nearestMarkets.length > 0 && (
              <p style={{ marginTop: 8, fontSize: 12, color: '#6b7280' }}>
                Found {nearestMarkets.length} markets within 100km
              </p>
            )}
          </div>

          <MarketList
            markets={filteredMarkets}
            prices={prices}
            selectedMarket={selectedMarket}
            onSelect={setSelectedMarket}
            getPriceForMarket={getPriceForMarket}
            loading={loading}
            commodityUnit={prices[0]?.unit || 'kg'}
          />
        </div>
      </div>

      <div className="map-container">
        <div id="map" ref={mapRef}></div>

        {selectedMarket && (
          <Popup
            market={selectedMarket}
            prices={prices}
            onClose={() => setSelectedMarket(null)}
            commodities={commodities}
          />
        )}

        <div className="legend">
          <div className="legend-title">Price Level</div>
          <div className="legend-item">
            <div className="legend-dot" style={{ background: '#16a34a' }}></div>
            <span>Low price (best deal)</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ background: '#d97706' }}></div>
            <span>Medium price</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ background: '#dc2626' }}></div>
            <span>High price</span>
          </div>
          {userLocation && (
            <div className="legend-item" style={{ marginTop: 4 }}>
              <div className="legend-dot" style={{ background: '#3b82f6' }}></div>
              <span>Your location</span>
            </div>
          )}
        </div>

        <div className="attribution">
          Price data sourced from{' '}
          <a href="https://farmgainafrica.org" target="_blank" rel="noopener">Farmgain Africa</a>,{' '}
          <a href="https://agromarketday.com" target="_blank" rel="noopener">AgroMarketDay</a>,{' '}
          <a href="https://ugandacoffee.go.ug" target="_blank" rel="noopener">UCDA</a>,{' '}
          <a href="https://ubos.org" target="_blank" rel="noopener">UBOS</a>
        </div>
      </div>
    </div>
  );
}

export default App;