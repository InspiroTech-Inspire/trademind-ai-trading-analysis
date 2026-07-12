// Technical indicator calculation engine
import type { OHLCV, IndicatorResult, SupportResistance, PatternResult, AnalysisScores, Signal } from "@contracts/trading";

// Simple Moving Average
export function sma(data: number[], period: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(NaN);
      continue;
    }
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j];
    }
    result.push(sum / period);
  }
  return result;
}

// Exponential Moving Average
export function ema(data: number[], period: number): number[] {
  const result: number[] = [];
  const multiplier = 2 / (period + 1);
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(NaN);
      continue;
    }
    if (i === period - 1) {
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += data[i - j];
      }
      result.push(sum / period);
    } else {
      result.push((data[i] - result[i - 1]) * multiplier + result[i - 1]);
    }
  }
  return result;
}

// Relative Strength Index
export function rsi(data: number[], period: number = 14): number[] {
  const result: number[] = [];
  let gains = 0;
  let losses = 0;

  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      result.push(NaN);
      continue;
    }

    const change = data[i] - data[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? -change : 0;

    if (i < period) {
      gains += gain;
      losses += loss;
      result.push(NaN);
      continue;
    }

    if (i === period) {
      gains += gain;
      losses += loss;
    } else {
      gains = (gains * (period - 1) + gain) / period;
      losses = (losses * (period - 1) + loss) / period;
    }

    if (losses === 0) {
      result.push(100);
    } else {
      const rs = gains / losses;
      result.push(100 - 100 / (1 + rs));
    }
  }
  return result;
}

// MACD
export function macd(
  data: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): { macdLine: number[]; signalLine: number[]; histogram: number[] } {
  const fastEMA = ema(data, fastPeriod);
  const slowEMA = ema(data, slowPeriod);
  const macdLine: number[] = [];

  for (let i = 0; i < data.length; i++) {
    if (isNaN(fastEMA[i]) || isNaN(slowEMA[i])) {
      macdLine.push(NaN);
    } else {
      macdLine.push(fastEMA[i] - slowEMA[i]);
    }
  }

  const signalLine = ema(
    macdLine.filter((v) => !isNaN(v)),
    signalPeriod
  );

  const paddedSignal: number[] = [];
  let sigIdx = 0;
  for (let i = 0; i < data.length; i++) {
    if (isNaN(macdLine[i]) || sigIdx >= signalLine.length) {
      paddedSignal.push(NaN);
    } else {
      paddedSignal.push(signalLine[sigIdx++]);
    }
  }

  const histogram: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (isNaN(macdLine[i]) || isNaN(paddedSignal[i])) {
      histogram.push(NaN);
    } else {
      histogram.push(macdLine[i] - paddedSignal[i]);
    }
  }

  return { macdLine, signalLine: paddedSignal, histogram };
}

// Bollinger Bands
export function bollingerBands(
  data: number[],
  period: number = 20,
  stdDev: number = 2
): { upper: number[]; middle: number[]; lower: number[] } {
  const middle = sma(data, period);
  const upper: number[] = [];
  const lower: number[] = [];

  for (let i = 0; i < data.length; i++) {
    if (isNaN(middle[i])) {
      upper.push(NaN);
      lower.push(NaN);
      continue;
    }
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += Math.pow(data[i - j] - middle[i], 2);
    }
    const std = Math.sqrt(sum / period);
    upper.push(middle[i] + stdDev * std);
    lower.push(middle[i] - stdDev * std);
  }

  return { upper, middle, lower };
}

// Average True Range
export function atr(ohlc: OHLCV[], period: number = 14): number[] {
  const tr: number[] = [];
  for (let i = 0; i < ohlc.length; i++) {
    if (i === 0) {
      tr.push(ohlc[i].high - ohlc[i].low);
    } else {
      const tr1 = ohlc[i].high - ohlc[i].low;
      const tr2 = Math.abs(ohlc[i].high - ohlc[i - 1].close);
      const tr3 = Math.abs(ohlc[i].low - ohlc[i - 1].close);
      tr.push(Math.max(tr1, tr2, tr3));
    }
  }
  return sma(tr, period);
}

// Stochastic Oscillator
export function stochastic(
  ohlc: OHLCV[],
  kPeriod: number = 14,
  dPeriod: number = 3
): { k: number[]; d: number[] } {
  const k: number[] = [];
  for (let i = 0; i < ohlc.length; i++) {
    if (i < kPeriod - 1) {
      k.push(NaN);
      continue;
    }
    let lowestLow = Infinity;
    let highestHigh = -Infinity;
    for (let j = 0; j < kPeriod; j++) {
      lowestLow = Math.min(lowestLow, ohlc[i - j].low);
      highestHigh = Math.max(highestHigh, ohlc[i - j].high);
    }
    const range = highestHigh - lowestLow;
    if (range === 0) {
      k.push(50);
    } else {
      k.push(((ohlc[i].close - lowestLow) / range) * 100);
    }
  }

  const d = sma(k.filter((v) => !isNaN(v)), dPeriod);
  const paddedD: number[] = [];
  let dIdx = 0;
  for (let i = 0; i < ohlc.length; i++) {
    if (isNaN(k[i]) || dIdx >= d.length) {
      paddedD.push(NaN);
    } else {
      paddedD.push(d[dIdx++]);
    }
  }

  return { k, d: paddedD };
}

// Find support and resistance levels
export function findSupportResistance(
  ohlc: OHLCV[],
  lookback: number = 20,
  tolerance: number = 0.005
): SupportResistance {
  const levels: { price: number; touches: number; type: "support" | "resistance" }[] = [];

  for (let i = lookback; i < ohlc.length - lookback; i++) {
    let isLow = true;
    for (let j = 1; j <= lookback; j++) {
      if (ohlc[i].low >= ohlc[i - j].low || ohlc[i].low >= ohlc[i + j].low) {
        isLow = false;
        break;
      }
    }
    if (isLow) {
      const existing = levels.find(
        (l) => Math.abs(l.price - ohlc[i].low) / l.price < tolerance
      );
      if (existing) {
        existing.touches++;
      } else {
        levels.push({ price: ohlc[i].low, touches: 1, type: "support" });
      }
    }

    let isHigh = true;
    for (let j = 1; j <= lookback; j++) {
      if (ohlc[i].high <= ohlc[i - j].high || ohlc[i].high <= ohlc[i + j].high) {
        isHigh = false;
        break;
      }
    }
    if (isHigh) {
      const existing = levels.find(
        (l) => Math.abs(l.price - ohlc[i].high) / l.price < tolerance
      );
      if (existing) {
        existing.touches++;
      } else {
        levels.push({ price: ohlc[i].high, touches: 1, type: "resistance" });
      }
    }
  }

  const supports = levels
    .filter((l) => l.type === "support")
    .sort((a, b) => b.touches - a.touches)
    .slice(0, 5)
    .map((l) => l.price);

  const resistances = levels
    .filter((l) => l.type === "resistance")
    .sort((a, b) => b.touches - a.touches)
    .slice(0, 5)
    .map((l) => l.price);

  const last = ohlc[ohlc.length - 1];
  const pivot = (last.high + last.low + last.close) / 3;
  const r1 = 2 * pivot - last.low;
  const s1 = 2 * pivot - last.high;
  const r2 = pivot + (last.high - last.low);
  const s2 = pivot - (last.high - last.low);

  return {
    supports: [...supports, s1, s2].sort((a, b) => b - a),
    resistances: [...resistances, r1, r2].sort((a, b) => a - b),
    pivotPoints: [pivot],
  };
}

// Calculate all indicators
export function calculateIndicators(ohlc: OHLCV[]): IndicatorResult[] {
  const closes = ohlc.map((d) => d.close);
  const lastClose = closes[closes.length - 1];
  const indicators: IndicatorResult[] = [];

  const sma20 = sma(closes, 20);
  const sma20Val = sma20[sma20.length - 1];
  indicators.push({
    name: "SMA 20",
    value: Number(sma20Val.toFixed(2)),
    signal: lastClose > sma20Val ? "bullish" : "bearish",
    description: `Price ${lastClose > sma20Val ? "above" : "below"} 20-period SMA`,
  });

  const sma50 = sma(closes, 50);
  const sma50Val = sma50[sma50.length - 1];
  indicators.push({
    name: "SMA 50",
    value: Number(sma50Val.toFixed(2)),
    signal: lastClose > sma50Val ? "bullish" : "bearish",
    description: `Price ${lastClose > sma50Val ? "above" : "below"} 50-period SMA`,
  });

  const ema12 = ema(closes, 12);
  const ema26 = ema(closes, 26);
  const ema12Val = ema12[ema12.length - 1];
  const ema26Val = ema26[ema26.length - 1];
  indicators.push({
    name: "EMA 12/26",
    value: Number(ema12Val.toFixed(2)),
    signal: ema12Val > ema26Val ? "bullish" : "bearish",
    description: `EMA 12 ${ema12Val > ema26Val ? ">" : "<"} EMA 26`,
    details: { ema12: ema12Val, ema26: ema26Val },
  });

  const rsiValues = rsi(closes, 14);
  const rsiVal = rsiValues[rsiValues.length - 1];
  let rsiSignal: "bullish" | "bearish" | "neutral" = "neutral";
  if (rsiVal > 70) rsiSignal = "bearish";
  else if (rsiVal < 30) rsiSignal = "bullish";
  indicators.push({
    name: "RSI 14",
    value: Number(rsiVal.toFixed(2)),
    signal: rsiSignal,
    description:
      rsiVal > 70
        ? "Overbought (>70)"
        : rsiVal < 30
          ? "Oversold (<30)"
          : `Neutral (${rsiVal.toFixed(1)})`,
  });

  const macdResult = macd(closes);
  const macdVal = macdResult.macdLine[macdResult.macdLine.length - 1];
  const signalVal = macdResult.signalLine[macdResult.signalLine.length - 1];
  const histVal = macdResult.histogram[macdResult.histogram.length - 1];
  indicators.push({
    name: "MACD",
    value: Number(macdVal.toFixed(4)),
    signal: macdVal > signalVal ? "bullish" : "bearish",
    description: `MACD ${macdVal > signalVal ? ">" : "<"} Signal (${histVal > 0 ? "+" : ""}${histVal.toFixed(4)})`,
    details: { macd: macdVal, signal: signalVal, histogram: histVal },
  });

  const bb = bollingerBands(closes);
  const bbUpper = bb.upper[bb.upper.length - 1];
  const bbLower = bb.lower[bb.lower.length - 1];
  const bbWidth = ((bbUpper - bbLower) / lastClose) * 100;
  indicators.push({
    name: "Bollinger Bands",
    value: Number(bbWidth.toFixed(2)),
    signal:
      lastClose > bbUpper ? "bearish" : lastClose < bbLower ? "bullish" : "neutral",
    description: `BB Width: ${bbWidth.toFixed(1)}% - ${lastClose > bbUpper ? "Above upper" : lastClose < bbLower ? "Below lower" : "Within bands"}`,
    details: { upper: bbUpper, lower: bbLower, middle: bb.middle[bb.middle.length - 1] },
  });

  const stoch = stochastic(ohlc);
  const kVal = stoch.k[stoch.k.length - 1];
  const dVal = stoch.d[stoch.d.length - 1];
  let stochSignal: "bullish" | "bearish" | "neutral" = "neutral";
  if (kVal > 80) stochSignal = "bearish";
  else if (kVal < 20) stochSignal = "bullish";
  indicators.push({
    name: "Stochastic",
    value: Number(kVal.toFixed(2)),
    signal: stochSignal,
    description: `%K=${kVal.toFixed(1)}, %D=${dVal.toFixed(1)}`,
    details: { k: kVal, d: dVal },
  });

  const atrValues = atr(ohlc);
  const atrVal = atrValues[atrValues.length - 1];
  const atrPercent = (atrVal / lastClose) * 100;
  indicators.push({
    name: "ATR",
    value: Number(atrVal.toFixed(2)),
    signal: atrPercent > 3 ? "bearish" : atrPercent > 1.5 ? "neutral" : "bullish",
    description: `${atrVal.toFixed(2)} (${atrPercent.toFixed(2)}%)`,
  });

  return indicators;
}

// Detect chart patterns
export function detectPatterns(ohlc: OHLCV[]): PatternResult[] {
  const patterns: PatternResult[] = [];
  const closes = ohlc.map((d) => d.close);
  const highs = ohlc.map((d) => d.high);
  const lows = ohlc.map((d) => d.low);
  const n = ohlc.length;

  const sma20 = sma(closes, 20);
  const sma50 = sma(closes, 50);
  const lastSMA20 = sma20[n - 1];
  const lastSMA50 = sma50[n - 1];
  const trend =
    lastSMA20 > lastSMA50 ? "uptrend" : lastSMA20 < lastSMA50 ? "downtrend" : "sideways";

  patterns.push({
    name: "Trend Direction",
    detected: true,
    confidence: 75,
    description: `${trend.charAt(0).toUpperCase() + trend.slice(1)} based on SMA 20/50`,
  });

  if (n > 50) {
    const prevSMA20 = sma20[n - 5];
    const prevSMA50 = sma50[n - 5];
    if (prevSMA20 && prevSMA50) {
      if (prevSMA20 <= prevSMA50 && lastSMA20 > lastSMA50) {
        patterns.push({
          name: "Golden Cross",
          detected: true,
          confidence: 85,
          description: "SMA 20 crossed above SMA 50 - bullish signal",
          location: {
            startPrice: closes[n - 5],
            endPrice: lastSMA20,
            startDate: ohlc[n - 5].date,
            endDate: ohlc[n - 1].date,
          },
        });
      } else if (prevSMA20 >= prevSMA50 && lastSMA20 < lastSMA50) {
        patterns.push({
          name: "Death Cross",
          detected: true,
          confidence: 85,
          description: "SMA 20 crossed below SMA 50 - bearish signal",
          location: {
            startPrice: closes[n - 5],
            endPrice: lastSMA20,
            startDate: ohlc[n - 5].date,
            endDate: ohlc[n - 1].date,
          },
        });
      }
    }
  }

  const recentHighs = highs.slice(-30);
  if (recentHighs.length >= 20) {
    const max1 = Math.max(...recentHighs.slice(0, 15));
    const max2 = Math.max(...recentHighs.slice(15));
    const idx1 = recentHighs.indexOf(max1);
    const idx2 = recentHighs.slice(15).indexOf(max2) + 15;
    if (Math.abs(max1 - max2) / max1 < 0.02 && idx2 - idx1 > 3) {
      patterns.push({
        name: "Double Top",
        detected: true,
        confidence: Math.round(70 - (Math.abs(max1 - max2) / max1) * 1000),
        description: `Two similar highs at ${max1.toFixed(2)} and ${max2.toFixed(2)}`,
      });
    }
  }

  const recentLows = lows.slice(-30);
  if (recentLows.length >= 20) {
    const min1 = Math.min(...recentLows.slice(0, 15));
    const min2 = Math.min(...recentLows.slice(15));
    const idx1 = recentLows.indexOf(min1);
    const idx2 = recentLows.slice(15).indexOf(min2) + 15;
    if (Math.abs(min1 - min2) / min1 < 0.02 && idx2 - idx1 > 3) {
      patterns.push({
        name: "Double Bottom",
        detected: true,
        confidence: Math.round(70 - (Math.abs(min1 - min2) / min1) * 1000),
        description: `Two similar lows at ${min1.toFixed(2)} and ${min2.toFixed(2)}`,
      });
    }
  }

  const swingHighs: number[] = [];
  for (let i = 2; i < highs.length - 2; i++) {
    if (highs[i] > highs[i - 1] && highs[i] > highs[i - 2] && highs[i] > highs[i + 1] && highs[i] > highs[i + 2]) {
      swingHighs.push(highs[i]);
    }
  }
  if (swingHighs.length >= 3) {
    const last3 = swingHighs.slice(-3);
    if (last3[0] < last3[1] && last3[1] < last3[2]) {
      patterns.push({
        name: "Higher Highs",
        detected: true,
        confidence: 70,
        description: "Consecutive higher swing highs - bullish",
      });
    } else if (last3[0] > last3[1] && last3[1] > last3[2]) {
      patterns.push({
        name: "Lower Highs",
        detected: true,
        confidence: 70,
        description: "Consecutive lower swing highs - bearish",
      });
    }
  }

  const recentVolume = ohlc.slice(-10).map((d) => d.volume);
  const avgVolume = recentVolume.reduce((a, b) => a + b, 0) / recentVolume.length;
  const lastVolume = ohlc[ohlc.length - 1].volume;
  const volChange = ((lastVolume - avgVolume) / avgVolume) * 100;

  patterns.push({
    name: "Volume Spike",
    detected: volChange > 50,
    confidence: Math.min(Math.round(volChange), 95),
    description: volChange > 50
      ? `Volume ${volChange.toFixed(0)}% above average`
      : `Volume normal (${volChange.toFixed(0)}% vs avg)`,
  });

  return patterns;
}

// Calculate overall scores
export function calculateScores(indicators: IndicatorResult[]): AnalysisScores {
  let trendScore = 0;
  let momentumScore = 0;
  let volatilityScore = 0;
  let volumeScore = 0;

  const sma20 = indicators.find((i) => i.name === "SMA 20");
  const sma50 = indicators.find((i) => i.name === "SMA 50");
  const ema = indicators.find((i) => i.name === "EMA 12/26");

  if (sma20) trendScore += sma20.signal === "bullish" ? 25 : sma20.signal === "bearish" ? -25 : 0;
  if (sma50) trendScore += sma50.signal === "bullish" ? 25 : sma50.signal === "bearish" ? -25 : 0;
  if (ema) trendScore += ema.signal === "bullish" ? 25 : ema.signal === "bearish" ? -25 : 0;

  const rsi = indicators.find((i) => i.name === "RSI 14");
  const macd = indicators.find((i) => i.name === "MACD");
  const stoch = indicators.find((i) => i.name === "Stochastic");

  if (rsi) momentumScore += rsi.signal === "bullish" ? 30 : rsi.signal === "bearish" ? -30 : 0;
  if (macd) momentumScore += macd.signal === "bullish" ? 30 : macd.signal === "bearish" ? -30 : 0;
  if (stoch) momentumScore += stoch.signal === "bullish" ? 20 : stoch.signal === "bearish" ? -20 : 0;

  const bb = indicators.find((i) => i.name === "Bollinger Bands");
  const atr = indicators.find((i) => i.name === "ATR");

  if (bb) volatilityScore += bb.signal === "bullish" ? 30 : bb.signal === "bearish" ? -30 : 0;
  if (atr) volatilityScore += atr.signal === "bullish" ? 20 : atr.signal === "bearish" ? -20 : 10;

  volumeScore = 0;

  const overall = Math.round(
    (trendScore * 0.35 + momentumScore * 0.35 + volatilityScore * 0.2 + volumeScore * 0.1)
  );

  return {
    trend: Math.round(trendScore),
    momentum: Math.round(momentumScore),
    volatility: Math.round(volatilityScore),
    volume: Math.round(volumeScore),
    overall,
  };
}

// Convert score to signal
export function scoreToSignal(score: number): Signal {
  if (score >= 50) return "strong_buy";
  if (score >= 15) return "buy";
  if (score <= -50) return "strong_sell";
  if (score <= -15) return "sell";
  return "neutral";
}
