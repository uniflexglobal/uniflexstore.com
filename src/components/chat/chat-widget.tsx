'use client'

import {
  useRef,
  useEffect,
  useState,
  useCallback,
  KeyboardEvent,
  useMemo,
} from 'react'
import { usePathname } from 'next/navigation'
import { m, AnimatePresence, useReducedMotion } from 'motion/react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import type { UIMessage } from 'ai'
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  Bot,
  ShoppingBag,
  AlertCircle,
  Sparkles,
} from 'lucide-react'
import Link from 'next/link'
import {
  chatPanel,
  chatMsgUser,
  chatMsgAssistant,
  toolActivity,
} from '@/lib/motion'
import type { Transition } from 'motion/react'
import { ConfirmationCard, type Proposal } from '@/components/chat/confirmation-card'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatWidgetProps {
  userId: string | null
}

// ─── Hidden routes ────────────────────────────────────────────────────────────

const HIDDEN_PREFIXES = ['/admin', '/auth', '/checkout', '/logistics', '/crm']

function useShowWidget(pathname: string): boolean {
  return !HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'))
}

// ─── Tool detection helpers ───────────────────────────────────────────────────

type RawPart = Record<string, unknown>

function isToolPart(part: unknown): part is RawPart {
  if (typeof part !== 'object' || part === null) return false
  const p = part as RawPart
  return typeof p.type === 'string' && p.type.startsWith('tool-')
}

function isActiveTool(part: unknown): boolean {
  if (!isToolPart(part)) return false
  const p = part as RawPart
  return p.state === 'input-streaming' || p.state === 'input-available'
}

function isProposal(part: unknown): part is RawPart & { output: Proposal } {
  if (!isToolPart(part)) return false
  const p = part as RawPart
  if (p.state !== 'output-available') return false
  const output = p.output
  if (typeof output !== 'object' || output === null) return false
  return (output as Record<string, unknown>).type === 'proposal'
}

function getToolName(part: unknown): string {
  if (!isToolPart(part)) return ''
  return ((part as RawPart).type as string).replace('tool-', '')
}

// ─── Tool activity labels ─────────────────────────────────────────────────────

const TOOL_LABELS: Record<string, string> = {
  proposeAddToCart: 'Checking product…',
  proposeRemoveFromCart: 'Checking cart…',
  proposeUpdateCartQty: 'Checking cart…',
  proposeClearCart: 'Loading cart…',
  proposeApplyCoupon: 'Validating coupon…',
  proposeCancelOrder: 'Checking order…',
  proposeReturnRequest: 'Checking return eligibility…',
  getCart: 'Loading cart…',
  getCheckoutLink: 'Preparing checkout…',
  listOrders: 'Loading orders…',
  getOrderStatus: 'Looking up order…',
  searchProducts: 'Searching products…',
  getProduct: 'Loading product details…',
  checkBrandAuthorization: 'Checking brand authorization…',
  getPolicy: 'Getting policy…',
}

// ─── Instant transition ───────────────────────────────────────────────────────

const INSTANT: Transition = { duration: 0 }

// ─── Thread persistence ───────────────────────────────────────────────────────

async function loadThread(): Promise<UIMessage[]> {
  try {
    const res = await fetch('/api/chat/thread', { credentials: 'include' })
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data.messages) ? (data.messages as UIMessage[]) : []
  } catch {
    return []
  }
}

function saveThread(messages: UIMessage[]) {
  fetch('/api/chat/thread', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  }).catch(() => {})
}

// ─── Typing indicator ─────────────────────────────────────────────────────────

function TypingIndicator({ reduced }: { reduced: boolean }) {
  return (
    <div className="flex items-end gap-1.5 px-4 pb-2">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--brand-accent)]/12">
        <Bot className="h-3.5 w-3.5 text-[var(--brand-accent)]" aria-hidden="true" />
      </div>
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-[var(--bg-subtle)] px-3.5 py-2.5">
        {reduced ? (
          <span className="h-1.5 w-8 rounded-full bg-[var(--text-muted)]" />
        ) : (
          [0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-[var(--text-muted)]"
              style={{ animation: `chatDotBounce 1.1s ease-in-out ${i * 0.18}s infinite` }}
            />
          ))
        )}
      </div>
    </div>
  )
}

// ─── Tool activity pill ───────────────────────────────────────────────────────

function ToolActivityPill({ label, reduced }: { label: string; reduced: boolean }) {
  return (
    <m.div
      key={label}
      variants={toolActivity}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={reduced ? INSTANT : undefined}
      className="mx-4 flex items-center gap-2 self-start rounded-full border border-[var(--brand-accent)]/20 bg-[var(--brand-accent)]/8 px-3 py-1.5"
    >
      <Sparkles className="h-3 w-3 animate-pulse text-[var(--brand-accent)]" />
      <span className="text-[11px] font-500 text-[var(--brand-accent)]">{label}</span>
    </m.div>
  )
}

// ─── Message text (markdown link parser) ─────────────────────────────────────

function MessageText({ text }: { text: string }) {
  const parts = text.split(/(\[.+?\]\(.+?\))/g)
  return (
    <>
      {parts.map((part, i) => {
        const match = part.match(/^\[(.+?)\]\((.+?)\)$/)
        if (match) {
          const [, label, href] = match
          return href.startsWith('/') ? (
            <Link key={i} href={href} className="underline underline-offset-2 hover:opacity-80">
              {label}
            </Link>
          ) : (
            <a
              key={i}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:opacity-80"
            >
              {label}
              <span className="sr-only"> (opens in new tab)</span>
            </a>
          )
        }
        return part.split('\n').map((line, j, arr) => (
          <span key={`${i}-${j}`}>
            {line}
            {j < arr.length - 1 && <br />}
          </span>
        ))
      })}
    </>
  )
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({ message, reduced }: { message: UIMessage; reduced: boolean }) {
  const isUser = message.role === 'user'

  const textContent = message.parts
    .filter((p) => p.type === 'text')
    .map((p) => (p.type === 'text' ? p.text : ''))
    .join('')

  if (!textContent) return null

  return (
    <m.div
      variants={isUser ? chatMsgUser : chatMsgAssistant}
      initial="hidden"
      animate="visible"
      transition={reduced ? INSTANT : undefined}
      className={`flex items-end gap-1.5 px-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {!isUser && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--brand-accent)]/12">
          <Bot className="h-3.5 w-3.5 text-[var(--brand-accent)]" aria-hidden="true" />
        </div>
      )}
      <div
        className={[
          'max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
          isUser
            ? 'rounded-br-sm bg-[var(--brand-primary)] text-white'
            : 'rounded-bl-sm bg-[var(--bg-subtle)] text-[var(--text-primary)]',
        ].join(' ')}
      >
        <MessageText text={textContent} />
      </div>
    </m.div>
  )
}

// ─── Thread loading skeleton ──────────────────────────────────────────────────

function ThreadSkeleton() {
  return (
    <div className="flex flex-col gap-3 px-4 py-4" aria-label="Loading conversation…">
      <div className="h-10 w-4/5 animate-pulse rounded-2xl bg-[var(--bg-subtle)]" />
      <div className="h-10 w-3/5 animate-pulse self-end rounded-2xl bg-[var(--bg-subtle)]" />
      <div className="h-10 w-[72%] animate-pulse rounded-2xl bg-[var(--bg-subtle)]" />
    </div>
  )
}

// ─── Quick replies ────────────────────────────────────────────────────────────

const QUICK_REPLIES = [
  'What electronics do you have?',
  'Gifts for kids under $30?',
  "What's your return policy?",
  'Are you an authorized Sony dealer?',
]

// ─── Focus trap ───────────────────────────────────────────────────────────────

const FOCUSABLE_SELECTORS =
  'a[href], button:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

// ─── Main widget ──────────────────────────────────────────────────────────────

export function ChatWidget({ userId }: ChatWidgetProps) {
  const reducedMotion = useReducedMotion() ?? false
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [threadLoaded, setThreadLoaded] = useState(false)

  const [dismissedProposals, setDismissedProposals] = useState<Set<string>>(new Set())

  const pathname = usePathname()
  const showWidget = useShowWidget(pathname)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const fabRef = useRef<HTMLButtonElement>(null)

  // Context ref — updated on pathname change, read at send time by transport headers fn
  const pathnameRef = useRef(pathname)
  useEffect(() => {
    pathnameRef.current = pathname
  }, [pathname])

  // Transport sends x-chat-context header on every request; headers fn reads pathnameRef at call time
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/chat',
        headers: () => {
          const productSlugMatch = pathnameRef.current.match(/^\/products\/([^/]+)/)
          return {
            'x-chat-context': JSON.stringify({
              pathname: pathnameRef.current,
              productSlug: productSlugMatch?.[1],
            }),
          }
        },
      }),
    []
  )

  const { messages, sendMessage, setMessages, status, error, clearError } = useChat({ transport })

  const isLoading = status === 'submitted' || status === 'streaming'
  const hasMessages = messages.length > 0

  // Load thread on mount (skip on routes where the widget is hidden — no point
  // creating/fetching a thread for a bot the visitor can never open)
  useEffect(() => {
    if (!showWidget) return
    loadThread().then((msgs) => {
      if (msgs.length > 0) setMessages(msgs)
      setThreadLoaded(true)
    })
  }, [setMessages, showWidget])

  // Save thread whenever messages change (debounced 1.5 s)
  useEffect(() => {
    if (!threadLoaded || messages.length === 0) return
    const id = setTimeout(() => saveThread(messages), 1500)
    return () => clearTimeout(id)
  }, [messages, threadLoaded])

  const closePanel = useCallback(() => {
    setIsOpen(false)
    requestAnimationFrame(() => fabRef.current?.focus())
  }, [])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' })
  }, [messages, isLoading, reducedMotion])

  // Focus input when opened
  useEffect(() => {
    if (!isOpen) return
    const id = setTimeout(() => inputRef.current?.focus(), 150)
    return () => clearTimeout(id)
  }, [isOpen])

  // Escape + focus trap
  useEffect(() => {
    if (!isOpen || !panelRef.current) return
    const panel = panelRef.current
    const handleKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') { closePanel(); return }
      if (e.key !== 'Tab') return
      const els = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS))
      if (els.length === 0) return
      const first = els[0]; const last = els[els.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus() }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, closePanel])

  const handleSend = useCallback(() => {
    const text = inputValue.trim()
    if (!text || isLoading) return
    sendMessage({ text })
    setInputValue('')
  }, [inputValue, isLoading, sendMessage])

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  // ── Confirmed action handler ───────────────────────────────────────────────

  const handleConfirm = useCallback(
    async (params: Proposal['params']): Promise<{ message: string }> => {
      const res = await fetch('/api/chat/action', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      })
      const data = await res.json()
      if (res.status === 401) throw new Error('SIGN_IN_REQUIRED')
      if (!res.ok) throw new Error(data.error ?? 'Action failed.')

      window.dispatchEvent(new CustomEvent('uniflex:cart-refresh'))
      return { message: data.message }
    },
    []
  )

  const handleCancelProposal = useCallback((proposalId: string) => {
    setDismissedProposals((prev) => new Set(prev).add(proposalId))
  }, [])

  // Dismiss proposal card 1.5 s after confirm success so user sees the checkmark briefly
  const handleSuccessProposal = useCallback((proposalId: string) => {
    setTimeout(() => {
      setDismissedProposals((prev) => new Set(prev).add(proposalId))
    }, 1500)
  }, [])

  // ── Detect active tool for activity pill ─────────────────────────────────

  const activeToolLabel = useMemo(() => {
    if (!isLoading) return null
    for (const msg of [...messages].reverse()) {
      for (const part of msg.parts) {
        if (isActiveTool(part)) {
          const name = getToolName(part)
          return TOOL_LABELS[name] ?? 'Working…'
        }
      }
    }
    return null
  }, [messages, isLoading])

  if (!showWidget) return null

  return (
    <>
      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <m.div
            ref={panelRef}
            key="chat-panel"
            variants={chatPanel}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={reducedMotion ? INSTANT : undefined}
            role="dialog"
            aria-modal="true"
            aria-label="UniFlex Store chat assistant"
            className="fixed right-4 z-[450] flex w-[380px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-base)] shadow-[0_20px_60px_-12px_rgba(10,21,32,0.4),0_0_0_1px_rgba(29,170,188,0.06)] transition-[bottom] duration-300"
            style={{
              bottom: 'calc(5.5rem + var(--cookie-banner-h, 0px))',
              height: 'min(600px, calc(100dvh - 8rem))',
              transformOrigin: 'bottom right',
            }}
          >
            {/* Header */}
            <div className="flex shrink-0 items-center gap-3 border-b border-[var(--border-subtle)] bg-[var(--brand-primary)] px-4 py-3.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
                <ShoppingBag className="h-4 w-4 text-white" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-600 text-white">UniFlex Assistant</p>
                <p className="text-[11px] text-white/70">
                  Shop, manage orders &amp; more
                </p>
              </div>
              <button
                onClick={closePanel}
                aria-label="Close chat"
                className="flex h-8 w-8 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/15 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {/* Live region — aria-busy tells screen readers a response is in progress */}
            <div
              aria-live="polite"
              aria-atomic="false"
              aria-busy={isLoading}
              className="sr-only"
            >
              {isLoading
                ? 'Assistant is thinking…'
                : hasMessages &&
                  messages[messages.length - 1]?.role === 'assistant' &&
                  messages[messages.length - 1]?.parts
                    .filter((p) => p.type === 'text')
                    .map((p) => (p.type === 'text' ? p.text : ''))
                    .join('')}
            </div>

            {/* Message list */}
            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto py-4 overscroll-contain">
              {!threadLoaded ? (
                <ThreadSkeleton />
              ) : !hasMessages ? (
                <div className="flex flex-col items-center gap-5 px-6 py-6 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand-accent)]/10">
                    <Bot className="h-6 w-6 text-[var(--brand-accent)]" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-sm font-600 text-[var(--text-primary)]">
                      Hi! I&apos;m your UniFlex shopping assistant.
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      I can search products, manage your cart, look up orders, and more.
                    </p>
                  </div>
                  <div className="flex w-full flex-col gap-2">
                    {QUICK_REPLIES.map((reply) => (
                      <button
                        key={reply}
                        onClick={() => sendMessage({ text: reply })}
                        disabled={isLoading}
                        className="rounded-xl border border-[var(--border-subtle)] px-3.5 py-2 text-left text-xs text-[var(--text-secondary)] transition-colors hover:border-[var(--brand-accent)] hover:bg-[var(--brand-teal-light)] hover:text-[var(--brand-accent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)] focus-visible:ring-offset-1 disabled:opacity-50"
                      >
                        {reply}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((msg) => (
                    <MessageRow
                      key={msg.id}
                      message={msg}
                      reduced={reducedMotion}
                      dismissedProposals={dismissedProposals}
                      onConfirm={handleConfirm}
                      onCancelProposal={handleCancelProposal}
                      onSuccessProposal={handleSuccessProposal}
                    />
                  ))}

                  {/* Tool activity pill */}
                  <AnimatePresence mode="wait">
                    {activeToolLabel && (
                      <ToolActivityPill
                        key={activeToolLabel}
                        label={activeToolLabel}
                        reduced={reducedMotion}
                      />
                    )}
                  </AnimatePresence>

                  {/* Typing indicator (text streaming, no active tool) */}
                  {isLoading && !activeToolLabel && (
                    <TypingIndicator reduced={reducedMotion} />
                  )}
                </>
              )}

              {/* Error banner */}
              <AnimatePresence>
                {error && (
                  <m.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={reducedMotion ? INSTANT : undefined}
                    className="mx-4 flex items-start gap-2 rounded-xl border border-[var(--error)]/25 bg-[var(--error)]/8 px-3.5 py-3 text-xs text-[var(--error)]"
                    role="alert"
                  >
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span>{error.message || 'Something went wrong. Please try again.'}</span>
                    <button
                      onClick={clearError}
                      className="ml-auto shrink-0 text-[var(--error)] opacity-70 hover:opacity-100 focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--error)]"
                      aria-label="Dismiss error"
                    >
                      <X className="h-3 w-3" aria-hidden="true" />
                    </button>
                  </m.div>
                )}
              </AnimatePresence>

              <div ref={messagesEndRef} aria-hidden="true" />
            </div>

            {/* Guest sign-in nudge */}
            {!userId && hasMessages && (
              <div className="shrink-0 border-t border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-4 py-2.5 text-[11px] text-[var(--text-muted)]">
                <Link
                  href="/auth/login"
                  className="font-500 text-[var(--brand-accent)] hover:underline"
                >
                  Sign in
                </Link>{' '}
                to add items to cart, look up orders, and more.
              </div>
            )}

            {/* Input */}
            <div className="shrink-0 border-t border-[var(--border-subtle)] px-3 py-3">
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value)
                    const el = e.target
                    el.style.height = 'auto'
                    el.style.height = `${Math.min(el.scrollHeight, 112)}px`
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about products, orders, policies…"
                  rows={1}
                  maxLength={2000}
                  disabled={isLoading}
                  aria-label="Chat message"
                  className="max-h-28 min-h-[44px] flex-1 resize-none overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--bg-subtle)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--brand-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)]/20 disabled:opacity-60"
                />
                <button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isLoading}
                  aria-label="Send message"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-primary)] text-white transition-all hover:bg-[var(--brand-secondary)] disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Send className="h-4 w-4 translate-x-px" aria-hidden="true" />
                  )}
                </button>
              </div>
              <p className="mt-2 text-[11px] text-[var(--text-muted)]">
                AI may make mistakes — verify important info.
              </p>
            </div>
          </m.div>
        )}
      </AnimatePresence>

      {/* FAB */}
      <button
        ref={fabRef}
        onClick={() => setIsOpen((v) => !v)}
        aria-label={isOpen ? 'Close chat' : 'Open chat assistant'}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className="fixed right-4 z-[450] flex h-14 w-14 items-center justify-center rounded-full bg-[var(--brand-primary)] text-white shadow-[0_4px_16px_-2px_rgba(10,21,32,0.35),0_0_0_0_color-mix(in_srgb,var(--brand-accent)_35%,transparent)] transition-all duration-300 hover:bg-[var(--brand-secondary)] hover:shadow-[0_8px_24px_-4px_rgba(10,21,32,0.4),0_0_0_4px_color-mix(in_srgb,var(--brand-accent)_20%,transparent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)] focus-visible:ring-offset-2 active:scale-95"
        style={{ bottom: 'calc(1rem + var(--cookie-banner-h, 0px))' }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {isOpen ? (
            <m.span
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={reducedMotion ? INSTANT : { duration: 0.18 }}
            >
              <X className="h-6 w-6" aria-hidden="true" />
            </m.span>
          ) : (
            <m.span
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={reducedMotion ? INSTANT : { duration: 0.18 }}
            >
              <MessageCircle className="h-6 w-6" aria-hidden="true" />
            </m.span>
          )}
        </AnimatePresence>
      </button>
    </>
  )
}

// ─── MessageRow — renders text bubbles + inline proposal cards ────────────────

interface MessageRowProps {
  message: UIMessage
  reduced: boolean
  dismissedProposals: Set<string>
  onConfirm: (params: Proposal['params']) => Promise<{ message: string }>
  onCancelProposal: (proposalId: string) => void
  onSuccessProposal: (proposalId: string) => void
}

function MessageRow({
  message,
  reduced,
  dismissedProposals,
  onConfirm,
  onCancelProposal,
  onSuccessProposal,
}: MessageRowProps) {
  return (
    <>
      <MessageBubble message={message} reduced={reduced} />
      {/* AnimatePresence enables exit animation when a proposal is dismissed */}
      <AnimatePresence>
        {message.parts.flatMap((part, i) => {
          if (!isProposal(part)) return []
          const proposal = (part as RawPart).output as Proposal
          if (dismissedProposals.has(proposal.proposalId)) return []
          return [
            <ConfirmationCard
              key={`${message.id}-proposal-${i}`}
              proposal={proposal}
              reduced={reduced}
              onConfirm={onConfirm}
              onCancel={() => onCancelProposal(proposal.proposalId)}
              onSuccess={() => onSuccessProposal(proposal.proposalId)}
            />,
          ]
        })}
      </AnimatePresence>
    </>
  )
}
