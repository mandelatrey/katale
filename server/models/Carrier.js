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
  // Optional: the User who owns/drives this carrier. The WhatsApp webhook
  // will use this so a driver messaging the bot can update their own
  // vehicle without specifying an id.
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

carrierSchema.index({ status: 1 });
carrierSchema.index({ category: 1 });
carrierSchema.index({ owner: 1 });

export default mongoose.model("Carrier", carrierSchema);
