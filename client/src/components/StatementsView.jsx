import { useState, useEffect } from 'react';
import { FileText, ArrowUpRight, ArrowDownRight, ChevronRight } from './Icons';
import Tooltip from './Tooltip';
import * as statementsApi from '../api/statements.js';

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

function EntryTypeBadge({ type }) {
  const isIncome = type === 'income';
  return (
    <span style={{ fontSize: 'var(--text-2xs)', fontWeight: 'var(--weight-semibold)', letterSpacing: 'var(--tracking-wide)', color: isIncome ? '#1f8a3e' : '#dc2626', backgroundColor: isIncome ? '#e6f2ea' : '#fee2e2', padding: '2px 8px', borderRadius: 20, textTransform: 'uppercase' }}>
      {type}
    </span>
  );
}

function StatementRow({ statement, currency, expanded, onToggle }) {
  function fmtAmount(ugx) {
    if (currency === 'USD') return `$${(ugx / UGX_TO_USD).toFixed(2)}`;
    return `UGX ${Math.round(ugx).toLocaleString()}`;
  }

  const netChange = statement.closingBalance - statement.openingBalance;
  const isPositive = netChange >= 0;

  return (
    <div style={{ backgroundColor: '#fff', borderRadius: 10, border: '1px solid #f3f4f6', overflow: 'hidden', marginBottom: 8 }}>
      {/* Header row */}
      <div
        onClick={onToggle}
        style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', cursor: 'pointer', gap: 12, transition: 'background 0.15s' }}
        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fafafa'}
        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        <div style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.2s', color: '#9ca3af' }}>
          <ChevronRight size={14} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-base)', color: 'var(--gray-900)' }}>
            <Tooltip text="Click to expand and see every individual transaction for this month">
              <span>{statement.period}</span>
            </Tooltip>
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: '#6b7280', marginTop: 2 }}>
            {statement.entries?.length || 0} entries
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', color: 'var(--gray-900)' }}>
            {fmtAmount(statement.closingBalance)}
          </div>
          <div style={{ fontSize: 'var(--text-2xs)', color: isPositive ? '#1f8a3e' : '#dc2626', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
            {isPositive ? '+' : ''}{fmtAmount(netChange)} net
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16, minWidth: 200, justifyContent: 'flex-end' }}>
          <div style={{ textAlign: 'center' }}>
            <Tooltip text="Money coming in — sales, fees, and other revenue">
              <div style={{ fontSize: 'var(--text-2xs)', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Income</div>
            </Tooltip>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: '#1f8a3e', fontWeight: 'var(--weight-semibold)' }}>
              {fmtAmount(statement.totalIncome)}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Tooltip text="Money going out — transport costs, salaries, and other expenses">
              <div style={{ fontSize: 'var(--text-2xs)', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Expenses</div>
            </Tooltip>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: '#dc2626', fontWeight: 'var(--weight-semibold)' }}>
              {fmtAmount(statement.totalExpenses)}
            </div>
          </div>
        </div>
      </div>

      {/* Expanded entries */}
      {expanded && statement.entries && statement.entries.length > 0 && (
        <div style={{ borderTop: '1px solid #f3f4f6' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-xs)' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb' }}>
                {[
                  { h: 'Date',        tip: 'When this transaction happened' },
                  { h: 'Description', tip: 'A short note explaining what this entry is for' },
                  { h: 'Type',        tip: 'Whether money came in (income) or went out (expense)' },
                  { h: 'Amount',      tip: 'How much money was involved' },
                  { h: 'Balance',     tip: 'Your running account balance after this entry' },
                  { h: 'Reference',   tip: 'A code to trace this entry back to the original payment or record' },
                ].map(({ h, tip }) => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 16px', fontSize: 'var(--text-2xs)', fontWeight: 'var(--weight-bold)', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>
                    <Tooltip text={tip}><span>{h}</span></Tooltip>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {statement.entries.map((e, i) => (
                <tr key={i} style={{ borderTop: '1px solid #f9fafb' }}
                  onMouseEnter={el => el.currentTarget.style.backgroundColor = '#fafafa'}
                  onMouseLeave={el => el.currentTarget.style.backgroundColor = 'transparent'}>
                  <td style={{ padding: '8px 16px', color: '#6b7280', whiteSpace: 'nowrap' }}>
                    {new Date(e.date).toLocaleDateString('en-UG', { day: 'numeric', month: 'short' })}
                  </td>
                  <td style={{ padding: '8px 16px', color: 'var(--gray-700)' }}>{e.description}</td>
                  <td style={{ padding: '8px 16px' }}><EntryTypeBadge type={e.type} /></td>
                  <td style={{ padding: '8px 16px', fontFamily: 'var(--font-mono)', fontWeight: 'var(--weight-semibold)', color: e.type === 'income' ? '#1f8a3e' : '#dc2626' }}>
                    {e.type === 'income' ? '+' : '-'}{fmtAmount(e.amount)}
                  </td>
                  <td style={{ padding: '8px 16px', fontFamily: 'var(--font-mono)', color: 'var(--gray-600)' }}>
                    {fmtAmount(e.balance)}
                  </td>
                  <td style={{ padding: '8px 16px', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-2xs)', color: '#9ca3af' }}>
                    {e.reference || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function StatementsView({ currency = 'UGX', isMobile = false }) {
  const [statements, setStatements] = useState([]);
  const [detailCache, setDetailCache] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(null);

  useEffect(() => {
    async function fetchStatements() {
      try {
        const data = await statementsApi.listStatements();
        setStatements(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchStatements();
  }, []);

  async function handleToggle(stmt) {
    if (expandedId === stmt._id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(stmt._id);
    if (!detailCache[stmt._id]) {
      setLoadingDetail(stmt._id);
      try {
        const detail = await statementsApi.getStatement(stmt._id);
        setDetailCache(prev => ({ ...prev, [stmt._id]: detail }));
      } catch (e) {
        // ignore, will show empty entries
      } finally {
        setLoadingDetail(null);
      }
    }
  }

  function fmtAmount(ugx) {
    if (currency === 'USD') return `$${(ugx / UGX_TO_USD).toFixed(2)}`;
    return `UGX ${Math.round(ugx).toLocaleString()}`;
  }

  const latest = statements[0];
  const totalIncomeCurrent = latest?.totalIncome || 0;
  const totalExpensesCurrent = latest?.totalExpenses || 0;

  return (
    <div className="dashboard">
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Statements</h1>
          <p className="dash-subtitle">Monthly financial account summaries — click a period to expand entries</p>
        </div>
      </div>

      <div className="dash-cards">
        <SummaryCard icon={<FileText size={18} />} label={<Tooltip text="Your account balance at the end of the most recent period"><span>Current Balance</span></Tooltip>} value={loading ? '—' : fmtAmount(latest?.closingBalance || 0)} sub={latest?.period || 'Latest period'} color="#1f8a3e" loading={loading} />
        <SummaryCard icon={<ArrowUpRight size={18} />} label={<Tooltip text="Total money received this month — from sales, fees, and other income"><span>Income This Month</span></Tooltip>} value={loading ? '—' : fmtAmount(totalIncomeCurrent)} sub="Revenue collected" color="#2563eb" loading={loading} trend={8} />
        <SummaryCard icon={<ArrowDownRight size={18} />} label={<Tooltip text="Total money spent this month — on transport, salaries, and other costs"><span>Expenses This Month</span></Tooltip>} value={loading ? '—' : fmtAmount(totalExpensesCurrent)} sub="Costs incurred" color="#dc2626" loading={loading} />
        <SummaryCard icon={<FileText size={18} />} label={<Tooltip text="How many monthly account summaries have been recorded"><span>Statement Periods</span></Tooltip>} value={loading ? '—' : statements.length} sub="Monthly records" color="#7c3aed" loading={loading} />
      </div>

      {error && (
        <div style={{ backgroundColor: '#fef2f2', color: '#dc2626', padding: 12, borderRadius: 8, fontSize: 12, marginBottom: 16, border: '1px solid #fee2e2' }}>{error}</div>
      )}

      <div style={{ marginBottom: 8 }}>
        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} style={{ backgroundColor: '#fff', borderRadius: 10, border: '1px solid #f3f4f6', padding: 16, marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="dash-skeleton" style={{ height: 16, width: 120, borderRadius: 4 }} />
                <div className="dash-skeleton" style={{ height: 14, width: 60, borderRadius: 4, marginLeft: 'auto' }} />
              </div>
            </div>
          ))
        ) : statements.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 'var(--text-sm)' }}>No statements found</div>
        ) : (
          statements.map(stmt => {
            const isExpanded = expandedId === stmt._id;
            const detail = detailCache[stmt._id];
            const displayStmt = detail ? { ...stmt, entries: detail.entries } : stmt;
            return (
              <div key={stmt._id}>
                {loadingDetail === stmt._id && isExpanded && (
                  <div style={{ textAlign: 'center', padding: '8px', fontSize: 11, color: '#9ca3af' }}>Loading entries…</div>
                )}
                <StatementRow
                  statement={displayStmt}
                  currency={currency}
                  expanded={isExpanded}
                  onToggle={() => handleToggle(stmt)}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
