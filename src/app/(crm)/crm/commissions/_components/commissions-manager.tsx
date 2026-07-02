'use client'

import { useMemo, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Plus, HandCoins } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { createCommission, markCommissionPaid } from '@/server/actions/crm/commissions'
import { formatUSD, decimalToNumber } from '@/lib/utils'

// Free-text suggestions only — Commission.type has no enum until commission
// rules are formalized by the business owner (see prisma/schema.prisma).
const SUGGESTED_TYPES = ['dispatch_fee_share', 'signed_bonus', 'referral_bonus']

type Commission = {
  id: string
  amount: string | number
  type: string
  earnedAt: string
  paidAt: string | null
  staff: { id: string; name: string }
  load: { id: string; loadNumber: string } | null
  lead: { id: string; name: string } | null
}

type StaffOption = { id: string; name: string; role: string }
type LoadOption = { id: string; loadNumber: string }
type LeadOption = { id: string; name: string }

interface CommissionsManagerProps {
  commissions: Commission[]
  total: number
  staff: StaffOption[]
  loads: LoadOption[]
  leads: LeadOption[]
}

const EMPTY_FORM = { staffId: '', amount: '', type: '', loadId: '', leadId: '' }

export function CommissionsManager({ commissions, total, staff, loads, leads }: CommissionsManagerProps) {
  const [showForm, setShowForm] = useState(false)
  const [pending, startTransition] = useTransition()
  const [form, setForm] = useState(EMPTY_FORM)

  const totalUnpaid = useMemo(
    () => commissions.filter((c) => !c.paidAt).reduce((sum, c) => sum + decimalToNumber(c.amount), 0),
    [commissions]
  )

  function openNew() {
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  function submit() {
    startTransition(async () => {
      const result = await createCommission({
        staffId: form.staffId,
        amount: Number(form.amount),
        type: form.type,
        loadId: form.loadId || undefined,
        leadId: form.leadId || undefined,
      })
      if (result.error) toast.error(result.error)
      else {
        toast.success('Commission entry added')
        setShowForm(false)
      }
    })
  }

  function togglePaid(c: Commission) {
    startTransition(async () => {
      const result = await markCommissionPaid(c.id)
      if (result.error) toast.error(result.error)
      else toast.success(c.paidAt ? 'Marked unpaid' : 'Marked paid')
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[var(--text-primary)]">Commissions</h1>
          <p className="text-sm text-[var(--text-muted)]">
            {total} entries · {formatUSD(totalUnpaid)} unpaid
          </p>
        </div>
        <Button size="sm" onClick={openNew}>
          <Plus className="h-4 w-4" /> Add Entry
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--bg-base)]">
        {commissions.length === 0 ? (
          <p className="py-10 text-center text-sm text-[var(--text-muted)]">No commission entries yet.</p>
        ) : (
          <div className="divide-y divide-[var(--border-default)]">
            {commissions.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--bg-subtle)]">
                    <HandCoins className="h-4 w-4 text-[var(--text-muted)]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[var(--text-primary)]">{c.staff.name}</span>
                      <Badge variant="secondary">{c.type}</Badge>
                      {c.paidAt ? <Badge variant="success">Paid</Badge> : <Badge variant="warning">Unpaid</Badge>}
                    </div>
                    <p className="text-xs text-[var(--text-muted)]">
                      {formatUSD(decimalToNumber(c.amount))} · earned {new Date(c.earnedAt).toLocaleDateString()}
                      {c.load && ` · Load ${c.load.loadNumber}`}
                      {c.lead && ` · Lead ${c.lead.name}`}
                    </p>
                  </div>
                </div>
                <label className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                  Paid
                  <Switch checked={!!c.paidAt} onCheckedChange={() => togglePaid(c)} disabled={pending} />
                </label>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add commission entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="c-staff">Staff member *</Label>
              <Select value={form.staffId} onValueChange={(v) => setForm((f) => ({ ...f, staffId: v }))}>
                <SelectTrigger id="c-staff">
                  <SelectValue placeholder="Select staff" />
                </SelectTrigger>
                <SelectContent>
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="c-amount">Amount ($) *</Label>
                <Input
                  id="c-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-type">Type *</Label>
                <Input
                  id="c-type"
                  list="commission-type-suggestions"
                  placeholder="e.g. dispatch_fee_share"
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                />
                <datalist id="commission-type-suggestions">
                  {SUGGESTED_TYPES.map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="c-load">Related load</Label>
                <Select value={form.loadId} onValueChange={(v) => setForm((f) => ({ ...f, loadId: v }))}>
                  <SelectTrigger id="c-load">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    {loads.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.loadNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-lead">Related lead</Label>
                <Select value={form.leadId} onValueChange={(v) => setForm((f) => ({ ...f, leadId: v }))}>
                  <SelectTrigger id="c-lead">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    {leads.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button type="button" loading={pending} disabled={!form.staffId || !form.amount || !form.type} onClick={submit}>
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
