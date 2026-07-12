import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Target,
  CheckCircle2,
  XCircle,
  Loader2,
  Activity,
  Eye,
  Shield,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { FullAnalysis } from "@contracts/trading"

interface PatternPanelProps {
  analysis: FullAnalysis | null | undefined
  isLoading: boolean
}

export function PatternPanel({ analysis, isLoading }: PatternPanelProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!analysis || !analysis.patterns.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <Target className="h-8 w-8 mb-2" />
        <p>No pattern data available</p>
      </div>
    )
  }

  const detectedPatterns = analysis.patterns.filter((p) => p.detected)
  const undetectedPatterns = analysis.patterns.filter((p) => !p.detected)
  const sr = analysis.supportResistance

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-green-500">{detectedPatterns.length}</div><div className="text-xs text-muted-foreground mt-1">Detected</div></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-muted-foreground">{analysis.patterns.length}</div><div className="text-xs text-muted-foreground mt-1">Checked</div></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold">{Math.round(detectedPatterns.reduce((acc, p) => acc + p.confidence, 0) / Math.max(detectedPatterns.length, 1))}%</div><div className="text-xs text-muted-foreground mt-1">Avg Confidence</div></CardContent></Card>
      </div>

      {detectedPatterns.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <Eye className="h-4 w-4" /> Detected Patterns
          </h3>
          <div className="grid gap-2">
            {detectedPatterns.map((pattern) => <PatternCard key={pattern.name} pattern={pattern} />)}
          </div>
        </div>
      )}

      <Separator />

      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <Shield className="h-4 w-4" /> Support & Resistance Levels
        </h3>
        <Card>
          <CardContent className="p-4 space-y-4">
            <div>
              <div className="text-xs text-red-500 font-medium mb-2">Resistance Levels</div>
              <div className="flex flex-wrap gap-2">
                {sr.resistances.slice(0, 5).map((level, i) => (
                  <Badge key={`r-${i}`} variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">${level.toFixed(2)}</Badge>
                ))}
                {sr.resistances.length === 0 && <span className="text-sm text-muted-foreground">No clear resistance levels</span>}
              </div>
            </div>

            {sr.pivotPoints.length > 0 && (
              <div>
                <div className="text-xs text-yellow-500 font-medium mb-2">Pivot Point</div>
                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">${sr.pivotPoints[0].toFixed(2)}</Badge>
              </div>
            )}

            <div>
              <div className="text-xs text-green-500 font-medium mb-2">Support Levels</div>
              <div className="flex flex-wrap gap-2">
                {sr.supports.slice(0, 5).map((level, i) => (
                  <Badge key={`s-${i}`} variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">${level.toFixed(2)}</Badge>
                ))}
                {sr.supports.length === 0 && <span className="text-sm text-muted-foreground">No clear support levels</span>}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <Activity className="h-4 w-4" /> All Patterns
        </h3>
        <div className="grid gap-2">
          {undetectedPatterns.map((pattern) => <PatternCard key={pattern.name} pattern={pattern} />)}
        </div>
      </div>
    </div>
  )
}

function PatternCard({ pattern }: { pattern: FullAnalysis["patterns"][0] }) {
  return (
    <Card className={cn("transition-colors", pattern.detected ? "bg-primary/5 border-primary/20" : "hover:bg-muted/30")}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {pattern.detected ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-muted-foreground" />}
            <div>
              <div className="font-medium">{pattern.name}</div>
              <div className="text-sm text-muted-foreground">{pattern.description}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Confidence</div>
              <div className="font-mono font-medium">{pattern.confidence}%</div>
            </div>
            <Progress value={pattern.confidence} className={cn("w-16 h-2", pattern.detected ? "bg-primary/20" : "bg-muted")} />
          </div>
        </div>
        {pattern.location && (
          <div className="mt-2 text-xs text-muted-foreground flex gap-4">
            <span>From: ${pattern.location.startPrice.toFixed(2)}</span>
            <span>To: ${pattern.location.endPrice.toFixed(2)}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
