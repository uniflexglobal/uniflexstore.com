'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { PhoneOff, Clock, ThumbsDown, Ban, CheckCircle2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { logCallOutcome, qualifyLead } from '@/server/actions/crm/prospects'
import { TRUCK_TYPES } from '@/config/crm'
import { CopyPhoneButton } from '@/components/crm/copy-phone-button'

type Prospect = {
  id: string
  name: string
  phone: string
  email: string | null
  truckType: string | null
  route: string | null
}

type Dispatcher = { id: string; name: string }

const OUTCOMES = [
  { status: 'NO_ANSWER', label: 'No answer', icon: PhoneOff },
  { status: 'CALL_BACK_LATER', label: 'Call back later', icon: Clock },
  { status: 'NOT_INTERESTED', label: 'Not interested', icon: ThumbsDown },
  { status: 'DO_NOT_CALL', label: 'Do not call', icon: Ban },
] as const

interface WorkProspectDialogProps {
  prospect: Prospect | null
  onClose: () => void
  canAssignDispatcher: boolean
  dispatchers: Dispatcher[]
}

export function WorkProspectDialog({ prospect, onClose, canAssignDispatcher, dispatchers }: WorkProspectDialogProps) {
  const [mode, setMode] = useState<'outcome' | 'qualify'>('outcome')
  const [note, setNote] = useState('')
  const [callBackAt, setCallBackAt] = useState('')
  const [pendingOutcome, setPendingOutcome] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const [qualifyForm, setQualifyForm] = useState({
    name: '',
    phone: '',
    email: '',
    mcNumber: '',
    address: '',
    zipCode: '',
    truckType: '',
    weightAllowed: '',
    preferredRoute: '',
    availableAt: '',
    notes: '',
    assignToDispatcherId: '',
  })

  const mcNumberValid = qualifyForm.mcNumber.length === 0 || qualifyForm.mcNumber.length === 6

  function reset() {
    setMode('outcome')
    setNote('')
    setCallBackAt('')
    setPendingOutcome(null)
  }

  function handleClose() {
    reset()
    onClose()
  }

  function openQualify() {
    if (!prospect) return
    setQualifyForm({
      name: prospect.name,
      phone: prospect.phone,
      email: prospect.email ?? '',
      mcNumber: '',
      address: '',
      zipCode: '',
      truckType: prospect.truckType ?? '',
      weightAllowed: '',
      preferredRoute: prospect.route ?? '',
      availableAt: '',
      notes: '',
      assignToDispatcherId: '',
    })
    setMode('qualify')
  }

  function submitOutcome(status: (typeof OUTCOMES)[number]['status']) {
    if (!prospect) return
    setPendingOutcome(status)
    startTransition(async () => {
      const result = await logCallOutcome({ prospectId: prospect.id, status, note: note || undefined, callBackAt: callBackAt || undefined })
      if (result.error) toast.error(result.error)
      else {
        toast.success('Call outcome saved')
        handleClose()
      }
    })
  }

  function submitQualify() {
    if (!prospect) return
    startTransition(async () => {
      const result = await qualifyLead({
        prospectId: prospect.id,
        name: qualifyForm.name,
        phone: qualifyForm.phone,
        email: qualifyForm.email,
        mcNumber: qualifyForm.mcNumber ? `MC-${qualifyForm.mcNumber}` : undefined,
        address: qualifyForm.address || undefined,
        zipCode: qualifyForm.zipCode || undefined,
        truckType: qualifyForm.truckType,
        weightAllowed: qualifyForm.weightAllowed || undefined,
        preferredRoute: qualifyForm.preferredRoute || undefined,
        availableAt: qualifyForm.availableAt || undefined,
        notes: qualifyForm.notes || undefined,
        assignToDispatcherId: canAssignDispatcher && qualifyForm.assignToDispatcherId ? qualifyForm.assignToDispatcherId : undefined,
      })
      if (result.error) toast.error(result.error)
      else {
        toast.success(
          canAssignDispatcher && qualifyForm.assignToDispatcherId
            ? 'Lead qualified and assigned to dispatcher'
            : 'Lead qualified — sent to admin for dispatcher assignment'
        )
        handleClose()
      }
    })
  }

  return (
    <Dialog open={!!prospect} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === 'qualify' && (
              <button type="button" onClick={() => setMode('outcome')} aria-label="Back" className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            {prospect?.name}
          </DialogTitle>
        </DialogHeader>

        {mode === 'outcome' ? (
          <div className="space-y-4">
            {prospect && (
              <p className="text-sm text-[var(--text-muted)]">
                <CopyPhoneButton phone={prospect.phone} withCountryCode />
              </p>
            )}

            <div className="grid grid-cols-2 gap-2">
              {OUTCOMES.map(({ status, label, icon: Icon }) => (
                <Button
                  key={status}
                  type="button"
                  variant="outline"
                  size="sm"
                  loading={pending && pendingOutcome === status}
                  onClick={() => submitOutcome(status)}
                  className="justify-start"
                >
                  <Icon className="h-3.5 w-3.5" /> {label}
                </Button>
              ))}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="call-back-at">Call back on (optional)</Label>
              <Input id="call-back-at" type="date" value={callBackAt} onChange={(e) => setCallBackAt(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="call-note">Note (optional)</Label>
              <Textarea id="call-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="What came up on the call…" />
            </div>

            <Button type="button" variant="accent" className="w-full" onClick={openQualify}>
              <CheckCircle2 className="h-4 w-4" /> This call was successful — Qualify
            </Button>
          </div>
        ) : (
          <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="q-name">Name *</Label>
                <Input id="q-name" value={qualifyForm.name} onChange={(e) => setQualifyForm((f) => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="q-phone">Phone *</Label>
                <Input id="q-phone" value={qualifyForm.phone} onChange={(e) => setQualifyForm((f) => ({ ...f, phone: e.target.value }))} required />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="q-email">Email *</Label>
              <Input id="q-email" type="email" value={qualifyForm.email} onChange={(e) => setQualifyForm((f) => ({ ...f, email: e.target.value }))} required />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="q-mc">MC number</Label>
                <div
                  className={`flex h-10 items-center rounded-md border bg-[var(--bg-base)] transition-all duration-150 ${
                    mcNumberValid
                      ? 'border-[var(--border-default)] focus-within:border-[var(--brand-accent)] focus-within:ring-2 focus-within:ring-[var(--brand-accent)]/20'
                      : 'border-[var(--error)] focus-within:ring-2 focus-within:ring-[var(--error)]/20'
                  }`}
                >
                  <span className="pl-3 text-sm text-[var(--text-muted)] select-none">MC-</span>
                  <input
                    id="q-mc"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="123456"
                    value={qualifyForm.mcNumber}
                    onChange={(e) =>
                      setQualifyForm((f) => ({ ...f, mcNumber: e.target.value.replace(/\D/g, '').slice(0, 6) }))
                    }
                    className="h-full w-full rounded-md bg-transparent px-1.5 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
                  />
                </div>
                {!mcNumberValid && <p className="text-xs text-[var(--error)]">Must be 6 digits</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="q-truck">Truck type *</Label>
                <Select value={qualifyForm.truckType} onValueChange={(v) => setQualifyForm((f) => ({ ...f, truckType: v }))}>
                  <SelectTrigger id="q-truck">
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
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="q-address">Address</Label>
                <Input id="q-address" value={qualifyForm.address} onChange={(e) => setQualifyForm((f) => ({ ...f, address: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="q-zip">Zip code</Label>
                <Input
                  id="q-zip"
                  inputMode="numeric"
                  placeholder="e.g. 75201"
                  value={qualifyForm.zipCode}
                  onChange={(e) => setQualifyForm((f) => ({ ...f, zipCode: e.target.value.replace(/[^\d-]/g, '').slice(0, 10) }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="q-weight">Weight allowed</Label>
                <Input id="q-weight" value={qualifyForm.weightAllowed} onChange={(e) => setQualifyForm((f) => ({ ...f, weightAllowed: e.target.value }))} placeholder="e.g. 45,000 lbs" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="q-available">Available date</Label>
                <Input id="q-available" type="date" value={qualifyForm.availableAt} onChange={(e) => setQualifyForm((f) => ({ ...f, availableAt: e.target.value }))} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="q-route">Preferred route(s)</Label>
              <Input id="q-route" value={qualifyForm.preferredRoute} onChange={(e) => setQualifyForm((f) => ({ ...f, preferredRoute: e.target.value }))} placeholder="e.g. TX/OK/LA regional" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="q-notes">Notes</Label>
              <Textarea id="q-notes" rows={2} value={qualifyForm.notes} onChange={(e) => setQualifyForm((f) => ({ ...f, notes: e.target.value }))} />
            </div>

            {canAssignDispatcher && (
              <div className="space-y-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-subtle)] p-3">
                <Label htmlFor="q-dispatcher">Assign to dispatcher now (optional)</Label>
                <Select value={qualifyForm.assignToDispatcherId} onValueChange={(v) => setQualifyForm((f) => ({ ...f, assignToDispatcherId: v }))}>
                  <SelectTrigger id="q-dispatcher">
                    <SelectValue placeholder="Leave for admin to assign" />
                  </SelectTrigger>
                  <SelectContent>
                    {dispatchers.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-[var(--text-muted)]">
                  You can assign this straight to a dispatcher instead of sending it to the admin queue.
                </p>
              </div>
            )}
          </div>
        )}

        {mode === 'qualify' && (
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setMode('outcome')}>
              Back
            </Button>
            <Button
              type="button"
              variant="accent"
              loading={pending}
              disabled={!qualifyForm.name || !qualifyForm.phone || !qualifyForm.email || !qualifyForm.truckType || !mcNumberValid}
              onClick={submitQualify}
            >
              Qualify lead
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
