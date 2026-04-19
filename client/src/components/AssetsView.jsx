import { useState, useEffect } from 'react';
import { Truck, Package, ArrowUpRight, ArrowDownRight } from './Icons';
import Tooltip from './Tooltip';
import * as assetsApi from '../api/assets.js';

const UGX_TO_USD = 3700;

function SummaryCard({ icon, label, value, sub, trend, color = '#1f8a3e', loading }) {
  const trendUp = trend > 0;
  const trendNeutral = trend === 0 || trend == null;
  return (
    <div className="dash-card" style={{ borderTop: `3px solid ${color}` }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            backgroundColor: color + '18',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color,
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        {!trendNeutral && (
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              fontSize: 'var(--text-xs)',
              fontWeight: 'var(--weight-semibold)',
              fontFamily: 'var(--font-mono)',
              color: trendUp ? '#1f8a3e' : '#dc2626',
              backgroundColor: trendUp ? '#e6f2ea' : '#fef2f2',
              padding: '2px 7px',
              borderRadius: 20,
            }}
          >
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
        <div
          style={{
            fontSize: 'var(--text-2xl)',
            fontWeight: 'var(--weight-black)',
            color: 'var(--gray-900)',
            letterSpacing: 'var(--tracking-tight)',
            lineHeight: 'var(--leading-tight)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {value}
        </div>
      )}
      <div style={{ marginTop: 8 }}>
        <div
          style={{
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--weight-semibold)',
            color: 'var(--gray-700)',
            lineHeight: 'var(--leading-snug)',
          }}
        >
          {label}
        </div>
        {sub && (
          <div
            style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 'var(--weight-regular)',
              color: 'var(--gray-500)',
              marginTop: 2,
            }}
          >
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

const STATUS_COLORS = {
  active: { text: '#1f8a3e', bg: '#e6f2ea' },
  maintenance: { text: '#d97706', bg: '#fef3c7' },
  idle: { text: '#6b7280', bg: '#f3f4f6' },
  decommissioned: { text: '#dc2626', bg: '#fee2e2' },
};

const TYPE_COLORS = {
  vehicle: { text: '#2563eb', bg: '#dbeafe' },
  warehouse: { text: '#7c3aed', bg: '#ede9fe' },
  equipment: { text: '#0891b2', bg: '#cffafe' },
};

function StatusBadge({ value, map }) {
  const c = map[value] || { text: '#6b7280', bg: '#f3f4f6' };
  return (
    <span
      style={{
        fontSize: 'var(--text-2xs)',
        fontWeight: 'var(--weight-semibold)',
        letterSpacing: 'var(--tracking-wide)',
        color: c.text,
        backgroundColor: c.bg,
        padding: '2px 8px',
        borderRadius: 20,
        textTransform: 'uppercase',
      }}
    >
      {value}
    </span>
  );
}

export default function AssetsView({ currency = 'UGX', isMobile = false }) {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    async function fetchAssets() {
      try {
        const data = await assetsApi.listAssets();
        setAssets(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchAssets();
  }, []);

  const filtered = assets.filter(a => {
    if (typeFilter !== 'all' && a.type !== typeFilter) return false;
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    return true;
  });

  const vehicles = assets.filter(a => a.type === 'vehicle').length;
  const warehouses = assets.filter(a => a.type === 'warehouse').length;
  const equipment = assets.filter(a => a.type === 'equipment').length;
  const totalValue = assets.reduce((s, a) => s + (a.value || 0), 0);

  function fmtValue(ugx) {
    if (currency === 'USD') {
      const usd = ugx / UGX_TO_USD;
      return usd >= 1_000_000
        ? `$${(usd / 1_000_000).toFixed(1)}M`
        : usd >= 1000
          ? `$${(usd / 1000).toFixed(0)}K`
          : `$${usd.toFixed(0)}`;
    }
    if (ugx >= 1_000_000_000) return `${(ugx / 1_000_000_000).toFixed(1)}B`;
    if (ugx >= 1_000_000) return `${(ugx / 1_000_000).toFixed(0)}M`;
    if (ugx >= 1000) return `${(ugx / 1000).toFixed(0)}K`;
    return String(ugx);
  }

  const pillStyle = (active) => ({
    padding: '4px 12px',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
    border: active ? '1px solid rgba(26,107,48,0.3)' : '1px solid #e5e7eb',
    backgroundColor: active ? '#e6f2ea' : '#fff',
    color: active ? '#0d3b1a' : '#4b5563',
    transition: 'all 0.15s',
  });

  return (
    <div className="dashboard">
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Assets</h1>
          <p className="dash-subtitle">Vehicles, warehouses & equipment in your supply chain</p>
        </div>
      </div>

      <div className="dash-cards">
        <SummaryCard
          icon={<Package size={18} />}
          label={<Tooltip text="The total number of vehicles, warehouses, and equipment you've added"><span>Total Assets</span></Tooltip>}
          value={loading ? '—' : assets.length}
          sub="Across all types"
          color="#1f8a3e"
          loading={loading}
        />
        <SummaryCard
          icon={<Truck size={18} />}
          label={<Tooltip text="How many vehicles are registered in your fleet"><span>Vehicles</span></Tooltip>}
          value={loading ? '—' : vehicles}
          sub="Trucks, vans & lorries"
          color="#2563eb"
          loading={loading}
        />
        <SummaryCard
          icon={<Package size={18} />}
          label={<Tooltip text="Storage locations and processing equipment in your supply chain"><span>Warehouses</span></Tooltip>}
          value={loading ? '—' : warehouses}
          sub={`+ ${equipment} equipment`}
          color="#7c3aed"
          loading={loading}
        />
        <SummaryCard
          icon={<Package size={18} />}
          label={<Tooltip text="The combined estimated worth of all your assets"><span>Total Value</span></Tooltip>}
          value={loading ? '—' : `${currency === 'USD' ? '$' : 'UGX'} ${fmtValue(totalValue)}`}
          sub="Combined asset value"
          color="#d97706"
          loading={loading}
        />
      </div>

      {error && (
        <div
          style={{
            backgroundColor: '#fef2f2',
            color: '#dc2626',
            padding: 12,
            borderRadius: 8,
            fontSize: 12,
            marginBottom: 16,
            border: '1px solid #fee2e2',
          }}
        >
          {error}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {['all', 'vehicle', 'warehouse', 'equipment'].map(t => (
            <button key={t} style={pillStyle(typeFilter === t)} onClick={() => setTypeFilter(t)}>
              {t === 'all' ? 'All Types' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {['all', 'active', 'maintenance', 'idle', 'decommissioned'].map(s => (
            <button key={s} style={pillStyle(statusFilter === s)} onClick={() => setStatusFilter(s)}>
              {s === 'all' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table (desktop) / Cards (mobile) */}
      {isMobile ? (
        <div>
          {loading ? (
            <div className="mob-list">
              {Array(6).fill(0).map((_, i) => <div key={i} className="mob-card-skeleton" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 32, color: '#9ca3af', fontSize: 13 }}>No assets found</div>
          ) : (
            <div className="mob-list">
              {filtered.map(a => (
                <div key={a._id} className="mob-card">
                  <div className="mob-card-row">
                    <span className="mob-card-name">{a.name}</span>
                    <StatusBadge value={a.status} map={STATUS_COLORS} />
                  </div>
                  <div className="mob-card-row" style={{ marginTop: 8 }}>
                    <StatusBadge value={a.type} map={TYPE_COLORS} />
                    {a.value ? (
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 13 }}>
                        {currency === 'USD' ? '$' : 'UGX'} {fmtValue(a.value)}
                      </span>
                    ) : null}
                  </div>
                  <div className="mob-card-meta">
                    {(a.market?.name || a.region) && <span>{a.market?.name || a.region}</span>}
                    {a.assignedTo && <span> · {a.assignedTo}</span>}
                    {a.capacity && <span> · {a.capacity.toLocaleString()} {a.type === 'warehouse' ? 'MT' : 'kg'}</span>}
                  </div>
                </div>
              ))}
              <div className="mob-list-footer">Showing {filtered.length} of {assets.length} assets</div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ backgroundColor: '#fff', borderRadius: 12, border: '1px solid #f3f4f6', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
                  {[
                    { h: 'Asset Name',   tip: 'The name of the vehicle, warehouse, or piece of equipment' },
                    { h: 'Type',         tip: 'What kind of asset this is — vehicle, warehouse, or equipment' },
                    { h: 'Status',       tip: 'Whether this asset is in use, being repaired, sitting idle, or retired' },
                    { h: 'Location',     tip: 'Which market this asset is based at' },
                    { h: 'Assigned To',  tip: 'The person responsible for this asset' },
                    { h: 'Capacity',     tip: 'How much this asset can carry or store' },
                    { h: 'Value',        tip: 'What this asset is worth' },
                  ].map(({ h, tip }) => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 'var(--text-2xs)', fontWeight: 'var(--weight-bold)', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>
                      <Tooltip text={tip}><span>{h}</span></Tooltip>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array(6).fill(0).map((_, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f9fafb' }}>
                      {Array(7).fill(0).map((_, j) => (
                        <td key={j} style={{ padding: '12px 16px' }}>
                          <div className="dash-skeleton" style={{ height: 14, borderRadius: 4, width: j === 0 ? 140 : 80 }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: '#9ca3af' }}>No assets found</td></tr>
                ) : (
                  filtered.map(a => (
                    <tr key={a._id} style={{ borderBottom: '1px solid #f9fafb', transition: 'background 0.1s' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#fafafa')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                      <td style={{ padding: '12px 16px', fontWeight: 'var(--weight-medium)', color: 'var(--gray-900)' }}>{a.name}</td>
                      <td style={{ padding: '12px 16px' }}><StatusBadge value={a.type} map={TYPE_COLORS} /></td>
                      <td style={{ padding: '12px 16px' }}><StatusBadge value={a.status} map={STATUS_COLORS} /></td>
                      <td style={{ padding: '12px 16px', color: 'var(--gray-600)' }}>{a.market?.name || a.region || '—'}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--gray-600)' }}>{a.assignedTo || '—'}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--gray-600)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>
                        {a.capacity ? `${a.capacity.toLocaleString()} ${a.type === 'warehouse' ? 'MT' : 'kg'}` : '—'}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--gray-700)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)' }}>
                        {a.value ? `${currency === 'USD' ? '$' : 'UGX'} ${fmtValue(a.value)}` : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {!loading && (
            <div style={{ padding: '10px 16px', borderTop: '1px solid #f3f4f6', fontSize: 'var(--text-xs)', color: '#9ca3af' }}>
              Showing {filtered.length} of {assets.length} assets
            </div>
          )}
        </div>
      )}
    </div>
  );
}
