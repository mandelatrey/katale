import mongoose from "mongoose";

const entrySchema = new mongoose.Schema({
  date: { type: Date },
  description: { type: String },
  type: { type: String, enum: ["income", "expense"] },
  amount: { type: Number },
  balance: { type: Number },
  reference: { type: String },
}, { _id: false });

const statementSchema = new mongoose.Schema({
  statementId: { type: String, unique: true, required: true },
  period: { type: String, required: true }, // e.g. "March 2026"
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  openingBalance: { type: Number, default: 0 },
  closingBalance: { type: Number, default: 0 },
  totalIncome: { type: Number, default: 0 },
  totalExpenses: { type: Number, default: 0 },
  currency: { type: String, default: "UGX" },
  entries: [entrySchema],
});

statementSchema.index({ startDate: -1 });

export default mongoose.model("Statement", statementSchema);
