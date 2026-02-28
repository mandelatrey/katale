import "dotenv/config";
import mongoose from "mongoose";
import Insight from "./models/Insight.js";

const insightsData = [
  {
    title: "Staple Foods in Uganda",
    price: "USD 2,450",
    summary:
      "Demand for staple foods in Uganda continues to grow, driven by population expansion, urbanisation, and rising household incomes. Consumers still prefer affordable options, including unpackaged and small-pack products. Rice producer Tilda Uganda Ltd is the largest player.",
    source: "Euromonitor",
  },
  {
    title: "PEST Analysis: Uganda",
    price: "USD 350",
    summary:
      "Economic momentum is one of the best in the region amidst controlled inflation and investment in key sectors. However, public debt is sustainable but economic freedom is limited. Internet use is among the lowest in the region.",
    source: "Euromonitor",
  },
  {
    title: "Cooking Ingredients and Meals in Uganda",
    price: "USD 2,450",
    summary:
      "Supported by urbanisation and population growth. Rising prices shaped demand as consumers prioritised lower-priced options. Government investment in local production, especially edible oils, is noted.",
    source: "Euromonitor",
  },
  {
    title: "Dairy Products and Alternatives in Uganda",
    price: "USD 2,300",
    summary:
      "Sector remains a cornerstone of Uganda’s Vision 2040. Growth fuelled by government targeted initiatives, including cold chain facilities and milk collection infrastructure.",
    source: "Euromonitor",
  },
  {
    title: "Households: Uganda",
    price: "USD 350",
    summary:
      "Couples with children are the leading household type. Birth rates are declining due to urbanisation. Single-person households are the fastest-growing segment.",
    source: "Euromonitor",
  },
  {
    title: "Consumer Health in Uganda",
    price: "USD 2,750",
    summary:
      "Growth supported by urbanisation and the spending power of affluent consumers. Rural regions often rely on traditional or natural medicine due to affordability issues.",
    source: "Euromonitor",
  },
  {
    title: "Business Dynamics: Uganda",
    price: "USD 350",
    summary:
      "Uganda ranked 140th globally in the Index of Economic Freedom. Progress in business registration and FDI is hindered by corruption and judicial effectiveness issues.",
    source: "Euromonitor",
  },
  {
    title: "Economy, Finance and Trade: Uganda",
    price: "USD 350",
    summary:
      "Economy grew by 6.1% in 2024. Focus on oil development and fiscal reforms is expected to support future growth.",
    source: "Euromonitor",
  },
  {
    title: "Income and Expenditure: Uganda",
    price: "USD 350",
    summary:
      "Significant decline in per capita disposable income recently, but the government's 2024/2025 budget forecasts a 28% increase by 2029 through the Parish Development Model.",
    source: "Euromonitor",
  },
  {
    title: "Snacks in Uganda",
    price: "USD 2,450",
    summary:
      "Growth supported by local manufacturers and government policies aiming to add value to raw materials before export.",
    source: "Euromonitor",
  },
  {
    title: "Alcoholic Drinks in Uganda",
    price: "USD 2,450",
    summary:
      "Strong growth in total volume terms in 2024, backed by stable inflation and increasing disposable income, despite rising prices in spirits.",
    source: "Euromonitor",
  },
  {
    title: "Tobacco in Uganda",
    price: "USD 2,450",
    summary:
      'Detailed analysis of the tobacco industry "big picture" in Uganda for 2024.',
    source: "Euromonitor",
  },
  {
    title: "Beauty and Personal Care in Uganda",
    price: "USD 2,750",
    summary:
      "Personal care led the industry. Growing demand for natural and locally sourced beauty products driven by sustainability concerns.",
    source: "Euromonitor",
  },
  {
    title: "Tissue and Hygiene in Uganda",
    price: "USD 2,750",
    summary:
      "Growth supported by increasing product availability through importers and distributors, despite challenges from import taxes.",
    source: "Euromonitor",
  },
  {
    title: "Uganda in 2040: The Future Demographic",
    price: "USD 1,100",
    summary:
      "Population predicted to stand at 72 million by 2040. Young adults (18-29) will represent the largest portion of the population.",
    source: "Euromonitor",
  },
  {
    title: "Home Care in Uganda",
    price: "USD 2,750",
    summary:
      "Fast retail volume growth in 2024 due to heightened hygiene standards following disease outbreaks. Distribution is heavily focused on urban areas.",
    source: "Euromonitor",
  },
  {
    title:
      "Retail in Frontier Markets in Sub-Saharan Africa: Three Key Trends for 2024",
    price: "USD 2,450",
    summary:
      "Covers the retail sector in frontier markets including Uganda, exploring key trends across the region.",
    source: "Euromonitor",
  },
  {
    title: "Hot Drinks in Uganda",
    price: "USD 2,450",
    summary:
      "Uganda is a major exporter of tea and coffee. Unpackaged tea remains the only affordable option for low-income consumers.",
    source: "Euromonitor",
  },
  {
    title: "Soft Drinks in Uganda",
    price: "USD 2,450",
    summary:
      "Recorded strong growth in 2024 due to population growth and urbanisation. Players kept prices stable to avoid losing sales to competitors.",
    source: "Euromonitor",
  },
  {
    title: "Uganda Cities Review",
    price: "USD 800",
    summary:
      "Masaka and Lugazi identified as the most economically vibrant cities, with Masaka expected to see the fastest future growth.",
    source: "Euromonitor",
  },
];

async function seed() {
  const MONGODB_URI =
    process.env.MONGODB_URI || "mongodb://localhost:27017/uganda-markets";
  await mongoose.connect(MONGODB_URI);

  await Insight.deleteMany({ source: "Euromonitor" });

  const createdInsights = await Insight.insertMany(insightsData);
  console.log(`✓ Seeded ${createdInsights.length} insights`);

  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
