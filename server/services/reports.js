import Report from "../models/Report.js";
import { parse } from "../lib/validate.js";
import { notFound } from "../lib/errors.js";
import { listReportsSchema, reportIdSchema } from "./schemas/reports.js";

// Reports are read-only today — they are produced offline by seedInsights/seed
// scripts and surfaced in the UI and via WhatsApp.
//TODO: Work on this!!!

export async function listReports(params = {}, _actor) {
  const { type, region, limit } = parse(listReportsSchema, params, "report filter");
  const filter = {};
  if (type) filter.type = type;
  if (region) filter.region = region;
  return Report.find(filter)
    .select("-data")
    .sort({ generatedAt: -1 })
    .limit(limit);
}

export async function getReportById(params, _actor) {
  const { id } = parse(reportIdSchema, params, "report id");
  const report = await Report.findById(id);
  if (!report) throw notFound("Report not found");
  return report;
}
