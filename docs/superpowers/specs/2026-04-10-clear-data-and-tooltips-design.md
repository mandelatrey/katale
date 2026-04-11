# Design: Clear Seeded Data & Add Smart Tooltips

**Date:** 2026-04-10
**Status:** Approved

---

## Goal

Prepare the app for real user data by:
1. Replacing all seeded/placeholder MongoDB records with one example per collection
2. Adding plain-language tooltips to guide users across all sections

---

## Part 1 — Data Cleanup Script

### What it does
A new script `server/clearToExamples.js` that:
- Drops all records from: Assets, Transactions, Payments, Reports, Statements, Carriers
- Inserts exactly **1 example record** per collection, clearly labelled (e.g. name/title includes "Example —")
- Leaves Markets and Prices untouched (the map continues to work)

### One example per collection

| Collection | Example record |
|---|---|
| Assets | 1 vehicle asset ("Example Vehicle — Toyota Dyna") assigned to a real market |
| Transactions | 1 delivered maize buy transaction between two real markets |
| Payments | 1 completed mobile money payment linked to the example transaction |
| Reports | 1 price trend report for maize |
| Statements | 1 statement period (current month) with 2 entries (1 income, 1 expense) |
| Carriers | 1 carrier with an active route between two Ugandan markets |

### How to run
```bash
node server/clearToExamples.js
```

---

## Part 2 — Smart Tooltips

### Component
A small `Tooltip` component in `client/src/components/Tooltip.jsx`:
- CSS-only, no library dependencies
- Shows on hover, appears above the trigger element
- Dark background (#111827), white text, 11px, rounded
- Arrow pointing down toward the trigger
- Max-width 220px, wraps naturally

### Tooltip placement

#### Assets
| Element | Tooltip text |
|---|---|
| Asset Name column | "The name of the vehicle, warehouse, or piece of equipment" |
| Type column | "What kind of asset this is — vehicle, warehouse, or equipment" |
| Status column | "Whether this asset is currently being used, being repaired, sitting idle, or retired" |
| Location column | "Which market this asset is based at" |
| Assigned To column | "The person responsible for this asset" |
| Capacity column | "How much this asset can carry or store" |
| Value column | "What this asset is worth" |
| Total Assets card | "The total number of vehicles, warehouses, and equipment you've added" |

#### Transactions
| Element | Tooltip text |
|---|---|
| New Transaction button | "Record a new trade — buying or selling a commodity between markets" |
| Type column | "Whether you bought or sold the commodity" |
| Commodity column | "The crop or product being traded" |
| Qty column | "How many kilograms were traded" |
| Unit Price column | "The price per kilogram at the time of the trade" |
| Total column | "The total money value of this trade" |
| Route column | "Where the goods came from and where they went" |
| Carrier column | "The driver or vehicle that transported the goods" |
| Status column | "Where this trade is in the process — from agreed, to on the road, to delivered" |
| Total Volume card | "The total weight of all goods traded, in metric tons" |
| Pending card | "Trades that have been agreed but not yet completed" |

#### Payments
| Element | Tooltip text |
|---|---|
| Amount column | "How much money was paid" |
| Method column | "How the payment was made — mobile money, bank, cash, or cheque" |
| Provider column | "The specific service used, e.g. MTN MoMo or Stanbic Bank" |
| Status column | "Whether the payment went through, is still waiting, or had a problem" |
| Paid By column | "Who made the payment" |
| Reference column | "A unique code to identify this payment in your records" |
| Mobile Money card | "The share of payments made through mobile money services" |
| Success Rate card | "Out of all payments attempted, how many went through successfully" |

#### Carriers
| Element | Tooltip text |
|---|---|
| Add New Vehicle button | "Register a driver and their vehicle so you can assign them to deliveries" |
| Status badge (ON THE WAY) | "This driver is currently on the road with a delivery" |
| Status badge (LOADING) | "This driver is at the market loading goods onto their vehicle" |
| Status badge (WAITING) | "This driver is available and waiting to be assigned a delivery" |
| Status badge (UNLOADING) | "This driver has arrived and is unloading the goods" |
| Route map | "A map showing where this driver started and where they are headed" |

#### Reports
| Element | Tooltip text |
|---|---|
| Price Trend type | "Shows how the price of a commodity has changed over time" |
| Trade Volume type | "Shows how much of a commodity was bought and sold in a period" |
| Market Activity type | "A summary of what happened at a specific market" |
| Regional Summary type | "An overview of trade across an entire region" |
| Period field | "The time window this report covers" |
| Region field | "Which part of Uganda this report is about" |

#### Statements
| Element | Tooltip text |
|---|---|
| Period header | "Click to expand and see all individual transactions for this month" |
| Income column | "Money coming in — sales, fees, and other revenue" |
| Expenses column | "Money going out — costs, salaries, maintenance, and other outgoings" |
| Net column | "Income minus expenses — positive means you made money this period" |
| Current Balance card | "Your account balance at the end of the most recent period" |
| Income This Month card | "Total money received in the current statement period" |
| Expenses This Month card | "Total money spent in the current statement period" |

---

## Constraints

- Tooltip component must use inline styles only (no Tailwind class names on the tooltip itself, consistent with the rest of the codebase)
- No tooltip library — keeps bundle small
- Tooltips degrade gracefully on mobile (touch devices don't show hover tooltips — that's fine)
- Column header tooltips wrap the `<th>` text in a `<Tooltip>` without changing layout
