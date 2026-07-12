// Shared trading types between frontend and backend

export type Timeframe = "1d" | "4h" | "1h" | "30m" | "15m" | "5m";

export type AssetType = "stock" | "crypto" | "forex" | "etf" | "index";

export type Signal = "strong_buy" | "buy" | "neutral" | "sell" | "strong_sell";

export type AnalysisType = "indicator" | "pattern" | "topdown" | "full";

export interface OHLCV {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface IndicatorResult {
  name: string;
  value: number;
  signal: "bullish" | "bearish" | "neutral";
  description: string;
  details?: Record<string, number>;
}

export interface PatternResult {
  name: string;
  detected: boolean;
  confidence: number;
  description: string;
  location?: {
    startPrice: number;
    endPrice: number;
    startDate: string;
    endDate: string;
  };
}

export interface SupportResistance {
  supports: number[];
  resistances: number[];
  pivotPoints: number[];
}

export interface AnalysisScores {
  trend: number;
  momentum: number;
  volatility: number;
  volume: number;
  overall: number;
}

export interface FullAnalysis {
  symbol: string;
  timeframe: Timeframe;
  price: number;
  change: number;
  changePercent: number;
  scores: AnalysisScores;
  signal: Signal;
  indicators: IndicatorResult[];
  patterns: PatternResult[];
  supportResistance: SupportResistance;
  analyzedAt: string;
}

export interface TopDownAnalysis {
  symbol: string;
  currentPrice: number;
  timeframes: {
    timeframe: Timeframe;
    signal: Signal;
    score: number;
    keyLevel: string;
    summary: string;
  }[];
  overallSignal: Signal;
  alignment: number;
  summary: string;
}

export interface WatchlistWithItems {
  id: number;
  name: string;
  description: string | null;
  isDefault: boolean;
  items: {
    id: number;
    symbol: string;
    exchange: string | null;
    assetType: AssetType;
  }[];
}

export interface ScanFilter {
  minScore?: number;
  maxScore?: number;
  signal?: Signal;
  timeframes?: Timeframe[];
  indicators?: string[];
}

export const TIMEFRAMES: { value: Timeframe; label: string }[] = [
  { value: "1d", label: "1D" },
  { value: "4h", label: "4H" },
  { value: "1h", label: "1H" },
  { value: "30m", label: "30M" },
  { value: "15m", label: "15M" },
  { value: "5m", label: "5M" },
];

export const DEFAULT_SYMBOLS = [
  "AAPL", "MSFT", "GOOGL", "AMZN", "META",
  "TSLA", "NVDA", "AMD", "NFLX", "SPY",
  "QQQ", "IWM", "BTC-USD", "ETH-USD",
];
