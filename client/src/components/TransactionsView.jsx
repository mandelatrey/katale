import { useState, useEffect } from 'react';
import { CreditCard, Package, ArrowUpRight, ArrowDownRight, Plus, X } from './Icons';
import { commodities } from '../constants';
import Tooltip from './Tooltip';
import * as marketsApi from '../api/markets.js';
import * as transactionsApi from '../api/transactions.js';

const UGX_TO_USD = 3700;

const PAYMENT_METHODS = [
  { value: 'mobile_money', label: 'Mobile Money' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cash', label: 'Cash' },
  { value: 'cheque', label: 'Cheque' },
];

const PAYMENT_PROVIDERS = {
  mobile_money: ['MTN MoMo', 'Airtel Money'],
  bank_transfer: ['Stanbic Bank', 'DFCU Bank', 'Centenary Bank', 'Equity Bank', 'Absa Uganda'],
  cash: ['Cash'],
  cheque: ['Stanbic Bank', 'DFCU Bank', 'Centenary Bank'],
};

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
  pending:    { text: '#d97706', bg: '#fef3c7' },
  confirmed:  { text: '#2563eb', bg: '#dbeafe' },
  in_transit: { text: '#7c3aed', bg: '#ede9fe' },
  delivered:  { text: '#1f8a3e', bg: '#e6f2ea' },
  cancelled:  { text: '#dc2626', bg: '#fee2e2' },
};

const TYPE_COLORS = {
  buy:  { text: '#1f8a3e', bg: '#e6f2ea' },
  sell: { text: '#2563eb', bg: '#dbeafe' },
};

function Badge({ value, map }) {
  const c = map[value] || { text: '#6b7280', bg: '#f3f4f6' };
  return (
    <span style={{ fontSize: 'var(--text-2xs)', fontWeight: 'var(--weight-semibold)', letterSpacing: 'var(--tracking-wide)', color: c.text, backgroundColor: c.bg, padding: '2px 8px', borderRadius: 20, textTransform: 'uppercase' }}>
      {value?.replace('_', ' ')}
    </span>
  );
}

const inputStyle = {
  width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #e5e7eb',
  fontSize: 13, fontFamily: 'inherit', color: '#111827', backgroundColor: '#fff',
  outline: 'none', boxSizing: 'border-box',
};

const labelStyle = { fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 4 };

function AddTransactionModal({ onClose, onCreated }) {
  const [markets, setMarkets]   = useState([]);
  const [saving, setSaving]     = useState(false);
  const [formError, setFormError] = useState(null);

  const [form, setForm] = useState({
    type: 'buy', commodity: 'maize', quantity: '', unitPrice: '',
    fromMarket: '', toMarket: '', buyer: '', seller: '',
    status: 'pending', notes: '',
    paymentMethod: '', paymentProvider: '',
  });

  useEffect(() => {
    marketsApi.listMarkets()
      .then((m) => setMarkets(Array.isArray(m) ? m : []))
      .catch(() => {});
  }, []);

  function set(key, val) {
    setForm(f => ({ ...f, [key]: val }));
  }

  const total = form.quantity && form.unitPrice
    ? Math.round(Number(form.quantity) * Number(form.unitPrice)).toLocaleString()
    : '—';

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError(null);
    if (!form.quantity || !form.unitPrice) { setFormError('Quantity and unit price are required'); return; }

    setSaving(true);
    try {
      const body = {
        type: form.type,
        commodity: form.commodity,
        quantity: Number(form.quantity),
        unitPrice: Number(form.unitPrice),
        fromMarket: form.fromMarket || undefined,
        toMarket:   form.toMarket   || undefined,
        buyer:   form.buyer   || undefined,
        seller:  form.seller  || undefined,
        status:  form.status,
        notes:   form.notes   || undefined,
        paymentMethod:   form.paymentMethod   || undefined,
        paymentProvider: form.paymentProvider || undefined,
        paymentPaidBy:   form.buyer  || undefined,
        paymentPaidTo:   form.seller || undefined,
      };
      const created = await transactionsApi.createTransaction(body);
      onCreated(created);
      onClose();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const providers = form.paymentMethod ? PAYMENT_PROVIDERS[form.paymentMethod] : [];

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: 16 }}>
      <div style={{ backgroundColor: '#fff', borderRadius: 16, width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 16px', borderBottom: '1px solid #f3f4f6' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>New Transaction</div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>Record a commodity trade transaction</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex', alignItems: 'center' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Trade details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Type</label>
              <select style={inputStyle} value={form.type} onChange={e => set('type', e.target.value)}>
                <option value="buy">Buy</option>
                <option value="sell">Sell</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Commodity</label>
              <select style={inputStyle} value={form.commodity} onChange={e => set('commodity', e.target.value)}>
                {commodities.map(c => <option key={c.key} value={c.key}>{c.icon} {c.label}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Quantity (kg)</label>
              <input style={inputStyle} type="number" min="1" placeholder="e.g. 500" value={form.quantity} onChange={e => set('quantity', e.target.value)} required />
            </div>
            <div>
              <label style={labelStyle}>Unit Price (UGX/kg)</label>
              <input style={inputStyle} type="number" min="1" placeholder="e.g. 1200" value={form.unitPrice} onChange={e => set('unitPrice', e.target.value)} required />
            </div>
            <div>
              <label style={labelStyle}>Total Amount</label>
              <div style={{ ...inputStyle, backgroundColor: '#f9fafb', color: '#6b7280', fontFamily: 'var(--font-mono)', fontSize: 12, display: 'flex', alignItems: 'center' }}>
                {total !== '—' ? `UGX ${total}` : '—'}
              </div>
            </div>
          </div>

          {/* Markets */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>From Market</label>
              <select style={inputStyle} value={form.fromMarket} onChange={e => set('fromMarket', e.target.value)}>
                <option value="">— Select market —</option>
                {markets.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>To Market</label>
              <select style={inputStyle} value={form.toMarket} onChange={e => set('toMarket', e.target.value)}>
                <option value="">— Select market —</option>
                {markets.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
              </select>
            </div>
          </div>

          {/* Parties */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Buyer</label>
              <input style={inputStyle} type="text" placeholder="Buyer name" value={form.buyer} onChange={e => set('buyer', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Seller</label>
              <input style={inputStyle} type="text" placeholder="Seller name" value={form.seller} onChange={e => set('seller', e.target.value)} />
            </div>
          </div>

          {/* Status */}
          <div>
            <label style={labelStyle}>Initial Status</label>
            <select style={inputStyle} value={form.status} onChange={e => set('status', e.target.value)}>
              {['pending', 'confirmed', 'in_transit', 'delivered', 'cancelled'].map(s => (
                <option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
              ))}
            </select>
          </div>

          {/* Payment (optional) */}
          <div style={{ backgroundColor: '#f9fafb', borderRadius: 10, padding: '14px 16px', border: '1px solid #f3f4f6' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 10 }}>Payment (optional)</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={labelStyle}>Payment Method</label>
                <select style={inputStyle} value={form.paymentMethod} onChange={e => { set('paymentMethod', e.target.value); set('paymentProvider', ''); }}>
                  <option value="">— No payment yet —</option>
                  {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              {providers.length > 0 && (
                <div>
                  <label style={labelStyle}>Provider</label>
                  <select style={inputStyle} value={form.paymentProvider} onChange={e => set('paymentProvider', e.target.value)}>
                    <option value="">— Select provider —</option>
                    {providers.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              )}
            </div>
            {form.paymentMethod && (
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 6 }}>
                A pending payment of UGX {total} will be created and linked to this transaction.
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label style={labelStyle}>Notes (optional)</label>
            <textarea style={{ ...inputStyle, height: 64, resize: 'vertical' }} placeholder="Any additional notes..." value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>

          {formError && (
            <div style={{ backgroundColor: '#fef2f2', color: '#dc2626', padding: '8px 12px', borderRadius: 8, fontSize: 12, border: '1px solid #fee2e2' }}>{formError}</div>
          )}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
              Cancel
            </button>
            <button type="submit" disabled={saving} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#1a6b30', color: '#fff', fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Saving…' : 'Create Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function TransactionsView({ currency = 'UGX', isMobile = false }) {
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [commodityFilter, setCommodityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);

  async function fetchData() {
    try {
      const [txData, statsData] = await Promise.all([
        transactionsApi.listTransactions({ limit: 100 }),
        transactionsApi.getTransactionStats(),
      ]);
      setTransactions(txData);
      setStats(statsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, []);

  function handleCreated(txn) {
    setTransactions(prev => [txn, ...prev]);
    setStats(prev => prev ? { ...prev, total: (prev.total || 0) + 1, pending: (prev.pending || 0) + 1, totalValue: (prev.totalValue || 0) + txn.totalAmount, totalVolume: (prev.totalVolume || 0) + txn.quantity } : prev);
  }

  const filtered = transactions.filter(t => {
    if (commodityFilter !== 'all' && t.commodity !== commodityFilter) return false;
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
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

  const totalVolume = stats?.totalVolume || 0;
  const totalValue  = stats?.totalValue  || 0;

  return (
    <div className="dashboard">
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Transactions</h1>
          <p className="dash-subtitle">Commodity trade records across all markets</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', background: '#1a6b30', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}
        >
          <Plus size={15} />
          <Tooltip text="Record a new trade — buying or selling a commodity between markets"><span>New Transaction</span></Tooltip>
        </button>
      </div>

      <div className="dash-cards">
        <SummaryCard icon={<CreditCard size={18} />} label={<Tooltip text="The total number of trades recorded across all markets"><span>Total Transactions</span></Tooltip>} value={loading ? '—' : (stats?.total || 0)} sub="All time" color="#1f8a3e" loading={loading} trend={8} />
        <SummaryCard icon={<Package size={18} />} label={<Tooltip text="The total weight of all goods traded, measured in metric tons"><span>Total Volume</span></Tooltip>} value={loading ? '—' : `${(totalVolume / 1000).toFixed(0)}T`} sub="Metric tons traded" color="#2563eb" loading={loading} trend={5} />
        <SummaryCard icon={<CreditCard size={18} />} label={<Tooltip text="The total money value of all trades combined"><span>Total Value</span></Tooltip>} value={loading ? '—' : fmtAmount(totalValue)} sub={`In ${currency}`} color="#7c3aed" loading={loading} trend={12} />
        <SummaryCard icon={<Package size={18} />} label={<Tooltip text="Trades that have been agreed but not yet completed or delivered"><span>Pending</span></Tooltip>} value={loading ? '—' : (stats?.pending || 0)} sub="Awaiting confirmation" color="#d97706" loading={loading} />
      </div>

      {error && (
        <div style={{ backgroundColor: '#fef2f2', color: '#dc2626', padding: 12, borderRadius: 8, fontSize: 12, border: '1px solid #fee2e2' }}>{error}</div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <button style={pillStyle(commodityFilter === 'all')} onClick={() => setCommodityFilter('all')}>All Commodities</button>
          {commodities.map(c => (
            <button key={c.key} style={pillStyle(commodityFilter === c.key)} onClick={() => setCommodityFilter(c.key)}>
              <span style={{ marginRight: 3 }}>{c.icon}</span>{c.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {['all', 'pending', 'confirmed', 'in_transit', 'delivered', 'cancelled'].map(s => (
            <button key={s} style={pillStyle(statusFilter === s)} onClick={() => setStatusFilter(s)}>
              {s === 'all' ? 'All Status' : s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
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
            <div style={{ textAlign: 'center', padding: 32, color: '#9ca3af', fontSize: 13 }}>No transactions found</div>
          ) : (
            <div className="mob-list">
              {filtered.map(t => {
                const comm = commodities.find(c => c.key === t.commodity);
                return (
                  <div key={t._id} className="mob-card">
                    <div className="mob-card-row">
                      <span className="mob-card-name">
                        {comm?.icon && <span style={{ marginRight: 4 }}>{comm.icon}</span>}
                        {comm?.label || t.commodity}
                      </span>
                      <Badge value={t.status} map={STATUS_COLORS} />
                    </div>
                    <div className="mob-card-row" style={{ marginTop: 8 }}>
                      <span className="mob-card-amount">{fmtAmount(t.totalAmount)}</span>
                      <Badge value={t.type} map={TYPE_COLORS} />
                    </div>
                    <div className="mob-card-meta">
                      {fmtDate(t.date)} · {t.quantity.toLocaleString()} kg
                      {(t.fromMarket?.name || t.toMarket?.name) && (
                        <span> · {t.fromMarket?.name || '?'} → {t.toMarket?.name || '?'}</span>
                      )}
                    </div>
                  </div>
                );
              })}
              <div className="mob-list-footer">Showing {filtered.length} of {transactions.length} transactions</div>
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
                  { h: 'ID',         tip: 'A unique reference number for this trade' },
                  { h: 'Date',       tip: 'When this trade took place' },
                  { h: 'Type',       tip: 'Whether you bought or sold the commodity' },
                  { h: 'Commodity',  tip: 'The crop or product being traded' },
                  { h: 'Qty (kg)',   tip: 'How many kilograms were traded' },
                  { h: 'Unit Price', tip: 'The price per kilogram at the time of the trade' },
                  { h: 'Total',      tip: 'The total money value of this trade' },
                  { h: 'Route',      tip: 'Where the goods came from and where they went' },
                  { h: 'Status',     tip: 'Where this trade is in the process — agreed, on the road, or delivered' },
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
                    {Array(9).fill(0).map((_, j) => (
                      <td key={j} style={{ padding: '12px 16px' }}>
                        <div className="dash-skeleton" style={{ height: 14, borderRadius: 4, width: j === 0 ? 90 : 70 }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: 32, color: '#9ca3af' }}>No transactions found</td></tr>
              ) : (
                filtered.map(t => {
                  const comm = commodities.find(c => c.key === t.commodity);
                  return (
                    <tr key={t._id} style={{ borderBottom: '1px solid #f9fafb' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fafafa'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: '#6b7280' }}>{t.transactionId}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--gray-600)', whiteSpace: 'nowrap' }}>{fmtDate(t.date)}</td>
                      <td style={{ padding: '12px 16px' }}><Badge value={t.type} map={TYPE_COLORS} /></td>
                      <td style={{ padding: '12px 16px', color: 'var(--gray-700)', fontWeight: 'var(--weight-medium)' }}>
                        <span style={{ marginRight: 4 }}>{comm?.icon}</span>{comm?.label || t.commodity}
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--gray-700)' }}>
                        {t.quantity.toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--gray-600)' }}>
                        {fmtAmount(t.unitPrice)}/kg
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--gray-900)' }}>
                        {fmtAmount(t.totalAmount)}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--gray-500)', fontSize: 'var(--text-xs)', whiteSpace: 'nowrap' }}>
                        {t.fromMarket?.name || '—'} → {t.toMarket?.name || '—'}
                      </td>
                      <td style={{ padding: '12px 16px' }}><Badge value={t.status} map={STATUS_COLORS} /></td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {!loading && (
            <div style={{ padding: '10px 16px', borderTop: '1px solid #f3f4f6', fontSize: 'var(--text-xs)', color: '#9ca3af' }}>
              Showing {filtered.length} of {transactions.length} transactions
            </div>
          )}
        </div>
      )}

      {showModal && (
        <AddTransactionModal
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
