'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Phone } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { logCheckCall } from '@/server/actions/crm/check-calls'

type CheckCall = {
  id: string
  note: string
  location: string | null
  createdAt: string
  loggedBy: { id: string; name: string } | null
}

export function CheckCallLog({ loadId, checkCalls }: { loadId: string; checkCalls: CheckCall[] }) {
  const [note, setNote] = useState('')
  const [location, setLocation] = useState('')
  const [pending, startTransition] = useTransition()

  function submit() {
    if (!note.trim()) {
      toast.error('Enter a note for this check call')
      return
    }
    startTransition(async () => {
      const result = await logCheckCall({ loadId, note, location: location || undefined })
      if (result.error) toast.error(result.error)
      else {
        toast.success('Check call logged')
        setNote('')
        setLocation('')
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Check calls</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Textarea
            rows={2}
            placeholder="What's the status? e.g. 'Loaded, on schedule, ETA 6pm'"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <Input placeholder="Location (optional)" value={location} onChange={(e) => setLocation(e.target.value)} />
          <Button size="sm" loading={pending} onClick={submit} className="w-full">
            Log check call
          </Button>
        </div>

        <div className="space-y-3 border-t border-[var(--border-default)] pt-4">
          {checkCalls.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">No check calls logged yet.</p>
          ) : (
            checkCalls.map((cc) => (
              <div key={cc.id} className="flex gap-2.5">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--bg-subtle)]">
                  <Phone className="h-3 w-3 text-[var(--text-muted)]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-[var(--text-primary)]">{cc.note}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {cc.location ? `${cc.location} · ` : ''}
                    {new Date(cc.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                    {cc.loggedBy ? ` · ${cc.loggedBy.name}` : ''}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
