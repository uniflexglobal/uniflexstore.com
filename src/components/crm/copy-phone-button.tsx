'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

/** Normalizes a US phone number to +1XXXXXXXXXX for dialing/pasting into a phone app. */
export function toDialableUS(phone: string): string {
  const trimmed = phone.trim()
  if (trimmed.startsWith('+')) return trimmed
  const digits = trimmed.replace(/\D/g, '')
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  return trimmed
}

interface CopyPhoneButtonProps {
  phone: string
  className?: string
  iconClassName?: string
  /** Copies the number normalized to +1XXXXXXXXXX instead of the raw displayed text. */
  withCountryCode?: boolean
}

/** Renders a phone number with a small inline button to copy it to the clipboard. */
export function CopyPhoneButton({ phone, className, iconClassName, withCountryCode }: CopyPhoneButtonProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const value = withCountryCode ? toDialableUS(phone) : phone
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      toast.success(`Copied ${value}`)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error('Could not copy — copy it manually')
    }
  }

  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      {phone}
      <button
        type="button"
        onClick={handleCopy}
        aria-label={`Copy ${phone}`}
        className={cn(
          'inline-flex h-4 w-4 shrink-0 items-center justify-center rounded text-[var(--text-muted)] transition-colors hover:text-[var(--brand-accent)]',
          iconClassName
        )}
      >
        {copied ? <Check className="h-3 w-3 text-[var(--success)]" /> : <Copy className="h-3 w-3" />}
      </button>
    </span>
  )
}
