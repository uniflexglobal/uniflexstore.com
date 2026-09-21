'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { Plus, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { createDriver, updateDriver, deactivateDriver } from '@/server/actions/crm/drivers'
import { CopyPhoneButton } from '@/components/crm/copy-phone-button'
import type { TruckRow } from './trucks-tab'

export type DriverRow = {
  id: string
  name: string
  phone: string
  cdlNumber: string | null
  isActive: boolean
  truck: { id: string; unitNumber: string } | null
}

interface FormValues {
  name: string
  phone: string
  cdlNumber: string
  truckId: string
}

const UNASSIGNED = '__unassigned__'
const emptyForm: FormValues = { name: '', phone: '', cdlNumber: '', truckId: UNASSIGNED }

export function DriversTab({ carrierId, drivers, trucks }: { carrierId: string; drivers: DriverRow[]; trucks: TruckRow[] }) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<DriverRow | null>(null)
  const [pending, startTransition] = useTransition()
  const { register, handleSubmit, watch, setValue, reset } = useForm<FormValues>({ defaultValues: emptyForm })
  const truckId = watch('truckId')

  function openNew() {
    setEditing(null)
    reset(emptyForm)
    setShowForm(true)
  }

  function openEdit(d: DriverRow) {
    setEditing(d)
    reset({ name: d.name, phone: d.phone, cdlNumber: d.cdlNumber ?? '', truckId: d.truck?.id ?? UNASSIGNED })
    setShowForm(true)
  }

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      const payload = {
        carrierId,
        name: data.name,
        phone: data.phone,
        cdlNumber: data.cdlNumber || undefined,
        // Always send truckId explicitly (possibly '') so the update action
        // can tell "clear the assignment" apart from "field untouched".
        truckId: data.truckId !== UNASSIGNED ? data.truckId : '',
      }
      const result = editing ? await updateDriver(editing.id, payload) : await createDriver(payload)
      if (result.error) toast.error(result.error)
      else {
        toast.success(editing ? 'Driver updated' : 'Driver added')
        setShowForm(false)
      }
    })
  }

  function toggleActive(d: DriverRow) {
    startTransition(async () => {
      const result = d.isActive ? await deactivateDriver(d.id) : await updateDriver(d.id, { isActive: true })
      if (result.error) toast.error(result.error)
      else toast.success(d.isActive ? 'Driver deactivated' : 'Driver reactivated')
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--text-muted)]">{drivers.length} drivers</p>
        <Button size="sm" onClick={openNew}>
          <Plus className="h-4 w-4" /> Add driver
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--bg-base)]">
        {drivers.length === 0 ? (
          <p className="py-10 text-center text-sm text-[var(--text-muted)]">No drivers yet.</p>
        ) : (
          <div className="divide-y divide-[var(--border-default)]">
            {drivers.map((d) => (
              <div key={d.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--bg-subtle)]">
                    <UserRound className="h-4 w-4 text-[var(--text-muted)]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[var(--text-primary)]">{d.name}</span>
                      {d.truck && <Badge variant="secondary">Unit {d.truck.unitNumber}</Badge>}
                      {!d.isActive && <Badge variant="destructive">Inactive</Badge>}
                    </div>
                    <p className="text-xs text-[var(--text-muted)]">
                      <CopyPhoneButton phone={d.phone} />
                      {d.cdlNumber ? ` · CDL ${d.cdlNumber}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(d)}>
                    Edit
                  </Button>
                  <Button size="sm" variant={d.isActive ? 'ghost' : 'outline'} disabled={pending} onClick={() => toggleActive(d)}>
                    {d.isActive ? 'Deactivate' : 'Reactivate'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit driver' : 'Add driver'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="d-name">Name *</Label>
              <Input id="d-name" {...register('name', { required: true })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="d-phone">Phone *</Label>
                <Input id="d-phone" {...register('phone', { required: true })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="d-cdl">CDL number</Label>
                <Input id="d-cdl" {...register('cdlNumber')} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="d-truck">Assigned truck</Label>
              <Select value={truckId} onValueChange={(v) => setValue('truckId', v)}>
                <SelectTrigger id="d-truck">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                  {trucks.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      Unit {t.unitNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={pending}>
                {editing ? 'Save' : 'Add driver'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
