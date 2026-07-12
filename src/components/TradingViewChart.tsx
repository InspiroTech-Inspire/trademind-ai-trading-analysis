import { useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import type { Timeframe } from "@contracts/trading"

interface TradingViewChartProps {
  symbol: string
  timeframe: Timeframe
}

const TIMEFRAME_MAP: Record<Timeframe, string> = {
  "1d": "D",
  "4h": "240",
  "1h": "60",
  "30m": "30",
  "15m": "15",
  "5m": "5",
}

export function TradingViewChart({ symbol, timeframe }: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const scriptRef = useRef<HTMLScriptElement | null>(null)

  useEffect(() => {
    if (scriptRef.current && scriptRef.current.parentNode) {
      scriptRef.current.parentNode.removeChild(scriptRef.current)
      scriptRef.current = null
    }

    if (containerRef.current) {
      containerRef.current.innerHTML = ""
    }

    const tvSymbol = symbol.includes("-")
      ? symbol === "BTC-USD" ? "BINANCE:BTCUSDT" : symbol === "ETH-USD" ? "BINANCE:ETHUSDT" : symbol
      : `NASDAQ:${symbol}`

    const script = document.createElement("script")
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js"
    script.type = "text/javascript"
    script.async = true
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: tvSymbol,
      interval: TIMEFRAME_MAP[timeframe] || "D",
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "en",
      enable_publishing: false,
      backgroundColor: "rgba(10, 10, 15, 1)",
      gridColor: "rgba(42, 46, 57, 0.2)",
      withdateranges: true,
      hide_side_toolbar: false,
      allow_symbol_change: true,
      details: true,
      hotlist: true,
      calendar: false,
      show_popup_button: true,
      popup_width: "1000",
      popup_height: "650",
      support_host: "https://www.tradingview.com",
    })

    scriptRef.current = script

    if (containerRef.current) {
      const widgetContainer = document.createElement("div")
      widgetContainer.className = "tradingview-widget-container"
      widgetContainer.style.height = "100%"
      widgetContainer.style.width = "100%"

      const widget = document.createElement("div")
      widget.className = "tradingview-widget-container__widget"
      widget.style.height = "calc(100% - 32px)"
      widget.style.width = "100%"

      widgetContainer.appendChild(widget)
      widgetContainer.appendChild(script)
      containerRef.current.appendChild(widgetContainer)
    }

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [symbol, timeframe])

  return (
    <Card className="h-full border-0 rounded-none">
      <CardContent className="p-0 h-full">
        <div ref={containerRef} className="h-full w-full" />
      </CardContent>
    </Card>
  )
}
