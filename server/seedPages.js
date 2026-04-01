/**
 * seedPages.js — seeds Assets, Transactions, Payments, Reports, Statements
 * Must run AFTER seed.js (depends on Market documents existing)
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

const COMMODITIES = [
  "maize", "beans", "coffee", "matooke", "rice",
  "groundnuts", "cassava", "sweet_potatoes", "sorghum", "millet",
];

// Base prices per commodity (UGX per kg, wholesale)
const BASE_PRICES = {
  maize: 1200, beans: 3500, coffee: 8500, matooke: 800, rice: 3200,
  groundnuts: 5500, cassava: 600, sweet_potatoes: 700, sorghum: 1100, millet: 1400,
};

const UGANDAN_NAMES = [
  "Okello James", "Mugisha Samuel", "Akello Grace", "Ochieng Patrick", "Ssali Robert",
  "Byamukama David", "Tumusiime Moses", "Wasswa Joseph", "Nakato Sarah", "Kizza Emmanuel",
  "Amony Florence", "Nsubuga Peter", "Achen Christine", "Kaggwa Brian", "Atim Doreen",
  "Byaruhanga Fred", "Namutebi Joan", "Otim Kenneth", "Namukasa Lydia", "Lubega Martin",
];

const VEHICLE_MODELS = [
  "Toyota Dyna", "Isuzu NQR", "Mercedes-Benz Sprinter", "Volkswagen Transporter",
  "Volvo FL", "Mercedes-Benz Actros", "Isuzu ELF", "Mitsubishi Canter",
  "Toyota Land Cruiser", "Ford Transit",
];

const PAYMENT_PROVIDERS = {
  mobile_money: ["MTN MoMo", "Airtel Money"],
  bank_transfer: ["Stanbic Bank", "DFCU Bank", "Centenary Bank", "Equity Bank", "Absa Uganda"],
  cash: ["Cash"],
  cheque: ["Stanbic Bank", "DFCU Bank", "Centenary Bank"],
};

function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function formatUGX(n) {
  return Math.round(n);
}

async function seed() {
  await mongoose.connect(MONGODB_URI);

  const markets = await Market.find().lean();
  if (!markets.length) {
    console.error("No markets found. Run seed.js first.");
    process.exit(1);
  }

  // ── Clear collections ──────────────────────────────────────────────────────
  await Promise.all([
    Asset.deleteMany({}),
    Transaction.deleteMany({}),
    Payment.deleteMany({}),
    Report.deleteMany({}),
    Statement.deleteMany({}),
    Carrier.deleteMany({}),
  ]);

  // ── ASSETS ─────────────────────────────────────────────────────────────────
  const assetDocs = [];

  // Vehicles
  for (let i = 1; i <= 18; i++) {
    const market = rand(markets);
    assetDocs.push({
      name: `${rand(VEHICLE_MODELS)} #${String(i).padStart(3, "0")}`,
      type: "vehicle",
      status: rand(["active", "active", "active", "maintenance", "idle"]),
      market: market._id,
      region: market.region,
      assignedTo: rand(UGANDAN_NAMES),
      capacity: rand([1500, 2000, 2500, 3000, 5000, 8000, 14000]),
      value: randInt(25_000_000, 120_000_000),
      acquiredAt: daysAgo(randInt(30, 730)),
    });
  }

  // Warehouses
  const warehouseRegions = ["Central", "Eastern", "Northern", "Western"];
  const warehouseNames = [
    "Kampala Central Storage", "Jinja Grain Depot", "Gulu Northern Hub",
    "Mbarara Western Silo", "Mbale Eastern Warehouse", "Lira Distribution Center",
    "Kasese Produce Store", "Masaka Regional Depot",
  ];
  for (let i = 0; i < warehouseNames.length; i++) {
    const market = rand(markets);
    assetDocs.push({
      name: warehouseNames[i],
      type: "warehouse",
      status: rand(["active", "active", "active", "maintenance"]),
      market: market._id,
      region: rand(warehouseRegions),
      assignedTo: rand(UGANDAN_NAMES),
      capacity: randInt(50, 500), // metric tons
      value: randInt(80_000_000, 500_000_000),
      acquiredAt: daysAgo(randInt(180, 1460)),
    });
  }

  // Equipment
  const equipmentNames = [
    "Weighbridge Scale A", "Grain Moisture Meter", "Sorting Machine #1",
    "Packaging Unit B", "Forklift #2", "Weighbridge Scale B",
  ];
  for (const name of equipmentNames) {
    const market = rand(markets);
    assetDocs.push({
      name,
      type: "equipment",
      status: rand(["active", "active", "maintenance", "idle"]),
      market: market._id,
      region: market.region,
      assignedTo: rand(UGANDAN_NAMES),
      capacity: null,
      value: randInt(5_000_000, 40_000_000),
      acquiredAt: daysAgo(randInt(60, 900)),
    });
  }

  await Asset.insertMany(assetDocs);

  // ── TRANSACTIONS ───────────────────────────────────────────────────────────
  const txnDocs = [];
  const STATUSES = ["pending", "confirmed", "in_transit", "delivered", "delivered", "delivered", "cancelled"];

  for (let i = 1; i <= 200; i++) {
    const commodity = rand(COMMODITIES);
    const basePrice = BASE_PRICES[commodity];
    const noise = 1 + (Math.random() * 0.3 - 0.15);
    const unitPrice = formatUGX(basePrice * noise);
    const quantity = randInt(100, 5000); // kg
    const fromMarket = rand(markets);
    let toMarket = rand(markets);
    while (toMarket._id.toString() === fromMarket._id.toString()) {
      toMarket = rand(markets);
    }

    txnDocs.push({
      transactionId: `TXN-${String(i).padStart(5, "0")}`,
      type: rand(["buy", "sell"]),
      commodity,
      quantity,
      unitPrice,
      totalAmount: formatUGX(unitPrice * quantity),
      currency: "UGX",
      fromMarket: fromMarket._id,
      toMarket: toMarket._id,
      buyer: rand(UGANDAN_NAMES),
      seller: rand(UGANDAN_NAMES),
      status: rand(STATUSES),
      date: daysAgo(randInt(0, 89)),
    });
  }

  const txnInserted = await Transaction.insertMany(txnDocs);

  // ── PAYMENTS ───────────────────────────────────────────────────────────────
  const paymentDocs = [];
  const METHODS = ["mobile_money", "mobile_money", "bank_transfer", "cash", "cheque"];
  const PAY_STATUSES = ["completed", "completed", "completed", "pending", "failed", "refunded"];

  // Most delivered transactions get a payment
  const deliveredTxns = txnInserted.filter(t => t.status === "delivered" || t.status === "confirmed");
  for (let i = 0; i < deliveredTxns.length; i++) {
    const txn = deliveredTxns[i];
    const method = rand(METHODS);
    const provider = rand(PAYMENT_PROVIDERS[method]);
    paymentDocs.push({
      paymentId: `PAY-${String(i + 1).padStart(5, "0")}`,
      transaction: txn._id,
      amount: txn.totalAmount,
      currency: "UGX",
      method,
      provider,
      status: rand(PAY_STATUSES),
      paidBy: rand(UGANDAN_NAMES),
      paidTo: rand(UGANDAN_NAMES),
      reference: `REF${randInt(100000, 999999)}`,
      date: new Date(txn.date.getTime() + randInt(1, 3) * 86400000),
    });
  }

  // Add a few standalone pending payments
  for (let i = 0; i < 10; i++) {
    const method = rand(METHODS);
    const provider = rand(PAYMENT_PROVIDERS[method]);
    paymentDocs.push({
      paymentId: `PAY-${String(deliveredTxns.length + i + 1).padStart(5, "0")}`,
      transaction: txnInserted[randInt(0, txnInserted.length - 1)]._id,
      amount: formatUGX(randInt(500_000, 5_000_000)),
      currency: "UGX",
      method,
      provider,
      status: "pending",
      paidBy: rand(UGANDAN_NAMES),
      paidTo: rand(UGANDAN_NAMES),
      reference: `REF${randInt(100000, 999999)}`,
      date: daysAgo(randInt(0, 14)),
    });
  }

  await Payment.insertMany(paymentDocs);

  // ── REPORTS ────────────────────────────────────────────────────────────────
  const reportDocs = [
    {
      reportId: "RPT-001", title: "Maize Price Trend Q1 2026", type: "price_trend",
      period: "Q1 2026", region: "All", commodity: "maize",
      summary: "Maize prices rose 12% in Q1 2026, driven by increased demand from Eastern Uganda and reduced supply following dry spell in Northern districts.",
      data: { avgPrice: 1320, minPrice: 980, maxPrice: 1650, dataPoints: 450 },
      generatedAt: daysAgo(5),
    },
    {
      reportId: "RPT-002", title: "Beans Trade Volume — February 2026", type: "trade_volume",
      period: "February 2026", region: "Central", commodity: "beans",
      summary: "Total beans traded in Central Uganda reached 480 metric tons in February, a 9% increase from January. Kampala market accounted for 42% of volume.",
      data: { totalVolume: 480000, totalValue: 1_680_000_000, transactions: 64 },
      generatedAt: daysAgo(28),
    },
    {
      reportId: "RPT-003", title: "Kampala Market Activity Report", type: "market_activity",
      period: "March 2026", region: "Central", commodity: null,
      summary: "Kampala Market recorded 89 transactions in March with combined value of UGX 3.2B. Top commodities: coffee, beans, rice.",
      data: { transactions: 89, totalValue: 3_200_000_000, topCommodities: ["coffee", "beans", "rice"] },
      generatedAt: daysAgo(1),
    },
    {
      reportId: "RPT-004", title: "Northern Uganda Regional Summary Q4 2025", type: "regional_summary",
      period: "Q4 2025", region: "Northern", commodity: null,
      summary: "Northern markets saw millet and sorghum prices stabilise after 2 quarters of volatility. Gulu and Lira markets showed 15% volume growth.",
      data: { markets: 4, avgGrowth: 15, dominantCommodities: ["millet", "sorghum", "cassava"] },
      generatedAt: daysAgo(45),
    },
    {
      reportId: "RPT-005", title: "Coffee Export Price Trends 2025", type: "price_trend",
      period: "2025 Annual", region: "Western", commodity: "coffee",
      summary: "Arabica coffee prices from Western Uganda markets averaged UGX 9,200/kg in 2025, a 7% YoY increase. Fort Portal market led with highest quality grades.",
      data: { avgPrice: 9200, peakMonth: "October", peakPrice: 10_500, lowestPrice: 7_800 },
      generatedAt: daysAgo(60),
    },
    {
      reportId: "RPT-006", title: "Rice Import vs Local Supply Comparison", type: "trade_volume",
      period: "Q1 2026", region: "Eastern", commodity: "rice",
      summary: "Local rice supply from Eastern Uganda markets met 68% of regional demand in Q1 2026. Jinja market saw 22% growth in local rice transactions.",
      data: { localSupplyShare: 68, importShare: 32, totalVolume: 320000 },
      generatedAt: daysAgo(10),
    },
    {
      reportId: "RPT-007", title: "Groundnuts Price Volatility Report", type: "price_trend",
      period: "Jan–Mar 2026", region: "All", commodity: "groundnuts",
      summary: "Groundnut prices fluctuated between UGX 4,800–6,200/kg due to weather disruptions. Western markets experienced highest variance.",
      data: { avgPrice: 5500, variance: 22, minPrice: 4800, maxPrice: 6200 },
      generatedAt: daysAgo(15),
    },
    {
      reportId: "RPT-008", title: "Weekly Market Activity Digest — Week 13", type: "market_activity",
      period: "Week 13, 2026", region: "All", commodity: null,
      summary: "24 markets active. 312 transactions recorded. Highest activity in Central (112 txns). Maize dominated with 38% of total volume.",
      data: { activeMarkets: 24, transactions: 312, topRegion: "Central", topCommodity: "maize" },
      generatedAt: daysAgo(3),
    },
    {
      reportId: "RPT-009", title: "Eastern Uganda Cassava Market Review", type: "regional_summary",
      period: "Q1 2026", region: "Eastern", commodity: "cassava",
      summary: "Cassava prices in Eastern Uganda remained stable at UGX 580–650/kg. Iganga and Mbale markets saw increased activity from processing factories.",
      data: { avgPrice: 615, stability: "high", growthRate: 4 },
      generatedAt: daysAgo(20),
    },
    {
      reportId: "RPT-010", title: "Sweet Potatoes Seasonal Analysis", type: "price_trend",
      period: "Jan–Mar 2026", region: "Western", commodity: "sweet_potatoes",
      summary: "Sweet potato prices peaked at UGX 950/kg in February before seasonal harvest brought prices to UGX 620/kg by end of March.",
      data: { peakPrice: 950, endPrice: 620, peakMonth: "February", season: "short rains" },
      generatedAt: daysAgo(7),
    },
  ];

  // Add more reports to reach ~20
  const extraReports = [
    { type: "market_activity", region: "Western", commodity: null, period: "Feb 2026" },
    { type: "regional_summary", region: "Eastern", commodity: null, period: "Q4 2025" },
    { type: "trade_volume", region: "Northern", commodity: "sorghum", period: "Q1 2026" },
    { type: "price_trend", region: "Central", commodity: "matooke", period: "Mar 2026" },
    { type: "trade_volume", region: "All", commodity: "beans", period: "Q1 2026" },
    { type: "regional_summary", region: "Central", commodity: null, period: "2025 Annual" },
    { type: "price_trend", region: "Northern", commodity: "millet", period: "Q1 2026" },
    { type: "market_activity", region: "Eastern", commodity: null, period: "Week 12, 2026" },
    { type: "trade_volume", region: "Western", commodity: "coffee", period: "Feb 2026" },
    { type: "regional_summary", region: "Northern", commodity: null, period: "Q1 2026" },
  ];

  const titleMap = {
    price_trend: (r) => `${r.commodity ? r.commodity.charAt(0).toUpperCase() + r.commodity.slice(1) : r.region} Price Analysis — ${r.period}`,
    trade_volume: (r) => `${r.region} Trade Volume Report — ${r.period}`,
    market_activity: (r) => `${r.region} Market Activity — ${r.period}`,
    regional_summary: (r) => `${r.region} Regional Summary — ${r.period}`,
  };

  extraReports.forEach((r, i) => {
    reportDocs.push({
      reportId: `RPT-${String(reportDocs.length + 1).padStart(3, "0")}`,
      title: titleMap[r.type](r),
      type: r.type,
      period: r.period,
      region: r.region,
      commodity: r.commodity,
      summary: `Auto-generated ${r.type.replace("_", " ")} report for ${r.region} region covering ${r.period}.`,
      data: { dataPoints: randInt(50, 500) },
      generatedAt: daysAgo(randInt(1, 90)),
    });
  });

  await Report.insertMany(reportDocs);

  // ── STATEMENTS ─────────────────────────────────────────────────────────────
  // Generate 6 monthly statements (Oct 2025 – Mar 2026)
  const months = [
    { period: "October 2025", year: 2025, month: 9 },
    { period: "November 2025", year: 2025, month: 10 },
    { period: "December 2025", year: 2025, month: 11 },
    { period: "January 2026", year: 2026, month: 0 },
    { period: "February 2026", year: 2026, month: 1 },
    { period: "March 2026", year: 2026, month: 2 },
  ];

  const statementDocs = [];
  let runningBalance = 45_000_000; // starting balance UGX

  for (let mi = 0; mi < months.length; mi++) {
    const { period, year, month } = months[mi];
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);
    const openingBalance = runningBalance;

    // Generate 8–14 entries per month
    const entries = [];
    const entryCount = randInt(8, 14);
    let balance = openingBalance;

    for (let ei = 0; ei < entryCount; ei++) {
      const isIncome = Math.random() > 0.4;
      const amount = isIncome
        ? randInt(5_000_000, 80_000_000)
        : randInt(2_000_000, 30_000_000);
      balance += isIncome ? amount : -amount;

      const incomeDescriptions = [
        "Payment received — maize sale", "Coffee export proceeds", "Beans trade settlement",
        "Rice market commission", "Brokerage fee", "Warehouse rental income",
        "Transport service fee", "Market facilitation income",
      ];
      const expenseDescriptions = [
        "Vehicle maintenance", "Warehouse rent", "Staff salaries", "Fuel expenses",
        "Equipment repair", "Market fees", "Insurance premium", "Office supplies",
      ];

      const dayOfMonth = randInt(1, 28);
      const entryDate = new Date(year, month, dayOfMonth);

      entries.push({
        date: entryDate,
        description: isIncome ? rand(incomeDescriptions) : rand(expenseDescriptions),
        type: isIncome ? "income" : "expense",
        amount,
        balance,
        reference: `REF${randInt(100000, 999999)}`,
      });
    }

    // Sort entries by date
    entries.sort((a, b) => a.date - b.date);
    // Recalculate running balances after sorting
    let bal = openingBalance;
    for (const e of entries) {
      bal += e.type === "income" ? e.amount : -e.amount;
      e.balance = bal;
    }

    const totalIncome = entries.filter(e => e.type === "income").reduce((s, e) => s + e.amount, 0);
    const totalExpenses = entries.filter(e => e.type === "expense").reduce((s, e) => s + e.amount, 0);
    runningBalance = openingBalance + totalIncome - totalExpenses;

    statementDocs.push({
      statementId: `STMT-${String(mi + 1).padStart(3, "0")}`,
      period,
      startDate,
      endDate,
      openingBalance,
      closingBalance: runningBalance,
      totalIncome,
      totalExpenses,
      currency: "UGX",
      entries,
    });
  }

  await Statement.insertMany(statementDocs);

  // ── CARRIERS ───────────────────────────────────────────────────────────────
  const UGANDAN_ROUTES_COORDS = [
    { from: 'Kampala Central Market', to: 'Gulu Main Market',       distKm: 338, packages: 124, fromCoords: [32.5825, 0.3167], toCoords: [32.2975, 2.7745] },
    { from: 'Owino Market, Kampala',  to: 'Mbale Produce Market',   distKm: 217, packages: 86,  fromCoords: [32.5616, 0.3070], toCoords: [34.1750, 1.0800] },
    { from: 'Nakasero Market',        to: 'Mbarara Central Market',  distKm: 272, packages: 107, fromCoords: [32.5814, 0.3204], toCoords: [30.6588, -0.6067] },
    { from: 'St. Balikuddembe Market',to: 'Lira Market',             distKm: 342, packages: 93,  fromCoords: [32.5600, 0.3098], toCoords: [32.9000, 2.2499] },
    { from: 'Kalerwe Market',         to: 'Masaka Main Market',      distKm: 138, packages: 71,  fromCoords: [32.5749, 0.3389], toCoords: [31.7320, -0.3350] },
    { from: 'Wandegeya Market',       to: 'Jinja Main Market',       distKm: 81,  packages: 58,  fromCoords: [32.5748, 0.3394], toCoords: [33.2042, 0.4244] },
    { from: 'Bugolobi Market',        to: 'Fort Portal Market',      distKm: 301, packages: 115, fromCoords: [32.6144, 0.3222], toCoords: [30.2758, 0.6579] },
    { from: 'Nakawa Market',          to: 'Kabale Market',           distKm: 413, packages: 99,  fromCoords: [32.6267, 0.3294], toCoords: [29.9886, -1.2529] },
    { from: 'Kikuubo Market',         to: 'Arua Market',             distKm: 479, packages: 132, fromCoords: [32.5771, 0.3153], toCoords: [30.9109, 3.0248] },
    { from: 'Ntinda Market',          to: 'Soroti Market',           distKm: 315, packages: 88,  fromCoords: [32.6103, 0.3500], toCoords: [33.6108, 1.7153] },
    { from: 'Nateete Market',         to: 'Tororo Market',           distKm: 193, packages: 76,  fromCoords: [32.5430, 0.2980], toCoords: [34.1800, 0.6927] },
  ];

  const carrierDocs = [
    { name: 'Okello James',    phone: '+256 772 481 203', role: 'driver', status: 'ON THE WAY', category: 'Favorites', vehicleModel: 'Volkswagen Transporter',  vehicleType: 'Van',   specs: { payload: '2,885 lbs',  volume: '353,937 in³',   length: '117 in', width: '67 in',  plate: 'UAU 823F' } },
    { name: 'Mugisha Samuel',  phone: '+256 701 334 556', role: 'driver', status: 'ON THE WAY', category: 'Favorites', vehicleModel: 'Mercedes-Benz Sprinter',  vehicleType: 'Van',   specs: { payload: '3,814 lbs',  volume: '319,000 in³',   length: '144 in', width: '70 in',  plate: 'UBD 014K' } },
    { name: 'Akello Grace',    phone: '+256 755 920 178', role: 'driver', status: 'LOADING',    category: 'Favorites', vehicleModel: 'Isuzu NQR',               vehicleType: 'Van',   specs: { payload: '2,885 lbs',  volume: '353,937 in³',   length: '117 in', width: '67 in',  plate: 'UBG 447H' } },
    { name: 'Ochieng Patrick', phone: '+256 782 645 091', role: 'driver', status: 'WAITING',    category: 'Favorites', vehicleModel: 'Toyota Dyna',             vehicleType: 'Van',   specs: { payload: '2,500 lbs',  volume: '250,000 in³',   length: '111 in', width: '65 in',  plate: 'UBH 339J' } },
    { name: 'Ssali Robert',    phone: '+256 703 117 462', role: 'driver', status: 'ON THE WAY', category: 'Trucks',    vehicleModel: 'Volvo FL',                vehicleType: 'Truck', specs: { payload: '14,000 lbs', volume: '1,200,000 in³', length: '240 in', width: '96 in',  plate: 'UCA 551M' } },
    { name: 'Byamukama David', phone: '+256 776 803 374', role: 'driver', status: 'WAITING',    category: 'Trucks',    vehicleModel: 'Mercedes-Benz Actros',    vehicleType: 'Truck', specs: { payload: '16,000 lbs', volume: '1,400,000 in³', length: '260 in', width: '96 in',  plate: 'UCB 706N' } },
    { name: 'Tumusiime Moses', phone: '+256 752 290 815', role: 'driver', status: 'ON THE WAY', category: 'Trucks',    vehicleModel: 'Volvo FL',                vehicleType: 'Truck', specs: { payload: '14,000 lbs', volume: '1,200,000 in³', length: '240 in', width: '96 in',  plate: 'UCC 182P' } },
    { name: 'Wasswa Joseph',   phone: '+256 714 563 047', role: 'driver', status: 'UNLOADING',  category: 'Trucks',    vehicleModel: 'Volvo FH',                vehicleType: 'Truck', specs: { payload: '44,000 lbs', volume: '2,500,000 in³', length: '500 in', width: '102 in', plate: 'UCD 073Q' } },
    { name: 'Nakato Sarah',    phone: '+256 783 451 629', role: 'driver', status: 'LOADING',    category: 'Vans',      vehicleModel: 'Mitsubishi Canter',       vehicleType: 'Van',   specs: { payload: '2,885 lbs',  volume: '353,937 in³',   length: '117 in', width: '67 in',  plate: 'UCF 920R' } },
    { name: 'Kizza Emmanuel',  phone: '+256 701 738 254', role: 'driver', status: 'ON THE WAY', category: 'Vans',      vehicleModel: 'Isuzu ELF',               vehicleType: 'Van',   specs: { payload: '3,814 lbs',  volume: '319,000 in³',   length: '144 in', width: '70 in',  plate: 'UCG 261S' } },
    { name: 'Amony Florence',  phone: '+256 775 094 483', role: 'driver', status: 'ON THE WAY', category: 'Vans',      vehicleModel: 'Toyota Dyna',             vehicleType: 'Van',   specs: { payload: '2,500 lbs',  volume: '250,000 in³',   length: '111 in', width: '65 in',  plate: 'UCH 514T' } },
  ].map((c, i) => ({
    ...c,
    activeRoute: UGANDAN_ROUTES_COORDS[i % UGANDAN_ROUTES_COORDS.length],
    historyRoutes: [
      UGANDAN_ROUTES_COORDS[(i + 1) % UGANDAN_ROUTES_COORDS.length],
      UGANDAN_ROUTES_COORDS[(i + 3) % UGANDAN_ROUTES_COORDS.length],
    ],
  }));

  await Carrier.insertMany(carrierDocs);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
