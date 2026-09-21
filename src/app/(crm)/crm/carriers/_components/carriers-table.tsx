'use client'

import { useTransition, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Eye } from 'lucide-react'
import { DataTable, type Column } from '@/components/admin/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { carrierStatusLabels, carrierStatusVariant } from '@/config/crm'
import { reassignCarrier } from '@/server/actions/crm/carriers'
import { CopyPhoneButton } from '@/components/crm/copy-phone-button'

type CarrierRow = {
  id: string
  companyName: string
  contactName: string
  phone: string
  email: string
  mcNumber: string | null
  status: string
  assignedDispatcher: { id: string; name: string } | null
  _count: { trucks: number; drivers: number; documents: number }
}

type Dispatcher = { id: string; name: string }

interface CarriersTableProps {
  carriers: CarrierRow[]
  total: number
  page: number
  search: string
  isAdmin: boolean
  dispatchers: Dispatcher[]
}

export function CarriersTable({ carriers, total, page, search, isAdmin, dispatchers }: CarriersTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) params.set(key, value)
      else params.delete(key)
      if (key !== 'page') params.delete('page')
      router.push(`/crm/carriers?${params.toString()}`)
    },
    [searchParams, router]
  )

  function reassign(carrierId: string, dispatcherId: string) {
    startTransition(async () => {
      const result = await reassignCarrier(carrierId, dispatcherId)
      if (result.error) toast.error(result.error)
      else toast.success('Reassigned')
    })
  }

  const columns: Column<CarrierRow>[] = [
    {
      key: 'companyName',
      label: 'Carrier',
      render: (row) => (
        <Link href={`/crm/carriers/${row.id}`} className="hover:underline">
          <p className="text-sm font-medium text-[var(--text-primary)]">{row.companyName}</p>
          <p className="text-xs text-[var(--text-muted)]">
            {row.contactName} · <CopyPhoneButton phone={row.phone} />
            {row.mcNumber ? ` · MC ${row.mcNumber}` : ''}
          </p>
        </Link>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <Badge variant={carrierStatusVariant[row.status]}>{carrierStatusLabels[row.status] ?? row.status}</Badge>,
    },
    {
      key: 'fleet',
      label: 'Fleet',
      render: (row) => (
        <p className="text-xs text-[var(--text-muted)]">
          {row._count.trucks} trucks · {row._count.drivers} drivers · {row._count.documents} docs
        </p>
      ),
    },
    ...(isAdmin
      ? [
          {
            key: 'assignedDispatcher',
            label: 'Dispatcher',
            render: (row: CarrierRow) => (
              <Select value={row.assignedDispatcher?.id ?? ''} onValueChange={(v) => reassign(row.id, v)}>
                <SelectTrigger className="h-8 w-36 text-xs">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  {dispatchers.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ),
          } satisfies Column<CarrierRow>,
        ]
      : []),
    {
      key: 'actions',
      label: '',
      className: 'w-24',
      render: (row) => (
        <Link href={`/crm/carriers/${row.id}`}>
          <Button size="sm" variant="outline">
            <Eye className="h-3.5 w-3.5" /> View
          </Button>
        </Link>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--text-muted)]">{total} carriers</p>

      <DataTable
        columns={columns}
        data={carriers}
        total={total}
        page={page}
        pageSize={25}
        onPageChange={(p) => setParam('page', String(p))}
        searchPlaceholder="Search by company, contact, phone, or MC number…"
        onSearch={(q) => setParam('search', q)}
        searchValue={search}
        emptyMessage="No carriers yet — carriers are created automatically when a lead is assigned to a dispatcher."
      />
    </div>
  )
}
