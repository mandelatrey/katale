# Clear Seeded Data & Add Smart Tooltips — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all seeded placeholder data with one example per collection and add plain-language hover tooltips to guide users across every section of the app.

**Architecture:** A standalone Node script wipes and re-seeds each collection with one example record. A single reusable `Tooltip` component (CSS-only, inline styles) is dropped into column headers, summary cards, action buttons, and status badges across AssetsView, TransactionsView, PaymentsView, CarriersView, ReportsView, and StatementsView.

**Tech Stack:** Node.js + Mongoose (data script), React (Tooltip component + view integration), inline styles only (no Tailwind on the tooltip itself, consistent with codebase conventions).

**Note:** No test suite is configured in this project — skip test steps.

---

## File Map

| Action | File | Purpose |
|---|---|---|
| Create | `server/clearToExamples.js` | Wipe all seeded collections, insert 1 example per collection |
| Create | `client/src/components/Tooltip.jsx` | Reusable hover tooltip component |
| Modify | `client/src/components/AssetsView.jsx` | Add tooltips to column headers and summary cards |
| Modify | `client/src/components/TransactionsView.jsx` | Add tooltips to column headers, summary cards, and New Transaction button |
| Modify | `client/src/components/PaymentsView.jsx` | Add tooltips to column headers and summary cards |
| Modify | `client/src/components/CarriersView.jsx` | Add tooltips to Add New Vehicle button and status badges |
| Modify | `client/src/components/ReportsView.jsx` | Add tooltips to report type badges and field labels |
| Modify | `client/src/components/StatementsView.jsx` | Add tooltips to column headers and summary cards |

---

## Task 1: Create the data cleanup script

**Files:**
- Create: `server/clearToExamples.js`

- [ ] **Step 1: Create the script**

Create `server/clearToExamples.js` with this content:

```js
/**
 * clearToExamples.js
 * Wipes seeded data from all page collections and inserts one example
 * record per collection so the app looks populated but not fake.
 * Run: node server/clearToExamples.js
 * Requires Markets to exist (run seed.js first).
 */
import "dotenv/config";
import mongoose from "mongoose";
import Market from "./models/Market.js";
import Asset from "./models/Asset.js";
import Transaction from "./models/Transaction.js";
import Payment from "./models/Payment.js";
import Report from "./models/Report.js";
import Statement from "./models/Statement.js";
import Carrier from "./models/Carrier.js";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/uganda-markets";

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  // Fetch two real markets to use as references
  const markets = await Market.find().limit(2).lean();
  if (markets.length < 2) {
    console.error("Need at least 2 markets. Run seed.js first.");
    process.exit(1);
  }
  const [m1, m2] = markets;

  // ── Wipe all collections ──────────────────────────────────────────────────
  await Promise.all([
    Asset.deleteMany({}),
    Transaction.deleteMany({}),
    Payment.deleteMany({}),
    Report.deleteMany({}),
    Statement.deleteMany({}),
    Carrier.deleteMany({}),
  ]);
  console.log("Collections cleared");

  // ── 1 Asset ───────────────────────────────────────────────────────────────
  await Asset.create({
    name: "Example Vehicle — Toyota Dyna",
    type: "vehicle",
    status: "active",
    market: m1._id,
    region: m1.region || "Central",
    assignedTo: "Your Driver Name",
    capacity: 2000,
    value: 45_000_000,
    acquiredAt: new Date(),
  });

  // ── 1 Transaction ─────────────────────────────────────────────────────────
  const txn = await Transaction.create({
    transactionId: "TXN-00001",
    type: "buy",
    commodity: "maize",
    quantity: 500,
    unitPrice: 1200,
    totalAmount: 600_000,
    currency: "UGX",
    fromMarket: m1._id,
    toMarket: m2._id,
    buyer: "Your Buyer Name",
    seller: "Your Seller Name",
    status: "delivered",
    date: new Date(),
  });

  // ── 1 Payment ─────────────────────────────────────────────────────────────
  await Payment.create({
    paymentId: "PAY-00001",
    transaction: txn._id,
    amount: 600_000,
    currency: "UGX",
    method: "mobile_money",
    provider: "MTN MoMo",
    status: "completed",
    paidBy: "Your Buyer Name",
    paidTo: "Your Seller Name",
    reference: "REF-EXAMPLE-001",
    date: new Date(),
  });

  // ── 1 Report ──────────────────────────────────────────────────────────────
  await Report.create({
    reportId: "RPT-001",
    title: "Example Report — Maize Price Trend",
    type: "price_trend",
    period: "April 2026",
    region: "All",
    commodity: "maize",
    summary:
      "This is an example report. Generate your own by recording transactions and reviewing price data over time.",
    data: { avgPrice: 1200, dataPoints: 1 },
    generatedAt: new Date(),
  });

  // ── 1 Statement ───────────────────────────────────────────────────────────
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  await Statement.create({
    statementId: "STMT-001",
    period: now.toLocaleString("default", { month: "long", year: "numeric" }),
    startDate: startOfMonth,
    endDate: endOfMonth,
    openingBalance: 0,
    closingBalance: 350_000,
    totalIncome: 600_000,
    totalExpenses: 250_000,
    currency: "UGX",
    entries: [
      {
        date: new Date(),
        description: "Example income — maize sale proceeds",
        type: "income",
        amount: 600_000,
        balance: 600_000,
        reference: "REF-EXAMPLE-001",
      },
      {
        date: new Date(),
        description: "Example expense — transport cost",
        type: "expense",
        amount: 250_000,
        balance: 350_000,
        reference: "REF-EXAMPLE-002",
      },
    ],
  });

  // ── 1 Carrier ─────────────────────────────────────────────────────────────
  await Carrier.create({
    name: "Example Driver — Your Name Here",
    phone: "+256 700 000 000",
    role: "driver",
    status: "WAITING",
    category: "Vans",
    vehicleModel: "Toyota Dyna",
    vehicleType: "Van",
    specs: {
      payload: "2,500 lbs",
      volume: "250,000 in³",
      length: "111 in",
      width: "65 in",
      plate: "UAX 000X",
    },
    activeRoute: {
      from: m1.name,
      to: m2.name,
      distKm: 80,
      packages: 1,
      fromCoords: [m1.location?.coordinates[0] ?? 32.58, m1.location?.coordinates[1] ?? 0.32],
      toCoords:   [m2.location?.coordinates[0] ?? 33.20, m2.location?.coordinates[1] ?? 0.42],
    },
    historyRoutes: [],
  });

  console.log("One example record inserted per collection");
  await mongoose.disconnect();
  console.log("Done. Run the app to see the example data.");
}

run().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
```

- [ ] **Step 2: Run the script to verify it works**

```bash
cd /Users/mandelatrevor/Desktop/REPOS/mapping-2/uganda-market-map
node server/clearToExamples.js
```

Expected output:
```
Connected to MongoDB
Collections cleared
One example record inserted per collection
Done. Run the app to see the example data.
```

- [ ] **Step 3: Commit**

```bash
git add server/clearToExamples.js
git commit -m "feat: add clearToExamples script — wipes seed data, inserts one example per collection"
```

---

## Task 2: Create the Tooltip component

**Files:**
- Create: `client/src/components/Tooltip.jsx`

- [ ] **Step 1: Create the component**

Create `client/src/components/Tooltip.jsx`:

```jsx
import { useState } from 'react';

/**
 * Tooltip — shows plain-language help text on hover.
 * Usage: <Tooltip text="What this means"><span>Label</span></Tooltip>
 */
export default function Tooltip({ text, children }) {
  const [visible, setVisible] = useState(false);

  return (
    <span
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <span
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: 6,
            backgroundColor: '#111827',
            color: '#f9fafb',
            fontSize: 11,
            lineHeight: 1.4,
            fontWeight: 400,
            padding: '5px 9px',
            borderRadius: 6,
            whiteSpace: 'normal',
            width: 200,
            textAlign: 'center',
            zIndex: 9999,
            pointerEvents: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
            fontFamily: 'inherit',
            letterSpacing: 'normal',
            textTransform: 'none',
          }}
        >
          {text}
          {/* Arrow */}
          <span
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              borderWidth: '4px 4px 0 4px',
              borderStyle: 'solid',
              borderColor: '#111827 transparent transparent transparent',
            }}
          />
        </span>
      )}
    </span>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/Tooltip.jsx
git commit -m "feat: add Tooltip component — plain-language hover tooltips, CSS-only"
```

---

## Task 3: Add tooltips to AssetsView

**Files:**
- Modify: `client/src/components/AssetsView.jsx`

- [ ] **Step 1: Import Tooltip at the top of the file**

In `client/src/components/AssetsView.jsx`, add the import after the existing imports:

```jsx
import Tooltip from './Tooltip';
```

- [ ] **Step 2: Add tooltips to the four summary cards**

Find the four `<SummaryCard>` calls inside `AssetsView`. Change their `label` props to wrap the text in a `Tooltip`:

```jsx
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
```

- [ ] **Step 3: Add tooltips to table column headers**

Find the array `['Asset Name', 'Type', 'Status', 'Location', 'Assigned To', 'Capacity', 'Value']` used to render `<th>` elements. Replace it with individual `<th>` elements:

```jsx
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
```

- [ ] **Step 4: Commit**

```bash
git add client/src/components/AssetsView.jsx
git commit -m "feat: add plain-language tooltips to Assets view"
```

---

## Task 4: Add tooltips to TransactionsView

**Files:**
- Modify: `client/src/components/TransactionsView.jsx`

- [ ] **Step 1: Import Tooltip**

```jsx
import Tooltip from './Tooltip';
```

- [ ] **Step 2: Wrap the New Transaction button label**

Find the `<button>` with text `New Transaction`. Wrap just the text:

```jsx
<button
  onClick={() => setShowModal(true)}
  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', background: '#1a6b30', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}
>
  <Plus size={15} />
  <Tooltip text="Record a new trade — buying or selling a commodity between markets"><span>New Transaction</span></Tooltip>
</button>
```

- [ ] **Step 3: Add tooltips to summary cards**

Replace the four `<SummaryCard>` calls:

```jsx
<SummaryCard icon={<CreditCard size={18} />} label={<Tooltip text="The total number of trades recorded across all markets"><span>Total Transactions</span></Tooltip>} value={loading ? '—' : (stats?.total || 0)} sub="All time" color="#1f8a3e" loading={loading} trend={8} />
<SummaryCard icon={<Package size={18} />} label={<Tooltip text="The total weight of all goods traded, measured in metric tons"><span>Total Volume</span></Tooltip>} value={loading ? '—' : `${(totalVolume / 1000).toFixed(0)}T`} sub="Metric tons traded" color="#2563eb" loading={loading} trend={5} />
<SummaryCard icon={<CreditCard size={18} />} label={<Tooltip text="The total money value of all trades combined"><span>Total Value</span></Tooltip>} value={loading ? '—' : fmtAmount(totalValue)} sub={`In ${currency}`} color="#7c3aed" loading={loading} trend={12} />
<SummaryCard icon={<Package size={18} />} label={<Tooltip text="Trades that have been agreed but not yet completed or delivered"><span>Pending</span></Tooltip>} value={loading ? '—' : (stats?.pending || 0)} sub="Awaiting confirmation" color="#d97706" loading={loading} />
```

- [ ] **Step 4: Add tooltips to table column headers**

Find the array `['ID', 'Date', 'Type', 'Commodity', 'Qty (kg)', 'Unit Price', 'Total', 'Route', 'Carrier', 'Status']` and replace with:

```jsx
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
      { h: 'Carrier',    tip: 'The driver or vehicle that transported the goods' },
      { h: 'Status',     tip: 'Where this trade is in the process — agreed, on the road, or delivered' },
    ].map(({ h, tip }) => (
      <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 'var(--text-2xs)', fontWeight: 'var(--weight-bold)', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>
        <Tooltip text={tip}><span>{h}</span></Tooltip>
      </th>
    ))}
  </tr>
</thead>
```

- [ ] **Step 5: Commit**

```bash
git add client/src/components/TransactionsView.jsx
git commit -m "feat: add plain-language tooltips to Transactions view"
```

---

## Task 5: Add tooltips to PaymentsView

**Files:**
- Modify: `client/src/components/PaymentsView.jsx`

- [ ] **Step 1: Import Tooltip**

```jsx
import Tooltip from './Tooltip';
```

- [ ] **Step 2: Add tooltips to summary cards**

Replace the four `<SummaryCard>` calls:

```jsx
<SummaryCard icon={<CreditCard size={18} />} label={<Tooltip text="The total money received from completed payments"><span>Total Collected</span></Tooltip>} value={loading ? '—' : fmtAmount(stats?.totalCollected || 0)} sub="Completed payments" color="#1f8a3e" loading={loading} trend={6} />
<SummaryCard icon={<CreditCard size={18} />} label={<Tooltip text="Money owed but not yet received"><span>Pending Amount</span></Tooltip>} value={loading ? '—' : fmtAmount(stats?.totalPending || 0)} sub="Awaiting payment" color="#d97706" loading={loading} />
<SummaryCard icon={<CreditCard size={18} />} label={<Tooltip text="The share of all payments made through mobile money services like MTN MoMo or Airtel Money"><span>Mobile Money</span></Tooltip>} value={loading ? '—' : `${mobileMoneyPct}%`} sub="Of all payments" color="#f59e0b" loading={loading} />
<SummaryCard icon={<CreditCard size={18} />} label={<Tooltip text="Out of all payments attempted, how many went through successfully"><span>Success Rate</span></Tooltip>} value={loading ? '—' : `${successRate}%`} sub="Completed / total" color="#2563eb" loading={loading} trend={successRate >= 80 ? 2 : -3} />
```

- [ ] **Step 3: Add tooltips to table column headers**

Find the array `['Payment ID', 'Date', 'Amount', 'Method', 'Provider', 'Status', 'Paid By', 'Reference']` and replace with:

```jsx
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
```

- [ ] **Step 4: Commit**

```bash
git add client/src/components/PaymentsView.jsx
git commit -m "feat: add plain-language tooltips to Payments view"
```

---

## Task 6: Add tooltips to CarriersView

**Files:**
- Modify: `client/src/components/CarriersView.jsx`

- [ ] **Step 1: Import Tooltip**

At the top of `client/src/components/CarriersView.jsx`, add:

```jsx
import Tooltip from './Tooltip';
```

- [ ] **Step 2: Wrap the "Add New Vehicle" button text**

Find the button with text `Add New Vehicle` (or similar). Wrap the label:

```jsx
<Tooltip text="Register a driver and their vehicle so you can assign them to deliveries">
  <span>Add New Vehicle</span>
</Tooltip>
```

- [ ] **Step 3: Add tooltips to the StatusBadge component for the full (non-compact) variant**

Find the `StatusBadge` component. In the non-compact return, wrap the status text with a Tooltip. Add a `STATUS_TIPS` map just above the component:

```jsx
const STATUS_TIPS = {
  'ON THE WAY': 'This driver is currently on the road with a delivery',
  'LOADING':    'This driver is at the market loading goods onto their vehicle',
  'WAITING':    'This driver is available and waiting to be assigned a delivery',
  'UNLOADING':  'This driver has arrived and is unloading the goods',
};
```

Then in the non-compact JSX:

```jsx
return (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
    <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: color.text, flexShrink: 0 }}></span>
    <Tooltip text={STATUS_TIPS[status] || status}>
      <span style={{ fontSize: 'var(--text-2xs)', fontWeight: 'var(--weight-medium)', letterSpacing: 'var(--tracking-wide)', color: 'var(--gray-500)' }}>{status}</span>
    </Tooltip>
  </div>
);
```

- [ ] **Step 4: Add a tooltip to the route map label**

Find the `RouteMap` component's "No route data" fallback and the map container. Above the map div, add a small label with a tooltip. Find where `RouteMap` is rendered in the driver detail panel and add a label above it:

```jsx
<div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--gray-500)', marginBottom: 6 }}>
  <Tooltip text="A map showing where this driver started and where they are headed">
    <span>Active Route</span>
  </Tooltip>
</div>
```

- [ ] **Step 5: Commit**

```bash
git add client/src/components/CarriersView.jsx
git commit -m "feat: add plain-language tooltips to Carriers view"
```

---

## Task 7: Add tooltips to ReportsView

**Files:**
- Modify: `client/src/components/ReportsView.jsx`

- [ ] **Step 1: Import Tooltip**

```jsx
import Tooltip from './Tooltip';
```

- [ ] **Step 2: Add tooltips to summary cards**

Replace the four `<SummaryCard>` calls:

```jsx
<SummaryCard icon={<FileText size={18} />} label={<Tooltip text="The total number of reports generated across all categories"><span>Total Reports</span></Tooltip>} value={loading ? '—' : reports.length} sub="All time" color="#1f8a3e" loading={loading} />
<SummaryCard icon={<FileText size={18} />} label={<Tooltip text="Reports showing how the price of a commodity has changed over time"><span>Price Trends</span></Tooltip>} value={loading ? '—' : countByType('price_trend')} sub="Commodity price analysis" color="#2563eb" loading={loading} />
<SummaryCard icon={<FileText size={18} />} label={<Tooltip text="Reports showing how much of a commodity was bought and sold in a period"><span>Trade Volume</span></Tooltip>} value={loading ? '—' : countByType('trade_volume')} sub="Volume & value reports" color="#7c3aed" loading={loading} />
<SummaryCard icon={<FileText size={18} />} label={<Tooltip text="Reports covering activity at specific markets or across an entire region"><span>Regional</span></Tooltip>} value={loading ? '—' : countByType('regional_summary') + countByType('market_activity')} sub="Activity & summaries" color="#d97706" loading={loading} />
```

- [ ] **Step 3: Add tooltips to the TypeBadge component**

Add a `TYPE_TIPS` map just above the `TypeBadge` component:

```jsx
const TYPE_TIPS = {
  price_trend:      'Shows how the price of a commodity has changed over time',
  trade_volume:     'Shows how much of a commodity was bought and sold in a period',
  market_activity:  'A summary of what happened at a specific market',
  regional_summary: 'An overview of trade across an entire region',
};
```

Update `TypeBadge` to use it:

```jsx
function TypeBadge({ type }) {
  const m = TYPE_META[type] || { label: type, color: '#6b7280', bg: '#f3f4f6' };
  return (
    <Tooltip text={TYPE_TIPS[type] || m.label}>
      <span style={{ fontSize: 'var(--text-2xs)', fontWeight: 'var(--weight-semibold)', color: m.color, backgroundColor: m.bg, padding: '2px 8px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)', whiteSpace: 'nowrap' }}>
        {m.label}
      </span>
    </Tooltip>
  );
}
```

- [ ] **Step 4: Add tooltips to the Period and Region labels inside ReportCard**

In `ReportCard`, find the `Period:` and `Region:` label spans and wrap them:

```jsx
{report.period && (
  <span style={{ fontSize: 'var(--text-xs)', color: '#6b7280' }}>
    <Tooltip text="The time window this report covers">
      <span style={{ fontWeight: 'var(--weight-semibold)' }}>Period:</span>
    </Tooltip>{' '}{report.period}
  </span>
)}
{report.region && report.region !== 'All' && (
  <span style={{ fontSize: 'var(--text-xs)', color: '#6b7280' }}>
    <Tooltip text="Which part of Uganda this report covers">
      <span style={{ fontWeight: 'var(--weight-semibold)' }}>Region:</span>
    </Tooltip>{' '}{report.region}
  </span>
)}
```

- [ ] **Step 5: Commit**

```bash
git add client/src/components/ReportsView.jsx
git commit -m "feat: add plain-language tooltips to Reports view"
```

---

## Task 8: Add tooltips to StatementsView

**Files:**
- Modify: `client/src/components/StatementsView.jsx`

- [ ] **Step 1: Import Tooltip**

```jsx
import Tooltip from './Tooltip';
```

- [ ] **Step 2: Add tooltips to summary cards**

Replace the four `<SummaryCard>` calls:

```jsx
<SummaryCard icon={<FileText size={18} />} label={<Tooltip text="Your account balance at the end of the most recent period"><span>Current Balance</span></Tooltip>} value={loading ? '—' : fmtAmount(latest?.closingBalance || 0)} sub={latest?.period || 'Latest period'} color="#1f8a3e" loading={loading} />
<SummaryCard icon={<ArrowUpRight size={18} />} label={<Tooltip text="Total money received this month — from sales, fees, and other income"><span>Income This Month</span></Tooltip>} value={loading ? '—' : fmtAmount(totalIncomeCurrent)} sub="Revenue collected" color="#2563eb" loading={loading} trend={8} />
<SummaryCard icon={<ArrowDownRight size={18} />} label={<Tooltip text="Total money spent this month — on transport, salaries, and other costs"><span>Expenses This Month</span></Tooltip>} value={loading ? '—' : fmtAmount(totalExpensesCurrent)} sub="Costs incurred" color="#dc2626" loading={loading} />
<SummaryCard icon={<FileText size={18} />} label={<Tooltip text="How many monthly account summaries have been recorded"><span>Statement Periods</span></Tooltip>} value={loading ? '—' : statements.length} sub="Monthly records" color="#7c3aed" loading={loading} />
```

- [ ] **Step 3: Add tooltips to the expanded entry table headers**

In `StatementRow`, find the array `['Date', 'Description', 'Type', 'Amount', 'Balance', 'Reference']` used for `<th>` elements and replace with:

```jsx
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
```

- [ ] **Step 4: Add a tooltip to the expandable period header**

In `StatementRow`, find the period title div and wrap it:

```jsx
<div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-base)', color: 'var(--gray-900)' }}>
  <Tooltip text="Click to expand and see every individual transaction for this month">
    <span>{statement.period}</span>
  </Tooltip>
</div>
```

- [ ] **Step 5: Add tooltips to Income / Expenses column labels in the header row**

Find the Income and Expenses mini-columns in the header row of `StatementRow`:

```jsx
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
```

- [ ] **Step 6: Commit**

```bash
git add client/src/components/StatementsView.jsx
git commit -m "feat: add plain-language tooltips to Statements view"
```

---

## Self-Review Checklist

- [x] **Spec coverage:** clearToExamples script ✓, Tooltip component ✓, all 6 views covered ✓, plain-language wording ✓
- [x] **No placeholders:** All steps contain actual code
- [x] **Type consistency:** `Tooltip` imported and used identically across all tasks; `STATUS_TIPS` defined before `StatusBadge` in Task 6; `TYPE_TIPS` defined before `TypeBadge` in Task 7
- [x] **No test suite** — skip test steps per CLAUDE.md
