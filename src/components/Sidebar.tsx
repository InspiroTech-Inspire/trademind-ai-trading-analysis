import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  LayoutDashboard,
  Search,
  BarChart3,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  Activity,
  TrendingUp,
  Zap,
  Shield,
} from "lucide-react"
import { useState } from "react"
import { SymbolSearch } from "./SymbolSearch"

interface SidebarProps {
  open: boolean
  setOpen: (open: boolean) => void
}

export function Sidebar({ open, setOpen }: SidebarProps) {
  const [activeSection, setActiveSection] = useState("dashboard")
  const [showSearch, setShowSearch] = useState(false)

  const navItems = [
    { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { id: "scanner", icon: Search, label: "Scanner" },
    { id: "indicators", icon: BarChart3, label: "Indicators" },
    { id: "patterns", icon: Activity, label: "Patterns" },
    { id: "topdown", icon: TrendingUp, label: "Top-Down Analysis" },
    { id: "alerts", icon: Bell, label: "Alerts" },
    { id: "settings", icon: Settings, label: "Settings" },
  ]

  return (
    <>
      <div
        className={cn(
          "flex flex-col border-r bg-card transition-all duration-300",
          open ? "w-64" : "w-16"
        )}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b">
          {open ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Zap className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg tracking-tight">TradeMind</span>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center mx-auto">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
          )}
          <Button variant="ghost" size="icon" className={cn("h-8 w-8", !open && "hidden")} onClick={() => setOpen(false)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        {!open && (
          <Button variant="ghost" size="icon" className="h-8 w-8 mx-auto mt-2" onClick={() => setOpen(true)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}

        <ScrollArea className="flex-1 py-2">
          <div className="space-y-1 px-2">
            {open && (
              <Button variant="outline" className="w-full justify-start gap-2 mb-2" onClick={() => setShowSearch(true)}>
                <Search className="h-4 w-4" /> Search symbol...
              </Button>
            )}
            {!open && (
              <Button variant="ghost" size="icon" className="w-full h-10 flex justify-center" onClick={() => setShowSearch(true)}>
                <Search className="h-4 w-4" />
              </Button>
            )}

            <Separator className="my-2" />

            {navItems.map((item) => (
              <Button
                key={item.id}
                variant={activeSection === item.id ? "secondary" : "ghost"}
                className={cn("w-full", open ? "justify-start gap-3" : "justify-center h-10 px-0")}
                onClick={() => setActiveSection(item.id)}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {open && <span className="text-sm">{item.label}</span>}
                {open && item.id === "alerts" && (
                  <Badge variant="destructive" className="ml-auto h-5 w-5 rounded-full p-0 text-[10px] flex items-center justify-center">3</Badge>
                )}
              </Button>
            ))}
          </div>
        </ScrollArea>

        <div className="p-4 border-t">
          {open ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Shield className="h-3 w-3" />
              <span>TradeMind AI v1.0</span>
            </div>
          ) : (
            <Shield className="h-3 w-3 text-muted-foreground mx-auto" />
          )}
        </div>
      </div>

      {showSearch && <SymbolSearch onClose={() => setShowSearch(false)} onSelect={(symbol) => {
        setShowSearch(false)
        window.dispatchEvent(new CustomEvent('symbolSelect', { detail: symbol }))
      }} />}
    </>
  )
}
