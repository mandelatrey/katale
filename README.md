# Uganda Agricultural Market Map

Interactive map showing Uganda's agricultural markets with real-time commodity prices.

## Features

- Interactive map of Uganda with market locations
- Real-time prices for matooke, maize, beans, and coffee
- Find nearest markets using GPS
- Compare prices across locations
- Transport cost estimates between markets
- Price trend charts

## Quick Start

```bash
# Install dependencies
npm run install:all

# Seed database with sample data
npm run seed

# Start development servers
npm run dev
```

## Tech Stack

- **Frontend**: React + Vite + OpenLayers
- **Backend**: Node.js + Express
- **Database**: MongoDB with geospatial queries
- **Charts**: Chart.js

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| GET /api/markets | List all markets |
| GET /api/markets/nearest/:lng/:lat | Find nearest markets |
| GET /api/prices/latest | Get latest prices |
| GET /api/prices/compare/:commodity | Compare prices across markets |
| GET /api/prices/transport/:fromId/:toId | Estimate transport costs |
| GET /api/prices/history/:commodity | Get price history |

## Environment Variables

```
MONGODB_URI=mongodb://localhost:27017/uganda-markets
PORT=3001
```