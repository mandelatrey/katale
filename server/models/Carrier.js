import mongoose from "mongoose";

const routeSubdoc = {
  from: String,
  to: String,
  distKm: Number,
  packages: Number,
  fromCoords: [Number], // [lng, lat]
  toCoords: [Number],   // [lng, lat]
};

const carrierSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String },
  role: { type: String, default: "driver" },
  status: {
    type: String,
    enum: ["ON THE WAY", "LOADING", "WAITING", "UNLOADING"],
    default: "WAITING",
  },
  category: {
    type: String,
    enum: ["Favorites", "Trucks", "Vans"],
    default: "Vans",
  },
  vehicleModel: { type: String },
  vehicleType: { type: String, enum: ["Van", "Truck"] },
  specs: {
    payload: String,
    volume: String,
    length: String,
    width: String,
    plate: String,
  },
  activeRoute: routeSubdoc,
  historyRoutes: [routeSubdoc],
});

carrierSchema.index({ status: 1 });
carrierSchema.index({ category: 1 });

export default mongoose.model("Carrier", carrierSchema);
