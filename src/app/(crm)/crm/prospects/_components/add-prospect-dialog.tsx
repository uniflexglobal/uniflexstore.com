'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { createProspectManual } from '@/server/actions/crm/prospects'
import { TRUCK_TYPES } from '@/config/crm'

type Caller = { id: string; name: string }

export function AddProspectDialog({ isAdmin, callers }: { isAdmin: boolean; callers: Caller[] }) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [form, setForm] = useState({ name: '', phone: '', email: '', truckType: '', route: '', assignedToId: '' })

  function submit() {
    startTransition(async () => {
      const result = await createProspectManual({
        name: form.name,
        phone: form.phone,
        email: form.email || undefined,
        truckType: form.truckType || undefined,
        route: form.route || undefined,
        assignedToId: isAdmin && form.assignedToId ? form.assignedToId : undefined,
      })
      if (result.error) toast.error(result.error)
      else {
        toast.success('Prospect added')
        setForm({ name: '', phone: '', email: '', truckType: '', route: '', assignedToId: '' })
        setOpen(false)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" /> Add Prospect
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add a prospect</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="p-name">Name *</Label>
            <Input id="p-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-phone">Phone *</Label>
            <Input id="p-phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-email">Email</Label>
            <Input id="p-email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="p-truck">Truck type</Label>
              <Select value={form.truckType} onValueChange={(v) => setForm((f) => ({ ...f, truckType: v }))}>
                <SelectTrigger id="p-truck">
                  <SelectValue placeholder="Select" />
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
            <div className="space-y-1.5">
              <Label htmlFor="p-route">Route</Label>
              <Input id="p-route" value={form.route} onChange={(e) => setForm((f) => ({ ...f, route: e.target.value }))} />
            </div>
          </div>

          {isAdmin && (
            <div className="space-y-1.5">
              <Label htmlFor="p-assign">Assign to caller</Label>
              <Select value={form.assignedToId} onValueChange={(v) => setForm((f) => ({ ...f, assignedToId: v }))}>
                <SelectTrigger id="p-assign">
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
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="button" loading={pending} disabled={!form.name || !form.phone} onClick={submit}>
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
