'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { toast } from 'sonner'
import { Phone } from 'lucide-react'
import { DataTable, type Column } from '@/components/admin/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { prospectStatusLabels, prospectStatusVariant } from '@/config/crm'
import { reassignProspect } from '@/server/actions/crm/prospects'
import { CopyPhoneButton } from '@/components/crm/copy-phone-button'
import { WorkProspectDialog } from './work-prospect-dialog'
import { AddProspectDialog } from './add-prospect-dialog'

type ProspectRow = {
  id: string
  name: string
  phone: string
  email: string | null
  truckType: string | null
  route: string | null
  status: string
  createdAt: string
  assignedTo: { id: string; name: string } | null
}

type Caller = { id: string; name: string }
type Dispatcher = { id: string; name: string }

interface ProspectsTableProps {
  prospects: ProspectRow[]
  total: number
  page: number
  search: string
  isAdmin: boolean
  isSeniorCaller: boolean
  callers: Caller[]
  dispatchers: Dispatcher[]
}

export function ProspectsTable({ prospects, total, page, search, isAdmin, isSeniorCaller, callers, dispatchers }: ProspectsTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [working, setWorking] = useState<ProspectRow | null>(null)
  const [, startTransition] = useTransition()

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) params.set(key, value)
      else params.delete(key)
      if (key !== 'page') params.delete('page')
      router.push(`/crm/prospects?${params.toString()}`)
    },
    [searchParams, router]
  )

  function reassign(prospectId: string, callerId: string) {
    startTransition(async () => {
      const result = await reassignProspect(prospectId, callerId)
      if (result.error) toast.error(result.error)
      else toast.success('Reassigned')
    })
  }

  const columns: Column<ProspectRow>[] = [
    {
      key: 'name',
      label: 'Prospect',
      render: (row) => (
        <div>
          <p className="text-sm font-medium text-[var(--text-primary)]">{row.name}</p>
          <p className="text-xs text-[var(--text-muted)]">
            <CopyPhoneButton phone={row.phone} />
            {row.truckType ? ` · ${row.truckType}` : ''}
          </p>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <Badge variant={prospectStatusVariant[row.status]}>{prospectStatusLabels[row.status] ?? row.status}</Badge>,
    },
    ...(isAdmin
      ? [
          {
            key: 'assignedTo',
            label: 'Caller',
            render: (row: ProspectRow) => (
              <Select value={row.assignedTo?.id ?? ''} onValueChange={(v) => reassign(row.id, v)}>
                <SelectTrigger className="h-8 w-36 text-xs">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  {callers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ),
          } satisfies Column<ProspectRow>,
        ]
      : []),
    {
      key: 'actions',
      label: '',
      className: 'w-32',
      render: (row) => (
        <Button
          size="sm"
          variant={row.status === 'QUALIFIED' ? 'ghost' : 'outline'}
          disabled={row.status === 'QUALIFIED'}
          onClick={() => setWorking(row)}
        >
          <Phone className="h-3.5 w-3.5" /> {row.status === 'QUALIFIED' ? 'Qualified' : 'Call'}
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--text-muted)]">{total} prospects</p>
        <AddProspectDialog isAdmin={isAdmin} callers={callers} />
      </div>

      <DataTable
        columns={columns}
        data={prospects}
        total={total}
        page={page}
        pageSize={25}
        onPageChange={(p) => setParam('page', String(p))}
        searchPlaceholder="Search by name, phone, or email…"
        onSearch={(q) => setParam('search', q)}
        searchValue={search}
        emptyMessage="No prospects yet — import a list or add one manually."
      />

      <WorkProspectDialog
        prospect={working}
        onClose={() => setWorking(null)}
        canAssignDispatcher={isAdmin || isSeniorCaller}
        dispatchers={dispatchers}
      />
    </div>
  )
}
