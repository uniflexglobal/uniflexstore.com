import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatUSD } from '@/lib/utils'
import { CopyPhoneButton } from '@/components/crm/copy-phone-button'

type LoadDetail = {
  broker: string | null
  originCity: string
  originState: string
  destCity: string
  destState: string
  pickupAt: string | null
  deliveryAt: string | null
  rate: string
  dispatchFeePct: string | null
  notes: string | null
  carrier: { id: string; companyName: string; contactName: string; phone: string; email: string }
  truck: { id: string; unitNumber: string; equipmentType: string } | null
  driver: { id: string; name: string; phone: string } | null
  dispatcher: { id: string; name: string } | null
}

function formatDateTime(value: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
}

export function LoadInfoCard({ load }: { load: LoadDetail }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Load details</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
        <Field
          label="Carrier"
          value={load.carrier.companyName}
          sub={<>{load.carrier.contactName} · <CopyPhoneButton phone={load.carrier.phone} /></>}
        />
        <Field label="Dispatcher" value={load.dispatcher?.name ?? 'Unassigned'} />
        <Field label="Truck" value={load.truck ? `${load.truck.unitNumber} · ${load.truck.equipmentType}` : 'Unassigned'} />
        <Field
          label="Driver"
          value={load.driver ? load.driver.name : 'Unassigned'}
          sub={load.driver ? <CopyPhoneButton phone={load.driver.phone} /> : undefined}
        />
        <Field label="Broker" value={load.broker ?? '—'} />
        <Field label="Rate" value={formatUSD(Number(load.rate))} sub={load.dispatchFeePct ? `${load.dispatchFeePct}% dispatch fee` : undefined} />
        <Field
          label="Route"
          value={`${load.originCity}, ${load.originState} → ${load.destCity}, ${load.destState}`}
        />
        <Field label="Pickup" value={formatDateTime(load.pickupAt)} />
        <Field label="Delivery" value={formatDateTime(load.deliveryAt)} />
        {load.notes && (
          <div className="sm:col-span-2">
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">Notes</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--text-secondary)]">{load.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function Field({ label, value, sub }: { label: string; value: string; sub?: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-[var(--text-primary)]">{value}</p>
      {sub && <p className="text-xs text-[var(--text-muted)]">{sub}</p>}
    </div>
  )
}
