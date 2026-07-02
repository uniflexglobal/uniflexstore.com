import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ReportEmptyState } from './empty-state'
import { formatUSD } from '@/lib/utils'
import type { StaffCommissionSummary } from '@/server/queries/crm/reports'

interface CommissionSummaryProps {
  data: StaffCommissionSummary[]
}

export function CommissionSummary({ data }: CommissionSummaryProps) {
  const totals = data.reduce(
    (acc, row) => ({ paid: acc.paid + row.paid, unpaid: acc.unpaid + row.unpaid, total: acc.total + row.total }),
    { paid: 0, unpaid: 0, total: 0 }
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Commission Summary Per Staff</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <ReportEmptyState message="No commissions recorded yet." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Unpaid</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.staffId}>
                  <TableCell className="font-medium text-[var(--text-primary)]">{row.name}</TableCell>
                  <TableCell className="text-right text-emerald-600">{formatUSD(row.paid)}</TableCell>
                  <TableCell className="text-right text-amber-600">{formatUSD(row.unpaid)}</TableCell>
                  <TableCell className="text-right font-medium text-[var(--text-primary)]">{formatUSD(row.total)}</TableCell>
                </TableRow>
              ))}
              <TableRow className="hover:bg-transparent">
                <TableCell className="font-semibold text-[var(--text-primary)]">Total</TableCell>
                <TableCell className="text-right font-semibold text-emerald-600">{formatUSD(totals.paid)}</TableCell>
                <TableCell className="text-right font-semibold text-amber-600">{formatUSD(totals.unpaid)}</TableCell>
                <TableCell className="text-right font-semibold text-[var(--text-primary)]">{formatUSD(totals.total)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
