'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { CheckCircle2, Circle } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { carrierStatusLabels, carrierStatusVariant, documentTypeLabels, REQUIRED_ONBOARDING_DOCS } from '@/config/crm'
import { markCarrierActive } from '@/server/actions/crm/carriers'
import { CopyPhoneButton } from '@/components/crm/copy-phone-button'
import { ProfileTab } from './profile-tab'
import { TrucksTab } from './trucks-tab'
import { DriversTab } from './drivers-tab'
import { DocumentsTab, type DocumentRow } from './documents-tab'

type ActivityRow = { id: string; type: string; note: string | null; createdAt: string; staff: { id: string; name: string } | null }

type TruckRow = {
  id: string
  unitNumber: string
  equipmentType: string
  make: string | null
  model: string | null
  year: number | null
  vin: string | null
  isActive: boolean
}

type DriverRow = {
  id: string
  name: string
  phone: string
  cdlNumber: string | null
  isActive: boolean
  truck: { id: string; unitNumber: string } | null
}

export type CarrierDetailData = {
  id: string
  companyName: string
  contactName: string
  phone: string
  email: string
  mcNumber: string | null
  dotNumber: string | null
  address: string | null
  notes: string | null
  status: string
  assignedDispatcher: { id: string; name: string } | null
  trucks: TruckRow[]
  drivers: DriverRow[]
  documents: DocumentRow[]
  activity: ActivityRow[]
}

export function CarrierDetail({ carrier }: { carrier: CarrierDetailData }) {
  const [pending, startTransition] = useTransition()

  const presentTypes = new Set(carrier.documents.map((d) => d.type))
  const missing = REQUIRED_ONBOARDING_DOCS.filter((t) => !presentTypes.has(t))
  const canActivate = carrier.status === 'ONBOARDING' && missing.length === 0

  function activate() {
    startTransition(async () => {
      const result = await markCarrierActive(carrier.id)
      if (result.error) toast.error(result.error)
      else toast.success('Carrier marked Active')
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">{carrier.companyName}</h2>
            <Badge variant={carrierStatusVariant[carrier.status]}>{carrierStatusLabels[carrier.status] ?? carrier.status}</Badge>
          </div>
          <p className="text-sm text-[var(--text-muted)]">
            {carrier.contactName} · <CopyPhoneButton phone={carrier.phone} /> · {carrier.email}
            {carrier.mcNumber ? ` · MC ${carrier.mcNumber}` : ''}
          </p>
        </div>
        {carrier.assignedDispatcher && (
          <p className="text-xs text-[var(--text-muted)]">Dispatcher: {carrier.assignedDispatcher.name}</p>
        )}
      </div>

      {carrier.status === 'ONBOARDING' && (
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-subtle)] p-4">
          <p className="mb-3 text-sm font-medium text-[var(--text-primary)]">Onboarding checklist</p>
          <div className="mb-3 grid gap-2 sm:grid-cols-2">
            {REQUIRED_ONBOARDING_DOCS.map((type) => {
              const done = presentTypes.has(type)
              return (
                <div key={type} className="flex items-center gap-2 text-sm">
                  {done ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Circle className="h-4 w-4 text-[var(--text-muted)]" />
                  )}
                  <span className={done ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}>
                    {documentTypeLabels[type]}
                  </span>
                </div>
              )
            })}
          </div>
          <Button size="sm" variant="accent" disabled={!canActivate} loading={pending} onClick={activate}>
            Mark carrier Active
          </Button>
          {!canActivate && (
            <p className="mt-2 text-xs text-[var(--text-muted)]">Upload all required documents to activate this carrier.</p>
          )}
        </div>
      )}

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="trucks">Trucks ({carrier.trucks.length})</TabsTrigger>
          <TabsTrigger value="drivers">Drivers ({carrier.drivers.length})</TabsTrigger>
          <TabsTrigger value="documents">Documents ({carrier.documents.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <ProfileTab carrier={carrier} />
        </TabsContent>
        <TabsContent value="trucks">
          <TrucksTab carrierId={carrier.id} trucks={carrier.trucks} />
        </TabsContent>
        <TabsContent value="drivers">
          <DriversTab carrierId={carrier.id} drivers={carrier.drivers} trucks={carrier.trucks} />
        </TabsContent>
        <TabsContent value="documents">
          <DocumentsTab carrierId={carrier.id} documents={carrier.documents} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
