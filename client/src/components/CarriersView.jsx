import React, { useState, useEffect, useRef, useCallback } from 'react';
import Chart from 'chart.js/auto';
import OLMap from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import XYZ from 'ol/source/XYZ';
import OSM from 'ol/source/OSM';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import LineString from 'ol/geom/LineString';
import { fromLonLat } from 'ol/proj';
import { Style, Fill, Stroke, Circle as CircleStyle } from 'ol/style';
import { MapPin, Clock, MessageCircle, Phone, MoreHorizontal, ChevronDown, Truck, Package, Activity, ArrowUpRight, X, Check, Pencil, Trash2 } from './Icons';
import Tooltip from './Tooltip';
import * as carriersApi from '../api/carriers.js';

const STATUS_COLORS = {
  'ON THE WAY': { text: '#1f8a3e', bg: '#e6f2ea' },
  'LOADING':    { text: '#d97706', bg: '#fef3c7' },
  'WAITING':    { text: '#dc2626', bg: '#fee2e2' },
  'UNLOADING':  { text: '#3b82f6', bg: '#dbeafe' },
};

const STATUS_TIPS = {
  'ON THE WAY': 'This driver is currently on the road with a delivery',
  'LOADING':    'This driver is at the market loading goods onto their vehicle',
  'WAITING':    'This driver is available and waiting to be assigned a delivery',
  'UNLOADING':  'This driver has arrived and is unloading the goods',
};

function StatusBadge({ status, compact = false }) {
  const color = STATUS_COLORS[status] || { text: '#6b7280', bg: '#f3f4f6' };
  if (compact) {
    // Inline text-only badge for list items (matches reference)
    return (
      <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: color.text }}>
        {status}
      </span>
    );
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: color.text, flexShrink: 0 }}></span>
      <Tooltip text={STATUS_TIPS[status] || status}>
        <span style={{ fontSize: 'var(--text-2xs)', fontWeight: 'var(--weight-medium)', letterSpacing: 'var(--tracking-wide)', color: 'var(--gray-500)' }}>{status}</span>
      </Tooltip>
    </div>
  );
}

function DriverListItem({ driver, isActive, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', padding: '12px 16px', cursor: 'pointer',
        backgroundColor: isActive ? '#e6f2ea' : 'transparent',
        borderLeft: isActive ? '3px solid #1f8a3e' : '3px solid transparent',
        transition: 'all 0.2s ease',
      }}
    >
      <img
        src={`https://i.pravatar.cc/150?u=${driver._id}`}
        alt={driver.name}
        style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '2px solid #fff', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
      />
      <div style={{ marginLeft: 12, flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', color: 'var(--gray-900)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {driver.name}
        </div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {driver.vehicleModel}
        </div>
      </div>
      <div style={{ flexShrink: 0, marginLeft: 8 }}>
        <StatusBadge status={driver.status} compact />
      </div>
    </div>
  );
}

function DriverStatsChart() {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (chartRef.current) chartRef.current.destroy();

    const ctx = canvasRef.current.getContext('2d');
    chartRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
        datasets: [
          {
            label: 'Working Time',
            data: [6, 8, 7, 9, 6, 4, 0],
            backgroundColor: '#111827',
            borderRadius: 4,
            barThickness: 12,
          },
          {
            label: 'Average Working Time',
            data: [7, 7, 7, 7, 7, 7, 7],
            backgroundColor: '#e5e7eb',
            borderRadius: 4,
            barThickness: 12,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(17,24,39,0.92)',
            titleFont: { size: 11, family: 'IBM Plex Sans' },
            bodyFont: { size: 11, family: 'IBM Plex Sans' },
            padding: 10,
            cornerRadius: 8,
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 10, family: 'IBM Plex Sans' }, color: '#9ca3af' }, border: { display: false } },
          y: { grid: { display: false }, ticks: { font: { size: 10, family: 'IBM Plex Sans' }, color: '#9ca3af', stepSize: 4, max: 8 }, border: { display: false } }
        }
      }
    });

    return () => { if (chartRef.current) chartRef.current.destroy(); };
  }, []);

  return (
    <div style={{ position: 'relative', height: 160 }}>
      <canvas ref={canvasRef} />
      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#111827' }}></span>
          <span style={{ fontSize: 11, color: '#6b7280' }}>Working Time</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#e5e7eb' }}></span>
          <span style={{ fontSize: 11, color: '#6b7280' }}>Average Working Time</span>
        </div>
      </div>
    </div>
  );
}

// Mini OpenLayers map showing a route line between two coordinates
function RouteMap({ activeRoute }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const MAP_TILER_KEY = import.meta.env.VITE_MAP_TILER_API_KEY;

  useEffect(() => {
    if (!mapRef.current) return;

    const from = activeRoute?.fromCoords;
    const to = activeRoute?.toCoords;

    // Destroy previous instance
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setTarget(undefined);
      mapInstanceRef.current = null;
    }

    if (!from || !to || from.length < 2 || to.length < 2) return;

    const fromPt = fromLonLat(from);
    const toPt   = fromLonLat(to);

    const lineFeature = new Feature({ geometry: new LineString([fromPt, toPt]) });
    lineFeature.setStyle(new Style({
      stroke: new Stroke({ color: '#1f8a3e', width: 2.5, lineDash: [6, 4] }),
    }));

    const fromFeature = new Feature({ geometry: new Point(fromPt) });
    fromFeature.setStyle(new Style({
      image: new CircleStyle({ radius: 6, fill: new Fill({ color: '#111827' }), stroke: new Stroke({ color: '#fff', width: 2 }) }),
    }));

    const toFeature = new Feature({ geometry: new Point(toPt) });
    toFeature.setStyle(new Style({
      image: new CircleStyle({ radius: 6, fill: new Fill({ color: '#1f8a3e' }), stroke: new Stroke({ color: '#fff', width: 2 }) }),
    }));

    const vectorSource = new VectorSource({ features: [lineFeature, fromFeature, toFeature] });

    const baseLayer = MAP_TILER_KEY
      ? new TileLayer({ source: new XYZ({ url: `https://api.maptiler.com/maps/streets-v2/256/{z}/{x}/{y}.png?key=${MAP_TILER_KEY}`, crossOrigin: 'anonymous' }) })
      : new TileLayer({ source: new OSM() });

    const map = new OLMap({
      target: mapRef.current,
      layers: [baseLayer, new VectorLayer({ source: vectorSource })],
      view: new View({ center: fromPt, zoom: 7 }),
      controls: [],
    });

    // Fit view to route extent with padding
    map.getView().fit(vectorSource.getExtent(), {
      padding: [24, 24, 24, 24],
      maxZoom: 12,
      duration: 0,
    });

    mapInstanceRef.current = map;

    return () => {
      map.setTarget(undefined);
    };
  }, [activeRoute?.fromCoords?.join(), activeRoute?.toCoords?.join()]);

  if (!activeRoute?.fromCoords || !activeRoute?.toCoords) {
    return (
      <div style={{ backgroundColor: '#f3f4f6', borderRadius: 12, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 'var(--text-xs)', color: '#9ca3af' }}>No route data</span>
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      style={{ borderRadius: 12, height: 120, overflow: 'hidden', pointerEvents: 'none' }}
    />
  );
}

function AddDriverModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    name: '', phone: '', vehicleModel: '', vehicleType: 'Van',
    category: 'Vans', status: 'WAITING',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) { setError('Name is required'); return; }
    setSaving(true);
    setError('');
    try {
      await onSave(form);
    } catch (err) {
      setError(err.message || 'Failed to save');
      setSaving(false);
    }
  }

  const inputStyle = {
    width: '100%', padding: '9px 12px', border: '1px solid #e5e7eb', borderRadius: 8,
    fontSize: 'var(--text-base)', color: 'var(--gray-900)', backgroundColor: '#f9fafb',
    outline: 'none', boxSizing: 'border-box',
  };
  const labelStyle = { fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)', color: 'var(--gray-500)', marginBottom: 4, display: 'block' };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
      <div style={{ backgroundColor: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 460, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-bold)', color: 'var(--gray-900)', letterSpacing: 'var(--tracking-tight)' }}>Add New Driver</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4 }}>
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Full Name *</label>
              <input style={inputStyle} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Okello James" />
            </div>
            <div>
              <label style={labelStyle}>Phone</label>
              <input style={inputStyle} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+256 7XX XXX XXX" />
            </div>
            <div>
              <label style={labelStyle}>Vehicle Model</label>
              <input style={inputStyle} value={form.vehicleModel} onChange={e => set('vehicleModel', e.target.value)} placeholder="e.g. Toyota Dyna" />
            </div>
            <div>
              <label style={labelStyle}>Vehicle Type</label>
              <select style={inputStyle} value={form.vehicleType} onChange={e => set('vehicleType', e.target.value)}>
                <option value="Van">Van</option>
                <option value="Truck">Truck</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Category</label>
              <select style={inputStyle} value={form.category} onChange={e => set('category', e.target.value)}>
                <option value="Favorites">Favorites</option>
                <option value="Trucks">Trucks</option>
                <option value="Vans">Vans</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select style={inputStyle} value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="WAITING">Waiting</option>
                <option value="LOADING">Loading</option>
                <option value="ON THE WAY">On The Way</option>
                <option value="UNLOADING">Unloading</option>
              </select>
            </div>
          </div>

          {error && <div style={{ color: '#dc2626', fontSize: 'var(--text-xs)', marginBottom: 12 }}>{error}</div>}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 'var(--text-base)', color: 'var(--gray-600)', fontWeight: 'var(--weight-medium)' }}>
              Cancel
            </button>
            <button type="submit" disabled={saving} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: '#111827', cursor: saving ? 'default' : 'pointer', fontSize: 'var(--text-base)', color: '#fff', fontWeight: 'var(--weight-semibold)', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Saving…' : 'Add Driver'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CarriersView() {
  const [carriers, setCarriers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDriverId, setSelectedDriverId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDriverMenu, setShowDriverMenu] = useState(false);
  const [editingContact, setEditingContact] = useState(false);
  const [contactDraft, setContactDraft] = useState({ name: '', phone: '' });
  const [contactSaving, setContactSaving] = useState(false);
  const menuRef = useRef(null);

  const fetchCarriers = useCallback(async (search = searchQuery) => {
    setLoading(true);
    try {
      const data = await carriersApi.listCarriers(search ? { search } : {});
      setCarriers(data);
      setSelectedDriverId(prev => {
        if (prev && data.find(c => c._id === prev)) return prev;
        return data[0]?._id ?? null;
      });
    } catch (err) {
      console.error('Failed to fetch carriers:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => { fetchCarriers(); }, []);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => fetchCarriers(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Close driver menu on outside click
  useEffect(() => {
    if (!showDriverMenu) return;
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowDriverMenu(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showDriverMenu]);

  const selectedDriver = carriers.find(c => c._id === selectedDriverId) || carriers[0] || null;

  const groupedDrivers = carriers.reduce((acc, driver) => {
    if (!acc[driver.category]) acc[driver.category] = [];
    acc[driver.category].push(driver);
    return acc;
  }, { Favorites: [], Trucks: [], Vans: [] });

  const activeRoute = selectedDriver?.activeRoute;
  const historyRoutes = selectedDriver?.historyRoutes ?? [];
  const speedKmh = 60;
  const timeLeftMins = activeRoute?.distKm ? Math.round((activeRoute.distKm / speedKmh) * 60) : 0;

  // Live status percentages
  const total = carriers.length || 1;
  const statusCounts = {
    'ON THE WAY': carriers.filter(c => c.status === 'ON THE WAY').length,
    'UNLOADING':  carriers.filter(c => c.status === 'UNLOADING').length,
    'LOADING':    carriers.filter(c => c.status === 'LOADING').length,
    'WAITING':    carriers.filter(c => c.status === 'WAITING').length,
  };
  const pct = (n) => ((n / total) * 100).toFixed(1);

  async function handleAddDriver(formData) {
    const created = await carriersApi.createCarrier(formData);
    setShowAddModal(false);
    await fetchCarriers();
    setSelectedDriverId(created._id);
  }

  async function handleDeleteDriver() {
    if (!selectedDriver) return;
    await carriersApi.deleteCarrier(selectedDriver._id);
    setShowDeleteConfirm(false);
    setShowDriverMenu(false);
    await fetchCarriers();
  }

  function startEditContact() {
    setContactDraft({ name: selectedDriver.name, phone: selectedDriver.phone || '' });
    setEditingContact(true);
    setShowDriverMenu(false);
  }

  async function handleSaveContact() {
    if (!selectedDriver) return;
    setContactSaving(true);
    await carriersApi.updateCarrier(selectedDriver._id, {
      name: contactDraft.name,
      phone: contactDraft.phone,
    });
    setEditingContact(false);
    setContactSaving(false);
    await fetchCarriers();
  }

  if (loading && carriers.length === 0) {
    return (
      <div className="flex flex-col lg:flex-row h-full bg-white lg:rounded-[20px] overflow-hidden" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#9ca3af', fontSize: 'var(--text-sm)' }}>Loading carriers…</div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col lg:flex-row h-full bg-white lg:rounded-[20px] overflow-hidden">

        {/* ─── Sidebar ─── */}
        <div className="w-full p-3 lg:w-[280px] flex flex-col bg-white shrink-0 border-b lg:border-b-0 lg:border-r border-[#f1f3f5] z-10">

          {/* Mobile Header / Toggle */}
          <div
            className="lg:hidden flex justify-between items-center px-6 py-5 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, height: '55px', padding: '10px' }}>
              <span style={{ fontSize: 'var(--text-2xs)', fontWeight: 'var(--weight-bold)', color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)' }}>Driver</span>
              <div style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-semibold)', color: 'var(--gray-900)', letterSpacing: 'var(--tracking-tight)' }}>{selectedDriver?.name}</div>
            </div>
            <ChevronDown style={{ width: 20, height: 20, color: '#9ca3af', transform: isMobileSidebarOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', padding: '0 10px' }} />
          </div>

          <div className={`${isMobileSidebarOpen ? 'flex' : 'hidden'} lg:flex flex-col h-[50vh] lg:h-auto lg:flex-1`}>
            {/* Search */}
            <div style={{ padding: '0px 16px 12px', paddingTop: isMobileSidebarOpen ? 0 : 20 }}>
              <div style={{ position: 'relative' }}>
                <Activity style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: '#9ca3af' }} />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px 10px 34px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 'var(--text-base)', color: 'var(--gray-900)', outline: 'none' }}
                />
              </div>
            </div>

            {/* Categories */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {['Favorites', 'Trucks', 'Vans'].map(category => (
                groupedDrivers[category]?.length > 0 && (
                  <div key={category} style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 16px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-2xs)', fontWeight: 'var(--weight-bold)', color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)' }}>
                        {category === 'Favorites' ? <span style={{ color: '#fbbf24' }}>★</span> : null}
                        {category}
                      </span>
                      <ChevronDown style={{ width: 14, height: 14, color: '#d1d5db' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {groupedDrivers[category].map(driver => (
                        <DriverListItem
                          key={driver._id}
                          driver={driver}
                          isActive={selectedDriver?._id === driver._id}
                          onClick={() => {
                            setSelectedDriverId(driver._id);
                            setIsMobileSidebarOpen(false);
                            setEditingContact(false);
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )
              ))}
              {carriers.length === 0 && !loading && (
                <div style={{ padding: '24px 16px', color: '#9ca3af', fontSize: 'var(--text-xs)', textAlign: 'center' }}>No drivers found</div>
              )}
            </div>

            {/* Add New Vehicle */}
            <div style={{ padding: 16, borderTop: '1px solid #f1f3f5' }}>
              <button
                onClick={() => setShowAddModal(true)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#111827', color: '#fff', padding: '12px 16px', borderRadius: 12, fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', cursor: 'pointer', border: 'none' }}
              >
                <span style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-regular)' }}>+</span>
                <Tooltip text="Register a driver and their vehicle so you can assign them to deliveries"><span>Add New Vehicle</span></Tooltip>
              </button>
            </div>
          </div>
        </div>

        {/* ─── Main Content ─── */}
        {selectedDriver ? (
          <div className="flex-1 flex flex-col bg-white overflow-y-auto w-full">

            {/* Top bar with Driver Profile */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center bg-white gap-4" style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <img
                  src={`https://i.pravatar.cc/150?u=${selectedDriver._id}`}
                  alt={selectedDriver.name}
                  style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }}
                />
                <div>
                  {editingContact ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <input
                        value={contactDraft.name}
                        onChange={e => setContactDraft(d => ({ ...d, name: e.target.value }))}
                        style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-semibold)', color: 'var(--gray-900)', border: '1px solid #e5e7eb', borderRadius: 6, padding: '3px 8px', outline: 'none', width: 200 }}
                      />
                      <input
                        value={contactDraft.phone}
                        onChange={e => setContactDraft(d => ({ ...d, phone: e.target.value }))}
                        style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)', border: '1px solid #e5e7eb', borderRadius: 6, padding: '3px 8px', outline: 'none', width: 200, fontFamily: 'var(--font-mono)' }}
                      />
                      <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                        <button onClick={handleSaveContact} disabled={contactSaving} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, backgroundColor: '#1f8a3e', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                          <Check style={{ width: 12, height: 12 }} /> Save
                        </button>
                        <button onClick={() => setEditingContact(false)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, backgroundColor: '#f3f4f6', color: '#374151', border: 'none', cursor: 'pointer', fontSize: 12 }}>
                          <X style={{ width: 12, height: 12 }} /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-semibold)', color: 'var(--gray-900)', letterSpacing: 'var(--tracking-tight)' }}>{selectedDriver.name}</div>
                        <button onClick={startEditContact} title="Edit contact" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d1d5db', padding: 2, display: 'flex', alignItems: 'center' }}>
                          <Pencil style={{ width: 13, height: 13 }} />
                        </button>
                      </div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)', fontWeight: 'var(--weight-regular)', fontFamily: 'var(--font-mono)' }}>{selectedDriver.phone}</div>
                    </>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <button style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6', border: 'none', borderRadius: '50%', color: '#4b5563', cursor: 'pointer' }}>
                  <MessageCircle style={{ width: 18, height: 18 }} />
                </button>
                <button style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6', border: 'none', borderRadius: '50%', color: '#4b5563', cursor: 'pointer' }}>
                  <Phone style={{ width: 18, height: 18 }} />
                </button>
                {/* MoreHorizontal menu */}
                <div ref={menuRef} style={{ position: 'relative' }}>
                  <button
                    onClick={() => setShowDriverMenu(v => !v)}
                    style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}
                  >
                    <MoreHorizontal style={{ width: 20, height: 20 }} />
                  </button>
                  {showDriverMenu && (
                    <div style={{ position: 'absolute', right: 0, top: 42, backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.10)', zIndex: 50, minWidth: 160, overflow: 'hidden' }}>
                      <button
                        onClick={startEditContact}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--gray-700)', textAlign: 'left' }}
                      >
                        <Pencil style={{ width: 14, height: 14 }} /> Edit Contact
                      </button>
                      <button
                        onClick={() => { setShowDeleteConfirm(true); setShowDriverMenu(false); }}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 'var(--text-sm)', color: '#dc2626', textAlign: 'left' }}
                      >
                        <Trash2 style={{ width: 14, height: 14 }} /> Delete Driver
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Status strip */}
            <div className="flex flex-wrap gap-4 bg-white border-t border-[#f1f3f5]" style={{ padding: '12px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--gray-400)', fontWeight: 'var(--weight-bold)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)' }}>Status</span>
                <StatusBadge status={selectedDriver.status} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--gray-400)', fontWeight: 'var(--weight-bold)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)' }}>Vehicle</span>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-700)', fontWeight: 'var(--weight-medium)' }}>{selectedDriver.vehicleType}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--gray-400)', fontWeight: 'var(--weight-bold)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)' }}>Category</span>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-700)', fontWeight: 'var(--weight-medium)' }}>{selectedDriver.category}</span>
              </div>
            </div>

            {/* Vehicle Specs & Image Overlay */}
            <div className="bg-white" style={{ padding: '0 24px 24px' }}>
              <div className="flex flex-wrap-reverse items-center rounded-[16px] overflow-hidden gap-8" style={{ backgroundColor: '#f4f6f9', padding: '28px 32px' }}>

                {/* Specs Left Section */}
                <div style={{ flex: '1 1 300px' }}>
                  <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', color: 'var(--gray-900)', letterSpacing: 'var(--tracking-tight)', lineHeight: 'var(--leading-snug)', marginBottom: 20 }}>{selectedDriver.vehicleModel || '—'}</div>

                  {selectedDriver.specs ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '20px 20px', marginBottom: 28 }}>
                      {[['Payload', selectedDriver.specs.payload], ['Load Volume', selectedDriver.specs.volume], ['Load Length', selectedDriver.specs.length], ['Load Width', selectedDriver.specs.width]].map(([label, val]) => (
                        val && (
                          <div key={label}>
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)', fontWeight: 'var(--weight-medium)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)' }}>{label}</div>
                            <div style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', color: 'var(--gray-900)', fontFamily: 'var(--font-mono)' }}>{val}</div>
                          </div>
                        )
                      ))}
                    </div>
                  ) : null}

                  {selectedDriver.specs?.plate && (
                    <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
                      <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '12px 16px 8px', backgroundColor: '#fff', position: 'relative', minWidth: '120px' }}>
                        <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--gray-400)', position: 'absolute', top: 4, left: 0, width: '100%', textAlign: 'center', fontWeight: 'var(--weight-medium)', letterSpacing: 'var(--tracking-wide)' }}>UGANDA 2024</div>
                        <div style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-bold)', color: 'var(--gray-900)', marginTop: 4, letterSpacing: '0.08em', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{selectedDriver.specs.plate}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--gray-500)', textDecoration: 'underline', cursor: 'pointer' }}>Documents</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Image Right Section */}
                <div style={{ flex: '1 1 300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img
                    src={selectedDriver.vehicleType === 'Truck' ? '/images/vehicles/volvo_truck.png' : '/images/vehicles/volkswagen_van.png'}
                    alt={selectedDriver.vehicleModel}
                    style={{ width: '100%', maxWidth: '400px', maxHeight: '250px', objectFit: 'contain', filter: 'drop-shadow(0 20px 25px rgba(0,0,0,0.15))' }}
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                </div>
              </div>
            </div>

            {/* Bottom Section (Routes & Stats) */}
            <div className="flex flex-wrap gap-8 bg-white flex-1" style={{ padding: '24px 24px 32px' }}>

              {/* Routes Panel */}
              <div className="flex-1 min-w-[280px] flex flex-col">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', color: 'var(--gray-900)', letterSpacing: 'var(--tracking-tight)' }}>Routes</div>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)', color: 'var(--gray-400)', borderBottom: '2px solid transparent', paddingBottom: 4, cursor: 'pointer' }}>History</div>
                </div>

                <div style={{ fontSize: 'var(--text-2xs)', fontWeight: 'var(--weight-bold)', color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)', marginBottom: 10 }}>NOW ON THE WAY</div>

                {activeRoute ? (
                  <>
                    <div style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', color: 'var(--gray-900)', marginBottom: 3, letterSpacing: 'var(--tracking-tight)' }}>
                      {activeRoute.packages} packages
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)', marginBottom: 16, lineHeight: 'var(--leading-normal)' }}>
                      {activeRoute.from} → {activeRoute.to}
                    </div>

                    {/* Real OpenLayers route map */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--gray-500)', marginBottom: 6 }}>
                        <Tooltip text="A map showing where this driver started and where they are headed">
                          <span>Active Route</span>
                        </Tooltip>
                      </div>
                      <RouteMap activeRoute={activeRoute} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                      <div>
                        <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--gray-400)', fontWeight: 'var(--weight-medium)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)' }}>Distance</div>
                        <div style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', color: 'var(--gray-900)', fontFamily: 'var(--font-mono)' }}>{activeRoute.distKm} km</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--gray-400)', fontWeight: 'var(--weight-medium)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)' }}>Time Left</div>
                        <div style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', color: 'var(--gray-900)', fontFamily: 'var(--font-mono)' }}>{timeLeftMins} min</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--gray-400)', fontWeight: 'var(--weight-medium)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)' }}>Packages</div>
                        <div style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', color: 'var(--gray-900)', fontFamily: 'var(--font-mono)' }}>{activeRoute.packages}</div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ color: '#9ca3af', fontSize: 'var(--text-xs)', marginBottom: 24 }}>No active route assigned</div>
                )}

                <div style={{ flex: 1, borderTop: '1px solid #f1f3f5', paddingTop: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {historyRoutes.map((route, i) => (
                    <div key={i}>
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--gray-900)', marginBottom: 2 }}>{route.packages} packages</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)', lineHeight: 'var(--leading-normal)' }}>{route.from} → {route.to}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats Panel */}
              <div className="flex-1 min-w-[280px] flex flex-col">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <div style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', color: 'var(--gray-900)', letterSpacing: 'var(--tracking-tight)' }}>Driver Statistics</div>
                  <ArrowUpRight style={{ width: 16, height: 16, color: '#9ca3af' }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontSize: 'var(--text-2xs)', fontWeight: 'var(--weight-bold)', color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)' }}>FLEET STATUS DISTRIBUTION</div>
                </div>

                {/* Live status bar */}
                <div style={{ display: 'flex', marginBottom: 8 }}>
                  {['ON THE WAY', 'UNLOADING', 'LOADING', 'WAITING'].map(s => (
                    statusCounts[s] > 0 && (
                      <div key={s} style={{ flex: statusCounts[s], fontSize: 'var(--text-xs)', color: 'var(--gray-500)', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: 4 }}>
                        {s.charAt(0) + s.slice(1).toLowerCase()}
                      </div>
                    )
                  ))}
                </div>

                <div style={{ display: 'flex', height: 40, borderRadius: 8, overflow: 'hidden', marginBottom: 20 }}>
                  {statusCounts['ON THE WAY'] > 0 && <div style={{ flex: statusCounts['ON THE WAY'], backgroundColor: '#eef2ff', color: '#111827', display: 'flex', alignItems: 'center', paddingLeft: 12, fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', fontFamily: 'var(--font-mono)' }}>{pct(statusCounts['ON THE WAY'])}%</div>}
                  {statusCounts['UNLOADING'] > 0  && <div style={{ flex: statusCounts['UNLOADING'],  backgroundColor: '#3b82f6', color: '#fff', display: 'flex', alignItems: 'center', paddingLeft: 12, fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', fontFamily: 'var(--font-mono)' }}>{pct(statusCounts['UNLOADING'])}%</div>}
                  {statusCounts['LOADING'] > 0    && <div style={{ flex: statusCounts['LOADING'],    backgroundColor: '#f59e0b', color: '#fff', display: 'flex', alignItems: 'center', paddingLeft: 12, fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', fontFamily: 'var(--font-mono)' }}>{pct(statusCounts['LOADING'])}%</div>}
                  {statusCounts['WAITING'] > 0    && <div style={{ flex: statusCounts['WAITING'],    backgroundColor: '#111827', color: '#fff', display: 'flex', alignItems: 'center', paddingLeft: 12, fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', fontFamily: 'var(--font-mono)' }}>{pct(statusCounts['WAITING'])}%</div>}
                </div>

                {/* Chart Legend Breakdown */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
                  {[
                    { label: 'On the Way', key: 'ON THE WAY' },
                    { label: 'Unloading',  key: 'UNLOADING' },
                    { label: 'Loading',    key: 'LOADING' },
                    { label: 'Waiting',    key: 'WAITING' },
                  ].map(({ label, key }) => (
                    <div key={key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)', color: 'var(--gray-500)', fontWeight: 'var(--weight-regular)' }}>
                      <span>{label}</span>
                      <span style={{ color: '#111827', fontWeight: 600 }}>
                        {statusCounts[key]} driver{statusCounts[key] !== 1 ? 's' : ''}
                        <span style={{ color: '#9ca3af', fontWeight: 500, marginLeft: 16 }}>{pct(statusCounts[key])}%</span>
                      </span>
                    </div>
                  ))}
                </div>

                <DriverStatsChart />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-[#f9fafb]">
            <div style={{ color: '#9ca3af', fontSize: 'var(--text-sm)', textAlign: 'center' }}>
              <div style={{ marginBottom: 8 }}>No drivers yet</div>
              <button onClick={() => setShowAddModal(true)} style={{ color: '#1f8a3e', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>Add your first driver</button>
            </div>
          </div>
        )}
      </div>

      {/* Add Driver Modal */}
      {showAddModal && (
        <AddDriverModal
          onClose={() => setShowAddModal(false)}
          onSave={handleAddDriver}
        />
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && selectedDriver && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: 28, maxWidth: 380, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-bold)', color: 'var(--gray-900)', marginBottom: 8 }}>Delete {selectedDriver.name}?</div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-500)', marginBottom: 24 }}>This action cannot be undone. The driver and all their data will be permanently removed.</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowDeleteConfirm(false)} style={{ padding: '9px 18px', borderRadius: 10, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 'var(--text-base)', color: 'var(--gray-600)', fontWeight: 'var(--weight-medium)' }}>
                Cancel
              </button>
              <button onClick={handleDeleteDriver} style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: '#dc2626', cursor: 'pointer', fontSize: 'var(--text-base)', color: '#fff', fontWeight: 'var(--weight-semibold)' }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
