import { useState, useEffect, useRef, useMemo } from 'react';
import Chart from 'chart.js/auto';
import {
  Users, Truck, CreditCard, TrendingUp, TrendingDown, Minus,
  Activity, Package, MapPin, Clock, ArrowUpRight, ArrowDownRight,
  BarChart2, RefreshCw, ChevronRight
} from './Icons';
import CarriersView from './CarriersView';
import { commodities } from '../constants';

const API_URL = '/api';

// Commodity color palette (matches PriceChart)
const COMMODITY_COLORS = {
  maize: { line: '#ca8a04', fill: '#eab30820' },
  beans: { line: '#b91c1c', fill: '#dc262620' },
  coffee: { line: '#451a03', fill: '#78350f20' },
  matooke: { line: '#15803d', fill: '#16a34a20' },
  rice: { line: '#a8a29e', fill: '#f5f5f420' },
  groundnuts: { line: '#b45309', fill: '#d9770620' },
  cassava: { line: '#854d0e', fill: '#a1620720' },
  sweet_potatoes: { line: '#c2410c', fill: '#ea580c20' },
  sorghum: { line: '#4d7c0f', fill: '#65a30d20' },
  millet: { line: '#047857', fill: '#05966920' },
};

// ─── Summary Card ────────────────────────────────────────────────────────────
function SummaryCard({ icon, label, value, sub, trend, color = '#1f8a3e', loading }) {
  const trendUp = trend > 0;
  const trendNeutral = trend === 0 || trend == null;

  return (
    <div className="dash-card" style={{ borderTop: `3px solid ${color}` }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          backgroundColor: color + '18',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: color, flexShrink: 0,
        }}>
          {icon}
        </div>
        {!trendNeutral && (
          <span style={{
            display: 'flex', alignItems: 'center', gap: 3,
            fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', fontFamily: 'var(--font-mono)',
            color: trendUp ? '#1f8a3e' : '#dc2626',
            backgroundColor: trendUp ? '#e6f2ea' : '#fef2f2',
            padding: '2px 7px', borderRadius: 20,
          }}>
            {trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      {loading ? (
        <div style={{ height: 40, display: 'flex', alignItems: 'center' }}>
          <div className="dash-skeleton" style={{ width: '60%', height: 28, borderRadius: 6 }} />
        </div>
      ) : (
        <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-black)', color: 'var(--gray-900)', letterSpacing: 'var(--tracking-tight)', lineHeight: 'var(--leading-tight)', fontFamily: 'var(--font-mono)' }}>
          {value}
        </div>
      )}
      <div style={{ marginTop: 8 }}>
        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--gray-700)', lineHeight: 'var(--leading-snug)' }}>{label}</div>
        {sub && <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-regular)', color: 'var(--gray-500)', marginTop: 2, lineHeight: 'var(--leading-normal)' }}>{sub}</div>}
      </div>
    </div>
  );
}

// ─── Price Trend Chart ───────────────────────────────────────────────────────
function PriceTrendChart({ selectedCommodities, currency, isMobile = false }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const [histories, setHistories] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedCommodities.length) return;
    setLoading(true);
    Promise.all(
      selectedCommodities.map(c =>
        fetch(`${API_URL}/prices/history/${c}?days=30`)
          .then(r => r.json())
          .then(data => ({ commodity: c, data }))
          .catch(() => ({ commodity: c, data: [] }))
      )
    ).then(results => {
      const merged = {};
      results.forEach(({ commodity, data }) => { merged[commodity] = data; });
      setHistories(merged);
      setLoading(false);
    });
  }, [selectedCommodities.join(',')]);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (chartRef.current) chartRef.current.destroy();

    const ctx = canvasRef.current.getContext('2d');

    const allDates = new Set();
    Object.values(histories).forEach(data =>
      data.forEach(d => allDates.add(d._id))
    );
    const sortedDates = [...allDates].sort();

    if (!sortedDates.length) return;

    const datasets = Object.entries(histories).map(([commodity, data]) => {
      const dataMap = Object.fromEntries(data.map(d => [d._id, d.avgPrice]));
      const col = COMMODITY_COLORS[commodity] || { line: '#6b7280', fill: '#6b728020' };
      return {
        label: commodity.replace(/_/g, ' '),
        data: sortedDates.map(date => {
          const p = dataMap[date];
          return p ? (currency === 'USD' ? p / 3700 : p) : null;
        }),
        borderColor: col.line,
        backgroundColor: col.fill,
        borderWidth: 2,
        tension: 0.4,
        spanGaps: true,
        pointRadius: 0,
        pointHoverRadius: 5,
        fill: false,
      };
    });

    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: sortedDates.map(d => {
          const [, m, day] = d.split('-');
          return new Date(d).toLocaleDateString('en-UG', { month: 'short', day: 'numeric' });
        }),
        datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(17,24,39,0.92)',
            titleFont: { size: 11, family: 'Inter' },
            bodyFont: { size: 11, family: 'Inter' },
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: ctx => {
                if (ctx.parsed.y == null) return null;
                const val = currency === 'USD'
                  ? `$${ctx.parsed.y.toFixed(2)}`
                  : `UGX ${Math.round(ctx.parsed.y).toLocaleString()}`;
                return ` ${ctx.dataset.label}: ${val}`;
              }
            }
          }
        },
        scales: {
          x: {
            ticks: { maxTicksLimit: 8, font: { size: 10, family: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }, color: '#9ca3af' },
            grid: { display: false },
          },
          y: {
            ticks: {
              font: { size: 10, family: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }, color: '#9ca3af',
              callback: v => currency === 'USD' ? `$${v.toFixed(2)}` : v.toLocaleString(),
            },
            grid: { color: '#f3f4f6' },
            title: {
              display: true,
              text: `${currency} / kg`,
              font: { size: 10, family: 'Inter' }, color: '#9ca3af'
            }
          }
        }
      }
    });

    return () => { if (chartRef.current) chartRef.current.destroy(); };
  }, [histories, currency]);

  return (
    <div>
      {loading ? (
        <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-400)', fontSize: 'var(--text-base)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <div className="dash-spinner" />
            Loading 30-day trends…
          </div>
        </div>
      ) : Object.keys(histories).length === 0 ? (
        <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-400)', fontSize: 'var(--text-base)' }}>
          No trend data available
        </div>
      ) : (
        <div style={{ position: 'relative', height: isMobile ? 160 : 220 }}>
          <canvas ref={canvasRef} />
        </div>
      )}

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', marginTop: 14, paddingTop: 12, borderTop: '1px solid #f3f4f6' }}>
        {selectedCommodities.map(c => {
          const col = COMMODITY_COLORS[c] || { line: '#6b7280' };
          const label = commodities.find(x => x.key === c)?.label || c;
          return (
            <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 20, height: 2.5, borderRadius: 2, backgroundColor: col.line, display: 'block', flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: '#4b5563', textTransform: 'capitalize' }}>{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Activity Feed Item ──────────────────────────────────────────────────────
function ActivityItem({ icon, title, meta, time, color = '#6b7280', badge, price, currency }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 12,
      padding: '10px 0', borderBottom: '1px solid #f9fafb',
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: 9, flexShrink: 0,
        backgroundColor: color + '18',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: color,
        marginTop: 1,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--gray-900)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {title}
          </span>
          {badge && (
            <span style={{
              fontSize: 'var(--text-2xs)', fontWeight: 'var(--weight-bold)', padding: '2px 6px', borderRadius: 10,
              backgroundColor: color + '18', color: color, whiteSpace: 'nowrap', flexShrink: 0,
              letterSpacing: 'var(--tracking-wide)',
            }}>
              {badge}
            </span>
          )}
        </div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-500)', lineHeight: 'var(--leading-normal)' }}>
          {meta}
          {price && (
            <>
              {' · '}
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 'var(--weight-medium)', fontSize: 'var(--text-xs)', color: 'var(--gray-900)' }}>
                {price}
              </span>
              {' / kg'}
            </>
          )}
        </div>
      </div>
      <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--gray-400)', whiteSpace: 'nowrap', flexShrink: 0, marginTop: 2 }}>
        {time}
      </div>
    </div>
  );
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function stableNumber(seed = '') {
  return String(seed)
    .split('')
    .reduce((acc, ch) => ((acc * 31) + ch.charCodeAt(0)) % 1000003, 17);
}

// ─── Dashboard Main ──────────────────────────────────────────────────────────
export default function Dashboard({ markets = [], currency = 'UGX', isMobile = false, initialSection = 'overview' }) {
  const [latestPrices, setLatestPrices] = useState([]);
  const [loadingPrices, setLoadingPrices] = useState(true);
  const [selectedChart, setSelectedChart] = useState(['maize', 'beans', 'coffee']);
  const [selectedCarrierId, setSelectedCarrierId] = useState(null);
  const [activeSection, setActiveSection] = useState(initialSection === 'carriers' ? 'carriers' : 'overview');

  // Fetch all latest prices (across all commodities) for stats
  useEffect(() => {
    setLoadingPrices(true);
    fetch(`${API_URL}/prices/latest`)
      .then(r => r.json())
      .then(data => {
        setLatestPrices(Array.isArray(data) ? data : []);
        setLoadingPrices(false);
      })
      .catch(() => { setLoadingPrices(false); });
  }, []);

  // ── Derived stats from real data ──────────────────────────────────────────
  const stats = useMemo(() => {
    const activeMarkets = markets.length;
    // Count markets that have a price record (proxy for "active" data)
    const marketsWithPrices = new Set(latestPrices.map(p => String(p.market?._id || p.market)));
    const assetsInTransit = marketsWithPrices.size; // markets actively reporting
    // Pending = markets listed but not reporting
    const pendingPayments = Math.max(0, activeMarkets - assetsInTransit);

    // Price change % — compare latest maize price to an earlier estimate
    const maizePrices = latestPrices.filter(p => p.commodity === 'maize').map(p => p.price);
    const avgMaize = maizePrices.length ? Math.round(maizePrices.reduce((a, b) => a + b, 0) / maizePrices.length) : null;

    return { activeMarkets, assetsInTransit, pendingPayments, avgMaize };
  }, [markets, latestPrices]);

  // ── Recent activity — build from latest prices ────────────────────────────
  const recentActivity = useMemo(() => {
    const limit = isMobile ? 5 : 8;
    return [...latestPrices]
      .sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt))
      .slice(0, limit)
      .map(p => ({
        id: p._id,
        title: `${(p.commodity || '').replace(/_/g, ' ')} — ${p.market?.name || p.marketInfo?.name || 'Market'}`,
        meta: `${p.market?.district || p.marketInfo?.district || ''}`,
        price: currency === 'USD' ? `$${(p.price / 3700).toFixed(2)}` : `UGX ${Math.round(p.price).toLocaleString()}`,
        time: timeAgo(p.recordedAt),
        commodity: p.commodity,
      }));
  }, [latestPrices, currency]);

  const toggleChartCommodity = (key) => {
    setSelectedChart(prev =>
      prev.includes(key)
        ? prev.length > 1 ? prev.filter(k => k !== key) : prev
        : [...prev, key]
    );
  };

  const carrierRows = useMemo(() => {
    const grouped = latestPrices.reduce((acc, p) => {
      const marketId = String(p.market?._id || p.market || p.marketInfo?._id || '');
      if (!marketId) return acc;
      if (!acc[marketId]) acc[marketId] = [];
      acc[marketId].push(p);
      return acc;
    }, {});

    return markets.map((m) => {
      const id = String(m._id);
      const marketPrices = (grouped[id] || []).sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt));
      const recent = marketPrices[0];
      const seeded = stableNumber(id + m.name);
      const tripId = `UG-${String(seeded).slice(-4)}`;
      const routeDistanceKm = ((seeded % 86) + 14) / 10;
      const etaMinutes = (seeded % 130) + 15;

      let status = 'Waiting';
      if (recent?.recordedAt) {
        const ageMins = Math.floor((Date.now() - new Date(recent.recordedAt).getTime()) / 60000);
        if (ageMins <= 240) status = 'On Route';
        else if (ageMins <= 1440) status = 'Unloading';
      }

      return {
        id,
        name: `${m.district || m.name} Carrier`,
        market: m.name,
        district: m.district || 'District N/A',
        region: m.region || 'Region N/A',
        status,
        tripId,
        routeDistanceKm,
        etaMinutes,
        loadCount: marketPrices.length,
        lastUpdated: recent?.recordedAt || null,
        updates: marketPrices.slice(0, 4),
      };
    }).sort((a, b) => {
      const statusOrder = { 'On Route': 0, 'Unloading': 1, 'Waiting': 2 };
      if (statusOrder[a.status] !== statusOrder[b.status]) return statusOrder[a.status] - statusOrder[b.status];
      return (b.lastUpdated ? new Date(b.lastUpdated).getTime() : 0) - (a.lastUpdated ? new Date(a.lastUpdated).getTime() : 0);
    });
  }, [markets, latestPrices]);

  useEffect(() => {
    if (!carrierRows.length) {
      setSelectedCarrierId(null);
      return;
    }
    if (!selectedCarrierId || !carrierRows.some(c => c.id === selectedCarrierId)) {
      setSelectedCarrierId(carrierRows[0].id);
    }
  }, [carrierRows, selectedCarrierId]);

  const selectedCarrier = carrierRows.find(c => c.id === selectedCarrierId) || carrierRows[0] || null;
  const carrierStatusBreakdown = useMemo(() => {
    return carrierRows.reduce((acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    }, { 'On Route': 0, 'Unloading': 0, 'Waiting': 0 });
  }, [carrierRows]);

  useEffect(() => {
    setActiveSection(initialSection === 'carriers' ? 'carriers' : 'overview');
  }, [initialSection]);

  return (
    <div className="dashboard">
      {/* ── Header ── */}
      <div className="dash-header">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <h1 className="dash-title" style={{ marginBottom: 2 }}>{activeSection === 'carriers' ? 'Carriers' : 'Dashboard'}</h1>
          <p className="dash-subtitle" style={{ marginTop: 0 }}>
            Uganda commodity market overview · <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: '#1f8a3e' }}>{new Date().toLocaleDateString('en-CA')}</span>
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {[
              { key: 'overview', label: 'Overview' },
              { key: 'carriers', label: 'Carriers' },
            ].map((tab) => {
              const active = activeSection === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveSection(tab.key)}
                  style={{
                    border: active ? '1px solid rgba(45,159,111,0.28)' : '1px solid #e5e7eb',
                    backgroundColor: active ? '#e6f2ea' : '#fff',
                    color: active ? '#065f46' : '#6b7280',
                    borderRadius: 999,
                    fontSize: 'var(--text-xs)',
                    fontWeight: 'var(--weight-semibold)',
                    padding: '5px 12px',
                    cursor: 'pointer',
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
          <button 
            style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 'var(--weight-medium)',
              color: 'var(--gray-500)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'transparent',
              border: '1px solid #e5e7eb',
              borderRadius: 6,
              padding: '6px 12px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f3f4f6';
              e.currentTarget.style.borderColor = '#d1d5db';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = '#e5e7eb';
            }}
          >
            <RefreshCw size={12} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      {activeSection !== 'carriers' && (
      <div className="dash-cards">
        <SummaryCard
          icon={<Users size={20} />}
          label="Active Carriers"
          value={loadingPrices ? '—' : stats.activeMarkets.toString()}
          sub="Registered market nodes"
          trend={4}
          color="#1f8a3e"
          loading={loadingPrices}
        />
        <SummaryCard
          icon={<Truck size={20} />}
          label="Assets in Transit"
          value={loadingPrices ? '—' : stats.assetsInTransit.toString()}
          sub="Markets actively reporting"
          trend={-2}
          color="#d97706"
          loading={loadingPrices}
        />
        <SummaryCard
          icon={<CreditCard size={20} />}
          label="Pending Payments"
          value={loadingPrices ? '—' : stats.pendingPayments.toString()}
          sub="No recent price data"
          trend={null}
          color="#6366f1"
          loading={loadingPrices}
        />
        <SummaryCard
          icon={<BarChart2 size={20} />}
          label="Avg. Maize Price"
          value={loadingPrices || !stats.avgMaize ? '—' : (
            currency === 'USD'
              ? `$${(stats.avgMaize / 3700).toFixed(2)}`
              : `${(stats.avgMaize / 1000).toFixed(1)}K`
          )}
          sub={`${currency} per kg, all markets`}
          trend={3}
          color="#dc2626"
          loading={loadingPrices}
        />
      </div>
      )}

      {/* ── Main Content Row ── */}
      {activeSection !== 'carriers' && (
      <div className="dash-main">
        {/* Price Trend Chart */}
        <div className="dash-panel" style={{ flex: 2 }}>
          <div className="dash-panel-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={16} color="#1f8a3e" />
              <span className="dash-panel-title">Price Trends — Last 30 Days</span>
            </div>
            <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--gray-400)', fontWeight: 'var(--weight-medium)', letterSpacing: 'var(--tracking-wide)' }}>{currency}/kg avg</span>
          </div>

          {/* Commodity toggles */}
          <div style={{ display: 'flex', flexWrap: isMobile ? 'nowrap' : 'wrap', overflowX: isMobile ? 'auto' : 'visible', gap: 6, marginBottom: 16, scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', paddingBottom: isMobile ? 2 : 0 }}>
            {commodities.map(c => {
              const active = selectedChart.includes(c.key);
              const col = COMMODITY_COLORS[c.key]?.line || '#6b7280';
              return (
                <button
                  key={c.key}
                  onClick={() => toggleChartCommodity(c.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '3px 10px', borderRadius: 20, fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)',
                    border: active ? `1.5px solid ${col}` : '1.5px solid #e5e7eb',
                    backgroundColor: active ? col + '18' : '#fff',
                    color: active ? col : '#6b7280',
                    cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {active && <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: col, flexShrink: 0 }} />}
                  {c.label}
                </button>
              );
            })}
          </div>

          <PriceTrendChart selectedCommodities={selectedChart} currency={currency} isMobile={isMobile} />
        </div>

        {/* Recent Activity Feed */}
        <div className="dash-panel" style={{ flex: 1, minWidth: 280 }}>
          <div className="dash-panel-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Activity size={16} color="#1f8a3e" />
              <span className="dash-panel-title">Recent Activity</span>
            </div>
            <span style={{ fontSize: 'var(--text-2xs)', backgroundColor: '#fef9c3', color: '#92400e', padding: '2px 7px', borderRadius: 10, fontWeight: 'var(--weight-bold)', letterSpacing: 'var(--tracking-wide)' }}>
              LIVE
            </span>
          </div>

          {loadingPrices ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
              {[1,2,3,4,5].map(i => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div className="dash-skeleton" style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0 }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <div className="dash-skeleton" style={{ width: '70%', height: 11, borderRadius: 4 }} />
                    <div className="dash-skeleton" style={{ width: '50%', height: 10, borderRadius: 4 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : recentActivity.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#9ca3af', fontSize: 12 }}>
              No recent activity
            </div>
          ) : (
            <div style={{ marginTop: 4 }}>
              {recentActivity.map((item, i) => {
                const col = COMMODITY_COLORS[item.commodity]?.line || '#6b7280';
                const commInfo = commodities.find(c => c.key === item.commodity);
                return (
                  <ActivityItem
                    key={item.id || i}
                    icon={commInfo?.icon || <Package size={16} />}
                    title={item.title}
                    meta={item.meta}
                    price={item.price}
                    currency={currency}
                    time={item.time}
                    color={col}
                    badge="Price update"
                  />
                );
              })}
            </div>
          )}

          {recentActivity.length > 0 && (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f3f4f6', textAlign: 'center' }}>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)', fontFamily: 'var(--font-mono)' }}>Showing {recentActivity.length} most recent entries</span>
            </div>
          )}
        </div>
      </div>
      )}

      {/* ── Market Coverage Row — desktop only ── */}
      {!isMobile && activeSection !== 'carriers' && (
      <div className="dash-panel" style={{ marginTop: 0 }}>
        <div className="dash-panel-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <MapPin size={16} color="#1f8a3e" />
            <span className="dash-panel-title">Market Coverage by Region</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {['Central', 'Eastern', 'Northern', 'Western'].map(region => {
            const count = markets.filter(m => m.region === region).length;
            const pct = markets.length ? Math.round((count / markets.length) * 100) : 0;
            return (
              <div key={region} style={{ flex: 1, minWidth: 120 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--gray-700)' }}>{region}</span>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-500)', fontFamily: 'var(--font-mono)' }}>{count} markets</span>
                </div>
                <div style={{ width: '100%', height: 6, backgroundColor: '#f3f4f6', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', backgroundColor: '#1f8a3e', borderRadius: 3, transition: 'width 0.8s ease' }} />
                </div>
                <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--gray-400)', marginTop: 3, fontFamily: 'var(--font-mono)' }}>{pct}% of total</div>
              </div>
            );
          })}
        </div>
      </div>
      )}

      {/* ── Carrier Operations Section ── */}
      {activeSection === 'carriers' && (
        <div style={{ flex: 1, minHeight: 0 }}>
          <CarriersView />
        </div>
      )}
      <div className="dash-panel" style={{ marginTop: 0, display: activeSection === 'carriers' ? 'none' : 'block' }}>
        <div className="dash-panel-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Truck size={16} color="#1f8a3e" />
            <span className="dash-panel-title">Carrier Operations</span>
          </div>
          <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--gray-400)', fontFamily: 'var(--font-mono)', letterSpacing: 'var(--tracking-wide)' }}>
            {carrierRows.length} active lanes
          </span>
        </div>

        {loadingPrices ? (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.1fr 2fr', gap: 12 }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="dash-skeleton" style={{ height: 62, borderRadius: 10 }} />
            ))}
          </div>
        ) : carrierRows.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '28px 0', color: '#9ca3af', fontSize: 12 }}>
            No carrier coverage available yet
          </div>
        ) : (
          <div className="carrier-ops-layout">
            <div className="carrier-ops-list">
              {carrierRows.slice(0, isMobile ? 6 : 9).map((carrier) => {
                const selected = carrier.id === selectedCarrier?.id;
                const tone = carrier.status === 'On Route' ? '#1f8a3e' : carrier.status === 'Unloading' ? '#d97706' : '#6b7280';
                return (
                  <button
                    key={carrier.id}
                    onClick={() => setSelectedCarrierId(carrier.id)}
                    className="carrier-ops-item"
                    style={{
                      borderColor: selected ? 'rgba(45,159,111,0.35)' : '#eef0f2',
                      backgroundColor: selected ? '#e6f2ea' : '#fff',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <div style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: tone + '1f', color: tone, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                        <Truck size={14} />
                      </div>
                      <div style={{ minWidth: 0, textAlign: 'left' }}>
                        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--gray-900)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{carrier.name}</div>
                        <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--gray-500)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{carrier.market} · {carrier.region}</div>
                      </div>
                    </div>
                    <span style={{ fontSize: 'var(--text-2xs)', fontWeight: 'var(--weight-bold)', color: tone, backgroundColor: tone + '1f', padding: '2px 6px', borderRadius: 10, letterSpacing: 'var(--tracking-wide)' }}>
                      {carrier.status}
                    </span>
                  </button>
                );
              })}
            </div>

            {selectedCarrier && (
              <div className="carrier-ops-detail">
                <div className="carrier-ops-hero">
                  <div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)', fontFamily: 'var(--font-mono)', marginBottom: 2 }}>{selectedCarrier.tripId}</div>
                    <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', color: 'var(--gray-900)', letterSpacing: 'var(--tracking-tight)', lineHeight: 'var(--leading-snug)' }}>{selectedCarrier.name}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-500)', marginTop: 3 }}>
                      {selectedCarrier.market} · {selectedCarrier.district}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: 'var(--text-2xs)', backgroundColor: '#e6f2ea', color: '#065f46', padding: '3px 8px', borderRadius: 8, fontWeight: 'var(--weight-semibold)', letterSpacing: 'var(--tracking-wide)' }}>
                      {selectedCarrier.status}
                    </span>
                    <span style={{ fontSize: 'var(--text-2xs)', backgroundColor: 'var(--gray-100)', color: 'var(--gray-600)', padding: '3px 8px', borderRadius: 8, fontWeight: 'var(--weight-medium)' }}>
                      {selectedCarrier.loadCount} updates
                    </span>
                  </div>
                </div>

                <div className="carrier-ops-metrics">
                  <div className="carrier-ops-metric-card">
                    <MapPin size={14} color="#1f8a3e" />
                    <div>
                      <div className="carrier-ops-metric-label">Route distance</div>
                      <div className="carrier-ops-metric-value">{selectedCarrier.routeDistanceKm.toFixed(1)} km</div>
                    </div>
                  </div>
                  <div className="carrier-ops-metric-card">
                    <Clock size={14} color="#d97706" />
                    <div>
                      <div className="carrier-ops-metric-label">Estimated time</div>
                      <div className="carrier-ops-metric-value">{selectedCarrier.etaMinutes} min</div>
                    </div>
                  </div>
                  <div className="carrier-ops-metric-card">
                    <Activity size={14} color="#6366f1" />
                    <div>
                      <div className="carrier-ops-metric-label">Last market ping</div>
                      <div className="carrier-ops-metric-value">{selectedCarrier.lastUpdated ? timeAgo(selectedCarrier.lastUpdated) : 'No update'}</div>
                    </div>
                  </div>
                </div>

                <div className="carrier-ops-bottom">
                  <div style={{ border: '1px solid #f1f3f5', borderRadius: 10, padding: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', color: 'var(--gray-900)', letterSpacing: 'var(--tracking-tight)' }}>Latest Lane Activity</span>
                      <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--gray-400)', fontFamily: 'var(--font-mono)' }}>
                        {selectedCarrier.updates.length} entries
                      </span>
                    </div>
                    {selectedCarrier.updates.length === 0 ? (
                      <div style={{ fontSize: 11, color: '#9ca3af', padding: '12px 0' }}>No linked price updates for this lane.</div>
                    ) : (
                      selectedCarrier.updates.map((update, i) => {
                        const commodity = commodities.find(c => c.key === update.commodity);
                        const displayPrice = currency === 'USD'
                          ? `$${(update.price / 3700).toFixed(2)}`
                          : `UGX ${Math.round(update.price).toLocaleString()}`;
                        return (
                          <div key={update._id || i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderTop: i === 0 ? 'none' : '1px solid #f8fafc' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                              <span style={{ width: 22, height: 22, borderRadius: 6, backgroundColor: '#f3f4f6', display: 'grid', placeItems: 'center', color: '#6b7280', flexShrink: 0 }}>
                                {commodity?.icon || <Package size={12} />}
                              </span>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--gray-800)', textTransform: 'capitalize' }}>{(update.commodity || '').replace(/_/g, ' ')}</div>
                                <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--gray-400)' }}>{timeAgo(update.recordedAt)}</div>
                              </div>
                            </div>
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-900)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', fontWeight: 'var(--weight-medium)' }}>{displayPrice}</div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div style={{ border: '1px solid #f1f3f5', borderRadius: 10, padding: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <span style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', color: 'var(--gray-900)', letterSpacing: 'var(--tracking-tight)' }}>Fleet Snapshot</span>
                      <ChevronRight size={13} color="#9ca3af" />
                    </div>
                    {['On Route', 'Unloading', 'Waiting'].map((key) => {
                      const count = carrierStatusBreakdown[key] || 0;
                      const pct = carrierRows.length ? Math.round((count / carrierRows.length) * 100) : 0;
                      const col = key === 'On Route' ? '#1f8a3e' : key === 'Unloading' ? '#d97706' : '#9ca3af';
                      return (
                        <div key={key} style={{ marginBottom: 10 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-600)', fontWeight: 'var(--weight-medium)' }}>{key}</span>
                            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-400)', fontFamily: 'var(--font-mono)' }}>{count}</span>
                          </div>
                          <div style={{ width: '100%', height: 6, borderRadius: 3, backgroundColor: '#f3f4f6', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', backgroundColor: col, borderRadius: 3, transition: 'width .3s ease' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
