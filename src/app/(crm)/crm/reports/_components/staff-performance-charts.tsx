'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ReportEmptyState } from './empty-state'
import type { DispatcherLoadCount, CallerLeadCount } from '@/server/queries/crm/reports'

const TOOLTIP_STYLE = {
  backgroundColor: 'var(--bg-base)',
  border: '1px solid var(--border-default)',
  borderRadius: '8px',
  color: 'var(--text-primary)',
  fontSize: '12px',
}

interface LoadsByDispatcherChartProps {
  data: DispatcherLoadCount[]
}

export function LoadsByDispatcherChart({ data }: LoadsByDispatcherChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Loads Per Dispatcher</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <ReportEmptyState message="No loads booked yet." />
        ) : (
          <figure aria-label="Bar chart showing total loads booked per dispatcher">
            <figcaption className="sr-only">
              Loads per dispatcher: {data.map((d) => `${d.name} ${d.count}`).join(', ')}
            </figcaption>
            <ResponsiveContainer width="100%" height={Math.max(160, data.length * 36)}>
              <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                  axisLine={false}
                  tickLine={false}
                  width={110}
                />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [v, 'Loads']} />
                <Bar dataKey="count" fill="var(--brand-accent)" radius={[0, 4, 4, 0]} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </figure>
        )}
      </CardContent>
    </Card>
  )
}

interface LeadsByCallerChartProps {
  data: CallerLeadCount[]
}

export function LeadsByCallerChart({ data }: LeadsByCallerChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Leads Qualified Per Caller</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <ReportEmptyState message="No leads qualified yet." />
        ) : (
          <figure aria-label="Bar chart showing total leads qualified per caller">
            <figcaption className="sr-only">
              Leads per caller: {data.map((d) => `${d.name} ${d.count}`).join(', ')}
            </figcaption>
            <ResponsiveContainer width="100%" height={Math.max(160, data.length * 36)}>
              <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                  axisLine={false}
                  tickLine={false}
                  width={110}
                />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [v, 'Leads']} />
                <Bar dataKey="count" fill="var(--brand-accent)" radius={[0, 4, 4, 0]} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </figure>
        )}
      </CardContent>
    </Card>
  )
}
