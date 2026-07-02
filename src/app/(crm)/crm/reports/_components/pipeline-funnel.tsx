import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ReportEmptyState } from './empty-state'
import type { FunnelStage } from '@/server/queries/crm/reports'

interface PipelineFunnelProps {
  data: FunnelStage[]
}

/** Horizontal funnel bar list — same custom-bar pattern as StatusBreakdown in revenue-chart.tsx. */
export function PipelineFunnel({ data }: PipelineFunnelProps) {
  const max = Math.max(...data.map((d) => d.count), 1)
  const isEmpty = data.every((d) => d.count === 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pipeline Conversion Funnel</CardTitle>
      </CardHeader>
      <CardContent>
        {isEmpty ? (
          <ReportEmptyState message="No pipeline activity yet — the funnel fills in as prospects move through the CRM." />
        ) : (
          <div className="space-y-4">
            {data.map((stage, i) => {
              const prev = i > 0 ? data[i - 1].count : null
              const conversionPct = prev && prev > 0 ? Math.round((stage.count / prev) * 100) : null
              return (
                <div key={stage.stage}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm text-[var(--text-secondary)]">{stage.stage}</span>
                    <span className="text-sm font-medium text-[var(--text-primary)]">
                      {stage.count.toLocaleString()}
                      {conversionPct !== null && (
                        <span className="ml-2 text-xs font-normal text-[var(--text-muted)]">({conversionPct}%)</span>
                      )}
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-[var(--bg-muted)]">
                    <div
                      className="h-full rounded-full bg-[var(--brand-accent)]"
                      style={{ width: `${Math.round((stage.count / max) * 100)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
