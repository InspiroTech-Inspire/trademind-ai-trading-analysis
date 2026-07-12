import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { trpc } from "@/providers/trpc"
import {
  Layers,
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  Clock,
  BarChart3,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Timeframe, Signal } from "@contracts/trading"

interface TopDownPanelProps {
  symbol: string
}

const SIGNAL_STYLES: Record<Signal, { color: string; bg: string; icon: typeof TrendingUp }> = {
  strong_buy: { color: "text-green-600", bg: "bg-green-500", icon: TrendingUp },
  buy: { color: "text-green-500", bg: "bg-green-400", icon: TrendingUp },
  neutral: { color: "text-yellow-500", bg: "bg-yellow-400", icon: Minus },
  sell: { color: "text-red-500", bg: "bg-red-400", icon: TrendingDown },
  strong_sell: { color: "text-red-600", bg: "bg-red-500", icon: TrendingDown },
}

const TIMEFRAME_LABELS: Record<Timeframe, string> = {
  "1d": "Daily", "4h": "4 Hour", "1h": "1 Hour", "30m": "30 Minute", "15m": "15 Minute", "5m": "5 Minute",
}

export function TopDownPanel({ symbol }: TopDownPanelProps) {
  const { data: topDown, isLoading } = trpc.analysis.topDownAnalysis.useQuery(
    { symbol },
    { refetchInterval: 60000 }
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!topDown) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <Layers className="h-8 w-8 mb-2" />
        <p>No top-down analysis available</p>
      </div>
    )
  }

  const overallStyle = SIGNAL_STYLES[topDown.overallSignal]
  const OverallIcon = overallStyle.icon

  const bullishCount = topDown.timeframes.filter((t) => t.signal === "strong_buy" || t.signal === "buy").length
  const bearishCount = topDown.timeframes.filter((t) => t.signal === "strong_sell" || t.signal === "sell").length
  const neutralCount = topDown.timeframes.filter((t) => t.signal === "neutral").length

  return (
    <div className="space-y-6">
      <Card className={cn("border-2",
        topDown.overallSignal === "strong_buy" || topDown.overallSignal === "buy" ? "border-green-500/30 bg-green-500/5"
        : topDown.overallSignal === "strong_sell" || topDown.overallSignal === "sell" ? "border-red-500/30 bg-red-500/5"
        : "border-yellow-500/30 bg-yellow-500/5"
      )}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn("w-12 h-12 rounded-full flex items-center justify-center text-white", overallStyle.bg)}>
                <OverallIcon className="h-6 w-6" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Overall Signal</div>
                <div className="text-2xl font-bold">
                  {topDown.overallSignal === "strong_buy" && "Strong Buy"}
                  {topDown.overallSignal === "buy" && "Buy"}
                  {topDown.overallSignal === "neutral" && "Neutral"}
                  {topDown.overallSignal === "sell" && "Sell"}
                  {topDown.overallSignal === "strong_sell" && "Strong Sell"}
                </div>
              </div>
            </div>
            <div className="text-right space-y-1">
              <div className="text-sm text-muted-foreground">Timeframe Alignment</div>
              <div className="text-2xl font-bold">{topDown.alignment}%</div>
              <Progress value={topDown.alignment} className="w-32 h-2" />
            </div>
          </div>

          <Separator className="my-4" />

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="flex items-center justify-center gap-1 text-green-500">
                <ArrowUp className="h-4 w-4" /><span className="text-lg font-bold">{bullishCount}</span>
              </div>
              <div className="text-xs text-muted-foreground">Bullish</div>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-yellow-500">
                <Minus className="h-4 w-4" /><span className="text-lg font-bold">{neutralCount}</span>
              </div>
              <div className="text-xs text-muted-foreground">Neutral</div>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-red-500">
                <ArrowDown className="h-4 w-4" /><span className="text-lg font-bold">{bearishCount}</span>
              </div>
              <div className="text-xs text-muted-foreground">Bearish</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <p className="text-sm leading-relaxed">{topDown.summary}</p>
          </div>
        </CardContent>
      </Card>

      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <Clock className="h-4 w-4" /> Timeframe Analysis (1D to 5M)
        </h3>
        <div className="space-y-2">
          {topDown.timeframes.map((tf) => {
            const style = SIGNAL_STYLES[tf.signal]
            const TfIcon = style.icon
            const isHigherTF = ["1d", "4h", "1h"].includes(tf.timeframe)

            return (
              <Card key={tf.timeframe} className={cn("transition-all", isHigherTF ? "border-l-4 border-l-primary" : "border-l-2 border-l-muted")}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs w-12 justify-center">{tf.timeframe.toUpperCase()}</Badge>
                        {isHigherTF && <Badge variant="secondary" className="text-[10px]">Higher TF</Badge>}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{TIMEFRAME_LABELS[tf.timeframe]}</div>
                        <div className="text-xs text-muted-foreground">{tf.keyLevel}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className={cn("text-sm font-bold", tf.score > 0 ? "text-green-500" : tf.score < 0 ? "text-red-500" : "text-yellow-500")}>
                          {tf.score > 0 ? "+" : ""}{tf.score}
                        </div>
                      </div>
                      <Badge className={cn("gap-1 text-white border-0", style.bg)}>
                        <TfIcon className="h-3 w-3" />
                        {tf.signal === "strong_buy" && "Strong Buy"}
                        {tf.signal === "buy" && "Buy"}
                        {tf.signal === "neutral" && "Neutral"}
                        {tf.signal === "sell" && "Sell"}
                        {tf.signal === "strong_sell" && "Strong Sell"}
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-2">
                    <Progress value={Math.max(0, Math.min(100, 50 + tf.score))} className={cn("h-1.5", tf.score > 0 ? "bg-green-500/20" : tf.score < 0 ? "bg-red-500/20" : "bg-yellow-500/20")} />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4" /> Signal Flow
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            {topDown.timeframes.map((tf, i) => {
              const style = SIGNAL_STYLES[tf.signal]
              return (
                <div key={tf.timeframe} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold", style.bg)}>
                      {tf.timeframe === "1d" ? "D" : tf.timeframe.replace("m", "")}
                    </div>
                  </div>
                  {i < topDown.timeframes.length - 1 && (
                    <div className={cn("w-8 h-0.5 mx-1", tf.signal === topDown.timeframes[i + 1].signal ? "bg-primary" : "bg-muted")} />
                  )}
                </div>
              )
            })}
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
            <span>Higher Timeframe &rarr;</span>
            <span>&rarr; Lower Timeframe</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
