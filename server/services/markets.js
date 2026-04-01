import Market from "../models/Market.js";

export async function getMarkets({ region, district, marketType } = {}) {
  const filter = {};
  if (region) filter.region = region;
  if (district) filter.district = district;
  if (marketType) filter.marketType = marketType;
  return Market.find(filter);
}

export async function getMarketById(id) {
  const market = await Market.findById(id);
  if (!market) throw Object.assign(new Error("Market not found"), { status: 404 });
  return market;
}

export async function getNearbyMarkets(lng, lat, maxDistance = 50000) {
  return Market.find({
    location: {
      $near: {
        $geometry: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
        $maxDistance: parseFloat(maxDistance),
      },
    },
  }).limit(10);
}

export async function getMarketsInBounds(minLng, maxLng, minLat, maxLat) {
  return Market.find({
    location: {
      $geoWithin: {
        $box: [
          [parseFloat(minLng), parseFloat(minLat)],
          [parseFloat(maxLng), parseFloat(maxLat)],
        ],
      },
    },
  });
}
