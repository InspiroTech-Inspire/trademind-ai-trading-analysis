import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { execSync } from "child_process";
import type { OHLCV, Timeframe } from "@contracts/trading";

// Yahoo Finance timeframe mapping
const timeframeMap: Record<Timeframe, { interval: string; range: string }> = {
  "1d": { interval: "1d", range: "1y" },
  "4h": { interval: "1h", range: "6mo" },
  "1h": { interval: "1h", range: "1mo" },
  "30m": { interval: "30m", range: "1mo" },
  "15m": { interval: "15m", range: "1mo" },
  "5m": { interval: "5m", range: "5d" },
};

interface YahooOHLCV {
  timestamp: number[];
  indicators: {
    quote: Array<{
      open: number[];
      high: number[];
      low: number[];
      close: number[];
      volume: number[];
    }>;
  };
}

function fetchYahooData(symbol: string, interval: string, range: string): YahooOHLCV {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    symbol
  )}?interval=${interval}&range=${range}&includeAdjustedClose=true`;

  try {
    const output = execSync(`python3 -c "
import json
import urllib.request
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

url = '${url}'
try:
    with urllib.request.urlopen(url, context=ctx, timeout=15) as response:
        data = json.loads(response.read().decode())
        result = data['chart']['result'][0]
        timestamps = result['timestamp']
        quote = result['indicators']['quote'][0]
        print(json.dumps({
            'timestamp': timestamps,
            'indicators': {'quote': [quote]}
        }))
except Exception as e:
    print(json.dumps({'error': str(e)}))
"`, { timeout: 20000, encoding: "utf-8" });

    const parsed = JSON.parse(output);
    if (parsed.error) {
      throw new Error(parsed.error);
    }
    return parsed;
  } catch (error) {
    console.error(`Failed to fetch Yahoo data for ${symbol}:`, error);
    return generateMockData(symbol);
  }
}

function generateMockData(symbol: string): YahooOHLCV {
  const timestamps: number[] = [];
  const quote: { open: number[]; high: number[]; low: number[]; close: number[]; volume: number[] } = { open: [], high: [], low: [], close: [], volume: [] };
  const now = Math.floor(Date.now() / 1000);
  let price = symbol === "BTC-USD" ? 65000 : symbol === "ETH-USD" ? 3500 : 150;

  for (let i = 252; i >= 0; i--) {
    timestamps.push(now - i * 86400);
    const change = (Math.random() - 0.48) * price * 0.02;
    const open = price;
    price = price + change;
    const high = Math.max(open, price) * (1 + Math.random() * 0.01);
    const low = Math.min(open, price) * (1 - Math.random() * 0.01);
    quote.open.push(Number(open.toFixed(2)));
    quote.high.push(Number(high.toFixed(2)));
    quote.low.push(Number(low.toFixed(2)));
    quote.close.push(Number(price.toFixed(2)));
    quote.volume.push(Math.floor(Math.random() * 10000000) + 1000000);
  }

  return {
    timestamp: timestamps,
    indicators: { quote: [quote] },
  };
}

export const marketRouter = createRouter({
  getHistoricalData: publicQuery
    .input(
      z.object({
        symbol: z.string().toUpperCase(),
        timeframe: z.enum(["1d", "4h", "1h", "30m", "15m", "5m"]),
      })
    )
    .query(({ input }) => {
      const { symbol, timeframe } = input;
      const tf = timeframeMap[timeframe];
      const data = fetchYahooData(symbol, tf.interval, tf.range);

      const quote = data.indicators.quote[0];
      const ohlcv: OHLCV[] = [];

      for (let i = 0; i < data.timestamp.length; i++) {
        if (
          quote.open[i] !== null &&
          quote.high[i] !== null &&
          quote.low[i] !== null &&
          quote.close[i] !== null
        ) {
          ohlcv.push({
            date: new Date(data.timestamp[i] * 1000).toISOString(),
            open: quote.open[i],
            high: quote.high[i],
            low: quote.low[i],
            close: quote.close[i],
            volume: quote.volume[i] || 0,
          });
        }
      }

      return ohlcv;
    }),

  getQuote: publicQuery
    .input(z.object({ symbol: z.string().toUpperCase() }))
    .query(({ input }) => {
      const { symbol } = input;
      try {
        const output = execSync(
          `python3 -c "
import json
import urllib.request
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

url = 'https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=5d'
try:
    with urllib.request.urlopen(url, context=ctx, timeout=10) as response:
        data = json.loads(response.read().decode())
        result = data['chart']['result'][0]
        meta = result['meta']
        timestamps = result['timestamp']
        quote = result['indicators']['quote'][0]
        last_idx = len([c for c in quote['close'] if c is not None]) - 1
        
        print(json.dumps({
            'symbol': meta['symbol'],
            'price': quote['close'][last_idx],
            'open': meta.get('regularMarketPrice', quote['close'][last_idx]),
            'high': meta.get('regularMarketDayHigh', max(quote['high'])),
            'low': meta.get('regularMarketDayLow', min(quote['low'])),
            'volume': sum([v for v in quote['volume'] if v]) if quote['volume'] else 0,
            'previousClose': meta.get('previousClose', meta.get('chartPreviousClose', quote['close'][0])),
            'change': 0,
            'changePercent': 0
        }))
except Exception as e:
    print(json.dumps({'error': str(e)}))
"`,
          { timeout: 15000, encoding: "utf-8" }
        );

        const parsed = JSON.parse(output);
        if (parsed.error) {
          throw new Error(parsed.error);
        }

        parsed.change = parsed.price - parsed.previousClose;
        parsed.changePercent = (parsed.change / parsed.previousClose) * 100;

        return parsed;
      } catch (error) {
        console.error(`Failed to fetch quote for ${symbol}:`, error);
        return {
          symbol,
          price: 0,
          open: 0,
          high: 0,
          low: 0,
          volume: 0,
          previousClose: 0,
          change: 0,
          changePercent: 0,
        };
      }
    }),

  getMultipleQuotes: publicQuery
    .input(z.object({ symbols: z.array(z.string().toUpperCase()) }))
    .query(async ({ input }) => {
      const { symbols } = input;
      const results: Record<string, any> = {};

      for (const symbol of symbols) {
        try {
          const output = execSync(
            `python3 -c "
import json
import urllib.request
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

url = 'https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=5d'
try:
    with urllib.request.urlopen(url, context=ctx, timeout=10) as response:
        data = json.loads(response.read().decode())
        result = data['chart']['result'][0]
        meta = result['meta']
        quote = result['indicators']['quote'][0]
        closes = [c for c in quote['close'] if c is not None]
        last_close = closes[-1] if closes else 0
        prev_close = meta.get('previousClose', meta.get('chartPreviousClose', closes[0] if closes else last_close))
        change = last_close - prev_close
        
        print(json.dumps({
            'symbol': meta['symbol'],
            'price': last_close,
            'change': change,
            'changePercent': (change / prev_close * 100) if prev_close else 0
        }))
except Exception as e:
    print(json.dumps({'error': str(e)}))
"`,
            { timeout: 15000, encoding: "utf-8" }
          );
          const parsed = JSON.parse(output);
          if (!parsed.error) {
            results[symbol] = parsed;
          }
        } catch (e) {
          // Skip failed symbols
        }
      }

      return results;
    }),

  searchSymbol: publicQuery
    .input(z.object({ query: z.string().min(1) }))
    .query(({ input }) => {
      const { query } = input;
      try {
        const output = execSync(
          `python3 -c "
import json
import urllib.request
import ssl
import urllib.parse

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

q = urllib.parse.quote('${query}')
url = f'https://query2.finance.yahoo.com/v1/finance/search?q={q}&quotesCount=10&newsCount=0'
try:
    with urllib.request.urlopen(url, context=ctx, timeout=10) as response:
        data = json.loads(response.read().decode())
        quotes = data.get('quotes', [])
        results = [{'symbol': q.get('symbol', ''), 'name': q.get('shortname', q.get('longname', '')), 'exchange': q.get('exchange', ''), 'type': q.get('quoteType', '')} for q in quotes if q.get('symbol')]
        print(json.dumps(results[:8]))
except Exception as e:
    print(json.dumps([]))
"`,
          { timeout: 15000, encoding: "utf-8" }
        );
        return JSON.parse(output);
      } catch {
        return [];
      }
    }),
});
