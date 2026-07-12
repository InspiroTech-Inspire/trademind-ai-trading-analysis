# TradeMind AI

> Automated Trading Analysis Platform with Multi-Timeframe Technical Analysis, Pattern Recognition, and TradingView Integration

![Tech Stack](https://img.shields.io/badge/React-19-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue) ![Tailwind](https://img.shields.io/badge/Tailwind-3.4-06B6D4) ![tRPC](https://img.shields.io/badge/tRPC-11-orange) ![Drizzle](https://img.shields.io/badge/Drizzle-ORM-green)

## Features

### Technical Analysis Engine
- **Trend Indicators**: SMA 20/50, EMA 12/26 with crossover detection
- **Momentum Indicators**: RSI 14, MACD, Stochastic Oscillator
- **Volatility Indicators**: Bollinger Bands, ATR
- **Pattern Recognition**: Double Top/Bottom, Golden/Death Cross, Higher Highs/Lower Lows, Volume Spike detection
- **Support & Resistance**: Automatic level detection with Pivot Points

### Multi-Timeframe Top-Down Analysis
Analyzes across 6 timeframes from **1D to 5M**:
1. Daily (1D) - Major trend direction
2. 4-Hour (4H) - Intermediate analysis
3. 1-Hour (1H) - Swing trading
4. 30-Minute (30M) - Short-term
5. 15-Minute (15M) - Intraday
6. 5-Minute (5M) - Scalping

### Dashboard Components
- **TradingView Chart Widget** - Full interactive charting with all timeframes
- **Watchlist Panel** - Live quotes with P&L tracking
- **Symbol Search** - Search any stock, crypto, ETF, or forex pair
- **Indicator Panel** - Detailed breakdown of all technical indicators
- **Pattern Panel** - Visual pattern detection with confidence scores
- **Top-Down Panel** - Multi-timeframe alignment analysis with signal flow
- **Market Scanner** - Filter by bullish/bearish signals across symbols

### Scoring System
Each analysis produces 5 scores (-100 to +100):
| Score | Description |
|-------|-------------|
| Trend | SMA/EMA alignment and crossovers |
| Momentum | RSI, MACD, Stochastic signals |
| Volatility | Bollinger Bands position, ATR |
| Volume | Volume spike detection |
| Overall | Weighted composite score |

### Signal Classification
- **Strong Buy** (+50 and above)
- **Buy** (+15 to +49)
- **Neutral** (-14 to +14)
- **Sell** (-49 to -15)
- **Strong Sell** (-50 and below)

## Tech Stack

### Frontend
- React 19 + TypeScript
- Vite (build tool)
- Tailwind CSS + shadcn/ui
- tRPC client with React Query
- TradingView Chart Widget

### Backend
- Hono (HTTP framework)
- tRPC 11 (type-safe API)
- Drizzle ORM (MySQL)
- OAuth 2.0 Authentication
- Yahoo Finance API (market data)

## Getting Started

### Prerequisites
- Node.js 20+
- MySQL database

### Installation

```bash
# Clone the repository
git clone https://github.com/InspiroTech-Inspire/trademind-ai-trading-analysis.git
cd trademind-ai-trading-analysis

# Install dependencies
npm install

# Set up environment variables
# .env is auto-generated with init script

# Push database schema
npm run db:push

# Start development server
npm run dev
```

The application will be available at `http://localhost:3000`

### Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with HMR |
| `npm run build` | Build for production |
| `npm run check` | Type-check TypeScript files |
| `npm run db:push` | Sync database schema |
| `npm run db:generate` | Generate migration SQL |
| `npm start` | Start production server |

## Project Structure

```
tradmind-ai/
  api/                    # Backend API
    lib/indicators.ts     # Technical analysis engine
    market-router.ts      # Yahoo Finance data endpoints
    analysis-router.ts    # Analysis & scanning endpoints
    watchlist-router.ts   # Watchlist CRUD endpoints
    alerts-router.ts      # Alert management endpoints
    auth-router.ts        # OAuth authentication
    boot.ts               # Server entry point
  contracts/              # Shared types (frontend + backend)
    trading.ts            # Trading types and constants
  db/                     # Database schema & migrations
    schema.ts             # MySQL table definitions
  src/
    pages/
      Dashboard.tsx       # Main trading dashboard
    components/
      TradingViewChart.tsx    # TradingView widget
      IndicatorPanel.tsx      # Technical indicators
      PatternPanel.tsx        # Pattern recognition
      TopDownPanel.tsx        # Multi-timeframe analysis
      WatchlistPanel.tsx      # Watchlist sidebar
      Sidebar.tsx             # Navigation sidebar
      TopBar.tsx              # Header bar
      SymbolSearch.tsx        # Symbol search dialog
      AnalysisScoreCard.tsx   # Score display
    providers/
      trpc.tsx              # tRPC client setup
  public/                 # Static assets
```

## API Endpoints (tRPC)

| Router | Procedure | Description |
|--------|-----------|-------------|
| `market` | `getHistoricalData` | OHLCV data for a symbol |
| `market` | `getQuote` | Real-time quote |
| `market` | `getMultipleQuotes` | Batch quotes |
| `market` | `searchSymbol` | Symbol search |
| `analysis` | `analyze` | Full technical analysis |
| `analysis` | `topDownAnalysis` | Multi-timeframe analysis |
| `analysis` | `scanWatchlist` | Scan multiple symbols |
| `watchlist` | `list/create/delete` | Watchlist management |
| `watchlist` | `addItem/removeItem` | Watchlist items |
| `alerts` | `list/create/delete` | Price/signal alerts |

## Data Sources

- **Yahoo Finance API** - Historical prices, quotes, symbol search
- All data is fetched server-side and processed through the technical analysis engine

## License

MIT License - feel free to use this for your own trading analysis needs.

---

Built with precision for traders who demand data-driven decisions.
