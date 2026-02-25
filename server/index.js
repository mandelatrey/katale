import "dotenv/config";
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import marketRoutes from './routes/markets.js';
import priceRoutes from './routes/prices.js';

const app = express();
const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/uganda-markets';

app.use(cors());
app.use(express.json());

app.use('/api/markets', marketRoutes);
app.use('/api/prices', priceRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.error('MongoDB connection error:', err));