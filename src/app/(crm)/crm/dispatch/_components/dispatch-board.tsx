'use client'

import Link from 'next/link'
import { useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Truck as TruckIcon, UserRound, MapPin } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LoadStatusMenu } from '@/components/crm/load-status-menu'
import { LOAD_STATUS_ORDER, loadStatusLabels } from '@/config/crm'
import { cn, formatUSD } from '@/lib/utils'
import type { LoadStatus } from '@prisma/client'

type LoadRow = {
  id: string
  loadNumber: string
  broker: string | null
  originCity: string
  originState: string
  destCity: string
  destState: string
  pickupAt: string | null
  deliveryAt: string | null
  rate: string
  dispatchFeePct: string | null
  status: LoadStatus
  carrier: { id: string; companyName: string }
  truck: { id: string; unitNumber: string } | null
  driver: { id: string; name: string } | null
  dispatcher: { id: string; name: string } | null
}

type Dispatcher = { id: string; name: string }

interface DispatchBoardProps {
  loads: LoadRow[]
  role: 'DISPATCHER' | 'CRM_ADMIN'
  dispatchers: Dispatcher[]
  selectedDispatcherId: string
}

// The Invoicing vertical owns the workflow past DELIVERED — those two
// columns are compact reference lists, not interactive Kanban lanes.
const COMPACT_COLUMNS: LoadStatus[] = ['INVOICED', 'PAID']

export function DispatchBoard({ loads, role, dispatchers, selectedDispatcherId }: DispatchBoardProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const setDispatcher = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) params.set('dispatcherId', value)
      else params.delete('dispatcherId')
      router.push(`/crm/dispatch?${params.toString()}`)
    },
    [searchParams, router]
  )

  const byStatus = new Map<LoadStatus, LoadRow[]>()
  for (const status of LOAD_STATUS_ORDER) byStatus.set(status, [])
  for (const load of loads) byStatus.get(load.status)?.push(load)

  return (
    <div className="space-y-4">
      {role === 'CRM_ADMIN' && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-[var(--text-muted)]">Dispatcher</span>
          <Select value={selectedDispatcherId || 'all'} onValueChange={(v) => setDispatcher(v === 'all' ? '' : v)}>
            <SelectTrigger className="h-9 w-56">
              <SelectValue placeholder="All dispatchers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All dispatchers</SelectItem>
              {dispatchers.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex min-h-0 flex-1 gap-4 overflow-x-auto pb-2">
        {LOAD_STATUS_ORDER.map((status) =>
          COMPACT_COLUMNS.includes(status) ? (
            <CompactColumn key={status} status={status} loads={byStatus.get(status) ?? []} />
          ) : (
            <KanbanColumn key={status} status={status} loads={byStatus.get(status) ?? []} />
          )
        )}
      </div>
    </div>
  )
}

function ColumnHeader({ status, count }: { status: LoadStatus; count: number }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-sm font-semibold text-[var(--text-primary)]">{loadStatusLabels[status] ?? status}</h2>
      <span className="rounded-full bg-[var(--bg-subtle)] px-2 py-0.5 text-xs font-medium text-[var(--text-muted)]">{count}</span>
    </div>
  )
}

function KanbanColumn({ status, loads }: { status: LoadStatus; loads: LoadRow[] }) {
  return (
    <div className="flex w-80 shrink-0 flex-col rounded-xl border border-[var(--border-default)] bg-[var(--bg-subtle)]/40 p-3">
      <ColumnHeader status={status} count={loads.length} />
      <div className="flex flex-col gap-2.5">
        {loads.length === 0 ? (
          <p className="rounded-lg border border-dashed border-[var(--border-default)] py-6 text-center text-xs text-[var(--text-muted)]">
            No loads
          </p>
        ) : (
          loads.map((load) => <LoadCard key={load.id} load={load} />)
        )}
      </div>
    </div>
  )
}

function LoadCard({ load }: { load: LoadRow }) {
  return (
    <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] p-3 shadow-[var(--shadow-sm)]">
      <div className="mb-1.5 flex items-start justify-between gap-2">
        <Link href={`/crm/dispatch/loads/${load.id}`} className="text-sm font-semibold text-[var(--text-primary)] hover:underline">
          {load.loadNumber}
        </Link>
        <span className="text-sm font-semibold text-[var(--text-primary)]">{formatUSD(Number(load.rate))}</span>
      </div>
      <p className="mb-1.5 text-xs text-[var(--text-secondary)]">{load.carrier.companyName}</p>
      <div className="mb-2.5 flex items-center gap-1 text-xs text-[var(--text-muted)]">
        <MapPin className="h-3 w-3 shrink-0" />
        <span className="truncate">
          {load.originCity}, {load.originState} → {load.destCity}, {load.destState}
        </span>
      </div>
      {(load.truck || load.driver) && (
        <div className="mb-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--text-muted)]">
          {load.truck && (
            <span className="flex items-center gap-1">
              <TruckIcon className="h-3 w-3" /> {load.truck.unitNumber}
            </span>
          )}
          {load.driver && (
            <span className="flex items-center gap-1">
              <UserRound className="h-3 w-3" /> {load.driver.name}
            </span>
          )}
        </div>
      )}
      <LoadStatusMenu loadId={load.id} loadNumber={load.loadNumber} currentStatus={load.status} />
    </div>
  )
}

function CompactColumn({ status, loads }: { status: LoadStatus; loads: LoadRow[] }) {
  return (
    <div className={cn('flex w-64 shrink-0 flex-col rounded-xl border border-[var(--border-default)] p-3')}>
      <ColumnHeader status={status} count={loads.length} />
      <div className="flex flex-col divide-y divide-[var(--border-default)]">
        {loads.length === 0 ? (
          <p className="py-4 text-center text-xs text-[var(--text-muted)]">No loads</p>
        ) : (
          loads.map((load) => (
            <Link key={load.id} href={`/crm/dispatch/loads/${load.id}`} className="flex items-center justify-between gap-2 py-2 text-xs hover:opacity-80">
              <div className="min-w-0">
                <p className="truncate font-medium text-[var(--text-primary)]">{load.loadNumber}</p>
                <p className="truncate text-[var(--text-muted)]">{load.carrier.companyName}</p>
              </div>
              <span className="shrink-0 font-medium text-[var(--text-secondary)]">{formatUSD(Number(load.rate))}</span>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
