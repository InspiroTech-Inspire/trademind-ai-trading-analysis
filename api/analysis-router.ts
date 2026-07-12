import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import {
  calculateIndicators,
  detectPatterns,
  findSupportResistance,
  calculateScores,
  scoreToSignal,
} from "./lib/indicators";
import type { FullAnalysis, TopDownAnalysis, Timeframe, Signal } from "@contracts/trading";
import { marketRouter } from "./market-router";

// Helper to fetch OHLCV data through the market router
async function getOHLCV(symbol: string, timeframe: Timeframe) {
  const caller = marketRouter.createCaller({} as any);
  return await caller.getHistoricalData({ symbol, timeframe });
}

export const analysisRouter = createRouter({
  analyze: publicQuery
    .input(
      z.object({
        symbol: z.string().toUpperCase(),
        timeframe: z.enum(["1d", "4h", "1h", "30m", "15m", "5m"]).default("1d"),
      })
    )
    .query(async ({ input }) => {
      const { symbol, timeframe } = input;

      try {
        const ohlcv = await getOHLCV(symbol, timeframe);

        if (ohlcv.length < 50) {
          return {
            symbol,
            timeframe,
            price: 0,
            change: 0,
            changePercent: 0,
            scores: { trend: 0, momentum: 0, volatility: 0, volume: 0, overall: 0 },
            signal: "neutral" as Signal,
            indicators: [],
            patterns: [],
            supportResistance: { supports: [], resistances: [], pivotPoints: [] },
            analyzedAt: new Date().toISOString(),
          } satisfies FullAnalysis;
        }

        const indicators = calculateIndicators(ohlcv);
        const patterns = detectPatterns(ohlcv);
        const sr = findSupportResistance(ohlcv);
        const scores = calculateScores(indicators);
        const signal = scoreToSignal(scores.overall);

        const lastPrice = ohlcv[ohlcv.length - 1].close;
        const prevPrice = ohlcv[ohlcv.length - 2]?.close || lastPrice;
        const change = lastPrice - prevPrice;
        const changePercent = (change / prevPrice) * 100;

        return {
          symbol,
          timeframe,
          price: lastPrice,
          change,
          changePercent,
          scores,
          signal,
          indicators,
          patterns,
          supportResistance: sr,
          analyzedAt: new Date().toISOString(),
        } satisfies FullAnalysis;
      } catch (error) {
        console.error(`Analysis error for ${symbol}:`, error);
        return {
          symbol,
          timeframe,
          price: 0,
          change: 0,
          changePercent: 0,
          scores: { trend: 0, momentum: 0, volatility: 0, volume: 0, overall: 0 },
          signal: "neutral" as Signal,
          indicators: [],
          patterns: [],
          supportResistance: { supports: [], resistances: [], pivotPoints: [] },
          analyzedAt: new Date().toISOString(),
        } satisfies FullAnalysis;
      }
    }),

  topDownAnalysis: publicQuery
    .input(
      z.object({
        symbol: z.string().toUpperCase(),
      })
    )
    .query(async ({ input }) => {
      const { symbol } = input;
      const timeframes: Timeframe[] = ["1d", "4h", "1h", "30m", "15m", "5m"];

      const results = await Promise.all(
        timeframes.map(async (tf) => {
          try {
            const ohlcv = await getOHLCV(symbol, tf);
            if (ohlcv.length < 50) {
              return {
                timeframe: tf,
                signal: "neutral" as Signal,
                score: 0,
                keyLevel: "N/A",
                summary: "Insufficient data",
              };
            }

            const indicators = calculateIndicators(ohlcv);
            const sr = findSupportResistance(ohlcv);
            const scores = calculateScores(indicators);
            const signal = scoreToSignal(scores.overall);

            const lastPrice = ohlcv[ohlcv.length - 1].close;
            const nearestSupport = sr.supports.find((s) => s < lastPrice);
            const nearestResistance = sr.resistances.find((r) => r > lastPrice);

            return {
              timeframe: tf,
              signal,
              score: scores.overall,
              keyLevel: nearestSupport
                ? `Support: ${nearestSupport.toFixed(2)}`
                : nearestResistance
                  ? `Resistance: ${nearestResistance.toFixed(2)}`
                  : "N/A",
              summary: `${tf}: ${signal.replace("_", " ").toUpperCase()} (score: ${scores.overall})`,
            };
          } catch {
            return {
              timeframe: tf,
              signal: "neutral" as Signal,
              score: 0,
              keyLevel: "Error",
              summary: `Failed to analyze ${tf}`,
            };
          }
        })
      );

      // Calculate overall signal based on timeframe alignment
      const bullishCount = results.filter(
        (r) => r.signal === "strong_buy" || r.signal === "buy"
      ).length;
      const bearishCount = results.filter(
        (r) => r.signal === "strong_sell" || r.signal === "sell"
      ).length;

      let overallSignal: Signal = "neutral";
      if (bullishCount >= 4) overallSignal = "strong_buy";
      else if (bullishCount >= 3) overallSignal = "buy";
      else if (bearishCount >= 4) overallSignal = "strong_sell";
      else if (bearishCount >= 3) overallSignal = "sell";

      const alignment = Math.round(
        (Math.max(bullishCount, bearishCount) / timeframes.length) * 100
      );

      // Get current price from daily
      let currentPrice = 0;
      try {
        const dailyData = await getOHLCV(symbol, "1d");
        currentPrice = dailyData[dailyData.length - 1]?.close || 0;
      } catch {
        // fallback
      }

      // Generate summary
      const higherTf = results.filter((r) => ["1d", "4h", "1h"].includes(r.timeframe));
      const lowerTf = results.filter((r) => ["30m", "15m", "5m"].includes(r.timeframe));
      const higherBullish = higherTf.filter(
        (r) => r.signal === "buy" || r.signal === "strong_buy"
      ).length;
      const lowerBullish = lowerTf.filter(
        (r) => r.signal === "buy" || r.signal === "strong_buy"
      ).length;

      let summary = "";
      if (higherBullish >= 2 && lowerBullish >= 2) {
        summary = `Strong bullish alignment across timeframes. Higher timeframes (${higherBullish}/3 bullish) confirm the trend while lower timeframes (${lowerBullish}/3 bullish) support continuation.`;
      } else if (higherBullish >= 2 && lowerBullish < 2) {
        summary = `Bullish higher timeframes but lower timeframes show weakness. Potential pullback or consolidation before continuation.`;
      } else if (higherBullish < 2 && lowerBullish >= 2) {
        summary = `Lower timeframes turning bullish against higher timeframe trend. Potential reversal forming - wait for higher timeframe confirmation.`;
      } else {
        summary = `Bearish alignment across timeframes. Higher timeframes (${3 - higherBullish}/3 bearish) show downtrend with lower timeframe confirmation.`;
      }

      return {
        symbol,
        currentPrice,
        timeframes: results,
        overallSignal,
        alignment,
        summary,
      } satisfies TopDownAnalysis;
    }),

  scanWatchlist: publicQuery
    .input(
      z.object({
        symbols: z.array(z.string().toUpperCase()),
        timeframe: z.enum(["1d", "4h", "1h", "30m", "15m", "5m"]).default("1d"),
        minScore: z.number().optional(),
        signal: z.enum(["strong_buy", "buy", "neutral", "sell", "strong_sell"]).optional(),
      })
    )
    .query(async ({ input }) => {
      const { symbols, timeframe, minScore, signal } = input;

      const results = await Promise.all(
        symbols.map(async (symbol) => {
          try {
            const ohlcv = await getOHLCV(symbol, timeframe);
            if (ohlcv.length < 50) return null;

            const indicators = calculateIndicators(ohlcv);
            const patterns = detectPatterns(ohlcv);
            const sr = findSupportResistance(ohlcv);
            const scores = calculateScores(indicators);
            const sig = scoreToSignal(scores.overall);

            const lastPrice = ohlcv[ohlcv.length - 1].close;
            const prevPrice = ohlcv[ohlcv.length - 2]?.close || lastPrice;
            const change = lastPrice - prevPrice;
            const changePercent = (change / prevPrice) * 100;

            return {
              symbol,
              timeframe,
              price: lastPrice,
              change,
              changePercent,
              scores,
              signal: sig,
              indicators,
              patterns,
              supportResistance: sr,
              analyzedAt: new Date().toISOString(),
            } satisfies FullAnalysis;
          } catch {
            return null;
          }
        })
      );

      let filtered = results.filter((r): r is FullAnalysis => r !== null);

      if (minScore !== undefined) {
        filtered = filtered.filter((r) => r.scores.overall >= minScore);
      }

      if (signal) {
        filtered = filtered.filter((r) => r.signal === signal);
      }

      return filtered.sort((a, b) => b.scores.overall - a.scores.overall);
    }),
});
