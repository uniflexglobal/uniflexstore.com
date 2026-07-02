'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { Plus, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { createStaff, updateStaff } from '@/server/actions/crm/staff'
import { crmRoleLabels } from '@/config/crm'
import { CRM_ROLES } from '@/lib/validations/crm'

type Staff = {
  id: string
  name: string
  email: string
  role: 'CALLER' | 'DISPATCHER' | 'CRM_ADMIN'
  phone: string | null
  isActive: boolean
  isSeniorCaller: boolean
}

interface FormValues {
  name: string
  email: string
  password: string
  role: 'CALLER' | 'DISPATCHER' | 'CRM_ADMIN'
  phone: string
  isSeniorCaller: boolean
}

export function StaffManager({ staff }: { staff: Staff[] }) {
  const [showForm, setShowForm] = useState(false)
  const [pending, startTransition] = useTransition()

  const { register, handleSubmit, watch, setValue, reset } = useForm<FormValues>({
    defaultValues: { name: '', email: '', password: '', role: 'CALLER', phone: '', isSeniorCaller: false },
  })
  const role = watch('role')
  const isSeniorCaller = watch('isSeniorCaller')

  function openNew() {
    reset({ name: '', email: '', password: '', role: 'CALLER', phone: '', isSeniorCaller: false })
    setShowForm(true)
  }

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      const result = await createStaff(data)
      if (result.error) toast.error(result.error)
      else {
        toast.success('Staff account created')
        setShowForm(false)
      }
    })
  }

  function toggleActive(s: Staff) {
    startTransition(async () => {
      const result = await updateStaff(s.id, { isActive: !s.isActive })
      if (result.error) toast.error(result.error)
      else toast.success(s.isActive ? `${s.name} deactivated` : `${s.name} reactivated`)
    })
  }

  function toggleSenior(s: Staff) {
    startTransition(async () => {
      const result = await updateStaff(s.id, { isSeniorCaller: !s.isSeniorCaller })
      if (result.error) toast.error(result.error)
      else toast.success(s.isSeniorCaller ? `No longer senior` : `Marked as senior caller`)
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[var(--text-primary)]">Staff</h1>
          <p className="text-sm text-[var(--text-muted)]">{staff.length} accounts</p>
        </div>
        <Button size="sm" onClick={openNew}>
          <Plus className="h-4 w-4" /> Add Staff
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--bg-base)]">
        {staff.length === 0 ? (
          <p className="py-10 text-center text-sm text-[var(--text-muted)]">No staff accounts yet.</p>
        ) : (
          <div className="divide-y divide-[var(--border-default)]">
            {staff.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--bg-subtle)]">
                    <UserRound className="h-4 w-4 text-[var(--text-muted)]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[var(--text-primary)]">{s.name}</span>
                      <Badge variant="secondary">{crmRoleLabels[s.role]}</Badge>
                      {s.role === 'CALLER' && s.isSeniorCaller && <Badge variant="success">Senior</Badge>}
                      {!s.isActive && <Badge variant="destructive">Inactive</Badge>}
                    </div>
                    <p className="text-xs text-[var(--text-muted)]">{s.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {s.role === 'CALLER' && (
                    <label className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                      Senior
                      <Switch checked={s.isSeniorCaller} onCheckedChange={() => toggleSenior(s)} disabled={pending} />
                    </label>
                  )}
                  <label className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                    Active
                    <Switch checked={s.isActive} onCheckedChange={() => toggleActive(s)} disabled={pending} />
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add staff account</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="s-name">Name *</Label>
              <Input id="s-name" {...register('name', { required: true })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-email">Email *</Label>
              <Input id="s-email" type="email" {...register('email', { required: true })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-password">Temporary password *</Label>
              <Input id="s-password" type="text" {...register('password', { required: true })} placeholder="At least 8 characters" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="s-role">Role *</Label>
                <Select value={role} onValueChange={(v) => setValue('role', v as FormValues['role'])}>
                  <SelectTrigger id="s-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CRM_ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {crmRoleLabels[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="s-phone">Phone</Label>
                <Input id="s-phone" {...register('phone')} />
              </div>
            </div>
            {role === 'CALLER' && (
              <div className="flex items-center gap-2">
                <Switch id="s-senior" checked={isSeniorCaller} onCheckedChange={(v) => setValue('isSeniorCaller', v)} />
                <Label htmlFor="s-senior">Senior caller (can assign leads straight to a dispatcher)</Label>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={pending}>
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
