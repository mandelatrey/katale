import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  paymentId: { type: String, unique: true, required: true },
  transaction: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction" },
  amount: { type: Number, required: true }, // UGX
  currency: { type: String, default: "UGX" },
  method: {
    type: String,
    enum: ["mobile_money", "bank_transfer", "cash", "cheque"],
    required: true,
  },
  provider: { type: String }, // e.g. "MTN MoMo", "Airtel Money", "Stanbic Bank"
  status: {
    type: String,
    enum: ["pending", "completed", "failed", "refunded"],
    default: "pending",
  },
  paidBy: { type: String },
  paidTo: { type: String },
  reference: { type: String },
  date: { type: Date, default: Date.now },
});

paymentSchema.index({ transaction: 1 });
paymentSchema.index({ status: 1, date: -1 });

export default mongoose.model("Payment", paymentSchema);
