import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  BarChart3,
  Gauge,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { FullAnalysis } from "@contracts/trading"

interface IndicatorPanelProps {
  analysis: FullAnalysis | null | undefined
  isLoading: boolean
}

const getSignalIcon = (signal: string) => {
  switch (signal) {
    case "bullish": return <TrendingUp className="h-4 w-4 text-green-500" />
    case "bearish": return <TrendingDown className="h-4 w-4 text-red-500" />
    default: return <Minus className="h-4 w-4 text-yellow-500" />
  }
}

const getSignalColor = (signal: string) => {
  switch (signal) {
    case "bullish": return "bg-green-500/10 text-green-500 border-green-500/20"
    case "bearish": return "bg-red-500/10 text-red-500 border-red-500/20"
    default: return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
  }
}

export function IndicatorPanel({ analysis, isLoading }: IndicatorPanelProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!analysis || !analysis.indicators.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <Activity className="h-8 w-8 mb-2" />
        <p>No indicator data available</p>
      </div>
    )
  }

  const trendIndicators = analysis.indicators.filter((i) => ["SMA 20", "SMA 50", "EMA 12/26"].includes(i.name))
  const momentumIndicators = analysis.indicators.filter((i) => ["RSI 14", "MACD", "Stochastic"].includes(i.name))
  const volatilityIndicators = analysis.indicators.filter((i) => ["Bollinger Bands", "ATR"].includes(i.name))

  return (
    <div className="space-y-6">
      <Card className={cn("border-2",
        analysis.signal === "strong_buy" || analysis.signal === "buy" ? "border-green-500/30 bg-green-500/5"
        : analysis.signal === "strong_sell" || analysis.signal === "sell" ? "border-red-500/30 bg-red-500/5"
        : "border-yellow-500/30 bg-yellow-500/5"
      )}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Gauge className="h-6 w-6" />
              <div>
                <div className="text-sm text-muted-foreground">Technical Bias</div>
                <div className="text-lg font-bold">
                  {analysis.signal === "strong_buy" && "Strongly Bullish"}
                  {analysis.signal === "buy" && "Bullish"}
                  {analysis.signal === "neutral" && "Neutral"}
                  {analysis.signal === "sell" && "Bearish"}
                  {analysis.signal === "strong_sell" && "Strongly Bearish"}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Overall Score</div>
              <div className={cn("text-2xl font-bold", analysis.scores.overall > 0 ? "text-green-500" : analysis.scores.overall < 0 ? "text-red-500" : "text-yellow-500")}>
                {analysis.scores.overall > 0 ? "+" : ""}{analysis.scores.overall}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" /> Trend Indicators
        </h3>
        <div className="grid gap-2">
          {trendIndicators.map((ind) => <IndicatorCard key={ind.name} indicator={ind} />)}
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <Zap className="h-4 w-4" /> Momentum Indicators
        </h3>
        <div className="grid gap-2">
          {momentumIndicators.map((ind) => <IndicatorCard key={ind.name} indicator={ind} />)}
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <BarChart3 className="h-4 w-4" /> Volatility Indicators
        </h3>
        <div className="grid gap-2">
          {volatilityIndicators.map((ind) => <IndicatorCard key={ind.name} indicator={ind} />)}
        </div>
      </div>
    </div>
  )
}

function IndicatorCard({ indicator }: { indicator: FullAnalysis["indicators"][0] }) {
  const valuePercent =
    indicator.name === "RSI 14" ? Math.min(100, Math.max(0, indicator.value))
    : indicator.name === "Stochastic" ? Math.min(100, Math.max(0, indicator.value))
    : indicator.name === "MACD" ? 50 + indicator.value * 10
    : 50

  return (
    <Card className="hover:bg-muted/30 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getSignalIcon(indicator.signal)}
            <div>
              <div className="font-medium">{indicator.name}</div>
              <div className="text-sm text-muted-foreground">{indicator.description}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className={cn("font-mono", getSignalColor(indicator.signal))}>
              {indicator.value.toFixed ? indicator.value.toFixed(2) : indicator.value}
            </Badge>
            {indicator.signal === "bullish" && <ArrowUpRight className="h-4 w-4 text-green-500" />}
            {indicator.signal === "bearish" && <ArrowDownRight className="h-4 w-4 text-red-500" />}
          </div>
        </div>
        {(indicator.name === "RSI 14" || indicator.name === "Stochastic" || indicator.name === "MACD") && (
          <div className="mt-2"><Progress value={Math.min(100, Math.max(0, valuePercent))} className="h-1.5" /></div>
        )}
        {indicator.details && (
          <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
            {Object.entries(indicator.details).map(([key, value]) => (
              <span key={key}>{key}: {typeof value === "number" ? value.toFixed(4) : value}</span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
