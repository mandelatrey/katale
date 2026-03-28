import express from 'express';
import mongoose from 'mongoose';
import Price from '../models/Price.js';
import Market from '../models/Market.js';

const router = express.Router();

// Get latest prices for all markets
router.get('/latest', async (req, res) => {
  try {
    const { commodity, marketId } = req.query;
    const match = {};
    if (commodity) match.commodity = commodity;
    if (marketId) match.market = marketId;
    
    const prices = await Price.aggregate([
      { $match: match },
      { $sort: { recordedAt: -1 } },
      { $group: { _id: '$market', price: { $first: '$$ROOT' } } },
      { $replaceRoot: { newRoot: '$price' } },
      { $lookup: { from: 'markets', localField: 'market', foreignField: '_id', as: 'marketInfo' } },
      { $unwind: '$marketInfo' }
    ]);
    
    res.json(prices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get price history for a commodity
router.get('/history/:commodity', async (req, res) => {
  try {
    const { commodity } = req.params;
    const { days = 30, marketId } = req.query;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const match = { commodity, recordedAt: { $gte: startDate } };
    if (marketId) match.market = new mongoose.Types.ObjectId(marketId);
    
    const prices = await Price.aggregate([
      { $match: match },
      { $sort: { recordedAt: 1 } },
      { $lookup: { from: 'markets', localField: 'market', foreignField: '_id', as: 'market' } },
      { $unwind: '$market' },
      { $group: { 
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$recordedAt' } },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
        count: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ]);
    
    res.json(prices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get prices for a specific market — returns latest N records per commodity
// so the popup always has data regardless of when the DB was seeded.
router.get('/market/:marketId', async (req, res) => {
  try {
    const { marketId } = req.params;
    const { limit = 30 } = req.query;

    // Get the most recent `limit` prices per commodity for this market
    const prices = await Price.aggregate([
      { $match: { market: new mongoose.Types.ObjectId(marketId) } },
      { $sort: { recordedAt: -1 } },
      { $group: {
          _id: '$commodity',
          records: { $push: '$$ROOT' }
      }},
      { $project: { records: { $slice: ['$records', Number(limit)] } } },
      { $unwind: '$records' },
      { $replaceRoot: { newRoot: '$records' } },
      { $sort: { commodity: 1, recordedAt: -1 } }
    ]);

    res.json(prices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Compare prices across markets for a commodity
router.get('/compare/:commodity', async (req, res) => {
  try {
    const { commodity } = req.params;
    
    const prices = await Price.aggregate([
      { $match: { commodity, recordedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
      { $sort: { recordedAt: -1 } },
      { $group: { 
        _id: '$market', 
        latestPrice: { $first: '$price' },
        marketInfo: { $first: '$market' }
      }},
      { $lookup: { from: 'markets', localField: '_id', foreignField: '_id', as: 'marketDetails' } },
      { $unwind: '$marketDetails' },
      { $project: { 
        market: '$marketDetails.name',
        district: '$marketDetails.district',
        region: '$marketDetails.region',
        price: '$latestPrice'
      }},
      { $sort: { price: 1 } }
    ]);
    
    res.json(prices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get transport estimate between two markets
router.get('/transport/:fromId/:toId', async (req, res) => {
  try {
    const { fromId, toId } = req.params;
    
    const [from, to] = await Promise.all([
      Market.findById(fromId),
      Market.findById(toId)
    ]);
    
    if (!from || !to) return res.status(404).json({ error: 'Market not found' });
    
    // Haversine formula for distance
    const R = 6371; // Earth's radius in km
    const dLat = (to.location.coordinates[1] - from.location.coordinates[1]) * Math.PI / 180;
    const dLng = (to.location.coordinates[0] - from.location.coordinates[0]) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(from.location.coordinates[1] * Math.PI / 180) * 
              Math.cos(to.location.coordinates[1] * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    // Transport cost estimate (rough calculation)
    const costPerKm = 500; // UGX per km
    const estimatedCost = Math.round(distance * costPerKm);
    
    res.json({
      from: { name: from.name, district: from.district },
      to: { name: to.name, district: to.district },
      distance: Math.round(distance),
      estimatedCost,
      travelTime: Math.round(distance / 60) // Assuming 60km/h average
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;