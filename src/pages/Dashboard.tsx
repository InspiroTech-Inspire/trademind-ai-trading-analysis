import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { trpc } from "@/providers/trpc"
import { toast } from "sonner"
import {
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  Layers,
  Search,
  RefreshCw,
  Target,
  Minus,
  ChevronUp,
  ChevronDown,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Timeframe, Signal } from "@contracts/trading"
import { TIMEFRAMES } from "@contracts/trading"
import { TradingViewChart } from "@/components/TradingViewChart"
import { IndicatorPanel } from "@/components/IndicatorPanel"
import { PatternPanel } from "@/components/PatternPanel"
import { TopDownPanel } from "@/components/TopDownPanel"
import { WatchlistPanel } from "@/components/WatchlistPanel"
import { AnalysisScoreCard } from "@/components/AnalysisScoreCard"

const SIGNAL_CONFIG: Record<
  Signal,
  { color: string; bg: string; icon: typeof TrendingUp; label: string }
> = {
  strong_buy: { color: "text-green-600", bg: "bg-green-50 dark:bg-green-950", icon: TrendingUp, label: "Strong Buy" },
  buy: { color: "text-green-500", bg: "bg-green-50/50 dark:bg-green-950/50", icon: TrendingUp, label: "Buy" },
  neutral: { color: "text-yellow-500", bg: "bg-yellow-50 dark:bg-yellow-950", icon: Minus, label: "Neutral" },
  sell: { color: "text-red-500", bg: "bg-red-50/50 dark:bg-red-950/50", icon: TrendingDown, label: "Sell" },
  strong_sell: { color: "text-red-600", bg: "bg-red-50 dark:bg-red-950", icon: TrendingDown, label: "Strong Sell" },
}

export default function Dashboard() {
  const [selectedSymbol, setSelectedSymbol] = useState("AAPL")
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>("1d")
  const [activeTab, setActiveTab] = useState("chart")

  useEffect(() => {
    const handler = (e: Event) => {
      const symbol = (e as CustomEvent).detail
      setSelectedSymbol(symbol)
      setActiveTab("chart")
    }
    window.addEventListener("symbolSelect", handler)
    return () => window.removeEventListener("symbolSelect", handler)
  }, [])

  const { data: quote } = trpc.market.getQuote.useQuery(
    { symbol: selectedSymbol },
    { refetchInterval: 30000 }
  )

  const {
    data: analysis,
    isLoading: analysisLoading,
    refetch: refetchAnalysis,
  } = trpc.analysis.analyze.useQuery(
    { symbol: selectedSymbol, timeframe: selectedTimeframe },
    { refetchInterval: 60000 }
  )

  const handleRefresh = useCallback(() => {
    refetchAnalysis()
    toast.success(`Updated analysis for ${selectedSymbol} on ${selectedTimeframe}`)
  }, [refetchAnalysis, selectedSymbol, selectedTimeframe])

  const signalConfig = analysis ? SIGNAL_CONFIG[analysis.signal] : SIGNAL_CONFIG.neutral
  const SignalIcon = signalConfig.icon

  return (
    <div className="flex h-full">
      {/* Watchlist Sidebar */}
      <div className="w-72 border-r bg-card shrink-0">
        <WatchlistPanel
          selectedSymbol={selectedSymbol}
          onSelectSymbol={setSelectedSymbol}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Symbol Header */}
        <div className="border-b bg-card px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{selectedSymbol}</h1>
                {quote && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xl font-semibold">${quote.price?.toFixed(2)}</span>
                    <span
                      className={cn(
                        "text-sm font-medium flex items-center gap-0.5",
                        (quote.changePercent || 0) >= 0 ? "text-green-500" : "text-red-500"
                      )}
                    >
                      {(quote.changePercent || 0) >= 0 ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                      {quote.change?.toFixed(2)} ({quote.changePercent?.toFixed(2)}%)
                    </span>
                  </div>
                )}
              </div>

              {analysis && (
                <Badge
                  variant="outline"
                  className={cn("gap-1.5 px-3 py-1.5", signalConfig.bg)}
                >
                  <SignalIcon className={cn("h-3.5 w-3.5", signalConfig.color)} />
                  <span className={cn("font-semibold", signalConfig.color)}>
                    {signalConfig.label}
                  </span>
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center bg-muted rounded-lg p-0.5">
                {TIMEFRAMES.map((tf) => (
                  <Button
                    key={tf.value}
                    variant={selectedTimeframe === tf.value ? "secondary" : "ghost"}
                    size="sm"
                    className="h-7 px-2.5 text-xs font-medium"
                    onClick={() => setSelectedTimeframe(tf.value)}
                  >
                    {tf.label}
                  </Button>
                ))}
              </div>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleRefresh}>
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Score cards */}
          {analysis && (
            <div className="grid grid-cols-5 gap-2 mt-4">
              <AnalysisScoreCard label="Trend" score={analysis.scores.trend} icon={TrendingUp} />
              <AnalysisScoreCard label="Momentum" score={analysis.scores.momentum} icon={Activity} />
              <AnalysisScoreCard label="Volatility" score={analysis.scores.volatility} icon={BarChart3} />
              <AnalysisScoreCard label="Volume" score={analysis.scores.volume} icon={Layers} />
              <AnalysisScoreCard label="Overall" score={analysis.scores.overall} icon={Target} highlight />
            </div>
          )}
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <div className="border-b bg-card px-6">
            <TabsList className="w-full justify-start bg-transparent h-12 p-0 gap-1">
              <TabsTrigger value="chart" className="data-[state=active]:bg-muted gap-1.5">
                <BarChart3 className="h-3.5 w-3.5" /> Chart
              </TabsTrigger>
              <TabsTrigger value="indicators" className="data-[state=active]:bg-muted gap-1.5">
                <Activity className="h-3.5 w-3.5" /> Indicators
              </TabsTrigger>
              <TabsTrigger value="patterns" className="data-[state=active]:bg-muted gap-1.5">
                <Target className="h-3.5 w-3.5" /> Patterns
              </TabsTrigger>
              <TabsTrigger value="topdown" className="data-[state=active]:bg-muted gap-1.5">
                <Layers className="h-3.5 w-3.5" /> Top-Down
              </TabsTrigger>
              <TabsTrigger value="scanner" className="data-[state=active]:bg-muted gap-1.5">
                <Search className="h-3.5 w-3.5" /> Scanner
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-auto">
            <TabsContent value="chart" className="h-full m-0">
              <TradingViewChart symbol={selectedSymbol} timeframe={selectedTimeframe} />
            </TabsContent>

            <TabsContent value="indicators" className="m-0 p-6">
              <IndicatorPanel analysis={analysis} isLoading={analysisLoading} />
            </TabsContent>

            <TabsContent value="patterns" className="m-0 p-6">
              <PatternPanel analysis={analysis} isLoading={analysisLoading} />
            </TabsContent>

            <TabsContent value="topdown" className="m-0 p-6">
              <TopDownPanel symbol={selectedSymbol} />
            </TabsContent>

            <TabsContent value="scanner" className="m-0 p-6">
              <ScannerPanel />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}

// Scanner Panel Component
function ScannerPanel() {
  const [scanFilter, setScanFilter] = useState<"all" | "bullish" | "bearish">("all")
  const symbols = ["AAPL", "MSFT", "GOOGL", "AMZN", "META", "TSLA", "NVDA", "AMD", "SPY", "QQQ"]

  const { data: scanResults, isLoading } = trpc.analysis.scanWatchlist.useQuery({
    symbols,
    timeframe: "1d",
  })

  const filtered = scanResults?.filter((r) => {
    if (scanFilter === "bullish") return r.signal === "buy" || r.signal === "strong_buy"
    if (scanFilter === "bearish") return r.signal === "sell" || r.signal === "strong_sell"
    return true
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Market Scanner</h2>
        <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
          <Button variant={scanFilter === "all" ? "secondary" : "ghost"} size="sm" className="h-7 px-3 text-xs" onClick={() => setScanFilter("all")}>All</Button>
          <Button variant={scanFilter === "bullish" ? "secondary" : "ghost"} size="sm" className="h-7 px-3 text-xs" onClick={() => setScanFilter("bullish")}>Bullish</Button>
          <Button variant={scanFilter === "bearish" ? "secondary" : "ghost"} size="sm" className="h-7 px-3 text-xs" onClick={() => setScanFilter("bearish")}>Bearish</Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-2">
          {filtered?.map((result) => {
            const sigCfg = SIGNAL_CONFIG[result.signal]
            const SigIcon = sigCfg.icon
            return (
              <Card key={result.symbol} className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", sigCfg.bg)}>
                        <SigIcon className={cn("h-5 w-5", sigCfg.color)} />
                      </div>
                      <div>
                        <div className="font-semibold">{result.symbol}</div>
                        <div className="text-sm text-muted-foreground">
                          ${result.price.toFixed(2)}
                          <span className={cn("ml-2", result.changePercent >= 0 ? "text-green-500" : "text-red-500")}>
                            {result.changePercent >= 0 ? "+" : ""}{result.changePercent.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">Overall Score</div>
                        <div className={cn("font-bold text-lg", result.scores.overall > 0 ? "text-green-500" : result.scores.overall < 0 ? "text-red-500" : "text-yellow-500")}>
                          {result.scores.overall > 0 ? "+" : ""}{result.scores.overall}
                        </div>
                      </div>
                      <Badge variant="outline" className={cn(sigCfg.bg)}>
                        <span className={sigCfg.color}>{sigCfg.label}</span>
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
