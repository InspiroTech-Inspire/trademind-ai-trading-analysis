import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { trpc } from "@/providers/trpc"
import {
  Plus,
  TrendingUp,
  TrendingDown,
  ListPlus,
  X,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { DEFAULT_SYMBOLS } from "@contracts/trading"

interface WatchlistPanelProps {
  selectedSymbol: string
  onSelectSymbol: (symbol: string) => void
}

export function WatchlistPanel({ selectedSymbol, onSelectSymbol }: WatchlistPanelProps) {
  const [newSymbol, setNewSymbol] = useState("")
  const [showAdd, setShowAdd] = useState(false)

  const { data: quotes, isLoading } = trpc.market.getMultipleQuotes.useQuery(
    { symbols: DEFAULT_SYMBOLS },
    { refetchInterval: 30000 }
  )

  const handleAddSymbol = () => {
    if (newSymbol.trim()) {
      onSelectSymbol(newSymbol.trim().toUpperCase())
      setNewSymbol("")
      setShowAdd(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Watchlist</h2>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowAdd(!showAdd)}>
            {showAdd ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          </Button>
        </div>

        {showAdd && (
          <div className="flex gap-1">
            <Input placeholder="Symbol..." value={newSymbol} onChange={(e) => setNewSymbol(e.target.value)} className="h-8 text-xs" onKeyDown={(e) => e.key === "Enter" && handleAddSymbol()} autoFocus />
            <Button size="sm" className="h-8 px-2" onClick={handleAddSymbol}><ListPlus className="h-3.5 w-3.5" /></Button>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="divide-y">
            {DEFAULT_SYMBOLS.map((symbol) => {
              const quote = quotes?.[symbol]
              const changePercent = quote?.changePercent || 0
              const isSelected = selectedSymbol === symbol

              return (
                <button
                  key={symbol}
                  className={cn(
                    "w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors flex items-center justify-between",
                    isSelected && "bg-primary/5 border-l-2 border-l-primary"
                  )}
                  onClick={() => onSelectSymbol(symbol)}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", changePercent >= 0 ? "bg-green-500" : "bg-red-500")} />
                    <div>
                      <div className={cn("font-medium text-sm", isSelected && "text-primary")}>{symbol}</div>
                      <div className="text-xs text-muted-foreground">${quote?.price?.toFixed(2) || "--"}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={cn("text-xs font-medium flex items-center gap-0.5", changePercent >= 0 ? "text-green-500" : "text-red-500")}>
                      {changePercent >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {changePercent >= 0 ? "+" : ""}{changePercent.toFixed(2)}%
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </ScrollArea>

      <div className="p-3 border-t bg-muted/30">
        <div className="text-[10px] text-muted-foreground text-center">
          {DEFAULT_SYMBOLS.length} symbols - Auto-refresh 30s
        </div>
      </div>
    </div>
  )
}
