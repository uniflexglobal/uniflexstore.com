'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
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
import { updateLoadStatus } from '@/server/actions/crm/loads'
import { loadStatusLabels } from '@/config/crm'
import type { LoadStatus } from '@prisma/client'

// Forward path this board drives day-to-day. INVOICED → PAID belongs to the
// Invoicing vertical, so there's no "next status" offered past DELIVERED.
const NEXT_STATUS: Partial<Record<LoadStatus, LoadStatus>> = {
  BOOKED: 'DISPATCHED',
  DISPATCHED: 'IN_TRANSIT',
  IN_TRANSIT: 'DELIVERED',
}

const CANCELLABLE_FROM: LoadStatus[] = ['BOOKED', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED']

interface LoadStatusMenuProps {
  loadId: string
  loadNumber: string
  currentStatus: LoadStatus
  size?: 'sm' | 'md'
}

export function LoadStatusMenu({ loadId, loadNumber, currentStatus, size = 'sm' }: LoadStatusMenuProps) {
  const [pending, startTransition] = useTransition()
  const [confirmCancel, setConfirmCancel] = useState(false)

  const nextStatus = NEXT_STATUS[currentStatus]
  const cancellable = CANCELLABLE_FROM.includes(currentStatus)

  function move(status: LoadStatus) {
    startTransition(async () => {
      const result = await updateLoadStatus(loadId, status)
      if (result.error) toast.error(result.error)
      else toast.success(`${loadNumber} moved to ${loadStatusLabels[status] ?? status}`)
    })
  }

  function cancel() {
    startTransition(async () => {
      const result = await updateLoadStatus(loadId, 'CANCELLED')
      if (result.error) toast.error(result.error)
      else {
        toast.success(`${loadNumber} cancelled`)
        setConfirmCancel(false)
      }
    })
  }

  if (!nextStatus && !cancellable) return null

  // Simple, single-action case: just a button, no menu needed.
  if (nextStatus && !cancellable) {
    return (
      <Button size={size} loading={pending} onClick={() => move(nextStatus)}>
        Move to {loadStatusLabels[nextStatus] ?? nextStatus}
      </Button>
    )
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size={size} variant={nextStatus ? 'primary' : 'outline'} loading={pending}>
            {nextStatus ? `Move to ${loadStatusLabels[nextStatus] ?? nextStatus}` : 'Actions'}
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {nextStatus && (
            <DropdownMenuItem onClick={() => move(nextStatus)}>
              Move to {loadStatusLabels[nextStatus] ?? nextStatus}
            </DropdownMenuItem>
          )}
          {cancellable && (
            <DropdownMenuItem onClick={() => setConfirmCancel(true)} className="text-[var(--error)]">
              Cancel load
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel {loadNumber}?</AlertDialogTitle>
            <AlertDialogDescription>
              This marks the load as cancelled. This can&apos;t be undone from the dispatch board.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Back</AlertDialogCancel>
            <AlertDialogAction onClick={cancel}>Cancel load</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
