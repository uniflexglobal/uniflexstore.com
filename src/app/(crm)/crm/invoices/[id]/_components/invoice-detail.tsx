'use client'

import Link from 'next/link'
import { useTransition } from 'react'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { invoiceStatusLabels, invoiceStatusVariant, loadStatusLabels, loadStatusVariant } from '@/config/crm'
import { formatUSD, decimalToNumber } from '@/lib/utils'
import { updateInvoiceStatus, markSentToFactoring, markPaid } from '@/server/actions/crm/invoices'

type InvoiceDetailData = {
  id: string
  invoiceNumber: string
  amount: string | number
  status: string
  dueDate: string | null
  sentToFactoringAt: string | null
  paidAt: string | null
  notes: string | null
  createdAt: string
  carrier: { id: string; companyName: string; assignedDispatcherId: string | null }
  load: {
    id: string
    loadNumber: string
    rate: string | number
    dispatchFeePct: string | number | null
    status: string
    originCity: string
    originState: string
    destCity: string
    destState: string
  } | null
}

type ActionResult = { success?: boolean; error?: string }

export function InvoiceDetail({ invoice }: { invoice: InvoiceDetailData }) {
  const [pending, startTransition] = useTransition()

  const isOverdue = invoice.status === 'UNPAID' && !!invoice.dueDate && new Date(invoice.dueDate) < new Date()

  function runAction(fn: () => Promise<ActionResult>, successMsg: string) {
    startTransition(async () => {
      const result = await fn()
      if (result.error) toast.error(result.error)
      else toast.success(successMsg)
    })
  }

  return (
    <div className="space-y-6">
      <Link href="/crm/invoices" className="inline-flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to invoices
      </Link>

      <div className="space-y-5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-base)] p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-semibold text-[var(--text-primary)]">{invoice.invoiceNumber}</h1>
            <p className="text-sm text-[var(--text-muted)]">{invoice.carrier.companyName}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge variant={invoiceStatusVariant[invoice.status]}>{invoiceStatusLabels[invoice.status] ?? invoice.status}</Badge>
            {isOverdue && <Badge variant="warning">Overdue</Badge>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-[var(--text-muted)]">Amount</p>
            <p className="font-medium text-[var(--text-primary)]">{formatUSD(decimalToNumber(invoice.amount))}</p>
          </div>
          <div>
            <p className="text-[var(--text-muted)]">Due date</p>
            <p className="font-medium text-[var(--text-primary)]">{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '—'}</p>
          </div>
          <div>
            <p className="text-[var(--text-muted)]">Sent to factoring</p>
            <p className="font-medium text-[var(--text-primary)]">
              {invoice.sentToFactoringAt ? new Date(invoice.sentToFactoringAt).toLocaleDateString() : '—'}
            </p>
          </div>
          <div>
            <p className="text-[var(--text-muted)]">Paid at</p>
            <p className="font-medium text-[var(--text-primary)]">{invoice.paidAt ? new Date(invoice.paidAt).toLocaleDateString() : '—'}</p>
          </div>
        </div>

        {invoice.load && (
          <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-subtle)] p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-[var(--text-primary)]">Load {invoice.load.loadNumber}</p>
              <Badge variant={loadStatusVariant[invoice.load.status]}>{loadStatusLabels[invoice.load.status] ?? invoice.load.status}</Badge>
            </div>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              {invoice.load.originCity}, {invoice.load.originState} → {invoice.load.destCity}, {invoice.load.destState} · Rate{' '}
              {formatUSD(decimalToNumber(invoice.load.rate))}
              {invoice.load.dispatchFeePct != null && ` · Dispatch fee ${decimalToNumber(invoice.load.dispatchFeePct)}%`}
            </p>
          </div>
        )}

        {invoice.notes && (
          <div>
            <p className="text-sm text-[var(--text-muted)]">Notes</p>
            <p className="text-sm text-[var(--text-primary)]">{invoice.notes}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2 border-t border-[var(--border-default)] pt-4">
          {invoice.status === 'DRAFT' && (
            <Button size="sm" loading={pending} onClick={() => runAction(() => updateInvoiceStatus(invoice.id, 'SENT'), 'Invoice marked sent')}>
              Mark sent
            </Button>
          )}
          {invoice.status === 'SENT' && (
            <Button size="sm" loading={pending} onClick={() => runAction(() => updateInvoiceStatus(invoice.id, 'UNPAID'), 'Invoice marked unpaid')}>
              Mark unpaid (awaiting payment)
            </Button>
          )}
          {(invoice.status === 'SENT' || invoice.status === 'UNPAID') && (
            <Button size="sm" variant="outline" loading={pending} onClick={() => runAction(() => markSentToFactoring(invoice.id), 'Routed to factoring')}>
              Mark sent to factoring
            </Button>
          )}
          {invoice.status !== 'PAID' && invoice.status !== 'DRAFT' && (
            <Button size="sm" variant="outline" loading={pending} onClick={() => runAction(() => markPaid(invoice.id), 'Invoice marked paid')}>
              Mark paid
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
