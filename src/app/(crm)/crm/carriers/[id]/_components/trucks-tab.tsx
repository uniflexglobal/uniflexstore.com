'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { Plus, Truck as TruckIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { createTruck, updateTruck, deactivateTruck } from '@/server/actions/crm/trucks'
import { TRUCK_TYPES } from '@/config/crm'

export type TruckRow = {
  id: string
  unitNumber: string
  equipmentType: string
  make: string | null
  model: string | null
  year: number | null
  vin: string | null
  isActive: boolean
}

interface FormValues {
  unitNumber: string
  equipmentType: string
  make: string
  model: string
  year: string
  vin: string
}

const emptyForm: FormValues = { unitNumber: '', equipmentType: TRUCK_TYPES[0], make: '', model: '', year: '', vin: '' }

export function TrucksTab({ carrierId, trucks }: { carrierId: string; trucks: TruckRow[] }) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<TruckRow | null>(null)
  const [pending, startTransition] = useTransition()
  const { register, handleSubmit, watch, setValue, reset } = useForm<FormValues>({ defaultValues: emptyForm })
  const equipmentType = watch('equipmentType')

  function openNew() {
    setEditing(null)
    reset(emptyForm)
    setShowForm(true)
  }

  function openEdit(t: TruckRow) {
    setEditing(t)
    reset({
      unitNumber: t.unitNumber,
      equipmentType: t.equipmentType,
      make: t.make ?? '',
      model: t.model ?? '',
      year: t.year ? String(t.year) : '',
      vin: t.vin ?? '',
    })
    setShowForm(true)
  }

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      const payload = {
        carrierId,
        unitNumber: data.unitNumber,
        equipmentType: data.equipmentType as (typeof TRUCK_TYPES)[number],
        make: data.make || undefined,
        model: data.model || undefined,
        year: data.year ? Number(data.year) : undefined,
        vin: data.vin || undefined,
      }
      const result = editing ? await updateTruck(editing.id, payload) : await createTruck(payload)
      if (result.error) toast.error(result.error)
      else {
        toast.success(editing ? 'Truck updated' : 'Truck added')
        setShowForm(false)
      }
    })
  }

  function toggleActive(t: TruckRow) {
    startTransition(async () => {
      const result = t.isActive ? await deactivateTruck(t.id) : await updateTruck(t.id, { isActive: true })
      if (result.error) toast.error(result.error)
      else toast.success(t.isActive ? 'Truck deactivated' : 'Truck reactivated')
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--text-muted)]">{trucks.length} trucks</p>
        <Button size="sm" onClick={openNew}>
          <Plus className="h-4 w-4" /> Add truck
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--bg-base)]">
        {trucks.length === 0 ? (
          <p className="py-10 text-center text-sm text-[var(--text-muted)]">No trucks yet.</p>
        ) : (
          <div className="divide-y divide-[var(--border-default)]">
            {trucks.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--bg-subtle)]">
                    <TruckIcon className="h-4 w-4 text-[var(--text-muted)]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[var(--text-primary)]">Unit {t.unitNumber}</span>
                      <Badge variant="secondary">{t.equipmentType}</Badge>
                      {!t.isActive && <Badge variant="destructive">Inactive</Badge>}
                    </div>
                    <p className="text-xs text-[var(--text-muted)]">
                      {[t.year, t.make, t.model].filter(Boolean).join(' ') || '—'}
                      {t.vin ? ` · VIN ${t.vin}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(t)}>
                    Edit
                  </Button>
                  <Button size="sm" variant={t.isActive ? 'ghost' : 'outline'} disabled={pending} onClick={() => toggleActive(t)}>
                    {t.isActive ? 'Deactivate' : 'Reactivate'}
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
            <DialogTitle>{editing ? 'Edit truck' : 'Add truck'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="t-unit">Unit number *</Label>
                <Input id="t-unit" {...register('unitNumber', { required: true })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="t-type">Equipment type *</Label>
                <Select value={equipmentType} onValueChange={(v) => setValue('equipmentType', v)}>
                  <SelectTrigger id="t-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRUCK_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="t-make">Make</Label>
                <Input id="t-make" {...register('make')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="t-model">Model</Label>
                <Input id="t-model" {...register('model')} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="t-year">Year</Label>
                <Input id="t-year" type="number" {...register('year')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="t-vin">VIN</Label>
                <Input id="t-vin" {...register('vin')} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={pending}>
                {editing ? 'Save' : 'Add truck'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
