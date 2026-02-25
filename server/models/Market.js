import mongoose from "mongoose";

const marketSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], required: true }, // [longitude, latitude]
  },
  region: { type: String, required: true },
  district: { type: String, required: true },
  marketType: {
    type: String,
    enum: ["wholesale", "retail", "collection"],
    default: "retail",
  },
  operatingDays: [
    {
      type: String,
      enum: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
    },
  ],
  facilities: [{ type: String }],
  description: { type: String },
  specialties: [{ type: String }],
});

marketSchema.index({ location: "2dsphere" });

export default mongoose.model("Market", marketSchema);
