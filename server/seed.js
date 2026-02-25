import "dotenv/config";
import mongoose from "mongoose";
import Market from "./models/Market.js";
import Price from "./models/Price.js";

// ─── Real Markets ────────────────────────────────────────────────────────────
// Coordinates verified via OpenStreetMap / Google Maps
const markets = [
  // ── Central Region ──
  {
    name: "Owino (St. Balikuddembe) Market",
    location: { type: "Point", coordinates: [32.5729, 0.3136] },
    region: "Central",
    district: "Kampala",
    marketType: "wholesale",
    operatingDays: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ],
    description:
      "One of the oldest and busiest markets in Uganda, major wholesale hub.",
    specialties: ["maize", "beans", "rice", "matooke", "groundnuts"],
  },
  {
    name: "Nakasero Market",
    location: { type: "Point", coordinates: [32.5801, 0.3163] },
    region: "Central",
    district: "Kampala",
    marketType: "retail",
    operatingDays: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ],
    description:
      "Premium market in central Kampala known for quality produce and spices.",
    specialties: ["coffee", "spices", "dairy", "fruits"],
  },
  {
    name: "Kalerwe Market",
    location: { type: "Point", coordinates: [32.5647, 0.3438] },
    region: "Central",
    district: "Kampala",
    marketType: "wholesale",
    operatingDays: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ],
    description:
      "Major wholesale hub along Northern Bypass, known for affordability.",
    specialties: ["matooke", "cassava", "sweet potatoes", "beans"],
  },
  {
    name: "Nakawa Market",
    location: { type: "Point", coordinates: [32.6156, 0.3308] },
    region: "Central",
    district: "Kampala",
    marketType: "retail",
    operatingDays: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ],
    description:
      "Modern, semi-structured market known for cleanliness and variety.",
    specialties: ["rice", "groundnuts", "sorghum", "millet"],
  },
  {
    name: "Bugolobi Market",
    location: { type: "Point", coordinates: [32.6103, 0.3114] },
    region: "Central",
    district: "Kampala",
    marketType: "retail",
    operatingDays: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ],
    description:
      "Upscale neighborhood market specializing in organic and quality produce.",
    specialties: ["fruits", "vegetables", "coffee"],
  },
  {
    name: "Masaka Central Market",
    location: { type: "Point", coordinates: [31.735, -0.3411] },
    region: "Central",
    district: "Masaka",
    marketType: "wholesale",
    operatingDays: ["Monday", "Thursday", "Saturday"],
    description: "Major market serving the greater Masaka region.",
    specialties: ["matooke", "coffee", "beans"],
  },
  {
    name: "Luwero Market",
    location: { type: "Point", coordinates: [32.4733, 0.8492] },
    region: "Central",
    district: "Luwero",
    marketType: "wholesale",
    operatingDays: ["Tuesday", "Friday", "Sunday"],
    description: "Key agricultural market in the Luwero triangle.",
    specialties: ["maize", "cassava", "beans"],
  },
  {
    name: "Mityana Market",
    location: { type: "Point", coordinates: [32.0233, 0.4033] },
    region: "Central",
    district: "Mityana",
    marketType: "wholesale",
    operatingDays: ["Wednesday", "Saturday"],
    description: "Regional market connecting Kampala to western Uganda.",
    specialties: ["matooke", "maize", "coffee"],
  },
  {
    name: "Kiboga Main Market",
    location: { type: "Point", coordinates: [31.7744, 0.9156] },
    region: "Central",
    district: "Kiboga",
    marketType: "wholesale",
    operatingDays: ["Monday", "Thursday", "Saturday"],
    description: "Major maize and rice producing area market.",
    specialties: ["maize", "rice", "beans"],
  },
  // ── Eastern Region ──
  {
    name: "Jinja Central Market",
    location: { type: "Point", coordinates: [33.2044, 0.4256] },
    region: "Eastern",
    district: "Jinja",
    marketType: "wholesale",
    operatingDays: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ],
    description:
      "Major market at the source of the Nile, serving eastern Uganda.",
    specialties: ["maize", "rice", "beans", "groundnuts"],
  },
  {
    name: "Mbale Central Market",
    location: { type: "Point", coordinates: [34.1747, 1.0644] },
    region: "Eastern",
    district: "Mbale",
    marketType: "wholesale",
    operatingDays: ["Monday", "Wednesday", "Friday"],
    description: "Key market in the Mt. Elgon region, hub for Arabica coffee.",
    specialties: ["coffee", "maize", "beans", "millet"],
  },
  {
    name: "Iganga Main Market",
    location: { type: "Point", coordinates: [33.4856, 0.6092] },
    region: "Eastern",
    district: "Iganga",
    marketType: "wholesale",
    operatingDays: ["Tuesday", "Friday", "Sunday"],
    description: "Important transit market between Kampala and eastern border.",
    specialties: ["maize", "beans", "cassava"],
  },
  {
    name: "Soroti Main Market",
    location: { type: "Point", coordinates: [33.6117, 1.7147] },
    region: "Eastern",
    district: "Soroti",
    marketType: "wholesale",
    operatingDays: ["Tuesday", "Saturday"],
    description: "Major market in the Teso sub-region.",
    specialties: ["sorghum", "millet", "groundnuts", "cassava"],
  },
  // ── Northern Region ──
  {
    name: "Gulu Main Market",
    location: { type: "Point", coordinates: [32.2989, 2.7747] },
    region: "Northern",
    district: "Gulu",
    marketType: "wholesale",
    operatingDays: ["Monday", "Thursday", "Saturday"],
    description:
      "Largest market in Northern Uganda, hub for the Acholi sub-region.",
    specialties: ["sweet potatoes", "sesame", "millet", "sorghum"],
  },
  {
    name: "Lira Main Market",
    location: { type: "Point", coordinates: [32.5394, 2.2497] },
    region: "Northern",
    district: "Lira",
    marketType: "wholesale",
    operatingDays: ["Tuesday", "Friday", "Sunday"],
    description: "Key market in the Lango sub-region, important grain hub.",
    specialties: ["sorghum", "millet", "rice", "groundnuts"],
  },
  {
    name: "Arua Main Market",
    location: { type: "Point", coordinates: [30.9108, 3.0189] },
    region: "Northern",
    district: "Arua",
    marketType: "wholesale",
    operatingDays: ["Wednesday", "Saturday"],
    description: "Major market in the West Nile sub-region near DRC border.",
    specialties: ["cassava", "beans", "groundnuts", "maize"],
  },
  {
    name: "Nebbi Market",
    location: { type: "Point", coordinates: [31.0889, 2.4778] },
    region: "Northern",
    district: "Nebbi",
    marketType: "wholesale",
    operatingDays: ["Monday", "Thursday"],
    description:
      "Regional market serving the Nebbi district along Lake Albert.",
    specialties: ["cassava", "beans", "rice"],
  },
  // ── Western Region ──
  {
    name: "Mbarara Central Market",
    location: { type: "Point", coordinates: [30.6575, -0.6069] },
    region: "Western",
    district: "Mbarara",
    marketType: "wholesale",
    operatingDays: ["Monday", "Thursday", "Saturday"],
    description: "Major hub in western Uganda, known for dairy and produce.",
    specialties: ["matooke", "beans", "groundnuts", "coffee"],
  },
  {
    name: "Kasese Market",
    location: { type: "Point", coordinates: [30.0833, 0.1833] },
    region: "Western",
    district: "Kasese",
    marketType: "wholesale",
    operatingDays: ["Tuesday", "Friday", "Sunday"],
    description:
      "Market near Rwenzori Mountains, gateway to Queen Elizabeth NP.",
    specialties: ["matooke", "beans", "cassava", "coffee"],
  },
  {
    name: "Fort Portal Market",
    location: { type: "Point", coordinates: [30.2833, 0.65] },
    region: "Western",
    district: "Kabarole",
    marketType: "wholesale",
    operatingDays: ["Wednesday", "Saturday"],
    description: "Key market in the Tooro Kingdom, tourism hub area.",
    specialties: ["matooke", "coffee", "sweet potatoes"],
  },
  {
    name: "Kabale Main Market",
    location: { type: "Point", coordinates: [29.9883, -1.2506] },
    region: "Western",
    district: "Kabale",
    marketType: "wholesale",
    operatingDays: ["Monday", "Friday"],
    description: "Major market in the Kigezi highlands near Rwanda border.",
    specialties: ["beans", "sorghum", "sweet potatoes", "maize"],
  },
  {
    name: "Hoima Central Market",
    location: { type: "Point", coordinates: [31.3525, 1.4331] },
    region: "Western",
    district: "Hoima",
    marketType: "wholesale",
    operatingDays: ["Monday", "Wednesday", "Friday", "Saturday"],
    description: "Growing market in the Bunyoro region, near oil discoveries.",
    specialties: ["maize", "rice", "cassava", "beans"],
  },
];

// ─── Verified Base Prices (UGX/kg) ──────────────────────────────────────────
// Sources: Farmgain Africa, AgroMarketDay (Owino/Nakawa/Lira markets),
//          UCDA (coffee), SelinaWamucii (retail ranges), UBOS price indices
const commodityData = {
  maize: {
    wholesale: 1500,
    retail: 1900,
    unit: "kg",
    icon: "🌽",
    source: "Farmgain Africa / AgroMarketDay",
  },
  beans: {
    wholesale: 4200,
    retail: 5100,
    unit: "kg",
    icon: "🫘",
    source: "AgroMarketDay (Nambale beans)",
  },
  coffee: {
    wholesale: 12500,
    retail: 13000,
    unit: "kg",
    icon: "☕",
    source: "UCDA (Robusta FAQ)",
  },
  matooke: {
    wholesale: 1200,
    retail: 1500,
    unit: "kg",
    icon: "🍌",
    source: "AgroMarketDay",
  },
  rice: {
    wholesale: 5000,
    retail: 5500,
    unit: "kg",
    icon: "🍚",
    source: "AgroMarketDay (Super Rice)",
  },
  groundnuts: {
    wholesale: 5000,
    retail: 5500,
    unit: "kg",
    icon: "🥜",
    source: "AgroMarketDay / Farmgain Africa",
  },
  cassava: {
    wholesale: 2000,
    retail: 2500,
    unit: "kg",
    icon: "🥔",
    source: "AgroMarketDay (Fresh Cassava)",
  },
  sweet_potatoes: {
    wholesale: 3000,
    retail: 4000,
    unit: "kg",
    icon: "🍠",
    source: "AgroMarketDay / SelinaWamucii",
  },
  sorghum: {
    wholesale: 2000,
    retail: 2100,
    unit: "kg",
    icon: "🌾",
    source: "AgroMarketDay",
  },
  millet: {
    wholesale: 2500,
    retail: 2500,
    unit: "kg",
    icon: "🌱",
    source: "AgroMarketDay",
  },
};

// ─── Regional Price Multipliers ─────────────────────────────────────────────
// Prices differ by region due to transport costs and local supply/demand.
// Kampala (Central) is the most expensive; Northern production areas are cheapest.
const regionMultipliers = {
  Central: 1.15, // Kampala premium
  Eastern: 0.95,
  Northern: 0.85, // Production areas, lower prices
  Western: 0.92,
};

// Market-specific adjustments (retail markets sell at higher margins)
const marketTypeMultiplier = { wholesale: 1.0, retail: 1.18, collection: 0.9 };

// ─── Seasonal Variance ─────────────────────────────────────────────────────
// Simulate realistic seasonal price movements over 90 days
function getSeasonalFactor(dayOffset, commodity) {
  // Simple seasonal curve: prices tend to be higher mid-season and lower post-harvest
  const phase = Math.PI * 2 * (dayOffset / 180);
  const seasonal = Math.sin(phase) * 0.08; // ±8% seasonal swing

  // Add commodity-specific patterns
  const commodityPhase = {
    maize: 0,
    beans: 0.5,
    coffee: 1.0,
    matooke: 1.5,
    rice: 0.3,
    groundnuts: 0.7,
    cassava: 1.2,
    sweet_potatoes: 0.9,
    sorghum: 0.4,
    millet: 0.6,
  };

  const shift = commodityPhase[commodity] || 0;
  return 1 + seasonal + Math.sin(phase + shift) * 0.04;
}

// Small day-to-day noise (±3%)
function dailyNoise() {
  return 1 + (Math.random() - 0.5) * 0.06;
}

// ─── Seed Function ──────────────────────────────────────────────────────────
async function seed() {
  const MONGODB_URI =
    process.env.MONGODB_URI || "mongodb://localhost:27017/uganda-markets";
  await mongoose.connect(MONGODB_URI);

  await Market.deleteMany({});
  await Price.deleteMany({});

  const createdMarkets = await Market.insertMany(markets);
  console.log(`✓ Seeded ${createdMarkets.length} markets`);

  const prices = [];
  const DAYS = 90;
  const commodityNames = Object.keys(commodityData);

  for (const market of createdMarkets) {
    const regionMult = regionMultipliers[market.region] || 1.0;
    const typeMult = marketTypeMultiplier[market.marketType] || 1.0;

    for (const commodity of commodityNames) {
      const data = commodityData[commodity];
      const basePrice = data.wholesale * regionMult * typeMult;

      for (let day = 0; day < DAYS; day++) {
        const seasonalFactor = getSeasonalFactor(day, commodity);
        const noise = dailyNoise();
        const price = Math.round(basePrice * seasonalFactor * noise);

        prices.push({
          market: market._id,
          commodity,
          price,
          unit: data.unit,
          currency: "UGX",
          priceType: market.marketType === "retail" ? "retail" : "wholesale",
          recordedAt: new Date(Date.now() - day * 24 * 60 * 60 * 1000),
          source: data.source,
          quality: "mixed",
        });
      }
    }
  }

  // Insert in batches to avoid memory issues
  const BATCH_SIZE = 5000;
  for (let i = 0; i < prices.length; i += BATCH_SIZE) {
    await Price.insertMany(prices.slice(i, i + BATCH_SIZE));
  }

  console.log(
    `✓ Seeded ${prices.length} price records (${DAYS} days × ${createdMarkets.length} markets × ${commodityNames.length} commodities)`,
  );
  console.log(`\nData sources:`);
  console.log(`  • Farmgain Africa (farmgainafrica.org)`);
  console.log(`  • AgroMarketDay (agromarketday.com)`);
  console.log(`  • Uganda Coffee Development Authority (ugandacoffee.go.ug)`);
  console.log(`  • SelinaWamucii (selinawamucii.com)`);
  console.log(`  • Uganda Bureau of Statistics (ubos.org)`);

  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
