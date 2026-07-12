import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  decimal,
  json,
  int,
  boolean,
  bigint,
} from "drizzle-orm/mysql-core";

// Users table (from auth)
export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Watchlists table
export const watchlists = mysqlTable("watchlists", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).references(() => users.id),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  isDefault: boolean("isDefault").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// Watchlist items
export const watchlistItems = mysqlTable("watchlistItems", {
  id: serial("id").primaryKey(),
  watchlistId: bigint("watchlistId", { mode: "number", unsigned: true }).references(() => watchlists.id).notNull(),
  symbol: varchar("symbol", { length: 20 }).notNull(),
  exchange: varchar("exchange", { length: 20 }),
  assetType: mysqlEnum("assetType", ["stock", "crypto", "forex", "etf", "index"]).default("stock"),
  addedAt: timestamp("addedAt").defaultNow().notNull(),
});

// Analysis results
export const analysisResults = mysqlTable("analysisResults", {
  id: serial("id").primaryKey(),
  symbol: varchar("symbol", { length: 20 }).notNull(),
  timeframe: varchar("timeframe", { length: 10 }).notNull(),
  analysisType: mysqlEnum("analysisType", ["indicator", "pattern", "topdown", "full"]).notNull(),
  trendScore: decimal("trendScore", { precision: 5, scale: 2 }),
  momentumScore: decimal("momentumScore", { precision: 5, scale: 2 }),
  volatilityScore: decimal("volatilityScore", { precision: 5, scale: 2 }),
  volumeScore: decimal("volumeScore", { precision: 5, scale: 2 }),
  overallScore: decimal("overallScore", { precision: 5, scale: 2 }),
  signal: mysqlEnum("signal", ["strong_buy", "buy", "neutral", "sell", "strong_sell"]).default("neutral"),
  indicators: json("indicators"),
  patterns: json("patterns"),
  supportResistance: json("supportResistance"),
  priceAtAnalysis: decimal("priceAtAnalysis", { precision: 18, scale: 8 }),
  analyzedAt: timestamp("analyzedAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"),
});

// Scan history
export const scanHistory = mysqlTable("scanHistory", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).references(() => users.id),
  scanType: mysqlEnum("scanType", ["single", "watchlist", "market"]).notNull(),
  symbols: json("symbols"),
  timeframes: json("timeframes"),
  filters: json("filters"),
  resultsCount: int("resultsCount"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// User alerts
export const alerts = mysqlTable("alerts", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).references(() => users.id).notNull(),
  symbol: varchar("symbol", { length: 20 }).notNull(),
  timeframe: varchar("timeframe", { length: 10 }).notNull(),
  condition: mysqlEnum("condition", [
    "price_above",
    "price_below",
    "rsi_above",
    "rsi_below",
    "macd_bullish",
    "macd_bearish",
    "signal_buy",
    "signal_sell",
    "pattern_detected",
  ]).notNull(),
  threshold: decimal("threshold", { precision: 18, scale: 8 }),
  isActive: boolean("isActive").default(true),
  triggeredAt: timestamp("triggeredAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Types
export type Watchlist = typeof watchlists.$inferSelect;
export type WatchlistItem = typeof watchlistItems.$inferSelect;
export type AnalysisResult = typeof analysisResults.$inferSelect;
export type ScanHistory = typeof scanHistory.$inferSelect;
export type Alert = typeof alerts.$inferSelect;
