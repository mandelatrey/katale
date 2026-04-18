import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from './routes';
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
import { Style, Circle, Fill, Stroke, Icon } from 'ol/style';
import Popup from './components/Popup';
import MarketList from './components/MarketList';
import NavigationSidebar from './components/NavigationSidebar';
import Dashboard from './components/Dashboard';
import AssetsView from './components/AssetsView';
import TransactionsView from './components/TransactionsView';
import PaymentsView from './components/PaymentsView';
import ReportsView from './components/ReportsView';
import StatementsView from './components/StatementsView';
import CarriersView from './components/CarriersView';
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
import { ChevronDown, List, Navigation, TriangleAlert, MapPin, Store, LayoutGrid, Leaf, Receipt, MessageCircle, MoreHorizontal, Truck, Package, CreditCard, BarChart2, FileText, Users, Bell, Settings, LogOut } from './components/Icons';
import { commodities, regions } from './constants';
import { useIsMobile } from './hooks/use-mobile';
import * as marketsApi from './api/markets.js';
import * as commoditiesApi from './api/commodities.js';

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

function getPriceLevelColor(price, priceRange) {
  if (!priceRange || price === 'N/A' || price == null) return '#6b7280'; // gray – no data
  const ratio = (price - priceRange.min) / (priceRange.max - priceRange.min || 1);
  if (ratio <= 0.33) return '#1f8a3e'; // green – low (best deal)
  if (ratio <= 0.66) return '#d97706'; // amber – medium
  return '#dc2626';                    // red – high
}

function getMarkerStyle(price, priceRange, isSelected) {
  const hasPrice = price !== 'N/A' && price != null && typeof price === 'number';
  const priceText = hasPrice ? `UGX ${Number(price).toLocaleString()}` : 'N/A';
  
  // Use price level for the background color (replacing the previous black)
  const bg = getPriceLevelColor(typeof price === 'number' ? price : 'N/A', priceRange);
  
  // Border adjustments: 1px thin, 30% opacity on active (isSelected) states
  const strokeColor = isSelected ? 'rgba(26, 107, 48, 0.3)' : 'rgba(255, 255, 255, 0.8)';
  const strokeWidth = 1;

  // Estimate text width (rough approximation for 11px sans-serif)
  const textWidth = priceText.length * 6.5;
  const totalWidth = Math.max(textWidth + 34, 40);

  const dotSize = isSelected ? 5 : 4;
  const dotColor = '#ffffff'; // White dot for better contrast against themed backgrounds

  const svg = `<svg width="${totalWidth}" height="32" viewBox="0 0 ${totalWidth} 32" xmlns="http://www.w3.org/2000/svg">
    <rect x="0.5" y="0.5" width="${totalWidth - 1}" height="24" rx="12" fill="${bg}" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
    <circle cx="12" cy="12.5" r="${dotSize + 2}" fill="rgba(255,255,255,0.2)"/>
    <circle cx="12" cy="12.5" r="${dotSize}" fill="${dotColor}"/>
    <text x="24" y="16.5" font-family="'IBM Plex Sans', -apple-system, sans-serif" font-size="11" font-weight="700" fill="white">${priceText}</text>
    <path d="M ${totalWidth/2 - 5} 24.5 L ${totalWidth/2} 30 L ${totalWidth/2 + 5} 24.5" fill="${bg}" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linejoin="round"/>
  </svg>`;

  return new Style({
    image: new Icon({
      src: 'data:image/svg+xml;utf8,' + encodeURIComponent(svg),
      anchor: [0.5, 1],
      scale: isSelected ? 1.15 : 1
    }),
    zIndex: isSelected ? 1000 : 1
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
  const [currency, setCurrency] = useState('UGX');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [mobileSearch, setMobileSearch] = useState('');
  const [desktopSearch, setDesktopSearch] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('commodities'); // bottom tab active item
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);
  const unreadMessages = 2; // badge count — replace with real data when available
  const [showAllCommodities, setShowAllCommodities] = useState(false);
  
  const isMobile = useIsMobile();

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
    const currentZoom = map.getView().getZoom();
    const targetZoom = 14;
    
    // If not close to target zoom, we need to estimate resolution at target zoom
    // However, it's safer to just calculate the offset using the target resolution
    const targetResolution = map.getView().getResolutionForZoom(targetZoom);
    const center = fromLonLat([longitude, latitude]);
    
    // Move center north so the marker is placed lower on the screen
    // On mobile we need more space, pushing it further down
    if (isMobile) {
      center[1] += 260 * targetResolution; 
    }

    map.getView().animate({
      center: center,
      zoom: targetZoom,
      duration: 800
    });
  }, [map, selectedMarket, isMobile]);

  // Fix #14: wrap fetch functions with useCallback
  const fetchMarkets = useCallback(async () => {
    try {
      const data = await marketsApi.listMarkets();
      setMarkets(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Failed to load markets');
    }
  }, []);

  const fetchPrices = useCallback(async () => {
    setLoading(true);
    try {
      const data = await commoditiesApi.latestPrices({ commodity: selectedCommodity });
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
          const data = await marketsApi.listNearbyMarkets(longitude, latitude, 50000);
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

  // Zoom out to Uganda overview and reset selected market when commodity changes
  const handleCommodityChange = useCallback((commodityKey) => {
    setSelectedCommodity(commodityKey);
    setSelectedMarket(null);
    if (map) {
      map.getView().animate({
        center: fromLonLat([32.3, 1.4]),
        zoom: 7,
        duration: 700,
      });
    }
  }, [map]);

  const currentCommodity = commodities.find(c => c.key === selectedCommodity);
  const currentBaseLayer = BASE_LAYERS.find(l => l.id === baseLayerType);

  return (
    <div className="app">
      {!isMobile && (
        <NavigationSidebar
          onNavigate={navigate}
        />
      )}


      {/* ── Right-side content area (overlay views + map view) ── */}
      <div style={{ flex: 1, overflow: 'hidden', minHeight: 0, position: 'relative', display: 'flex', flexDirection: 'row' }}>

      {/* ── Overlay Views — rendered via React Router ── */}
      {!isMobile && location.pathname !== ROUTES.MAP && (
        <div style={{ flex: 1, flexDirection: 'column', minHeight: 0, overflow: 'hidden', display: 'flex' }}>
          <Routes>
            <Route path={ROUTES.DASHBOARD} element={<Dashboard markets={markets} currency={currency} />} />
            <Route path={ROUTES.CARRIERS} element={<CarriersView />} />
            <Route path={ROUTES.ASSETS} element={<AssetsView currency={currency} />} />
            <Route path={ROUTES.TRANSACTIONS} element={<TransactionsView currency={currency} />} />
            <Route path={ROUTES.PAYMENTS} element={<PaymentsView currency={currency} />} />
            <Route path={ROUTES.REPORTS} element={<ReportsView currency={currency} />} />
            <Route path={ROUTES.STATEMENTS} element={<StatementsView currency={currency} />} />
            <Route path="*" element={<Navigate to={ROUTES.MAP} replace />} />
          </Routes>
        </div>
      )}

      {/* ── Map View — always mounted, hidden via CSS so #map is never destroyed ── */}
      <div style={{ display: (!isMobile && location.pathname !== ROUTES.MAP) ? 'none' : 'contents' }}>
      <div className="sidebar">
        {/* ── Sidebar Header (fixed top) ── */}
        <div style={{ flexShrink: 0, backgroundColor: '#fff', padding: '20px 20px 12px', borderBottom: '1px solid #f3f4f6' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h1 style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>Commodity prices</h1>
            <button 
              onClick={() => setCurrency(currency === 'UGX' ? 'USD' : 'UGX')}
              style={{ padding: '2px 6px', fontSize: 10, fontWeight: 600, border: '1px solid #e5e7eb', borderRadius: 'var(--radius-sm)', backgroundColor: '#fff', color: '#4b5563', cursor: 'pointer' }}
            >
              {currency}
            </button>
          </div>

          {/* Region selector dropdown - only show in map view */}
          {location.pathname === ROUTES.MAP && (
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <div
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 8, marginBottom: 12, cursor: 'pointer', userSelect: 'none' }}
                >
                  <span style={{ fontSize: 12, color: '#6b7280' }}>Region: <span style={{ color: '#374151', fontWeight: 500 }}>{selectedRegion === 'All' ? 'All regions' : selectedRegion}</span></span>
                  <ChevronDown style={{ width: 14, height: 14, color: '#9ca3af' }} />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                style={{ width: 200, zIndex: 1100, backgroundColor: '#fff', borderRadius: 8, border: '1px solid #e5e7eb', boxShadow: '0 4px 16px rgba(0,0,0,.10)', padding: '6px', fontFamily: 'inherit' }}
              >
                <div style={{ fontSize: 9, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '4px 8px 6px' }}>Region</div>
                <DropdownMenuRadioGroup value={selectedRegion} onValueChange={setSelectedRegion}>
                  {regions.map(r => (
                    <DropdownMenuRadioItem
                      key={r}
                      value={r}
                      style={{ fontSize: 12, fontWeight: 500, color: '#374151', borderRadius: 6, padding: '6px 8px 6px 28px', cursor: 'pointer' }}
                      className="focus:bg-[#e6f2ea] data-[state=checked]:font-semibold data-[state=checked]:text-[#1a6b30]"
                    >
                      {r === 'All' ? 'All Regions' : r}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Search input */}
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type="text"
                placeholder="Search by market or district…"
                value={desktopSearch}
                onChange={e => setDesktopSearch(e.target.value)}
                style={{ width: '100%', paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8, backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
              <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: '#9ca3af' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {desktopSearch && (
                <button
                  onClick={() => setDesktopSearch('')}
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 14, lineHeight: 1, padding: 0 }}
                  title="Clear search"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Scrollable content ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px', scrollbarWidth: 'thin', scrollbarColor: '#d1d5db transparent' }}>
          <div style={{ height: 16, flexShrink: 0 }} />
          {error && (
            <div style={{ backgroundColor: '#fef2f2', color: '#dc2626', padding: 12, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, marginBottom: 16, border: '1px solid #fee2e2' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><TriangleAlert size={16} /> {error}</span>
              <button onClick={() => setError(null)} style={{ opacity: 0.7, cursor: 'pointer', fontSize: 18, border: 'none', background: 'none', color: '#dc2626' }}>&times;</button>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>Markets tracked</span>
            <span style={{ backgroundColor: '#e6f2ea', color: '#1a6b30', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, fontFamily: 'var(--font-mono)' }}>{filteredMarkets.length}</span>
          </div>

          {/* Commodity pills - only show in map view, collapsed to 5 by default */}
          {location.pathname === ROUTES.MAP && (
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 9, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Commodity</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {(showAllCommodities ? commodities : commodities.slice(0, 5)).map(c => (
                  <button
                    key={c.key}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      padding: '4px 10px', borderRadius: 6,
                      border: selectedCommodity === c.key ? '1px solid rgba(26, 107, 48, 0.3)' : '1px solid #e5e7eb',
                      backgroundColor: selectedCommodity === c.key ? '#e6f2ea' : '#fff',
                      color: selectedCommodity === c.key ? '#0d3b1a' : '#4b5563',
                      fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                      transition: 'all 0.15s ease',
                    }}
                    onClick={() => handleCommodityChange(c.key)}
                  >
                    <span style={{ fontSize: 12, lineHeight: 1 }}>{c.icon}</span>
                    {c.label}
                  </button>
                ))}
                <button
                  onClick={() => setShowAllCommodities(v => !v)}
                  style={{
                    padding: '4px 10px', borderRadius: 6,
                    border: '1px solid #e5e7eb',
                    backgroundColor: '#f9fafb',
                    color: '#6b7280',
                    fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {showAllCommodities ? 'Show less' : `+${commodities.length - 5} more`}
                </button>
              </div>
            </div>
          )}

          {/* Location */}
          <div style={{ marginBottom: 20 }}>
            <button
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#1f8a3e', color: '#fff', padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: 'none', fontFamily: 'inherit', transition: 'background 0.15s ease' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#1a6b30'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = '#1f8a3e'}
              onClick={handleFindNearest}
            >
              <MapPin size={16} /> Show markets near me
            </button>
            {nearestMarkets.length > 0 && (
              <p style={{ fontSize: 10, color: '#6b7280', textAlign: 'center', marginTop: 8, marginBottom: 0, fontFamily: 'var(--font-mono)' }}>
                {nearestMarkets.length} markets within 50 km of your location
              </p>
            )}
          </div>

          {/* Market list */}
          <MarketList
            markets={desktopSearch
              ? filteredMarkets.filter(m =>
                  m.name.toLowerCase().includes(desktopSearch.toLowerCase()) ||
                  m.district?.toLowerCase().includes(desktopSearch.toLowerCase()) ||
                  m.region?.toLowerCase().includes(desktopSearch.toLowerCase())
                )
              : filteredMarkets
            }
            prices={prices}
            selectedMarket={selectedMarket}
            onSelect={setSelectedMarket}
            getPriceForMarket={getPriceForMarket}
            loading={loading}
            commodityUnit={prices[0]?.unit || 'kg'}
            currency={currency}
          />

          {filteredMarkets.length > 0 && (
            <div style={{ textAlign: 'center', marginTop: 16, marginBottom: 8, flexShrink: 0 }}>
              <span style={{ fontSize: 9, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Prices in {currency} per kg</span>
            </div>
          )}
        </div>
      </div>

      <div className="map-container">
        <div id="map" ref={mapRef}></div>

        {isMobile && (
          <>
            {/* ── Mobile Tab View Panels (sit above map, below top nav) ── */}
            {activeTab === 'dashboard' && (
              <div className="mobile-view-panel">
                <Dashboard markets={markets} currency={currency} isMobile={true} />
              </div>
            )}
            {activeTab === 'carriers' && (
              <div className="mobile-view-panel">
                <CarriersView />
              </div>
            )}
            {activeTab === 'transactions' && (
              <div className="mobile-view-panel">
                <TransactionsView currency={currency} isMobile={true} />
              </div>
            )}
            {activeTab === 'assets' && (
              <div className="mobile-view-panel">
                <AssetsView currency={currency} isMobile={true} />
              </div>
            )}
            {activeTab === 'payments' && (
              <div className="mobile-view-panel">
                <PaymentsView currency={currency} isMobile={true} />
              </div>
            )}
            {activeTab === 'reports' && (
              <div className="mobile-view-panel">
                <ReportsView currency={currency} isMobile={true} />
              </div>
            )}
            {activeTab === 'statements' && (
              <div className="mobile-view-panel">
                <StatementsView currency={currency} isMobile={true} />
              </div>
            )}
            {activeTab === 'chat' && (
              <div className="mobile-view-panel">
                <div className="mobile-placeholder">
                  <div className="mobile-placeholder-icon">
                    <MessageCircle size={28} color="#1a6b30" />
                  </div>
                  <div className="mobile-placeholder-title">Chat</div>
                  <div className="mobile-placeholder-sub">Message brokers, buyers, and carriers directly from the market map.</div>
                  <span className="mobile-placeholder-badge">🚧 Coming Soon</span>
                </div>
              </div>
            )}

            {/* ── Row 1: Main Top Bar — Brand + Map Controls ── */}
            <div className="mobile-top-bar">
              <span className="mobile-brand" style={{ display: 'flex', alignItems: 'center' }}>
                <img src="/assets/agribridge-icon.svg" alt="Agribridge" style={{ width: 18, height: 18, marginRight: 6 }} /> Agribridge
              </span>

              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                {/* Base Map Picker */}
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="mobile-dropdown-btn"
                      style={{ gap: 4 }}
                      title="Base map"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
                        <line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/>
                      </svg>
                      <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>{currentBaseLayer?.label}</span>
                      <ChevronDown className="h-3 w-3 opacity-60" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    style={{ width: 170, zIndex: 1100, backgroundColor: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid #f0f0f0', boxShadow: '0 8px 30px rgba(0,0,0,.12)', padding: '6px', fontFamily: 'inherit', overflow: 'hidden' }}
                  >
                    <div style={{ fontSize: 'var(--text-2xs)', fontWeight: 'var(--weight-bold)', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '4px 8px 8px', borderBottom: '1px solid #f0f0f0', marginBottom: 4 }}>Base Map</div>
                    <DropdownMenuRadioGroup value={baseLayerType} onValueChange={value => setBaseLayerType(value)}>
                      {BASE_LAYERS.map(layer => (
                        <DropdownMenuRadioItem
                          key={layer.id}
                          value={layer.id}
                          style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)', color: '#374151', borderRadius: 'var(--radius-sm)', padding: '6px 8px 6px 28px', cursor: 'pointer' }}
                          className="focus:bg-[#e6f2ea] data-[state=checked]:font-semibold data-[state=checked]:text-[#1a6b30]"
                        >
                          {layer.label}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                    <DropdownMenuSeparator style={{ backgroundColor: '#f0f0f0', margin: '4px 0' }} />
                    <DropdownMenuCheckboxItem
                      checked={showMarkets}
                      onCheckedChange={value => setShowMarkets(Boolean(value))}
                      style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)', color: '#374151', borderRadius: 'var(--radius-sm)', padding: '6px 8px 6px 28px', cursor: 'pointer' }}
                      className="focus:bg-[#e6f2ea] data-[state=checked]:text-[#1a6b30]"
                    >
                      Show markers
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* ── Row 2: Sub-bar — Commodity + Region selectors (only show in commodities tab) ── */}
            {activeTab === 'commodities' && (
              <div className="mobile-sub-bar">
                <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 500, whiteSpace: 'nowrap' }}>Viewing:</div>

                {/* Commodity Dropdown */}
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <button className="mobile-sub-btn">
                      <span style={{ fontSize: 13, lineHeight: 1 }}>{currentCommodity?.icon}</span>
                      <span>{currentCommodity?.label}</span>
                      <ChevronDown className="h-3 w-3 opacity-50" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    style={{ width: 210, zIndex: 1100, backgroundColor: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid #f0f0f0', boxShadow: '0 8px 30px rgba(0,0,0,.12)', padding: '6px', fontFamily: 'inherit', overflow: 'hidden' }}
                  >
                    <div style={{ fontSize: 9, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '4px 8px 6px' }}>Commodity</div>
                    <DropdownMenuRadioGroup value={selectedCommodity} onValueChange={handleCommodityChange}>
                      {commodities.map(c => (
                        <DropdownMenuRadioItem
                          key={c.key}
                          value={c.key}
                          style={{ fontSize: 12, fontWeight: 500, color: '#374151', borderRadius: 6, padding: '6px 8px 6px 28px', cursor: 'pointer' }}
                          className="focus:bg-[#e6f2ea] data-[state=checked]:font-semibold data-[state=checked]:text-[#1a6b30]"
                        >
                          <span className="flex items-center" style={{ marginRight: '8px' }}>{c.icon}</span>
                          <span>{c.label}</span>
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>

                <span style={{ color: '#d1d5db', fontSize: 14, userSelect: 'none' }}>·</span>

                {/* Region Dropdown */}
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <button className="mobile-sub-btn">
                      <span>{selectedRegion === 'All' ? 'All Regions' : selectedRegion}</span>
                      <ChevronDown className="h-3 w-3 opacity-50" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    style={{ width: 170, zIndex: 1100, backgroundColor: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid #f0f0f0', boxShadow: '0 8px 30px rgba(0,0,0,.12)', padding: '6px', fontFamily: 'inherit', overflow: 'hidden' }}
                  >
                    <div style={{ fontSize: 9, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '4px 8px 6px' }}>Region</div>
                    <DropdownMenuRadioGroup value={selectedRegion} onValueChange={setSelectedRegion}>
                      {regions.map(r => (
                        <DropdownMenuRadioItem
                          key={r}
                          value={r}
                          style={{ fontSize: 12, fontWeight: 500, color: '#374151', borderRadius: 6, padding: '6px 8px 6px 28px', cursor: 'pointer' }}
                          className="focus:bg-[#e6f2ea] data-[state=checked]:font-semibold data-[state=checked]:text-[#1a6b30]"
                        >
                          {r === 'All' ? 'All Regions' : r}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            {activeTab === 'commodities' && (
              <>
                {/* ── Mobile Markets Drawer Toggle Button ── */}
            <button
              onClick={() => { setMobileDrawerOpen(o => !o); setSelectedMarket(null); }}
              style={{
                position: 'absolute',
                bottom: mobileDrawerOpen ? 'calc(min(85vh, 560px) + 76px)' : 76,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 600,
                background: '#1f8a3e',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--radius-xl)',
                padding: '10px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontFamily: 'inherit',
                fontSize: 13,
                fontWeight: 600,
                boxShadow: '0 4px 16px rgba(26,107,48,0.35)',
                cursor: 'pointer',
                transition: 'bottom 0.38s cubic-bezier(0.32,0.72,0,1), background 0.15s ease',
              }}
            >
              <List style={{ width: 16, height: 16 }} />
              {mobileDrawerOpen ? 'Close' : `Markets (${filteredMarkets.length})`}
            </button>

            {/* ── Backdrop ── */}
            {mobileDrawerOpen && (
              <div
                onClick={() => setMobileDrawerOpen(false)}
                style={{
                  position: 'absolute', inset: 0,
                  background: 'rgba(0,0,0,0.3)',
                  zIndex: 540,
                  backdropFilter: 'blur(2px)',
                  WebkitBackdropFilter: 'blur(2px)',
                }}
              />
            )}

            {/* ── Mobile Markets Bottom Sheet ── */}
            <div
              style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                height: 'calc(min(85vh, 560px) + 64px)',
                zIndex: 550,
                background: '#fff',
                borderRadius: '20px 20px 0 0',
                boxShadow: '0 -8px 32px rgba(0,0,0,0.14)',
                display: 'flex',
                flexDirection: 'column',
                transform: mobileDrawerOpen ? 'translateY(0)' : 'translateY(100%)',
                transition: 'transform 0.38s cubic-bezier(0.32,0.72,0,1)',
                overflow: 'hidden',
                paddingBottom: 64,
              }}
            >
              {/* Handle */}
              <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px', flexShrink: 0 }}>
                <div style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#d1d5db' }} />
              </div>

              {/* Sheet Header */}
              <div style={{ padding: '8px 20px 12px', borderBottom: '1px solid #f3f4f6', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Markets</span>
                    <span style={{ backgroundColor: '#e6f2ea', color: '#1a6b30', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, fontFamily: 'var(--font-mono)' }}>{filteredMarkets.length}</span>
                  </div>
                  <button
                    onClick={handleFindNearest}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#1f8a3e', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', padding: '6px 12px', fontSize: 11, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}
                  >
                    <Navigation style={{ width: 12, height: 12 }} /> Find Nearest
                  </button>
                </div>

                {/* Search */}
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Search markets…"
                    value={mobileSearch}
                    onChange={e => setMobileSearch(e.target.value)}
                    style={{ width: '100%', paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8, backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                  />
                  <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 13, height: 13, color: '#9ca3af' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* Scrollable Market List */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8, scrollbarWidth: 'thin', scrollbarColor: '#d1d5db transparent' }}>
                {loading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, color: '#9ca3af' }}>
                    <div style={{ width: 22, height: 22, border: '2px solid #e5e7eb', borderTopColor: '#1f8a3e', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: 10 }} />
                    <div style={{ fontSize: 12 }}>Loading prices…</div>
                  </div>
                ) : (
                  filteredMarkets
                    .filter(m => !mobileSearch || m.name.toLowerCase().includes(mobileSearch.toLowerCase()) || m.district?.toLowerCase().includes(mobileSearch.toLowerCase()))
                    .sort((a, b) => {
                      const pa = getPriceForMarket(a._id);
                      const pb = getPriceForMarket(b._id);
                      if (pa === 'N/A' && pb === 'N/A') return 0;
                      if (pa === 'N/A') return 1;
                      if (pb === 'N/A') return -1;
                      return pa - pb;
                    })
                    .map(m => {
                      const price = getPriceForMarket(m._id);
                      const isSelected = selectedMarket?._id === m._id;
                      const fmtPrice = (v) => {
                        if (v === 'N/A') return '—';
                        return currency === 'USD' ? `$${(v / 3700).toFixed(2)}` : `UGX ${Math.round(v).toLocaleString()}`;
                      };
                      return (
                        <div
                          key={m._id}
                          onClick={() => { setSelectedMarket(m); setMobileDrawerOpen(false); }}
                          style={{
                            borderRadius: 12,
                            border: isSelected ? '1px solid rgba(45,159,111,0.3)' : '1px solid #e5e7eb',
                            padding: '12px 14px',
                            cursor: 'pointer',
                            backgroundColor: isSelected ? '#e6f2ea' : '#fff',
                            transition: 'all 0.15s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 10,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: isSelected ? 'rgba(45,159,111,0.12)' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <Store style={{ width: 14, height: 14, color: isSelected ? '#1f8a3e' : '#6b7280' }} />
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
                              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 1 }}>{m.district}, {m.region}</div>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 300, color: price === 'N/A' ? '#9ca3af' : '#1a6b30' }} className="price-mono">{fmtPrice(price)}</div>
                            {price !== 'N/A' && prices[0]?.unit && <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 1 }}>/{prices[0].unit}</div>}
                          </div>
                        </div>
                      );
                    })
                )}
                {filteredMarkets.length > 0 && (
                  <div style={{ textAlign: 'center', padding: '8px 0 4px', fontSize: 9, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Prices in {currency} per kg</div>
                )}
              </div>
            </div>
              </>
            )}

            {/* ── More Bottom Sheet Overlay ── */}
            {moreSheetOpen && (
              <div
                className="mobile-more-overlay"
                onClick={() => setMoreSheetOpen(false)}
              />
            )}

            {/* ── More Bottom Sheet ── */}
            <div className={`mobile-more-sheet${moreSheetOpen ? ' open' : ''}`}>
              <div className="mobile-more-handle">
                <div className="mobile-more-handle-pill" />
              </div>
              <div style={{ padding: '4px 20px 8px', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', flexShrink: 0 }}>
                More
              </div>
              <div className="mobile-more-grid">
                {[
                  { label: 'Assets',          icon: Package    },
                  { label: 'Payments',        icon: CreditCard },
                  { label: 'Reports',         icon: BarChart2  },
                  { label: 'Statements',      icon: FileText   },
                  { label: 'Staff',           icon: Users      },
                  { label: 'Notifications',   icon: Bell       },
                  { label: 'Company Settings',icon: Settings   },
                ].map(({ label, icon: Icon }) => (
                  <button
                    key={label}
                    className="mobile-more-item"
                    onClick={() => {
                      setMoreSheetOpen(false);
                      setActiveTab(label.toLowerCase().replace(/\s+/g, '-'));
                    }}
                  >
                    <Icon size={22} color="#1a6b30" />
                    <span className="mobile-more-item-label">{label}</span>
                  </button>
                ))}
              </div>
              <div className="mobile-more-user">
                <div className="mobile-more-user-info">
                  <div className="mobile-more-avatar">IM</div>
                  <div>
                    <div className="mobile-more-user-name">Ismail M.</div>
                    <div className="mobile-more-user-role">Broker</div>
                  </div>
                </div>
                <button className="mobile-more-logout">
                  <LogOut size={14} />
                  Logout
                </button>
              </div>
            </div>

            {/* ── Bottom Tab Bar ── */}
            <nav className="mobile-tab-bar">
              <button
                className={`mobile-tab-item${activeTab === 'dashboard' ? ' active' : ''}`}
                onClick={() => {
                  setActiveTab('dashboard');
                  setSelectedMarket(null);
                }}
              >
                <LayoutGrid size={20} color={activeTab === 'dashboard' ? '#1a6b30' : '#9CA3AF'} />
                <span className="mobile-tab-label">Dashboard</span>
              </button>
              <button
                className={`mobile-tab-item${activeTab === 'commodities' ? ' active' : ''}`}
                onClick={() => {
                  setActiveTab('commodities');
                  setSelectedMarket(null);
                }}
              >
                <Leaf size={20} color={activeTab === 'commodities' ? '#1a6b30' : '#9CA3AF'} />
                <span className="mobile-tab-label">Commodities</span>
              </button>
              <button
                className={`mobile-tab-item${activeTab === 'transactions' ? ' active' : ''}`}
                onClick={() => {
                  setActiveTab('transactions');
                  setSelectedMarket(null);
                }}
              >
                <Receipt size={20} color={activeTab === 'transactions' ? '#1a6b30' : '#9CA3AF'} />
                <span className="mobile-tab-label">Transactions</span>
              </button>
              <button
                className={`mobile-tab-item${activeTab === 'chat' ? ' active' : ''}`}
                onClick={() => {
                  setActiveTab('chat');
                  setSelectedMarket(null);
                }}
              >
                <MessageCircle size={20} color={activeTab === 'chat' ? '#1a6b30' : '#9CA3AF'} />
                {unreadMessages > 0 && (
                  <span className="mobile-tab-badge">{unreadMessages}</span>
                )}
                <span className="mobile-tab-label">Chat</span>
              </button>
              <button
                className={`mobile-tab-item${moreSheetOpen ? ' active' : ''}`}
                onClick={() => {
                  setMoreSheetOpen(o => !o);
                  setSelectedMarket(null);
                }}
              >
                <MoreHorizontal size={20} color={moreSheetOpen ? '#1a6b30' : '#9CA3AF'} />
                <span className="mobile-tab-label">More</span>
              </button>
            </nav>
          </>
        )}

        {!isMobile && (
          <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 400 }}>
            <div style={{ backgroundColor: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid #f0f0f0', boxShadow: '0 8px 30px rgba(0,0,0,.12)', padding: '10px 8px', fontFamily: 'inherit', width: 148, overflow: 'hidden' }}>
              {/* Header */}
              <div style={{ fontSize: 'var(--text-2xs)', fontWeight: 'var(--weight-bold)', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '2px 8px 8px', borderBottom: '1px solid #f0f0f0', marginBottom: 4 }}>
                Base Map
              </div>

              {/* Layer rows */}
              {BASE_LAYERS.map(layer => {
                const active = baseLayerType === layer.id;
                return (
                  <button
                    key={layer.id}
                    onClick={() => setBaseLayerType(layer.id)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'var(--text-xs)', fontWeight: active ? 'var(--weight-semibold)' : 'var(--weight-regular)', backgroundColor: active ? 'var(--green-100)' : 'transparent', color: active ? 'var(--green-900)' : '#374151', transition: 'background-color 0.1s ease', textAlign: 'left' }}
                    onMouseEnter={e => { if (!active) e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, border: active ? 'none' : '1.5px solid #d1d5db', backgroundColor: active ? 'var(--green-700)' : 'transparent', transition: 'all 0.1s ease' }} />
                    {layer.label}
                  </button>
                );
              })}

              {/* Separator + Show markers toggle */}
              <div style={{ borderTop: '1px solid #f0f0f0', marginTop: 4, paddingTop: 4 }}>
                <button
                  onClick={() => setShowMarkets(v => !v)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-regular)', backgroundColor: 'transparent', color: '#374151', textAlign: 'left' }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <div style={{ width: 12, height: 12, borderRadius: 3, flexShrink: 0, border: showMarkets ? 'none' : '1.5px solid #d1d5db', backgroundColor: showMarkets ? 'var(--green-700)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.1s ease' }}>
                    {showMarkets && (
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <path d="M1 4l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  Show markers
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedMarket && (
          <Popup
            map={map}
            market={selectedMarket}
            prices={prices}
            onClose={() => setSelectedMarket(null)}
            commodities={commodities}
            allMarkets={markets}
            isMobile={isMobile}
          />
        )}

        <div style={{ position: 'absolute', bottom: 16, right: 16, zIndex: 400, backgroundColor: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', padding: '10px 14px', boxShadow: '0 2px 8px rgba(0,0,0,.08)', fontSize: 11 }}>
          <div style={{ fontWeight: 700, color: '#374151', marginBottom: 6, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Price Level</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#1f8a3e' }}></div>
            <span style={{ color: '#4b5563' }}>Low price (best deal)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#d97706' }}></div>
            <span style={{ color: '#4b5563' }}>Medium price</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#dc2626' }}></div>
            <span style={{ color: '#4b5563' }}>High price</span>
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
      </div>
    </div>
  );
}

export default App;