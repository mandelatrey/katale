import mongoose from 'mongoose';

const priceSchema = new mongoose.Schema({
  market: { type: mongoose.Schema.Types.ObjectId, ref: 'Market', required: true },
  commodity: { type: String, required: true },
  price: { type: Number, required: true },
  unit: { type: String, required: true },
  currency: { type: String, default: 'UGX' },
  priceType: { type: String, enum: ['wholesale', 'retail'], default: 'retail' },
  recordedAt: { type: Date, default: Date.now },
  source: { type: String },
  quality: { type: String, enum: ['grade A', 'grade B', 'grade C', 'mixed'], default: 'mixed' }
});

priceSchema.index({ market: 1, commodity: 1, recordedAt: -1 });
priceSchema.index({ commodity: 1, recordedAt: -1 });

export default mongoose.model('Price', priceSchema);