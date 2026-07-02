'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ReportEmptyState } from './empty-state'
import type { RevenuePoint } from '@/server/queries/crm/reports'

const TOOLTIP_STYLE = {
  backgroundColor: 'var(--bg-base)',
  border: '1px solid var(--border-default)',
  borderRadius: '8px',
  color: 'var(--text-primary)',
  fontSize: '12px',
}

interface RevenueOverTimeChartProps {
  data: RevenuePoint[]
}

export function RevenueOverTimeChart({ data }: RevenueOverTimeChartProps) {
  const hasRevenue = data.some((d) => d.revenue > 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasRevenue ? (
          <ReportEmptyState message="No paid invoices yet — revenue will appear here once invoices are marked paid." />
        ) : (
          <figure aria-label="Area chart showing dispatch fee revenue by month">
            <figcaption className="sr-only">
              Monthly revenue: {data.map((d) => `${d.month} $${d.revenue.toLocaleString()}`).join(', ')}
            </figcaption>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="reportsRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--brand-accent)" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="var(--brand-accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => (Number(v) >= 1000 ? `$${(Number(v) / 1000).toFixed(0)}k` : `$${Number(v)}`)}
                  width={48}
                />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [`$${Number(v).toLocaleString()}`, 'Revenue']} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--brand-accent)"
                  strokeWidth={2}
                  fill="url(#reportsRevenueGrad)"
                  dot={false}
                  activeDot={{ r: 4, fill: 'var(--brand-accent)', stroke: 'var(--bg-base)', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </figure>
        )}
      </CardContent>
    </Card>
  )
}
