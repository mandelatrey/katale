import { useState, useEffect, useRef, useMemo } from 'react';
import Chart from 'chart.js/auto';
import {
  Users, Truck, CreditCard, TrendingUp, TrendingDown, Minus,
  Activity, Package, MapPin, Clock, ArrowUpRight, ArrowDownRight,
  BarChart2, RefreshCw, ChevronRight
} from './Icons';
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
function SummaryCard({ icon, label, value, sub, trend, color = '#2D9F6F', loading }) {
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
            fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-mono)',
            color: trendUp ? '#2D9F6F' : '#dc2626',
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
        <div style={{ fontSize: 28, fontWeight: 800, color: '#111827', letterSpacing: '-0.5px', lineHeight: 1, fontFamily: 'var(--font-mono)' }}>
          {value}
        </div>
      )}
      <div style={{ marginTop: 6 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{sub}</div>}
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
        <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 13 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <div className="dash-spinner" />
            Loading 30-day trends…
          </div>
        </div>
      ) : Object.keys(histories).length === 0 ? (
        <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 13 }}>
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
          <span style={{ fontSize: 12, fontWeight: 600, color: '#111827', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {title}
          </span>
          {badge && (
            <span style={{
              fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 10,
              backgroundColor: color + '18', color: color, whiteSpace: 'nowrap', flexShrink: 0,
            }}>
              {badge}
            </span>
          )}
        </div>
        <div style={{ fontSize: 11, color: '#6b7280' }}>
          {meta}
          {price && (
            <>
              {' · '}
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500, fontSize: 11, color: '#111827' }}>
                {price}
              </span>
              {' / kg'}
            </>
          )}
        </div>
      </div>
      <div style={{ fontSize: 10, color: '#9ca3af', whiteSpace: 'nowrap', flexShrink: 0, marginTop: 2 }}>
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

// ─── Dashboard Main ──────────────────────────────────────────────────────────
export default function Dashboard({ markets = [], currency = 'UGX', isMobile = false }) {
  const [latestPrices, setLatestPrices] = useState([]);
  const [loadingPrices, setLoadingPrices] = useState(true);
  const [selectedChart, setSelectedChart] = useState(['maize', 'beans', 'coffee']);

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

  return (
    <div className="dashboard">
      {/* ── Header ── */}
      <div className="dash-header">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <h1 className="dash-title" style={{ marginBottom: 2 }}>Dashboard</h1>
          <p className="dash-subtitle" style={{ marginTop: 0 }}>
            Uganda commodity market overview · <span style={{ fontFamily: 'monospace', fontSize: '0.9em', color: '#4ade80' }}>{new Date().toLocaleDateString('en-CA')}</span>
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button 
            style={{ 
              fontSize: 11, 
              color: '#6b7280', 
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
      <div className="dash-cards">
        <SummaryCard
          icon={<Users size={20} />}
          label="Active Carriers"
          value={loadingPrices ? '—' : stats.activeMarkets.toString()}
          sub="Registered market nodes"
          trend={4}
          color="#2D9F6F"
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

      {/* ── Main Content Row ── */}
      <div className="dash-main">
        {/* Price Trend Chart */}
        <div className="dash-panel" style={{ flex: 2 }}>
          <div className="dash-panel-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={16} color="#2D9F6F" />
              <span className="dash-panel-title">Price Trends — Last 30 Days</span>
            </div>
            <span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 500 }}>{currency}/kg avg</span>
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
                    padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500,
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
              <Activity size={16} color="#2D9F6F" />
              <span className="dash-panel-title">Recent Activity</span>
            </div>
            <span style={{ fontSize: 10, backgroundColor: '#fef9c3', color: '#92400e', padding: '2px 7px', borderRadius: 10, fontWeight: 700 }}>
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
              <span style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'var(--font-mono)' }}>Showing {recentActivity.length} most recent entries</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Market Coverage Row — desktop only ── */}
      {!isMobile && (
      <div className="dash-panel" style={{ marginTop: 0 }}>
        <div className="dash-panel-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <MapPin size={16} color="#2D9F6F" />
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
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{region}</span>
                  <span style={{ fontSize: 11, color: '#6b7280', fontFamily: 'var(--font-mono)' }}>{count} markets</span>
                </div>
                <div style={{ width: '100%', height: 6, backgroundColor: '#f3f4f6', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', backgroundColor: '#2D9F6F', borderRadius: 3, transition: 'width 0.8s ease' }} />
                </div>
                <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 3, fontFamily: 'var(--font-mono)' }}>{pct}% of total</div>
              </div>
            );
          })}
        </div>
      </div>
      )}
    </div>
  );
}
