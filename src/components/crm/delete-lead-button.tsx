'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { deleteLead } from '@/server/actions/crm/leads'

export function DeleteLeadButton({ leadId, leadName }: { leadId: string; leadName: string }) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  function submit() {
    startTransition(async () => {
      const result = await deleteLead(leadId)
      if (result.error) toast.error(result.error)
      else {
        toast.success(`${leadName} deleted`)
        setOpen(false)
      }
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-[var(--error)]" onClick={() => setOpen(true)}>
        <Trash2 className="h-3.5 w-3.5" />
        <span className="sr-only">Delete lead</span>
      </Button>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {leadName}?</AlertDialogTitle>
          <AlertDialogDescription>
            This removes the lead record permanently. If it was already converted to a carrier, that carrier
            and its trucks, drivers, and loads are not affected. This can&apos;t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            onClick={(e) => {
              e.preventDefault()
              submit()
            }}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
