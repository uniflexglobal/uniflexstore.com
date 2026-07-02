'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { updateCarrier } from '@/server/actions/crm/carriers'

type ActivityRow = { id: string; type: string; note: string | null; createdAt: string; staff: { id: string; name: string } | null }

interface ProfileTabProps {
  carrier: {
    id: string
    companyName: string
    contactName: string
    phone: string
    email: string
    mcNumber: string | null
    dotNumber: string | null
    address: string | null
    notes: string | null
    activity: ActivityRow[]
  }
}

interface FormValues {
  companyName: string
  contactName: string
  phone: string
  email: string
  mcNumber: string
  dotNumber: string
  address: string
  notes: string
}

export function ProfileTab({ carrier }: ProfileTabProps) {
  const [pending, startTransition] = useTransition()
  const { register, handleSubmit } = useForm<FormValues>({
    defaultValues: {
      companyName: carrier.companyName,
      contactName: carrier.contactName,
      phone: carrier.phone,
      email: carrier.email,
      mcNumber: carrier.mcNumber ?? '',
      dotNumber: carrier.dotNumber ?? '',
      address: carrier.address ?? '',
      notes: carrier.notes ?? '',
    },
  })

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      const result = await updateCarrier(carrier.id, data)
      if (result.error) toast.error(result.error)
      else toast.success('Carrier profile updated')
    })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 lg:col-span-2">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="c-company">Company name *</Label>
            <Input id="c-company" {...register('companyName', { required: true })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-contact">Contact name *</Label>
            <Input id="c-contact" {...register('contactName', { required: true })} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="c-phone">Phone *</Label>
            <Input id="c-phone" {...register('phone', { required: true })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-email">Email *</Label>
            <Input id="c-email" type="email" {...register('email', { required: true })} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="c-mc">MC number</Label>
            <Input id="c-mc" {...register('mcNumber')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-dot">DOT number</Label>
            <Input id="c-dot" {...register('dotNumber')} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="c-address">Address</Label>
          <Input id="c-address" {...register('address')} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="c-notes">Notes</Label>
          <Textarea id="c-notes" rows={4} {...register('notes')} />
        </div>
        <Button type="submit" loading={pending}>
          Save changes
        </Button>
      </form>

      <div className="space-y-2">
        <p className="text-sm font-medium text-[var(--text-primary)]">Recent activity</p>
        {carrier.activity.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">No activity yet.</p>
        ) : (
          <ul className="space-y-2">
            {carrier.activity.map((a) => (
              <li key={a.id} className="rounded-lg border border-[var(--border-default)] p-2.5 text-xs">
                <p className="text-[var(--text-primary)]">{a.note ?? a.type}</p>
                <p className="mt-0.5 text-[var(--text-muted)]">
                  {a.staff?.name ?? 'System'} · {new Date(a.createdAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
