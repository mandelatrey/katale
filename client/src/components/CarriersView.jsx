import React, { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { MapPin, Clock, MessageCircle, Phone, MoreHorizontal, ChevronDown, ChevronRight, Truck, Package, Activity, ArrowUpRight } from './Icons';

const MOCK_DRIVERS = [
  { id: 1,  name: 'Okello James',        phone: '+256 772 481 203', role: 'driver', status: 'ON THE WAY', category: 'Favorites', vehicleModel: 'Volkswagen Transporter', vehicleType: 'Van',   image: '/images/vehicles/volkswagen_van.png',    specs: { payload: '2,885 lbs', volume: '353,937 in³', length: '117 in', width: '67 in', plate: 'UAU 823F' } },
  { id: 2,  name: 'Mugisha Samuel',       phone: '+256 701 334 556', role: 'driver', status: 'ON THE WAY', category: 'Favorites', vehicleModel: 'Mercedes-Benz Sprinter', vehicleType: 'Van',   image: '/images/vehicles/mercedes_sprinter.png', specs: { payload: '3,814 lbs', volume: '319,000 in³', length: '144 in', width: '70 in', plate: 'UBD 014K' } },
  { id: 3,  name: 'Akello Grace',         phone: '+256 755 920 178', role: 'driver', status: 'LOADING',    category: 'Favorites', vehicleModel: 'Isuzu NQR',             vehicleType: 'Van',   image: '/images/vehicles/volkswagen_van.png',    specs: { payload: '2,885 lbs', volume: '353,937 in³', length: '117 in', width: '67 in', plate: 'UBG 447H' } },
  { id: 4,  name: 'Ochieng Patrick',      phone: '+256 782 645 091', role: 'driver', status: 'WAITING',    category: 'Favorites', vehicleModel: 'Toyota Dyna',           vehicleType: 'Van',   image: '/images/vehicles/mercedes_sprinter.png', specs: { payload: '2,500 lbs', volume: '250,000 in³', length: '111 in', width: '65 in', plate: 'UBH 339J' } },
  { id: 5,  name: 'Ssali Robert',         phone: '+256 703 117 462', role: 'driver', status: 'ON THE WAY', category: 'Trucks',    vehicleModel: 'Volvo FL',              vehicleType: 'Truck', image: '/images/vehicles/volvo_truck.png',       specs: { payload: '14,000 lbs', volume: '1,200,000 in³', length: '240 in', width: '96 in', plate: 'UCA 551M' } },
  { id: 6,  name: 'Byamukama David',      phone: '+256 776 803 374', role: 'driver', status: 'WAITING',    category: 'Trucks',    vehicleModel: 'Mercedes-Benz Actros',  vehicleType: 'Truck', image: '/images/vehicles/volvo_truck.png',       specs: { payload: '16,000 lbs', volume: '1,400,000 in³', length: '260 in', width: '96 in', plate: 'UCB 706N' } },
  { id: 7,  name: 'Tumusiime Moses',      phone: '+256 752 290 815', role: 'driver', status: 'ON THE WAY', category: 'Trucks',    vehicleModel: 'Volvo FL',              vehicleType: 'Truck', image: '/images/vehicles/volvo_truck.png',       specs: { payload: '14,000 lbs', volume: '1,200,000 in³', length: '240 in', width: '96 in', plate: 'UCC 182P' } },
  { id: 8,  name: 'Wasswa Joseph',        phone: '+256 714 563 047', role: 'driver', status: 'UNLOADING',  category: 'Trucks',    vehicleModel: 'Volvo FH',              vehicleType: 'Truck', image: '/images/vehicles/volvo_truck.png',       specs: { payload: '44,000 lbs', volume: '2,500,000 in³', length: '500 in', width: '102 in', plate: 'UCD 073Q' } },
  { id: 9,  name: 'Nakato Sarah',         phone: '+256 783 451 629', role: 'driver', status: 'LOADING',    category: 'Vans',      vehicleModel: 'Mitsubishi Canter',     vehicleType: 'Van',   image: '/images/vehicles/volkswagen_van.png',    specs: { payload: '2,885 lbs', volume: '353,937 in³', length: '117 in', width: '67 in', plate: 'UCF 920R' } },
  { id: 10, name: 'Kizza Emmanuel',       phone: '+256 701 738 254', role: 'driver', status: 'ON THE WAY', category: 'Vans',      vehicleModel: 'Isuzu ELF',             vehicleType: 'Van',   image: '/images/vehicles/mercedes_sprinter.png', specs: { payload: '3,814 lbs', volume: '319,000 in³', length: '144 in', width: '70 in', plate: 'UCG 261S' } },
  { id: 11, name: 'Amony Florence',       phone: '+256 775 094 483', role: 'driver', status: 'ON THE WAY', category: 'Vans',      vehicleModel: 'Toyota Dyna',           vehicleType: 'Van',   image: '/images/vehicles/mercedes_sprinter.png', specs: { payload: '2,500 lbs', volume: '250,000 in³', length: '111 in', width: '65 in', plate: 'UCH 514T' } },
];

const STATUS_COLORS = {
  'ON THE WAY': { text: '#1f8a3e', bg: '#e6f2ea' },
  'LOADING':    { text: '#d97706', bg: '#fef3c7' },
  'WAITING':    { text: '#dc2626', bg: '#fee2e2' },
  'UNLOADING':  { text: '#3b82f6', bg: '#dbeafe' },
};

function StatusBadge({ status }) {
  const color = STATUS_COLORS[status] || { text: '#6b7280', bg: '#f3f4f6' };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: color.text, flexShrink: 0 }}></span>
      <span style={{ fontSize: 'var(--text-2xs)', fontWeight: 'var(--weight-medium)', letterSpacing: 'var(--tracking-wide)', color: 'var(--gray-500)' }}>{status}</span>
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
        src={`https://i.pravatar.cc/150?u=${driver.id}`}
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
        <StatusBadge status={driver.status} />
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
            titleFont: { size: 11, family: 'Inter' },
            bodyFont: { size: 11, family: 'Inter' },
            padding: 10,
            cornerRadius: 8,
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 10, family: 'Inter' }, color: '#9ca3af' }, border: { display: false } },
          y: { grid: { display: false }, ticks: { font: { size: 10, family: 'Inter' }, color: '#9ca3af', stepSize: 4, max: 8 }, border: { display: false } }
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

// Active routes derived from real market data
const UGANDAN_ROUTES = [
  { from: 'Kampala Central Market', to: 'Gulu Main Market',      distKm: 338, packages: 124 },
  { from: 'Owino Market, Kampala',  to: 'Mbale Produce Market',  distKm: 217, packages: 86  },
  { from: 'Nakasero Market',        to: 'Mbarara Central Market', distKm: 272, packages: 107 },
  { from: 'St. Balikuddembe Market',to: 'Lira Market',            distKm: 342, packages: 93  },
  { from: 'Kalerwe Market',         to: 'Masaka Main Market',     distKm: 138, packages: 71  },
  { from: 'Wandegeya Market',       to: 'Jinja Main Market',      distKm: 81,  packages: 58  },
  { from: 'Bugolobi Market',        to: 'Fort Portal Market',     distKm: 301, packages: 115 },
  { from: 'Nakawa Market',          to: 'Kabale Market',          distKm: 413, packages: 99  },
  { from: 'Kikuubo Market',         to: 'Arua Market',            distKm: 479, packages: 132 },
  { from: 'Ntinda Market',          to: 'Soroti Market',          distKm: 315, packages: 88  },
  { from: 'Nateete Market',         to: 'Tororo Market',          distKm: 193, packages: 76  },
];

function driverRoute(driverId) {
  return UGANDAN_ROUTES[(driverId - 1) % UGANDAN_ROUTES.length];
}

function driverHistoryRoutes(driverId) {
  return [
    UGANDAN_ROUTES[driverId % UGANDAN_ROUTES.length],
    UGANDAN_ROUTES[(driverId + 3) % UGANDAN_ROUTES.length],
  ];
}

export default function CarriersView() {
  const [selectedDriverId, setSelectedDriverId] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const selectedDriver = MOCK_DRIVERS.find(d => d.id === selectedDriverId) || MOCK_DRIVERS[0];

  const groupedDrivers = MOCK_DRIVERS.reduce((acc, driver) => {
    if (searchQuery && !driver.name.toLowerCase().includes(searchQuery.toLowerCase())) return acc;
    if (!acc[driver.category]) acc[driver.category] = [];
    acc[driver.category].push(driver);
    return acc;
  }, { Favorites: [], Trucks: [], Vans: [] });

  const activeRoute = driverRoute(selectedDriver.id);
  const historyRoutes = driverHistoryRoutes(selectedDriver.id);
  const speedKmh = 60;
  const timeLeftMins = Math.round((activeRoute.distKm / speedKmh) * 60);

  return (
    <div className="flex flex-col lg:flex-row h-full bg-white lg:rounded-[20px] overflow-hidden">

      {/* ─── Sidebar ─── */}
      <div className="w-full p-3 lg:w-[280px] flex flex-col bg-white shrink-0 border-b lg:border-b-0 lg:border-r border-[#f1f3f5] z-10">

        {/* Mobile Header / Toggle */}
        <div
          className="lg:hidden flex justify-between items-center px-6 py-5 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, height: '55px', padding: '10px 10px 10px 10px' }}>
            <span style={{ fontSize: 'var(--text-2xs)', fontWeight: 'var(--weight-bold)', color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)' }}>Driver</span>
            <div style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-semibold)', color: 'var(--gray-900)', letterSpacing: 'var(--tracking-tight)' }}>{selectedDriver.name}</div>
          </div>
          <ChevronDown style={{ width: 20, height: 20, color: '#9ca3af', transform: isMobileSidebarOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', padding: '0px 10px 0px 0px' }} />
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
                      key={driver.id}
                      driver={driver}
                      isActive={selectedDriver.id === driver.id}
                      onClick={() => {
                        setSelectedDriverId(driver.id);
                        setIsMobileSidebarOpen(false);
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Add New Vehicle */}
          <div style={{ padding: 16, borderTop: '1px solid #f1f3f5' }}>
            <button style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#111827', color: '#fff', padding: '12px 16px', borderRadius: 12, fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', cursor: 'pointer', border: 'none' }}>
              <span style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-regular)' }}>+</span> Add New Vehicle
            </button>
          </div>
        </div>
      </div>

      {/* ─── Main Content ─── */}
      <div className="flex-1 flex flex-col bg-[#f9fafb] overflow-y-auto w-full" style={{ padding: '16px' }}>

        {/* Top bar with Driver Profile */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center p-4 sm:p-6 lg:px-8 bg-white gap-4">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <img
              src={`https://i.pravatar.cc/150?u=${selectedDriver.id}`}
              alt={selectedDriver.name}
              style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }}
            />
            <div>
              <div style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-semibold)', color: 'var(--gray-900)', letterSpacing: 'var(--tracking-tight)' }}>{selectedDriver.name}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)', fontWeight: 'var(--weight-regular)', fontFamily: 'var(--font-mono)' }}>{selectedDriver.phone}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6', border: 'none', borderRadius: '50%', color: '#4b5563', cursor: 'pointer' }}>
              <MessageCircle style={{ width: 18, height: 18 }} />
            </button>
            <button style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6', border: 'none', borderRadius: '50%', color: '#4b5563', cursor: 'pointer' }}>
              <Phone style={{ width: 18, height: 18 }} />
            </button>
            <button style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
              <MoreHorizontal style={{ width: 20, height: 20 }} />
            </button>
          </div>
        </div>

        {/* Vehicle Specs & Image Overlay */}
        <div className="p-4 sm:p-6 lg:px-8 bg-white">
          <div className="flex flex-wrap-reverse items-center bg-[#f8fafc] rounded-[20px] p-6 lg:p-8 overflow-hidden gap-8">

            {/* Specs Left Section */}
            <div style={{ flex: '1 1 300px' }}>
              <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', color: 'var(--gray-900)', letterSpacing: 'var(--tracking-tight)', lineHeight: 'var(--leading-snug)', marginBottom: 20 }}>{selectedDriver.vehicleModel}</div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '20px 20px', marginBottom: 28 }}>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)', fontWeight: 'var(--weight-medium)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)' }}>Payload</div>
                  <div style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', color: 'var(--gray-900)', fontFamily: 'var(--font-mono)' }}>{selectedDriver.specs.payload}</div>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)', fontWeight: 'var(--weight-medium)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)' }}>Load Volume</div>
                  <div style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', color: 'var(--gray-900)', fontFamily: 'var(--font-mono)' }}>{selectedDriver.specs.volume}</div>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)', fontWeight: 'var(--weight-medium)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)' }}>Load Length</div>
                  <div style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', color: 'var(--gray-900)', fontFamily: 'var(--font-mono)' }}>{selectedDriver.specs.length}</div>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)', fontWeight: 'var(--weight-medium)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)' }}>Load Width</div>
                  <div style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', color: 'var(--gray-900)', fontFamily: 'var(--font-mono)' }}>{selectedDriver.specs.width}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
                <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '12px 16px 8px', backgroundColor: '#fff', position: 'relative', minWidth: '120px' }}>
                  <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--gray-400)', position: 'absolute', top: 4, left: 0, width: '100%', textAlign: 'center', fontWeight: 'var(--weight-medium)', letterSpacing: 'var(--tracking-wide)' }}>UGANDA 2024</div>
                  <div style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-bold)', color: 'var(--gray-900)', marginTop: 4, letterSpacing: '0.08em', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{selectedDriver.specs.plate}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--gray-500)', textDecoration: 'underline', cursor: 'pointer' }}>Documents</div>
                </div>
              </div>
            </div>

            {/* Image Right Section */}
            <div style={{ flex: '1 1 300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img
                src={selectedDriver.image}
                alt={selectedDriver.vehicleModel}
                style={{ width: '100%', maxWidth: '400px', maxHeight: '250px', objectFit: 'contain', filter: 'drop-shadow(0 20px 25px rgba(0,0,0,0.15))' }}
              />
            </div>

          </div>
        </div>

        {/* Bottom Section (Routes & Stats) */}
        <div className="flex flex-wrap p-4 sm:p-6 lg:p-8 gap-8 bg-white flex-1">

          {/* Routes Panel */}
          <div className="flex-1 min-w-[280px] flex flex-col">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', color: 'var(--gray-900)', letterSpacing: 'var(--tracking-tight)' }}>Routes</div>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)', color: 'var(--gray-400)', borderBottom: '2px solid transparent', paddingBottom: 4, cursor: 'pointer' }}>History</div>
            </div>

            <div style={{ fontSize: 'var(--text-2xs)', fontWeight: 'var(--weight-bold)', color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)', marginBottom: 10 }}>NOW ON THE WAY</div>

            <div style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', color: 'var(--gray-900)', marginBottom: 3, letterSpacing: 'var(--tracking-tight)' }}>
              {activeRoute.packages} packages
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)', marginBottom: 16, lineHeight: 'var(--leading-normal)' }}>
              {activeRoute.from} → {activeRoute.to}
            </div>

            <div style={{ backgroundColor: '#f3f4f6', borderRadius: 12, height: 120, marginBottom: 16, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '80%', height: 2, backgroundColor: '#d1d5db', position: 'absolute', zIndex: 1 }}></div>
              <div style={{ width: '60%', height: 2, backgroundColor: '#1f8a3e', position: 'absolute', zIndex: 2, left: '10%' }}></div>
              <div style={{ position: 'absolute', left: '10%', zIndex: 3, width: 14, height: 14, borderRadius: '50%', backgroundColor: '#fff', border: '3px solid #111827' }}></div>
              <div style={{ position: 'absolute', left: '70%', zIndex: 3, width: 14, height: 14, borderRadius: '50%', backgroundColor: '#fff', border: '3px solid #111827' }}></div>
              <div style={{ width: '100%', height: '100%', backgroundImage: 'linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)', backgroundSize: '20px 20px', position: 'absolute' }}></div>
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
              <div style={{ fontSize: 'var(--text-2xs)', fontWeight: 'var(--weight-bold)', color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)' }}>AVERAGE TIME PER DAY BY CATEGORY</div>
              <div style={{ display: 'flex', gap: 12, fontSize: 'var(--text-xs)', color: 'var(--gray-400)', fontWeight: 'var(--weight-medium)' }}>
                <span>W</span>
                <span style={{ color: '#111827' }}>M</span>
                <span>6M</span>
                <span>Y</span>
              </div>
            </div>

            {/* Horizontal Bar Chart (Category Stats) */}
            <div style={{ display: 'flex', marginBottom: 8 }}>
              <div style={{ flex: 3.97, fontSize: 'var(--text-xs)', color: 'var(--gray-500)', marginBottom: 4 }}>On the Way</div>
              <div style={{ flex: 2.83, fontSize: 'var(--text-xs)', color: 'var(--gray-500)', marginBottom: 4 }}>Unloading</div>
              <div style={{ flex: 1.74, fontSize: 'var(--text-xs)', color: 'var(--gray-500)', marginBottom: 4 }}>Loading</div>
              <div style={{ flex: 1.46, fontSize: 'var(--text-xs)', color: 'var(--gray-500)', marginBottom: 4 }}>Waiting</div>
            </div>

            <div style={{ display: 'flex', height: 40, borderRadius: 8, overflow: 'hidden', marginBottom: 20 }}>
              <div style={{ flex: 3.97, backgroundColor: '#eef2ff', color: '#111827', display: 'flex', alignItems: 'center', paddingLeft: 12, fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', fontFamily: 'var(--font-mono)' }}>39.7%</div>
              <div style={{ flex: 2.83, backgroundColor: '#3b82f6', color: '#fff', display: 'flex', alignItems: 'center', paddingLeft: 12, fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', fontFamily: 'var(--font-mono)' }}>28.3%</div>
              <div style={{ flex: 1.74, backgroundColor: '#f59e0b', color: '#fff', display: 'flex', alignItems: 'center', paddingLeft: 12, fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', fontFamily: 'var(--font-mono)' }}>17.4%</div>
              <div style={{ flex: 1.46, backgroundColor: '#111827', color: '#fff', display: 'flex', alignItems: 'center', paddingLeft: 12, fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', fontFamily: 'var(--font-mono)' }}>14.6%</div>
            </div>

            {/* Chart Legend Breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)', color: 'var(--gray-500)', fontWeight: 'var(--weight-regular)' }}>
                <span>On the Way</span>
                <span style={{ color: '#111827', fontWeight: 600 }}>3 hr 10 min <span style={{ color: '#9ca3af', fontWeight: 500, marginLeft: 16 }}>39.7%</span></span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)', color: 'var(--gray-500)', fontWeight: 'var(--weight-regular)' }}>
                <span>Unloading</span>
                <span style={{ color: '#111827', fontWeight: 600 }}>2 hr 15 min <span style={{ color: '#9ca3af', fontWeight: 500, marginLeft: 16 }}>28.3%</span></span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)', color: 'var(--gray-500)', fontWeight: 'var(--weight-regular)' }}>
                <span>Loading</span>
                <span style={{ color: '#111827', fontWeight: 600 }}>1 hr 23 min <span style={{ color: '#9ca3af', fontWeight: 500, marginLeft: 16 }}>17.4%</span></span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)', color: 'var(--gray-500)', fontWeight: 'var(--weight-regular)' }}>
                <span>Waiting</span>
                <span style={{ color: '#111827', fontWeight: 600 }}>1 hr 10 min <span style={{ color: '#9ca3af', fontWeight: 500, marginLeft: 16 }}>14.6%</span></span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 'var(--text-2xs)', fontWeight: 'var(--weight-bold)', color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)' }}>WORKING TIME PER DAY</div>
              <div style={{ display: 'flex', gap: 12, fontSize: 'var(--text-xs)', color: 'var(--gray-400)', fontWeight: 'var(--weight-medium)' }}>
                <span>W</span>
                <span style={{ color: '#111827' }}>M</span>
                <span>6M</span>
                <span>Y</span>
              </div>
            </div>

            {/* Vertical Bar Chart (Working Time) */}
            <DriverStatsChart />

          </div>

        </div>

      </div>
    </div>
  );
}
