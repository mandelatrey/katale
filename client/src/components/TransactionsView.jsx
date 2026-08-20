import { useState, useEffect } from 'react';
import { CreditCard, Package, ArrowUpRight, ArrowDownRight, Plus, MoreHorizontal, Pencil, Trash2, Info } from './Icons';
import { commodities } from '../constants';
import Tooltip from './Tooltip';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardHeader, CardContent } from './ui/card';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from './ui/dropdown-menu';
import { Field, FieldGroup, FieldLabel, FieldSet, FieldLegend, FieldDescription, FieldError } from './ui/field';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup, SelectLabel } from './ui/select';
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

function SummaryCard({ icon, label, value, sub, trend, color = '#1f8a3e', loading, isMobile }) {
  const trendUp = trend > 0;
  const trendNeutral = trend === 0 || trend == null;

  if (isMobile) {
    return (
      <div className="dash-card" style={{ border: '1px solid #e5e7eb', padding: '10px 10px 12px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
          {icon}
        </div>
        {loading ? (
          <div className="dash-skeleton" style={{ width: '60%', height: 18, borderRadius: 4, marginTop: 2 }} />
        ) : (
          <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-black)', color: 'var(--gray-900)', letterSpacing: 'var(--tracking-tight)', lineHeight: 1.15, fontFamily: 'var(--font-mono)' }}>
            {value}
          </div>
        )}
        <div style={{ fontSize: 11, fontWeight: 'var(--weight-semibold)', color: 'var(--gray-700)', lineHeight: 1.2 }}>{label}</div>
        {!trendNeutral && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 10, fontWeight: 'var(--weight-semibold)', fontFamily: 'var(--font-mono)', color: trendUp ? '#1f8a3e' : '#dc2626', backgroundColor: trendUp ? '#e6f2ea' : '#fef2f2', padding: '1px 6px', borderRadius: 20 }}>
            {trendUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
    );
  }

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

function StatusBadge({ value }) {
  return <Badge variant={value}>{value?.replace('_', ' ')}</Badge>;
}

const fieldLabelClass = "text-[11px] font-semibold uppercase tracking-[0.07em] text-[#6b7280]";
const inputClass = "h-9 rounded-lg border-[#e5e7eb] bg-white text-[13px] text-[#111827] focus-visible:border-[#1a6b30] focus-visible:ring-[#1a6b30]/15";
const triggerClass = "h-9 rounded-lg border-[#e5e7eb] bg-white text-[13px] font-medium text-[#111827]";

function TransactionFormModal({ onClose, onSaved, initial }) {
  const isEdit = !!initial;
  const [markets, setMarkets]   = useState([]);
  const [saving, setSaving]     = useState(false);
  const [formError, setFormError] = useState(null);

  const [form, setForm] = useState(() => initial ? {
    type: initial.type || 'buy',
    commodity: initial.commodity || 'maize',
    quantity: String(initial.quantity ?? ''),
    unitPrice: String(initial.unitPrice ?? ''),
    fromMarket: initial.fromMarket?._id || initial.fromMarket || '',
    toMarket: initial.toMarket?._id || initial.toMarket || '',
    buyer: initial.buyer || '',
    seller: initial.seller || '',
    status: initial.status || 'pending',
    notes: initial.notes || '',
    paymentMethod: '', paymentProvider: '',
  } : {
    type: 'buy', commodity: 'maize', quantity: '', unitPrice: '',
    fromMarket: '', toMarket: '', buyer: '', seller: '',
    status: 'pending', notes: '',
    paymentMethod: '', paymentProvider: '',
  });

  const [betweenMarkets, setBetweenMarkets] = useState(() =>
    initial ? !!(initial.fromMarket || initial.toMarket) : true
  );

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
        fromMarket: betweenMarkets ? (form.fromMarket || undefined) : undefined,
        toMarket:   betweenMarkets ? (form.toMarket   || undefined) : undefined,
        buyer:   form.buyer   || undefined,
        seller:  form.seller  || undefined,
        status:  form.status,
        notes:   form.notes   || undefined,
        paymentMethod:   form.paymentMethod   || undefined,
        paymentProvider: form.paymentProvider || undefined,
        paymentPaidBy:   form.buyer  || undefined,
        paymentPaidTo:   form.seller || undefined,
      };
      const saved = isEdit
        ? await transactionsApi.updateTransaction(initial._id, body)
        : await transactionsApi.createTransaction(body);
      onSaved(saved, isEdit);
      onClose();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const providers = form.paymentMethod ? PAYMENT_PROVIDERS[form.paymentMethod] : [];

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="!max-w-[640px] max-h-[90vh] overflow-y-auto border-none bg-transparent p-0 shadow-none ring-0">
        <Card className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-[0_20px_50px_-12px_rgba(15,23,42,0.22)]">
          <CardHeader className="space-y-1 border-b border-[#f3f4f6] px-6 pt-5 pb-4">
            <DialogTitle className="text-base font-bold tracking-[-0.01em] text-[#111827]">{isEdit ? 'Edit Transaction' : 'New Transaction'}</DialogTitle>
            <DialogDescription className="text-xs text-[#6b7280]">
              {isEdit ? `Update details for ${initial.transactionId || 'this trade'}` : 'Record a commodity trade transaction'}
            </DialogDescription>
          </CardHeader>

          <CardContent className="p-0">
            <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-6 pt-5 pb-6">
              <FieldGroup>
                {/* Trade details */}
                <div className="grid grid-cols-2 gap-3">
                  <Field>
                    <FieldLabel htmlFor="txn-type" className={fieldLabelClass}>Type</FieldLabel>
                    <Select value={form.type} onValueChange={v => set('type', v)}>
                      <SelectTrigger id="txn-type" className={triggerClass}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="buy">Buy</SelectItem>
                        <SelectItem value="sell">Sell</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="txn-commodity" className={fieldLabelClass}>Commodity</FieldLabel>
                    <Select value={form.commodity} onValueChange={v => set('commodity', v)}>
                      <SelectTrigger id="txn-commodity" className={triggerClass}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {commodities.map(c => (
                          <SelectItem key={c.key} value={c.key} icon={c.icon}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field>
                    <FieldLabel htmlFor="txn-qty" className={fieldLabelClass}>Quantity (kg)</FieldLabel>
                    <Input id="txn-qty" type="number" min="1" placeholder="e.g. 500" value={form.quantity} onChange={e => set('quantity', e.target.value)} required className={inputClass} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="txn-price" className={fieldLabelClass}>Unit Price (UGX/kg)</FieldLabel>
                    <Input id="txn-price" type="number" min="1" placeholder="e.g. 1200" value={form.unitPrice} onChange={e => set('unitPrice', e.target.value)} required className={inputClass} />
                  </Field>
                </div>

                <Field>
                  <FieldLabel className={fieldLabelClass}>Total Amount</FieldLabel>
                  <div className="flex h-9 w-full items-center rounded-lg border border-[#e5e7eb] bg-[#f9fafb] px-2.5 font-mono text-[13px] font-semibold text-[#111827]">
                    {total !== '—' ? `UGX ${total}` : <span className="font-normal text-[#9ca3af]">—</span>}
                  </div>
                </Field>

                {/* Markets */}
                <div className="flex items-center justify-between rounded-lg border border-[#e5e7eb] bg-[#f9fafb] px-3 py-2">
                  <div className="flex flex-col">
                    <span className={fieldLabelClass}>Between markets</span>
                    <span className="mt-0.5 text-[11px] text-[#6b7280]">
                      Turn off if this trade is between individuals
                    </span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={betweenMarkets}
                    onClick={() => setBetweenMarkets(v => !v)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a6b30]/25 ${
                      betweenMarkets ? 'bg-[#1a6b30]' : 'bg-[#d1d5db]'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        betweenMarkets ? 'translate-x-4' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
                {betweenMarkets && (
                  <div className="grid grid-cols-2 gap-3">
                    <Field>
                      <FieldLabel htmlFor="txn-from" className={fieldLabelClass}>From Market</FieldLabel>
                      <Select value={form.fromMarket} onValueChange={v => set('fromMarket', v)}>
                        <SelectTrigger id="txn-from" className={triggerClass}>
                          <SelectValue placeholder="Select market" />
                        </SelectTrigger>
                        <SelectContent>
                          {markets.map(m => <SelectItem key={m._id} value={m._id}>{m.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="txn-to" className={fieldLabelClass}>To Market</FieldLabel>
                      <Select value={form.toMarket} onValueChange={v => set('toMarket', v)}>
                        <SelectTrigger id="txn-to" className={triggerClass}>
                          <SelectValue placeholder="Select market" />
                        </SelectTrigger>
                        <SelectContent>
                          {markets.map(m => <SelectItem key={m._id} value={m._id}>{m.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>
                )}

                {/* Parties */}
                <div className="grid grid-cols-2 gap-3">
                  <Field>
                    <FieldLabel htmlFor="txn-buyer" className={fieldLabelClass}>Buyer</FieldLabel>
                    <Input id="txn-buyer" type="text" placeholder="Buyer name" value={form.buyer} onChange={e => set('buyer', e.target.value)} className={inputClass} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="txn-seller" className={fieldLabelClass}>Seller</FieldLabel>
                    <Input id="txn-seller" type="text" placeholder="Seller name" value={form.seller} onChange={e => set('seller', e.target.value)} className={inputClass} />
                  </Field>
                </div>

                {/* Status */}
                <Field>
                  <FieldLabel htmlFor="txn-status" className={fieldLabelClass}>Initial Status</FieldLabel>
                  <Select value={form.status} onValueChange={v => set('status', v)}>
                    <SelectTrigger id="txn-status" className={triggerClass}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {['pending', 'confirmed', 'in_transit', 'delivered', 'cancelled'].map(s => (
                        <SelectItem key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                {/* Payment (optional) — only when creating a new transaction */}
                {!isEdit && (
                <FieldSet className="rounded-lg border border-[#f3f4f6] bg-[#f9fafb] px-4 py-3.5">
                  <FieldLegend className="mb-0 px-1 text-[11px] font-semibold uppercase tracking-[0.07em] text-[#6b7280]">Payment (optional)</FieldLegend>
                  <FieldGroup className="gap-3">
                    <div className="grid grid-cols-2 gap-3">
                      <Field>
                        <FieldLabel htmlFor="txn-method" className={fieldLabelClass}>Payment Method</FieldLabel>
                        <Select value={form.paymentMethod || 'none'} onValueChange={v => { set('paymentMethod', v === 'none' ? '' : v); set('paymentProvider', ''); }}>
                          <SelectTrigger id="txn-method" className={triggerClass}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No payment yet</SelectItem>
                            {PAYMENT_METHODS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </Field>
                      {providers.length > 0 && (
                        <Field>
                          <FieldLabel htmlFor="txn-provider" className={fieldLabelClass}>Provider</FieldLabel>
                          <Select value={form.paymentProvider} onValueChange={v => set('paymentProvider', v)}>
                            <SelectTrigger id="txn-provider" className={triggerClass}>
                              <SelectValue placeholder="Select provider" />
                            </SelectTrigger>
                            <SelectContent>
                              {providers.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </Field>
                      )}
                    </div>
                    {form.paymentMethod && (
                      <FieldDescription className="text-[11px]">
                        A pending payment of UGX {total} will be created and linked to this transaction.
                      </FieldDescription>
                    )}
                  </FieldGroup>
                </FieldSet>
                )}

                {/* Notes */}
                <Field>
                  <FieldLabel htmlFor="txn-notes" className={fieldLabelClass}>Notes (optional)</FieldLabel>
                  <Textarea id="txn-notes" placeholder="Any additional notes..." value={form.notes} onChange={e => set('notes', e.target.value)} className="min-h-[64px] rounded-lg border-[#e5e7eb] bg-white text-[13px] text-[#111827] focus-visible:border-[#1a6b30] focus-visible:ring-[#1a6b30]/15" />
                </Field>

                {formError && (
                  <FieldError className="rounded-lg border border-[#fee2e2] bg-[#fef2f2] px-3 py-2 text-xs text-[#dc2626]">
                    {formError}
                  </FieldError>
                )}
              </FieldGroup>

              <div className="mt-1 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-9 rounded-lg border-[#e5e7eb] bg-white px-4 text-[13px] font-medium text-[#374151] hover:bg-[#f9fafb] hover:text-[#111827]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="h-9 rounded-lg bg-[#1a6b30] px-5 text-[13px] font-semibold text-white shadow-[0_1px_2px_rgba(15,23,42,0.06)] hover:bg-[#155a28] focus-visible:ring-[#1a6b30]/25"
            >
              {saving ? 'Saving…' : (isEdit ? 'Save Changes' : 'Create Transaction')}
            </Button>
          </div>
            </form>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}

export default function TransactionsView({ currency = 'UGX', isMobile = false, currentUser = null }) {
  const isAdmin = currentUser?.role === 'admin';
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [commodityFilter, setCommodityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editTxn, setEditTxn] = useState(null);
  const [detailsTxn, setDetailsTxn] = useState(null);
  const [deleteTxn, setDeleteTxn] = useState(null);
  const [deleting, setDeleting] = useState(false);

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

  function handleSaved(txn, wasEdit) {
    if (wasEdit) {
      setTransactions(prev => prev.map(t => t._id === txn._id ? txn : t));
    } else {
      handleCreated(txn);
    }
  }

  async function handleDelete() {
    if (!deleteTxn) return;
    setDeleting(true);
    try {
      await transactionsApi.deleteTransaction(deleteTxn._id);
      setTransactions(prev => prev.filter(t => t._id !== deleteTxn._id));
      setStats(prev => prev ? { ...prev, total: Math.max(0, (prev.total || 0) - 1), totalValue: Math.max(0, (prev.totalValue || 0) - deleteTxn.totalAmount), totalVolume: Math.max(0, (prev.totalVolume || 0) - deleteTxn.quantity) } : prev);
      setDeleteTxn(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  const filtered = transactions.filter(t => {
    if (commodityFilter !== 'all' && t.commodity !== commodityFilter) return false;
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    return true;
  });

  function fmtAmount(ugx) {
    if (currency === 'USD') return `$${(ugx / UGX_TO_USD).toFixed(2)}`;
    return `UGX ${Math.round(ugx).toLocaleString()}`;
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
        <Button
          size="lg"
          onClick={() => setShowModal(true)}
          className="h-9 gap-1.5 rounded-lg bg-[#1a6b30] px-4 text-[13px] font-semibold text-white shadow-[0_1px_2px_rgba(15,23,42,0.06)] hover:bg-[#155a28] focus-visible:ring-[#1a6b30]/25"
        >
          <Plus size={15} />
          <Tooltip text="Record a new trade — buying or selling a commodity between markets"><span>New Transaction</span></Tooltip>
        </Button>
      </div>

      <div className="dash-cards">
        <SummaryCard isMobile={isMobile} icon={<CreditCard size={isMobile ? 15 : 18} />} label={<Tooltip text="The total number of trades recorded across all markets"><span>Total Transactions</span></Tooltip>} value={loading ? '—' : (stats?.total || 0)} sub="All time" color="#1f8a3e" loading={loading} trend={8} />
        <SummaryCard isMobile={isMobile} icon={<Package size={isMobile ? 15 : 18} />} label={<Tooltip text="The total weight of all goods traded, in kilograms"><span>Total Volume</span></Tooltip>} value={loading ? '—' : `${Math.round(totalVolume).toLocaleString()} kg`} sub="Kilograms traded" color="#2563eb" loading={loading} trend={5} />
        <SummaryCard isMobile={isMobile} icon={<CreditCard size={isMobile ? 15 : 18} />} label={<Tooltip text="The total money value of all trades combined"><span>Total Value</span></Tooltip>} value={loading ? '—' : fmtAmount(totalValue)} sub={`In ${currency}`} color="#7c3aed" loading={loading} trend={12} />
        <SummaryCard isMobile={isMobile} icon={<Package size={isMobile ? 15 : 18} />} label={<Tooltip text="Trades that have been agreed but not yet completed or delivered"><span>Pending</span></Tooltip>} value={loading ? '—' : (stats?.pending || 0)} sub="Awaiting confirmation" color="#d97706" loading={loading} />
      </div>

      {error && (
        <div style={{ backgroundColor: '#fef2f2', color: '#dc2626', padding: 12, borderRadius: 8, fontSize: 12, border: '1px solid #fee2e2' }}>{error}</div>
      )}

      {/* Filters */}
      {isMobile ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Select value={commodityFilter} onValueChange={setCommodityFilter}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Filter by commodity</SelectLabel>
                <SelectItem value="all">All Commodities</SelectItem>
                {commodities.map(c => (
                  <SelectItem key={c.key} value={c.key} icon={c.icon}>{c.label}</SelectItem>
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
                {['all', 'pending', 'confirmed', 'in_transit', 'delivered', 'cancelled'].map(s => (
                  <SelectItem key={s} value={s}>
                    {s === 'all' ? 'All Status' : s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      ) : (
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
      )}

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
                  <div key={t._id} className="mob-card relative">
                    <div className="mob-card-row">
                      <span className="mob-card-name" style={{ display: 'inline-flex', alignItems: 'center', gap: 16, minWidth: 0 }}>
                        <span style={{ fontFamily: 'var(--font-mono)' }}>{t.transactionId}</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 8, fontWeight: 500, color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {comm?.icon && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{comm.icon}</span>}
                          {comm?.label || t.commodity}
                        </span>
                      </span>
                      <div className="flex items-center gap-2">
                        <StatusBadge value={t.status} />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              aria-label="Transaction actions"
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#111827] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a6b30]/25"
                            >
                              <MoreHorizontal size={16} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="min-w-[160px]">
                            <DropdownMenuItem onSelect={() => setDetailsTxn(t)} className="gap-2 text-[13px]">
                              <Info size={14} /> View details
                            </DropdownMenuItem>
                            {isAdmin && (
                              <>
                                <DropdownMenuItem onSelect={() => setEditTxn(t)} className="gap-2 text-[13px]">
                                  <Pencil size={14} /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onSelect={() => setDeleteTxn(t)} className="gap-2 text-[13px] text-[#dc2626] focus:bg-[#fef2f2] focus:text-[#b91c1c]">
                                  <Trash2 size={14} /> Delete
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <div className="mob-card-row" style={{ marginTop: 8 }}>
                      <span className="mob-card-amount">{fmtAmount(t.totalAmount)}</span>
                      <StatusBadge value={t.type} />
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
                      <td style={{ padding: '12px 16px' }}><StatusBadge value={t.type} /></td>
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
                      <td style={{ padding: '12px 16px' }}><StatusBadge value={t.status} /></td>
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
        <TransactionFormModal
          onClose={() => setShowModal(false)}
          onSaved={handleSaved}
        />
      )}

      {editTxn && (
        <TransactionFormModal
          initial={editTxn}
          onClose={() => setEditTxn(null)}
          onSaved={handleSaved}
        />
      )}

      {detailsTxn && (
        <TransactionDetailsModal
          txn={detailsTxn}
          fmtAmount={fmtAmount}
          fmtDate={fmtDate}
          onClose={() => setDetailsTxn(null)}
        />
      )}

      {deleteTxn && (
        <DeleteConfirmModal
          txn={deleteTxn}
          saving={deleting}
          onCancel={() => setDeleteTxn(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}

function TransactionDetailsModal({ txn, fmtAmount, fmtDate, onClose }) {
  const comm = commodities.find(c => c.key === txn.commodity);
  const rows = [
    ['Transaction ID', txn.transactionId],
    ['Date', fmtDate(txn.date)],
    ['Type', txn.type],
    ['Commodity', comm?.label || txn.commodity],
    ['Quantity', `${txn.quantity?.toLocaleString()} kg`],
    ['Unit Price', `${fmtAmount(txn.unitPrice)}/kg`],
    ['Total', fmtAmount(txn.totalAmount)],
    ['From', txn.fromMarket?.name || '—'],
    ['To', txn.toMarket?.name || '—'],
    ['Buyer', txn.buyer || '—'],
    ['Seller', txn.seller || '—'],
    ['Status', txn.status?.replace('_', ' ')],
  ];
  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="!max-w-[480px] max-h-[90vh] overflow-y-auto border-none bg-transparent p-0 shadow-none ring-0">
        <Card className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-[0_20px_50px_-12px_rgba(15,23,42,0.22)]">
          <CardHeader className="space-y-1 border-b border-[#f3f4f6] px-6 pt-5 pb-4">
            <DialogTitle className="text-base font-bold tracking-[-0.01em] text-[#111827]">Transaction Details</DialogTitle>
            <DialogDescription className="text-xs text-[#6b7280]">
              {txn.transactionId}
            </DialogDescription>
          </CardHeader>
          <CardContent className="p-0">
            <dl className="divide-y divide-[#f3f4f6]">
              {rows.map(([label, value]) => (
                <div key={label} className="grid grid-cols-[110px_1fr] gap-4 px-6 py-2.5">
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[#6b7280]">{label}</dt>
                  <dd className="text-[13px] font-medium capitalize text-[#111827]">{value}</dd>
                </div>
              ))}
              {txn.notes && (
                <div className="grid grid-cols-[110px_1fr] gap-4 px-6 py-2.5">
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[#6b7280]">Notes</dt>
                  <dd className="text-[13px] text-[#374151]">{txn.notes}</dd>
                </div>
              )}
            </dl>
            <div className="flex justify-end border-t border-[#f3f4f6] px-6 py-4">
              <Button
                variant="outline"
                onClick={onClose}
                className="h-9 rounded-lg border-[#e5e7eb] bg-white px-4 text-[13px] font-medium text-[#374151] hover:bg-[#f9fafb] hover:text-[#111827]"
              >
                Close
              </Button>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}

function DeleteConfirmModal({ txn, saving, onCancel, onConfirm }) {
  return (
    <Dialog open onOpenChange={(open) => { if (!open) onCancel(); }}>
      <DialogContent className="!max-w-[400px] border-none bg-transparent p-0 shadow-none ring-0">
        <Card className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-[0_20px_50px_-12px_rgba(15,23,42,0.22)]">
          <CardHeader className="space-y-1 border-b border-[#f3f4f6] px-6 pt-5 pb-4">
            <DialogTitle className="text-base font-bold tracking-[-0.01em] text-[#111827]">Delete transaction?</DialogTitle>
            <DialogDescription className="text-xs text-[#6b7280]">
              {txn.transactionId} will be permanently removed along with any linked payment records. This cannot be undone.
            </DialogDescription>
          </CardHeader>
          <CardContent className="flex justify-end gap-2 px-6 py-4">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={saving}
              className="h-9 rounded-lg border-[#e5e7eb] bg-white px-4 text-[13px] font-medium text-[#374151] hover:bg-[#f9fafb] hover:text-[#111827]"
            >
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              disabled={saving}
              className="h-9 rounded-lg bg-[#dc2626] px-5 text-[13px] font-semibold text-white hover:bg-[#b91c1c] focus-visible:ring-[#dc2626]/25"
            >
              {saving ? 'Deleting…' : 'Delete'}
            </Button>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
