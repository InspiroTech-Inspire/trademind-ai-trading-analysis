import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface AnalysisScoreCardProps {
  label: string
  score: number
  icon: LucideIcon
  highlight?: boolean
}

export function AnalysisScoreCard({ label, score, icon: Icon, highlight }: AnalysisScoreCardProps) {
  const isPositive = score > 0
  const isNegative = score < 0
  const absScore = Math.abs(score)

  return (
    <Card className={cn("transition-all", highlight && "border-primary/50 bg-primary/5")}>
      <CardContent className="p-2.5">
        <div className="flex items-center gap-1.5 mb-1">
          <Icon className={cn("h-3 w-3", isPositive ? "text-green-500" : isNegative ? "text-red-500" : "text-yellow-500")} />
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
        </div>
        <div className={cn("text-lg font-bold tabular-nums", isPositive ? "text-green-500" : isNegative ? "text-red-500" : "text-yellow-500", highlight && "text-xl")}>
          {isPositive ? "+" : ""}{score}
        </div>
        <div className="mt-1 h-1 bg-muted rounded-full overflow-hidden">
          <div className={cn("h-full rounded-full transition-all", isPositive ? "bg-green-500" : isNegative ? "bg-red-500" : "bg-yellow-500")}
            style={{ width: `${Math.min(100, (absScore / 75) * 100)}%`, marginLeft: isNegative ? "auto" : "0", marginRight: isPositive ? "auto" : "0" }} />
        </div>
      </CardContent>
    </Card>
  )
}
