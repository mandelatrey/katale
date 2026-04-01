import { useState, useEffect } from 'react';
import { FileText, ArrowUpRight } from './Icons';

const API_URL = '/api';

function SummaryCard({ icon, label, value, sub, trend, color = '#1f8a3e', loading }) {
  const trendUp = trend > 0;
  const trendNeutral = trend === 0 || trend == null;
  return (
    <div className="dash-card" style={{ borderTop: `3px solid ${color}` }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
          {icon}
        </div>
        {!trendNeutral && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', fontFamily: 'var(--font-mono)', color: trendUp ? '#1f8a3e' : '#dc2626', backgroundColor: trendUp ? '#e6f2ea' : '#fef2f2', padding: '2px 7px', borderRadius: 20 }}>
            <ArrowUpRight size={12} />
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
        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--gray-700)' }}>{label}</div>
        {sub && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-500)', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

const TYPE_META = {
  price_trend:       { label: 'Price Trend',       color: '#2563eb', bg: '#dbeafe' },
  trade_volume:      { label: 'Trade Volume',       color: '#7c3aed', bg: '#ede9fe' },
  market_activity:   { label: 'Market Activity',   color: '#1f8a3e', bg: '#e6f2ea' },
  regional_summary:  { label: 'Regional Summary',  color: '#d97706', bg: '#fef3c7' },
};

function TypeBadge({ type }) {
  const m = TYPE_META[type] || { label: type, color: '#6b7280', bg: '#f3f4f6' };
  return (
    <span style={{ fontSize: 'var(--text-2xs)', fontWeight: 'var(--weight-semibold)', color: m.color, backgroundColor: m.bg, padding: '2px 8px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)', whiteSpace: 'nowrap' }}>
      {m.label}
    </span>
  );
}

function ReportCard({ report, loading }) {
  if (loading) {
    return (
      <div style={{ backgroundColor: '#fff', borderRadius: 10, border: '1px solid #f3f4f6', padding: 16 }}>
        <div className="dash-skeleton" style={{ height: 16, width: '70%', borderRadius: 4, marginBottom: 8 }} />
        <div className="dash-skeleton" style={{ height: 12, width: '40%', borderRadius: 4, marginBottom: 12 }} />
        <div className="dash-skeleton" style={{ height: 12, width: '90%', borderRadius: 4 }} />
      </div>
    );
  }
  const m = TYPE_META[report.type] || {};
  return (
    <div style={{ backgroundColor: '#fff', borderRadius: 10, border: '1px solid #f3f4f6', padding: 16, borderLeft: `3px solid ${m.color || '#e5e7eb'}`, transition: 'box-shadow 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
        <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-base)', color: 'var(--gray-900)', lineHeight: 'var(--leading-snug)' }}>
          {report.title}
        </div>
        <TypeBadge type={report.type} />
      </div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
        {report.period && (
          <span style={{ fontSize: 'var(--text-xs)', color: '#6b7280' }}>
            <span style={{ fontWeight: 'var(--weight-semibold)' }}>Period:</span> {report.period}
          </span>
        )}
        {report.region && report.region !== 'All' && (
          <span style={{ fontSize: 'var(--text-xs)', color: '#6b7280' }}>
            <span style={{ fontWeight: 'var(--weight-semibold)' }}>Region:</span> {report.region}
          </span>
        )}
        {report.commodity && (
          <span style={{ fontSize: 'var(--text-xs)', color: '#6b7280' }}>
            <span style={{ fontWeight: 'var(--weight-semibold)' }}>Commodity:</span> {report.commodity}
          </span>
        )}
      </div>
      {report.summary && (
        <p style={{ fontSize: 'var(--text-xs)', color: '#6b7280', lineHeight: 'var(--leading-normal)', margin: 0 }}>
          {report.summary}
        </p>
      )}
      <div style={{ marginTop: 10, fontSize: 'var(--text-2xs)', color: '#9ca3af', fontFamily: 'var(--font-mono)' }}>
        Generated {new Date(report.generatedAt).toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' })}
      </div>
    </div>
  );
}

export default function ReportsView({ currency = 'UGX', isMobile = false }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    async function fetchReports() {
      try {
        const res = await fetch(`${API_URL}/reports?limit=50`);
        if (!res.ok) throw new Error('Failed to load reports');
        const data = await res.json();
        setReports(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchReports();
  }, []);

  const filtered = typeFilter === 'all' ? reports : reports.filter(r => r.type === typeFilter);

  const countByType = (type) => reports.filter(r => r.type === type).length;

  const pillStyle = (active) => ({
    padding: '4px 12px', borderRadius: 6, fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
    border: active ? '1px solid rgba(26,107,48,0.3)' : '1px solid #e5e7eb',
    backgroundColor: active ? '#e6f2ea' : '#fff', color: active ? '#0d3b1a' : '#4b5563', transition: 'all 0.15s',
  });

  return (
    <div className="dashboard">
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Reports</h1>
          <p className="dash-subtitle">Market intelligence reports and analytics</p>
        </div>
      </div>

      <div className="dash-cards">
        <SummaryCard icon={<FileText size={18} />} label="Total Reports" value={loading ? '—' : reports.length} sub="All time" color="#1f8a3e" loading={loading} />
        <SummaryCard icon={<FileText size={18} />} label="Price Trends" value={loading ? '—' : countByType('price_trend')} sub="Commodity price analysis" color="#2563eb" loading={loading} />
        <SummaryCard icon={<FileText size={18} />} label="Trade Volume" value={loading ? '—' : countByType('trade_volume')} sub="Volume & value reports" color="#7c3aed" loading={loading} />
        <SummaryCard icon={<FileText size={18} />} label="Regional" value={loading ? '—' : countByType('regional_summary') + countByType('market_activity')} sub="Activity & summaries" color="#d97706" loading={loading} />
      </div>

      {error && (
        <div style={{ backgroundColor: '#fef2f2', color: '#dc2626', padding: 12, borderRadius: 8, fontSize: 12, marginBottom: 16, border: '1px solid #fee2e2' }}>{error}</div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 16 }}>
        {['all', 'price_trend', 'trade_volume', 'market_activity', 'regional_summary'].map(t => (
          <button key={t} style={pillStyle(typeFilter === t)} onClick={() => setTypeFilter(t)}>
            {t === 'all' ? 'All Reports' : TYPE_META[t]?.label || t}
          </button>
        ))}
      </div>

      {/* Report Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(420px, 1fr))', gap: 12 }}>
        {loading ? (
          Array(6).fill(0).map((_, i) => <ReportCard key={i} loading />)
        ) : filtered.length === 0 ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 'var(--text-sm)' }}>
            No reports found
          </div>
        ) : (
          filtered.map(r => <ReportCard key={r._id} report={r} />)
        )}
      </div>

      {!loading && (
        <div style={{ marginTop: 12, fontSize: 'var(--text-xs)', color: '#9ca3af' }}>
          Showing {filtered.length} of {reports.length} reports
        </div>
      )}
    </div>
  );
}
