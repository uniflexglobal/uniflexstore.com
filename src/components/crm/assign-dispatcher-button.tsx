'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { assignDispatcher } from '@/server/actions/crm/leads'

type Dispatcher = { id: string; name: string }

export function AssignDispatcherButton({
  leadId,
  leadName,
  dispatchers,
}: {
  leadId: string
  leadName: string
  dispatchers: Dispatcher[]
}) {
  const [open, setOpen] = useState(false)
  const [dispatcherId, setDispatcherId] = useState('')
  const [pending, startTransition] = useTransition()

  function submit() {
    if (!dispatcherId) return
    startTransition(async () => {
      const result = await assignDispatcher({ leadId, dispatcherId })
      if (result.error) toast.error(result.error)
      else {
        toast.success(`${leadName} assigned to a dispatcher`)
        setOpen(false)
      }
    })
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        Assign
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Assign {leadName} to a dispatcher</DialogTitle>
          </DialogHeader>

          {dispatchers.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">
              No active dispatcher accounts yet — create one on the Staff page first.
            </p>
          ) : (
            <Select value={dispatcherId} onValueChange={setDispatcherId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a dispatcher" />
              </SelectTrigger>
              <SelectContent>
                {dispatchers.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={!dispatcherId} loading={pending} onClick={submit}>
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
