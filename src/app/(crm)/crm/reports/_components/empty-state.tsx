interface ReportEmptyStateProps {
  message?: string
}

/** Shared placeholder for report sections with zero data — never render a blank/crashed chart. */
export function ReportEmptyState({ message = 'No data yet' }: ReportEmptyStateProps) {
  return (
    <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-[var(--border-default)] text-sm text-[var(--text-muted)]">
      {message}
    </div>
  )
}
