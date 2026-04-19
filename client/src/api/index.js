// Single import point for the API layer. Consumers should import from
// "@/api" rather than reaching into individual domain files.

export { api, ApiError } from "./client.js";
export * as markets from "./markets.js";
export * as commodities from "./commodities.js";
export * as transactions from "./transactions.js";
export * as payments from "./payments.js";
export * as carriers from "./carriers.js";
export * as assets from "./assets.js";
export * as reports from "./reports.js";
export * as statements from "./statements.js";
export * as insights from "./insights.js";
