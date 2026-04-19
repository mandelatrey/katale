import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  transactionId: { type: String, unique: true, required: true },
  type: { type: String, enum: ["buy", "sell"], required: true },
  commodity: { type: String, required: true },
  quantity: { type: Number, required: true }, // kg
  unitPrice: { type: Number, required: true }, // UGX per kg
  totalAmount: { type: Number, required: true }, // UGX
  currency: { type: String, default: "UGX" },
  fromMarket: { type: mongoose.Schema.Types.ObjectId, ref: "Market" },
  toMarket: { type: mongoose.Schema.Types.ObjectId, ref: "Market" },
  buyer: { type: String },
  seller: { type: String },
  carrier: { type: mongoose.Schema.Types.ObjectId, ref: "Carrier" },
  asset: { type: mongoose.Schema.Types.ObjectId, ref: "Asset" },
  notes: { type: String },
  status: {
    type: String,
    enum: ["pending", "confirmed", "in_transit", "delivered", "cancelled"],
    default: "pending",
  },
  date: { type: Date, default: Date.now },
  // Populated by web auth (later) or by the WhatsApp webhook once a
  // phone number resolves to a User. Optional so existing seeded data
  // without a user stays valid.
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  buyerUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  sellerUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

transactionSchema.index({ commodity: 1, date: -1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ fromMarket: 1 });
transactionSchema.index({ toMarket: 1 });
transactionSchema.index({ createdBy: 1 });
transactionSchema.index({ buyerUser: 1 });
transactionSchema.index({ sellerUser: 1 });

export default mongoose.model("Transaction", transactionSchema);
