import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Bell } from "lucide-react"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface TopBarProps {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

export function TopBar({ sidebarOpen, setSidebarOpen }: TopBarProps) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [marketStatus, setMarketStatus] = useState<"open" | "closed" | "pre">("closed")

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date()
      setCurrentTime(now)

      const hour = now.getHours()
      const day = now.getDay()
      if (day >= 1 && day <= 5) {
        if (hour >= 9 && hour < 16) setMarketStatus("open")
        else if (hour >= 8 && hour < 9) setMarketStatus("pre")
        else setMarketStatus("closed")
      } else {
        setMarketStatus("closed")
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <header className="h-16 border-b bg-card flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-4">
        {!sidebarOpen && (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSidebarOpen(true)}>
            <Search className="h-4 w-4" />
          </Button>
        )}
        <div className="flex items-center gap-2">
          <Badge variant={marketStatus === "open" ? "default" : marketStatus === "pre" ? "secondary" : "outline"} className="text-xs">
            <span className={cn("w-1.5 h-1.5 rounded-full mr-1", marketStatus === "open" ? "bg-green-400" : marketStatus === "pre" ? "bg-yellow-400" : "bg-red-400")} />
            {marketStatus === "open" ? "Market Open" : marketStatus === "pre" ? "Pre-Market" : "Market Closed"}
          </Badge>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-mono">
            {currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
          </span>
          <span>UTC</span>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 relative">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
        </Button>
      </div>
    </header>
  )
}
