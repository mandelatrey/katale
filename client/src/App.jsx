import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { fromLonLat } from 'ol/proj';
import { Style, Circle, Fill, Stroke } from 'ol/style';
import Popup from './components/Popup';
import MarketList from './components/MarketList';
import { Button } from './components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from './components/ui/card';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuCheckboxItem,
} from './components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';
import { commodities, regions } from './constants';

const API_URL = '/api';

const MAP_TILER_API_KEY = import.meta.env.VITE_MAP_TILER_API_KEY;

const BASE_LAYERS = [
  { id: 'streets', label: 'Streets', description: 'MapTiler streets' },
  { id: 'transport', label: 'Transport', description: 'MapTiler transport' },
  { id: 'outdoor', label: 'Outdoor', description: 'MapTiler outdoor' },
  { id: 'topo', label: 'Topo', description: 'MapTiler topo' },
  { id: 'satellite', label: 'Satellite', description: 'MapTiler satellite' }
];

function createBaseLayer(type) {
  if (MAP_TILER_API_KEY) {
    let url;

    switch (type) {
      case 'streets':
        url = `https://api.maptiler.com/maps/streets-v2/256/{z}/{x}/{y}.png?key=${MAP_TILER_API_KEY}`;
        break;
      case 'transport':
        url = `https://api.maptiler.com/maps/transport-v2/256/{z}/{x}/{y}.png?key=${MAP_TILER_API_KEY}`;
        break;
      case 'outdoor':
        url = `https://api.maptiler.com/maps/outdoor-v2/256/{z}/{x}/{y}.png?key=${MAP_TILER_API_KEY}`;
        break;
      case 'satellite':
        url = `https://api.maptiler.com/maps/satellite/256/{z}/{x}/{y}.jpg?key=${MAP_TILER_API_KEY}`;
        break;
      case 'topo':
        url = `https://api.maptiler.com/maps/topo-v2/256/{z}/{x}/{y}.png?key=${MAP_TILER_API_KEY}`;
        break;
      default:
        url = `https://api.maptiler.com/maps/streets-v2/256/{z}/{x}/{y}.png?key=${MAP_TILER_API_KEY}`;
        break;
    }

    return new TileLayer({
      source: new XYZ({
        url,
        crossOrigin: 'anonymous'
      })
    });
  }

  // Fallback to standard OSM tiles if no MapTiler key is available
  return new TileLayer({
    source: new OSM()
  });
}

function getMarkerStyle(price, priceRange, isSelected) {
  if (!priceRange || price === 'N/A') {
    return new Style({
      image: new Circle({
        radius: isSelected ? 10 : 7,
        fill: new Fill({ color: '#9ca3af' }),
        stroke: new Stroke({ color: 'white', width: 2 })
      })
    });
  }

  const { min, max } = priceRange;
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
  const [baseLayer, setBaseLayer] = useState(null);
  const [baseLayerType, setBaseLayerType] = useState('streets');
  const [markets, setMarkets] = useState([]);
  const [prices, setPrices] = useState([]);
  const [selectedCommodity, setSelectedCommodity] = useState('maize');
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [marketLayer, setMarketLayer] = useState(null);
  const [showMarkets, setShowMarkets] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [nearestMarkets, setNearestMarkets] = useState([]);

  useEffect(() => {
    const initialBaseLayer = createBaseLayer(baseLayerType);
    const mapInstance = new Map({
      target: 'map',
      layers: [initialBaseLayer],
      view: new View({ center: fromLonLat([32.3, 1.4]), zoom: 7 })
    });
    setMap(mapInstance);
    setBaseLayer(initialBaseLayer);
    return () => {
      mapInstance.setTarget(undefined);
      mapInstance.dispose(); // Fix #10: fully dispose map on unmount
    };
  }, []);

  // Fix #9: dispose old base layer source when swapping
  useEffect(() => {
    if (!map) return;

    const newBaseLayer = createBaseLayer(baseLayerType);

    if (baseLayer) {
      map.removeLayer(baseLayer);
      baseLayer.getSource()?.dispose?.();
    }

    map.getLayers().insertAt(0, newBaseLayer);
    setBaseLayer(newBaseLayer);
  }, [map, baseLayerType]);

  useEffect(() => {
    fetchMarkets();
    fetchPrices();
  }, [selectedCommodity]);

  // Precompute price range once for marker styling (Fix #7)
  const priceRange = useMemo(() => {
    const values = prices.map(p => p.price).filter(Boolean);
    if (!values.length) return null;
    return { min: Math.min(...values), max: Math.max(...values) };
  }, [prices]);

  // Compute filtered markets once (Fix #5)
  const filteredMarkets = useMemo(() => {
    return selectedRegion === 'All'
      ? markets
      : markets.filter(m => m.region === selectedRegion);
  }, [markets, selectedRegion]);

  // Build market layer — no selectedMarket dependency (Fix #1)
  useEffect(() => {
    if (!map || !markets.length) return;

    if (!showMarkets) {
      if (marketLayer) {
        marketLayer.setVisible(false);
      }
      return;
    }

    const source = new VectorSource({
      features: filteredMarkets.map(m => {
        const feature = new Feature({
          geometry: new Point(fromLonLat(m.location.coordinates)),
          ...m
        });
        feature.setId(m._id);

        const price = getPriceForMarket(m._id);
        feature.setStyle(getMarkerStyle(
          typeof price === 'number' ? price : 'N/A',
          priceRange,
          false
        ));

        return feature;
      })
    });

    if (marketLayer) {
      map.removeLayer(marketLayer);
    }

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
  }, [map, filteredMarkets, prices, priceRange, showMarkets]);

  // Highlight selected market without rebuilding the layer (Fix #1)
  useEffect(() => {
    if (!marketLayer) return;
    const source = marketLayer.getSource();
    if (!source) return;

    source.getFeatures().forEach(feature => {
      const fid = feature.getId();
      const isSelected = selectedMarket?._id === fid;
      const price = getPriceForMarket(fid);
      feature.setStyle(getMarkerStyle(
        typeof price === 'number' ? price : 'N/A',
        priceRange,
        isSelected
      ));
    });
  }, [selectedMarket, marketLayer, priceRange, prices]);

  useEffect(() => {
    if (!map || !selectedMarket?.location?.coordinates) return;

    const [longitude, latitude] = selectedMarket.location.coordinates;

    map.getView().animate({
      center: fromLonLat([longitude, latitude]),
      zoom: 14,
      duration: 800
    });
  }, [map, selectedMarket]);

  // Fix #14: wrap fetch functions with useCallback
  const fetchMarkets = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/markets`);
      const data = await res.json();
      setMarkets(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Failed to load markets');
    }
  }, []);

  const fetchPrices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/prices/latest?commodity=${selectedCommodity}`);
      const data = await res.json();
      setPrices(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Failed to load prices');
      setPrices([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCommodity]);

  const handleFindNearest = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation([longitude, latitude]);

        try {
          const res = await fetch(`${API_URL}/markets/nearest/${longitude}/${latitude}?maxDistance=50000`);
          const data = await res.json();
          setNearestMarkets(Array.isArray(data) ? data : []);

          map.getView().animate({
            center: fromLonLat([longitude, latitude]),
            zoom: 10,
            duration: 800
          });
        } catch (err) {
          setError('Failed to find nearest markets');
        }
      });
    }
  }, [map]);

  const getPriceForMarket = useCallback((marketId) => {
    const price = prices.find(p => p.market?._id === marketId || p.market === marketId);
    return price?.price || 'N/A';
  }, [prices]);

  // filteredMarkets is now computed via useMemo above

  const currentCommodity = commodities.find(c => c.key === selectedCommodity);
  const currentBaseLayer = BASE_LAYERS.find(l => l.id === baseLayerType);

  return (
    <div className="app">
      <div className="sidebar">
        <div className="sidebar-header flex items-center justify-between gap-3">
          <div>
            <h1>🇺🇬 Katale</h1>
            <p>Real agricultural commodity prices across Uganda</p>
          </div>
        </div>

        <div className="sidebar-content">
          {error && (
            <div className="error">
              <span>⚠️</span> {error}
              <button
                onClick={() => setError(null)}
                style={{
                  marginLeft: 'auto',
                  background: 'none',
                  border: 'none',
                  color: 'inherit',
                  cursor: 'pointer',
                  fontSize: 16,
                }}
              >
                ×
              </button>
            </div>
          )}

          <Card className="control-panel">
            <CardHeader className="pb-3">
              <CardTitle>Select commodity</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="commodity-selector">
                {commodities.map(c => (
                  <Button
                    key={c.key}
                    variant={
                      selectedCommodity === c.key ? 'default' : 'outline'
                    }
                    size="sm"
                    className={`commodity-btn ${
                      selectedCommodity === c.key ? 'active' : ''
                    }`}
                    onClick={() => setSelectedCommodity(c.key)}
                  >
                    <span className="commodity-icon">{c.icon}</span>
                    {c.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="control-panel">
            <CardHeader className="pb-3">
              <CardTitle>Filter by region</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="region-filter">
                {regions.map(r => (
                  <Button
                    key={r}
                    size="sm"
                    variant={selectedRegion === r ? 'default' : 'outline'}
                    className={`region-btn ${
                      selectedRegion === r ? 'active' : ''
                    }`}
                    onClick={() => setSelectedRegion(r)}
                  >
                    {r}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="control-panel">
            <CardHeader className="pb-3">
              <CardTitle>Your location</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <Button
                className="commodity-btn active w-full justify-center"
                onClick={handleFindNearest}
              >
                📍 Find nearest markets
              </Button>
              {nearestMarkets.length > 0 && (
                <p style={{ fontSize: 12, color: '#6b7280' }}>
                  Found {nearestMarkets.length} markets within 50km
                </p>
              )}
            </CardContent>
          </Card>

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

        <div className="map-controls">
          <div className="map-controls-row w-52">
            <span className="map-controls-label font-medium text-gray-800">Base map</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-between text-[11px] font-medium"
                >
                  <span>{currentBaseLayer?.label || 'Choose map style'}</span>
                  <ChevronDown className="h-3 w-3 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[var(--radix-dropdown-menu-trigger-width)] text-[11px] bg-white/95 backdrop-blur-[8px] border border-gray-200 shadow-lg rounded-[10px] p-2 z-[1000]"
              >
                <DropdownMenuLabel className="font-medium text-gray-800">Base map style</DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={baseLayerType}
                  onValueChange={value => setBaseLayerType(value)}
                >
                  {BASE_LAYERS.map(layer => (
                    <DropdownMenuRadioItem
                      key={layer.id}
                      value={layer.id}
                      className="cursor-pointer text-gray-700 hover:text-gray-900 focus:text-gray-900"
                    >
                      {layer.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={showMarkets}
                  onCheckedChange={value => setShowMarkets(Boolean(value))}
                  className="cursor-pointer text-gray-700 hover:text-gray-900 focus:text-gray-900"
                >
                  Show market markers
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {selectedMarket && (
          <Popup
            market={selectedMarket}
            prices={prices}
            onClose={() => setSelectedMarket(null)}
            commodities={commodities}
            allMarkets={markets}
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