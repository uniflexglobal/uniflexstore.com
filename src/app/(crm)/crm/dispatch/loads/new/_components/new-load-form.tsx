'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createLoad } from '@/server/actions/crm/loads'

type Carrier = { id: string; companyName: string }
type Truck = { id: string; unitNumber: string; equipmentType: string }
type Driver = { id: string; name: string; truckId: string | null }
type Fleet = { trucks: Truck[]; drivers: Driver[] }

interface FormValues {
  carrierId: string
  truckId: string
  driverId: string
  loadNumber: string
  broker: string
  originCity: string
  originState: string
  destCity: string
  destState: string
  pickupAt: string
  deliveryAt: string
  rate: string
  dispatchFeePct: string
  notes: string
}

function suggestLoadNumber() {
  return `LD-${Date.now().toString(36).toUpperCase()}`
}

export function NewLoadForm({ carriers, fleetByCarrier }: { carriers: Carrier[]; fleetByCarrier: Record<string, Fleet> }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const { register, handleSubmit, watch, setValue } = useForm<FormValues>({
    defaultValues: {
      carrierId: '',
      truckId: 'none',
      driverId: 'none',
      loadNumber: suggestLoadNumber(),
      broker: '',
      originCity: '',
      originState: '',
      destCity: '',
      destState: '',
      pickupAt: '',
      deliveryAt: '',
      rate: '',
      dispatchFeePct: '',
      notes: '',
    },
  })

  const carrierId = watch('carrierId')

  const fleet = fleetByCarrier[carrierId] ?? { trucks: [], drivers: [] }

  function onCarrierChange(value: string) {
    setValue('carrierId', value)
    setValue('truckId', 'none')
    setValue('driverId', 'none')
  }

  const onSubmit = (data: FormValues) => {
    if (!data.carrierId) {
      toast.error('Select a carrier')
      return
    }
    startTransition(async () => {
      const result = await createLoad({
        carrierId: data.carrierId,
        truckId: data.truckId === 'none' ? undefined : data.truckId,
        driverId: data.driverId === 'none' ? undefined : data.driverId,
        loadNumber: data.loadNumber,
        broker: data.broker || undefined,
        originCity: data.originCity,
        originState: data.originState,
        destCity: data.destCity,
        destState: data.destState,
        pickupAt: data.pickupAt || undefined,
        deliveryAt: data.deliveryAt || undefined,
        rate: data.rate,
        dispatchFeePct: data.dispatchFeePct || undefined,
        notes: data.notes || undefined,
      })
      if (result.error) toast.error(result.error)
      else {
        toast.success(`Load ${data.loadNumber} booked`)
        router.push(`/crm/dispatch/loads/${result.loadId}`)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Carrier & equipment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {carriers.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">
              No active carriers available to dispatch yet — carriers must complete onboarding first.
            </p>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="carrierId">Carrier *</Label>
              <Select value={carrierId} onValueChange={onCarrierChange}>
                <SelectTrigger id="carrierId">
                  <SelectValue placeholder="Select a carrier" />
                </SelectTrigger>
                <SelectContent>
                  {carriers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="truckId">Truck</Label>
              <Select value={watch('truckId')} onValueChange={(v) => setValue('truckId', v)} disabled={!carrierId}>
                <SelectTrigger id="truckId">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {fleet.trucks.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.unitNumber} · {t.equipmentType}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="driverId">Driver</Label>
              <Select value={watch('driverId')} onValueChange={(v) => setValue('driverId', v)} disabled={!carrierId}>
                <SelectTrigger id="driverId">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {fleet.drivers.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Load details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="loadNumber">Load number *</Label>
              <Input id="loadNumber" {...register('loadNumber', { required: true })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="broker">Broker</Label>
              <Input id="broker" placeholder="Who tendered the load" {...register('broker')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="originCity">Origin city *</Label>
              <Input id="originCity" {...register('originCity', { required: true })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="originState">Origin state *</Label>
              <Input id="originState" placeholder="e.g. TX" maxLength={2} {...register('originState', { required: true })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="destCity">Destination city *</Label>
              <Input id="destCity" {...register('destCity', { required: true })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="destState">Destination state *</Label>
              <Input id="destState" placeholder="e.g. CA" maxLength={2} {...register('destState', { required: true })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="pickupAt">Pickup date/time</Label>
              <Input id="pickupAt" type="datetime-local" {...register('pickupAt')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="deliveryAt">Delivery date/time</Label>
              <Input id="deliveryAt" type="datetime-local" {...register('deliveryAt')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="rate">Rate ($) *</Label>
              <Input id="rate" type="number" step="0.01" min="0" {...register('rate', { required: true })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dispatchFeePct">Dispatch fee (%)</Label>
              <Input id="dispatchFeePct" type="number" step="0.01" min="0" max="100" placeholder="e.g. 10" {...register('dispatchFeePct')} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" rows={3} {...register('notes')} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.push('/crm/dispatch')}>
          Cancel
        </Button>
        <Button type="submit" loading={pending} disabled={carriers.length === 0}>
          Book load
        </Button>
      </div>
    </form>
  )
}
