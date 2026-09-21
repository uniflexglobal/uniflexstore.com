import { AssignDispatcherButton } from './assign-dispatcher-button'
import { CopyPhoneButton } from './copy-phone-button'

type Lead = {
  id: string
  name: string
  phone: string
  truckType: string
  createdAt: string
  qualifiedBy: { name: string } | null
}

type Dispatcher = { id: string; name: string }

export function AwaitingAssignmentQueue({ leads, dispatchers }: { leads: Lead[]; dispatchers: Dispatcher[] }) {
  if (leads.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--border-default)] bg-[var(--bg-base)] py-10 text-center text-sm text-[var(--text-muted)]">
        Nothing waiting on assignment right now.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--bg-base)]">
      <div className="divide-y divide-[var(--border-default)]">
        {leads.map((lead) => (
          <div key={lead.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">{lead.name}</p>
              <p className="text-xs text-[var(--text-muted)]">
                <CopyPhoneButton phone={lead.phone} /> · {lead.truckType}
                {lead.qualifiedBy ? ` · qualified by ${lead.qualifiedBy.name}` : ''}
              </p>
            </div>
            <AssignDispatcherButton leadId={lead.id} leadName={lead.name} dispatchers={dispatchers} />
          </div>
        ))}
      </div>
    </div>
  )
}
