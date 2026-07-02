'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { DataTable, type Column } from '@/components/admin/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { invoiceStatusLabels, invoiceStatusVariant } from '@/config/crm'
import { formatUSD, decimalToNumber } from '@/lib/utils'

type InvoiceRow = {
  id: string
  invoiceNumber: string
  amount: string | number
  status: string
  dueDate: string | null
  createdAt: string
  carrier: { id: string; companyName: string }
  load: { id: string; loadNumber: string } | null
}

interface InvoicesTableProps {
  invoices: InvoiceRow[]
  total: number
  page: number
  search: string
}

export function InvoicesTable({ invoices, total, page, search }: InvoicesTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) params.set(key, value)
      else params.delete(key)
      if (key !== 'page') params.delete('page')
      router.push(`/crm/invoices?${params.toString()}`)
    },
    [searchParams, router]
  )

  const columns: Column<InvoiceRow>[] = [
    {
      key: 'invoiceNumber',
      label: 'Invoice',
      render: (row) => (
        <div>
          <p className="text-sm font-medium text-[var(--text-primary)]">{row.invoiceNumber}</p>
          <p className="text-xs text-[var(--text-muted)]">{row.load ? `Load ${row.load.loadNumber}` : 'Standalone'}</p>
        </div>
      ),
    },
    {
      key: 'carrier',
      label: 'Carrier',
      render: (row) => <span className="text-sm text-[var(--text-secondary)]">{row.carrier.companyName}</span>,
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (row) => <span className="text-sm font-medium text-[var(--text-primary)]">{formatUSD(decimalToNumber(row.amount))}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const isOverdue = row.status === 'UNPAID' && !!row.dueDate && new Date(row.dueDate) < new Date()
        return (
          <div className="flex items-center gap-1.5">
            <Badge variant={invoiceStatusVariant[row.status]}>{invoiceStatusLabels[row.status] ?? row.status}</Badge>
            {isOverdue && <Badge variant="warning">Overdue</Badge>}
          </div>
        )
      },
    },
    {
      key: 'dueDate',
      label: 'Due',
      render: (row) => <span className="text-sm text-[var(--text-secondary)]">{row.dueDate ? new Date(row.dueDate).toLocaleDateString() : '—'}</span>,
    },
    {
      key: 'actions',
      label: '',
      className: 'w-24',
      render: (row) => (
        <div className="flex justify-end">
          <Link href={`/crm/invoices/${row.id}`}>
            <Button size="sm" variant="outline">
              View
            </Button>
          </Link>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--text-muted)]">{total} invoices</p>
      <DataTable
        columns={columns}
        data={invoices}
        total={total}
        page={page}
        pageSize={25}
        onPageChange={(p) => setParam('page', String(p))}
        searchPlaceholder="Search by invoice number, carrier, or load…"
        onSearch={(q) => setParam('search', q)}
        searchValue={search}
        emptyMessage="No invoices yet."
      />
    </div>
  )
}
