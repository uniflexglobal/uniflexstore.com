'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { DataTable, type Column } from '@/components/admin/data-table'
import { Badge } from '@/components/ui/badge'
import { leadStatusLabels, leadStatusVariant } from '@/config/crm'
import { AssignDispatcherButton } from '@/components/crm/assign-dispatcher-button'
import { MarkLostButton } from '@/components/crm/mark-lost-button'
import { DeleteLeadButton } from '@/components/crm/delete-lead-button'
import { CopyPhoneButton } from '@/components/crm/copy-phone-button'

type LeadRow = {
  id: string
  name: string
  phone: string
  email: string
  truckType: string
  status: string
  createdAt: string
  qualifiedBy: { id: string; name: string } | null
  assignedTo: { id: string; name: string } | null
}

type Dispatcher = { id: string; name: string }

interface LeadsTableProps {
  leads: LeadRow[]
  total: number
  page: number
  search: string
  role: 'CALLER' | 'DISPATCHER' | 'CRM_ADMIN'
  dispatchers: Dispatcher[]
}

export function LeadsTable({ leads, total, page, search, role, dispatchers }: LeadsTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) params.set(key, value)
      else params.delete(key)
      if (key !== 'page') params.delete('page')
      router.push(`/crm/leads?${params.toString()}`)
    },
    [searchParams, router]
  )

  const columns: Column<LeadRow>[] = [
    {
      key: 'name',
      label: 'Lead',
      render: (row) => (
        <div>
          <p className="text-sm font-medium text-[var(--text-primary)]">{row.name}</p>
          <p className="text-xs text-[var(--text-muted)]">
            <CopyPhoneButton phone={row.phone} /> · {row.truckType}
          </p>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <Badge variant={leadStatusVariant[row.status]}>{leadStatusLabels[row.status] ?? row.status}</Badge>,
    },
    ...(role === 'CRM_ADMIN'
      ? [
          {
            key: 'qualifiedBy',
            label: 'Qualified by',
            render: (row: LeadRow) => <span className="text-sm text-[var(--text-secondary)]">{row.qualifiedBy?.name ?? '—'}</span>,
          } satisfies Column<LeadRow>,
          {
            key: 'assignedTo',
            label: 'Dispatcher',
            render: (row: LeadRow) => <span className="text-sm text-[var(--text-secondary)]">{row.assignedTo?.name ?? '—'}</span>,
          } satisfies Column<LeadRow>,
        ]
      : []),
    {
      key: 'actions',
      label: '',
      className: 'w-44',
      render: (row) => (
        <div className="flex justify-end gap-2">
          {role === 'CRM_ADMIN' && row.status === 'AWAITING_ASSIGNMENT' && (
            <AssignDispatcherButton leadId={row.id} leadName={row.name} dispatchers={dispatchers} />
          )}
          {(role === 'CRM_ADMIN' || role === 'DISPATCHER') && row.status === 'ASSIGNED' && (
            <MarkLostButton leadId={row.id} leadName={row.name} />
          )}
          {role === 'CRM_ADMIN' && <DeleteLeadButton leadId={row.id} leadName={row.name} />}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--text-muted)]">{total} leads</p>
      <DataTable
        columns={columns}
        data={leads}
        total={total}
        page={page}
        pageSize={25}
        onPageChange={(p) => setParam('page', String(p))}
        searchPlaceholder="Search by name, phone, email, or MC number…"
        onSearch={(q) => setParam('search', q)}
        searchValue={search}
        emptyMessage="No leads yet."
      />
    </div>
  )
}
