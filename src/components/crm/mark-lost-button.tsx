'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { markLeadLost } from '@/server/actions/crm/leads'

export function MarkLostButton({ leadId, leadName }: { leadId: string; leadName: string }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [pending, startTransition] = useTransition()

  function submit() {
    startTransition(async () => {
      const result = await markLeadLost(leadId, reason || undefined)
      if (result.error) toast.error(result.error)
      else {
        toast.success(`${leadName} marked lost`)
        setOpen(false)
      }
    })
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        Mark lost
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Mark {leadName} as lost?</DialogTitle>
          </DialogHeader>
          <Textarea
            rows={2}
            placeholder="Reason (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" loading={pending} onClick={submit}>
              Mark lost
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
