'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createInvoice } from '@/server/actions/crm/invoices'
import { formatUSD, decimalToNumber } from '@/lib/utils'

type LoadOption = {
  id: string
  loadNumber: string
  rate: string | number
  dispatchFeePct: string | number | null
  carrierId: string
  carrier: { id: string; companyName: string }
  originCity: string
  originState: string
  destCity: string
  destState: string
}

type CarrierOption = { id: string; companyName: string }

function suggestInvoiceNumber() {
  return `INV-${Date.now().toString(36).toUpperCase()}`
}

export function NewInvoiceForm({ loads, carriers }: { loads: LoadOption[]; carriers: CarrierOption[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [mode, setMode] = useState<'load' | 'standalone'>(loads.length > 0 ? 'load' : 'standalone')
  const [loadId, setLoadId] = useState('')
  const [carrierId, setCarrierId] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState(suggestInvoiceNumber)
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')

  const selectedLoad = useMemo(() => loads.find((l) => l.id === loadId) ?? null, [loads, loadId])

  function handleSelectLoad(id: string) {
    setLoadId(id)
    const load = loads.find((l) => l.id === id)
    if (!load) return
    setCarrierId(load.carrierId)
    if (load.dispatchFeePct != null) {
      const rate = decimalToNumber(load.rate)
      const pct = decimalToNumber(load.dispatchFeePct)
      setAmount(((rate * pct) / 100).toFixed(2))
    } else {
      setAmount('')
    }
  }

  function switchMode(next: 'load' | 'standalone') {
    setMode(next)
    setLoadId('')
    setCarrierId('')
    setAmount('')
  }

  function submit() {
    startTransition(async () => {
      const result = await createInvoice({
        loadId: mode === 'load' ? loadId || undefined : undefined,
        carrierId,
        invoiceNumber,
        amount: Number(amount),
        dueDate: dueDate || undefined,
        notes: notes || undefined,
      })
      if (result.error) toast.error(result.error)
      else {
        toast.success('Invoice created')
        router.push('/crm/invoices')
      }
    })
  }

  const canSubmit = Boolean(carrierId && invoiceNumber && amount && Number(amount) > 0) && (mode === 'standalone' || Boolean(loadId))

  return (
    <div className="space-y-6">
      <div className="flex gap-1.5">
        <Button type="button" size="sm" variant={mode === 'load' ? 'primary' : 'outline'} onClick={() => switchMode('load')}>
          From a delivered load
        </Button>
        <Button type="button" size="sm" variant={mode === 'standalone' ? 'primary' : 'outline'} onClick={() => switchMode('standalone')}>
          Standalone (no load)
        </Button>
      </div>

      <div className="space-y-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-base)] p-5">
        {mode === 'load' ? (
          <div className="space-y-1.5">
            <Label htmlFor="inv-load">Delivered load *</Label>
            <Select value={loadId} onValueChange={handleSelectLoad}>
              <SelectTrigger id="inv-load">
                <SelectValue placeholder={loads.length ? 'Select a load' : 'No delivered loads awaiting invoice'} />
              </SelectTrigger>
              <SelectContent>
                {loads.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.loadNumber} — {l.carrier.companyName} ({l.originCity}, {l.originState} → {l.destCity}, {l.destState}) — {formatUSD(decimalToNumber(l.rate))}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedLoad && (
              <p className="text-xs text-[var(--text-muted)]">
                Rate {formatUSD(decimalToNumber(selectedLoad.rate))}
                {selectedLoad.dispatchFeePct != null
                  ? ` · Dispatch fee ${decimalToNumber(selectedLoad.dispatchFeePct)}% suggests ${formatUSD(
                      (decimalToNumber(selectedLoad.rate) * decimalToNumber(selectedLoad.dispatchFeePct)) / 100
                    )} — override below if needed`
                  : ' · No dispatch fee % set on this load — enter the amount manually'}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-1.5">
            <Label htmlFor="inv-carrier">Carrier *</Label>
            <Select value={carrierId} onValueChange={setCarrierId}>
              <SelectTrigger id="inv-carrier">
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
            <Label htmlFor="inv-number">Invoice number *</Label>
            <Input id="inv-number" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="inv-amount">Amount ($) *</Label>
            <Input id="inv-amount" type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="inv-due">Due date</Label>
          <Input id="inv-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="inv-notes">Notes</Label>
          <Textarea id="inv-notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.push('/crm/invoices')}>
          Cancel
        </Button>
        <Button type="button" loading={pending} disabled={!canSubmit} onClick={submit}>
          Create invoice
        </Button>
      </div>
    </div>
  )
}
