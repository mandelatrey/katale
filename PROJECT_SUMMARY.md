# AgriBridge - Project Summary

> Real-time agricultural market intelligence for Uganda's farmers, traders, and agribusinesses.

## Overview

AgriBridge is an agritech/fintech platform providing commodity price transparency, fleet management, and transaction tracking for Uganda's agricultural markets. The platform enables farmers to find the best prices for their produce, traders to optimize buying decisions, and agribusinesses to manage logistics efficiently.

## Current Features

### Market Intelligence
- **Interactive Map**: OpenLayers-powered map with 20+ verified Ugandan markets (Owino, Nakasero, Kalerwe, Nakawa, etc.)
- **Real-time Prices**: Commodity prices across markets with color-coded indicators (green=low, amber=medium, red=high)
- **Price Comparison**: Cross-market price analysis for maize, beans, coffee, matooke, rice, groundnuts, cassava, sweet potato, sorghum, and millet
- **Historical Trends**: Time-series price charts with configurable date ranges
- **Geospatial Search**: Find nearest markets using device location with distance-based filtering

### Fleet Management
- **Driver Registry**: Full CRUD for carriers with status tracking (On The Way, Loading, Waiting, Unloading)
- **Live Route Maps**: Mini-map visualization showing active routes between origin and destination
- **Vehicle Specs**: Track payload capacity, volume, dimensions, and license plates
- **Performance Analytics**: Working time charts and driver statistics

### Transaction Tracking
- **Buy/Sell Ledger**: Record transactions with commodity, quantity, pricing, and route information
- **Status Workflow**: Pending → Confirmed → In Transit → Delivered tracking
- **Market Linkage**: Transactions reference source and destination markets

### Financial Operations
- **Payment Tracking**: Mobile money (MTN, Airtel), bank transfers (Stanbic, DFCU), cash, and cheque
- **Asset Inventory**: Storage facilities, vehicles, and equipment management
- **Reports & Statements**: Aggregated summaries and period-based financial statements

### Mobile Experience
- **Responsive Design**: Optimized for field use on low-spec devices
- **Bottom Navigation**: Quick access to Dashboard, Commodities, Transactions, and More
- **Bottom Sheet UI**: Swipeable market list panels
- **Offline-Friendly**: Lightweight API responses designed for slow connections

---

## Technology Stack

### Current Implementation

| Layer | Technology | Notes |
|-------|------------|-------|
| **Frontend** | React 18 + Vite 5 | Single-page application with CSS-based view transitions |
| **Styling** | Tailwind CSS 4 | Custom design system with Radix UI primitives |
| **Mapping** | OpenLayers 9 | MapTiler tiles with OSM fallback; GeoJSON markers |
| **Charts** | Chart.js 4 | Price trends, carrier analytics |
| **Icons** | Ionicons 8 | Centralized icon exports via Icons.jsx |
| **Backend** | Express 4 (Node.js) | RESTful API with service layer architecture |
| **Database** | MongoDB 8 + Mongoose | GeoJSON with 2dsphere indexes for spatial queries |
| **Validation** | Zod | Schema validation in service layer |
| **Testing** | Vitest | Unit and integration tests with mongodb-memory-server |
| **Deployment** | Vercel | Static SPA + serverless functions |

### Architecture Highlights

```
client/                    server/
├── App.jsx (map + state)  ├── routes/     → HTTP endpoints
├── api/    (fetch client) ├── services/   → Business logic (Zod-validated)
├── components/            ├── models/     → Mongoose schemas
└── constants.jsx          └── whatsapp/   → Messaging scaffold
```

- **Service Layer Pattern**: Business logic is decoupled from HTTP routes, enabling reuse across REST API and WhatsApp webhook
- **Actor-Based Ownership**: Services receive `{ userId, source }` context for future multi-tenant/auth support
- **Geospatial Queries**: MongoDB `$near` and `$geoWithin` for market discovery within radius

---

## Upcoming Features

### WhatsApp Integration (Scaffolded)
Two-way messaging via WhatsApp for price checks and carrier updates:

| Component | Status |
|-----------|--------|
| Webhook router | Scaffolded (returns 501) |
| Intent parser | Stub |
| Session management | In-memory (to migrate to MongoDB TTL) |
| Twilio adapter | Stub |
| Meta Cloud API adapter | Stub |
| Response formatter | Basic structure |

**Planned Commands**:
- `PRICE <commodity>` — Get latest prices across markets
- `MARKET <name>` — Get details for a specific market
- `STATUS` — Carrier updates their delivery status
- Signup flow for unknown phone numbers

### USSD Gateway
Africa's Talking API integration for feature phone access:
- Price queries via `*xxx#` shortcode
- Basic market lookup
- Uganda-wide reach for users without smartphones

### Enhanced Analytics
- Demand forecasting using historical price patterns
- Route optimization for fleet dispatch
- Seasonal trend analysis
- Market capacity indicators

### User Authentication
- Phone-based identity (E.164 format)
- Role-based access: Farmer, Broker, Carrier, Staff
- Ownership enforcement for carrier self-service

---

## Target Users

| Segment | Context | Primary Need |
|---------|---------|--------------|
| **Farmers** | Field, mobile, slow connections | Quick price checks before selling |
| **Traders & Brokers** | Desktop/tablet, bulk decisions | Price trends, cross-market comparison |
| **Agribusiness Staff** | Desktop, professional operations | Fleet management, transaction ledger, reporting |

---

## Security & Compliance

- End-to-end encryption for user data in transit
- GDPR-compliant data handling practices
- User consent management in onboarding flows
- No secrets committed to repository (`.env` files gitignored)
- Input validation via Zod schemas at service layer

---

## License

Proprietary. Contact the AgriBridge team for licensing inquiries.

---

*Built for Uganda's agricultural markets. Designed to scale across Africa.*
