import { useState, useEffect } from 'react';
import { CreditCard, ArrowUpRight, ArrowDownRight } from './Icons';
import Tooltip from './Tooltip';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup, SelectLabel } from './ui/select';
import * as paymentsApi from '../api/payments.js';

const METHOD_OPTIONS = ['all', 'mobile_money', 'bank_transfer', 'cash', 'cheque'];
const STATUS_OPTIONS = ['all', 'pending', 'completed', 'failed', 'refunded'];
const METHOD_LABEL = (m) => m === 'all' ? 'All Methods' : m.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
const STATUS_LABEL = (s) => s === 'all' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1);

const UGX_TO_USD = 3700;

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
        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--gray-700)' }}>{label}</div>
        {sub && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-500)', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

const STATUS_COLORS = {
  pending:   { text: '#d97706', bg: '#fef3c7' },
  completed: { text: '#1f8a3e', bg: '#e6f2ea' },
  failed:    { text: '#dc2626', bg: '#fee2e2' },
  refunded:  { text: '#6b7280', bg: '#f3f4f6' },
};

const METHOD_COLORS = {
  mobile_money:   { text: '#f59e0b', bg: '#fef3c7' },
  bank_transfer:  { text: '#2563eb', bg: '#dbeafe' },
  cash:           { text: '#1f8a3e', bg: '#e6f2ea' },
  cheque:         { text: '#7c3aed', bg: '#ede9fe' },
};

function Badge({ value, map }) {
  const c = map[value] || { text: '#6b7280', bg: '#f3f4f6' };
  return (
    <span style={{ fontSize: 'var(--text-2xs)', fontWeight: 'var(--weight-semibold)', letterSpacing: 'var(--tracking-wide)', color: c.text, backgroundColor: c.bg, padding: '2px 8px', borderRadius: 20, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
      {value?.replace('_', ' ')}
    </span>
  );
}

export default function PaymentsView({ currency = 'UGX', isMobile = false }) {
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [methodFilter, setMethodFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [pmtData, statsData] = await Promise.all([
          paymentsApi.listPayments({ limit: 100 }),
          paymentsApi.getPaymentStats(),
        ]);
        setPayments(pmtData);
        setStats(statsData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filtered = payments.filter(p => {
    if (methodFilter !== 'all' && p.method !== methodFilter) return false;
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    return true;
  });

  function fmtAmount(ugx) {
    const v = currency === 'USD' ? ugx / UGX_TO_USD : ugx;
    const pfx = currency === 'USD' ? '$' : 'UGX ';
    if (v >= 1_000_000_000) return `${pfx}${(v / 1_000_000_000).toFixed(1)}B`;
    if (v >= 1_000_000) return `${pfx}${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1000) return `${pfx}${(v / 1000).toFixed(0)}K`;
    return `${pfx}${Math.round(v).toLocaleString()}`;
  }

  function fmtDate(d) {
    return new Date(d).toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: '2-digit' });
  }

  const pillStyle = (active) => ({
    padding: '4px 12px', borderRadius: 6, fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
    border: active ? '1px solid rgba(26,107,48,0.3)' : '1px solid #e5e7eb',
    backgroundColor: active ? '#e6f2ea' : '#fff', color: active ? '#0d3b1a' : '#4b5563', transition: 'all 0.15s',
  });

  const successRate = stats?.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
  const mobileMoneyPct = stats?.total > 0 ? Math.round((stats.mobileMoney / stats.total) * 100) : 0;

  return (
    <div className="dashboard">
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Payments</h1>
          <p className="dash-subtitle">Payment records linked to commodity transactions</p>
        </div>
      </div>

      {!loading && !bannerDismissed && (() => {
        const pending = payments.filter(p => p.status === 'pending');
        if (pending.length === 0) return null;
        const totalPending = pending.reduce((s, p) => s + (p.amount || 0), 0);
        return (
          <div style={{ backgroundColor: '#fef3c7', border: '1px solid #fde68a', color: '#92400e', borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
            <span>You have {pending.length} pending payment{pending.length === 1 ? '' : 's'} totalling UGX {totalPending.toLocaleString()}. Review them below.</span>
            <button onClick={() => setBannerDismissed(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#92400e', fontSize: 18, fontWeight: 700, lineHeight: 1, padding: '0 0 0 12px', flexShrink: 0 }}>&times;</button>
          </div>
        );
      })()}

      <div className="dash-cards">
        <SummaryCard icon={<CreditCard size={18} />} label={<Tooltip text="The total money received from completed payments"><span>Total Collected</span></Tooltip>} value={loading ? '—' : fmtAmount(stats?.totalCollected || 0)} sub="Completed payments" color="#1f8a3e" loading={loading} trend={6} />
        <SummaryCard icon={<CreditCard size={18} />} label={<Tooltip text="Money owed but not yet received"><span>Pending Amount</span></Tooltip>} value={loading ? '—' : fmtAmount(stats?.totalPending || 0)} sub="Awaiting payment" color="#d97706" loading={loading} />
        <SummaryCard icon={<CreditCard size={18} />} label={<Tooltip text="The share of all payments made through mobile money services like MTN MoMo or Airtel Money"><span>Mobile Money</span></Tooltip>} value={loading ? '—' : `${mobileMoneyPct}%`} sub="Of all payments" color="#f59e0b" loading={loading} />
        <SummaryCard icon={<CreditCard size={18} />} label={<Tooltip text="Out of all payments attempted, how many went through successfully"><span>Success Rate</span></Tooltip>} value={loading ? '—' : `${successRate}%`} sub="Completed / total" color="#2563eb" loading={loading} trend={successRate >= 80 ? 2 : -3} />
      </div>

      {error && (
        <div style={{ backgroundColor: '#fef2f2', color: '#dc2626', padding: 12, borderRadius: 8, fontSize: 12, marginBottom: 16, border: '1px solid #fee2e2' }}>{error}</div>
      )}

      {/* Filters */}
      {isMobile ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
          <Select value={methodFilter} onValueChange={setMethodFilter}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Filter by method</SelectLabel>
                {METHOD_OPTIONS.map(m => (
                  <SelectItem key={m} value={m}>{METHOD_LABEL(m)}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Filter by status</SelectLabel>
                {STATUS_OPTIONS.map(s => (
                  <SelectItem key={s} value={s}>{STATUS_LABEL(s)}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {METHOD_OPTIONS.map(m => (
              <button key={m} style={pillStyle(methodFilter === m)} onClick={() => setMethodFilter(m)}>
                {METHOD_LABEL(m)}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {STATUS_OPTIONS.map(s => (
              <button key={s} style={pillStyle(statusFilter === s)} onClick={() => setStatusFilter(s)}>
                {STATUS_LABEL(s)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Table (desktop) / Cards (mobile) */}
      {isMobile ? (
        <div>
          {loading ? (
            <div className="mob-list">
              {Array(6).fill(0).map((_, i) => <div key={i} className="mob-card-skeleton" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 32, color: '#9ca3af', fontSize: 13 }}>No payments found</div>
          ) : (
            <div className="mob-list">
              {filtered.map(p => (
                <div key={p._id} className="mob-card">
                  <div className="mob-card-row">
                    <span className="mob-card-amount">{fmtAmount(p.amount)}</span>
                    <Badge value={p.status} map={STATUS_COLORS} />
                  </div>
                  <div className="mob-card-row" style={{ marginTop: 8 }}>
                    <Badge value={p.method} map={METHOD_COLORS} />
                    <span style={{ fontSize: 11, color: '#9ca3af' }}>{fmtDate(p.date)}</span>
                  </div>
                  <div className="mob-card-meta">
                    {p.provider && <span>{p.provider}</span>}
                    {p.provider && p.paidBy && <span> · </span>}
                    {p.paidBy && <span>{p.paidBy}</span>}
                    {p.reference && <span style={{ color: '#d1d5db' }}> · {p.reference}</span>}
                  </div>
                </div>
              ))}
              <div className="mob-list-footer">Showing {filtered.length} of {payments.length} payments</div>
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
                    { h: 'Payment ID', tip: 'A unique reference number for this payment' },
                    { h: 'Date',       tip: 'When this payment was made' },
                    { h: 'Amount',     tip: 'How much money was paid' },
                    { h: 'Method',     tip: 'How the payment was made — mobile money, bank transfer, cash, or cheque' },
                    { h: 'Provider',   tip: 'The specific service used, like MTN MoMo or Stanbic Bank' },
                    { h: 'Status',     tip: 'Whether the payment went through, is still waiting, or had a problem' },
                    { h: 'Paid By',    tip: 'Who made the payment' },
                    { h: 'Reference',  tip: 'A code you can use to trace this payment in your bank or mobile money records' },
                  ].map(({ h, tip }) => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 'var(--text-2xs)', fontWeight: 'var(--weight-bold)', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>
                      <Tooltip text={tip}><span>{h}</span></Tooltip>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array(8).fill(0).map((_, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f9fafb' }}>
                      {Array(8).fill(0).map((_, j) => (
                        <td key={j} style={{ padding: '12px 16px' }}>
                          <div className="dash-skeleton" style={{ height: 14, borderRadius: 4, width: j === 0 ? 90 : 70 }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: '#9ca3af' }}>No payments found</td></tr>
                ) : (
                  filtered.map(p => (
                    <tr key={p._id} style={{ borderBottom: '1px solid #f9fafb' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fafafa'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: '#6b7280' }}>{p.paymentId}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--gray-600)', whiteSpace: 'nowrap' }}>{fmtDate(p.date)}</td>
                      <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--gray-900)' }}>{fmtAmount(p.amount)}</td>
                      <td style={{ padding: '12px 16px' }}><Badge value={p.method} map={METHOD_COLORS} /></td>
                      <td style={{ padding: '12px 16px', color: 'var(--gray-600)', fontSize: 'var(--text-xs)' }}>{p.provider || '—'}</td>
                      <td style={{ padding: '12px 16px' }}><Badge value={p.status} map={STATUS_COLORS} /></td>
                      <td style={{ padding: '12px 16px', color: 'var(--gray-600)', fontSize: 'var(--text-xs)' }}>{p.paidBy || '—'}</td>
                      <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-2xs)', color: '#9ca3af' }}>{p.reference || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {!loading && (
            <div style={{ padding: '10px 16px', borderTop: '1px solid #f3f4f6', fontSize: 'var(--text-xs)', color: '#9ca3af' }}>
              Showing {filtered.length} of {payments.length} payments
            </div>
          )}
        </div>
      )}
    </div>
  );
}
