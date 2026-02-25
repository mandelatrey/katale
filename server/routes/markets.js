import express from 'express';
import Market from '../models/Market.js';

const router = express.Router();

// Get all markets
router.get('/', async (req, res) => {
  try {
    const { region, district, marketType } = req.query;
    const filter = {};
    if (region) filter.region = region;
    if (district) filter.district = district;
    if (marketType) filter.marketType = marketType;
    
    const markets = await Market.find(filter);
    res.json(markets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get market by ID
router.get('/:id', async (req, res) => {
  try {
    const market = await Market.findById(req.params.id);
    if (!market) return res.status(404).json({ error: 'Market not found' });
    res.json(market);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Find nearest markets
router.get('/nearest/:lng/:lat', async (req, res) => {
  try {
    const { lng, lat } = req.params;
    const maxDistance = req.query.maxDistance || 50000; // 50km default
    
    const markets = await Market.find({
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseFloat(maxDistance)
        }
      }
    }).limit(10);
    
    res.json(markets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get markets within bounding box (for map viewport)
router.get('/bounds/:minLng/:maxLng/:minLat/:maxLat', async (req, res) => {
  try {
    const { minLng, maxLng, minLat, maxLat } = req.params;
    
    const markets = await Market.find({
      location: {
        $geoWithin: {
          $box: [[parseFloat(minLng), parseFloat(minLat)], [parseFloat(maxLng), parseFloat(maxLat)]]
        }
      }
    });
    
    res.json(markets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;