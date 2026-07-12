import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { trpc } from "@/providers/trpc"
import { Search, Loader2, TrendingUp, X } from "lucide-react"

interface SymbolSearchProps {
  onClose: () => void
  onSelect: (symbol: string) => void
}

export function SymbolSearch({ onClose, onSelect }: SymbolSearchProps) {
  const [query, setQuery] = useState("")

  const { data: results, isLoading } = trpc.market.searchSymbol.useQuery(
    { query },
    { enabled: query.length >= 1 }
  )

  const popularSymbols = [
    { symbol: "AAPL", name: "Apple Inc.", exchange: "NASDAQ" },
    { symbol: "MSFT", name: "Microsoft Corp.", exchange: "NASDAQ" },
    { symbol: "GOOGL", name: "Alphabet Inc.", exchange: "NASDAQ" },
    { symbol: "AMZN", name: "Amazon.com Inc.", exchange: "NASDAQ" },
    { symbol: "META", name: "Meta Platforms", exchange: "NASDAQ" },
    { symbol: "TSLA", name: "Tesla Inc.", exchange: "NASDAQ" },
    { symbol: "NVDA", name: "NVIDIA Corp.", exchange: "NASDAQ" },
    { symbol: "AMD", name: "AMD Inc.", exchange: "NASDAQ" },
    { symbol: "SPY", name: "SPDR S&P 500 ETF", exchange: "NYSE" },
    { symbol: "QQQ", name: "Invesco QQQ ETF", exchange: "NASDAQ" },
    { symbol: "BTC-USD", name: "Bitcoin USD", exchange: "CRYPTO" },
    { symbol: "ETH-USD", name: "Ethereum USD", exchange: "CRYPTO" },
  ]

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-4 w-4" /> Search Symbol
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Input
              placeholder="Search by symbol or company name..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pr-8"
              autoFocus
            />
            {query && (
              <Button variant="ghost" size="icon" className="absolute right-0 top-0 h-9 w-9" onClick={() => setQuery("")}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          <ScrollArea className="h-[300px]">
            <div className="space-y-1">
              {(results && results.length > 0
                ? results.map((r: any) => ({
                    symbol: r.symbol,
                    name: r.name || r.symbol,
                    exchange: r.exchange || "",
                  }))
                : !query
                  ? popularSymbols
                  : []
              ).map((item: { symbol: string; name: string; exchange: string }) => (
                <Button
                  key={item.symbol}
                  variant="ghost"
                  className="w-full justify-start gap-3 h-auto py-2 px-2"
                  onClick={() => onSelect(item.symbol)}
                >
                  <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                    <TrendingUp className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-sm">{item.symbol}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-[200px]">{item.name}</div>
                  </div>
                  <span className="text-xs text-muted-foreground">{item.exchange}</span>
                </Button>
              ))}

              {query && results && results.length === 0 && !isLoading && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No results found for &quot;{query}&quot;
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}
