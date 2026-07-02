export const crmRoleLabels: Record<string, string> = {
  CALLER: 'Caller',
  DISPATCHER: 'Dispatcher',
  CRM_ADMIN: 'Admin',
}

export const prospectStatusLabels: Record<string, string> = {
  NEW: 'New',
  NO_ANSWER: 'No answer',
  CALL_BACK_LATER: 'Call back later',
  NOT_INTERESTED: 'Not interested',
  DO_NOT_CALL: 'Do not call',
  QUALIFIED: 'Qualified',
}

export const prospectStatusVariant: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline' | 'info'> = {
  NEW: 'info',
  NO_ANSWER: 'secondary',
  CALL_BACK_LATER: 'warning',
  NOT_INTERESTED: 'outline',
  DO_NOT_CALL: 'destructive',
  QUALIFIED: 'success',
}

export const leadStatusLabels: Record<string, string> = {
  AWAITING_ASSIGNMENT: 'Awaiting assignment',
  ASSIGNED: 'Assigned',
  SIGNED: 'Signed',
  LOST: 'Lost',
}

export const leadStatusVariant: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline' | 'info'> = {
  AWAITING_ASSIGNMENT: 'warning',
  ASSIGNED: 'info',
  SIGNED: 'success',
  LOST: 'outline',
}

export const carrierStatusLabels: Record<string, string> = {
  ONBOARDING: 'Onboarding',
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  TERMINATED: 'Terminated',
}

export const carrierStatusVariant: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline' | 'info'> = {
  ONBOARDING: 'warning',
  ACTIVE: 'success',
  INACTIVE: 'secondary',
  TERMINATED: 'destructive',
}

export const TRUCK_TYPES = ['Dry Van', 'Reefer', 'Flatbed', 'Box Truck', 'Other'] as const

// ─── Documents (Phase B) ────────────────────────────────────────────

export const documentTypeLabels: Record<string, string> = {
  W9: 'W-9',
  COI: 'Certificate of Insurance',
  AUTHORITY_LETTER: 'MC/DOT Authority Letter',
  DISPATCH_AGREEMENT: 'Dispatch Agreement',
  OTHER: 'Other',
}

export const REQUIRED_ONBOARDING_DOCS = ['W9', 'COI', 'AUTHORITY_LETTER', 'DISPATCH_AGREEMENT'] as const

// ─── Loads & dispatch board (Phase B) ────────────────────────────────

export const LOAD_STATUS_ORDER = ['BOOKED', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED', 'INVOICED', 'PAID'] as const

export const loadStatusLabels: Record<string, string> = {
  BOOKED: 'Booked',
  DISPATCHED: 'Dispatched',
  IN_TRANSIT: 'In transit',
  DELIVERED: 'Delivered',
  INVOICED: 'Invoiced',
  PAID: 'Paid',
  CANCELLED: 'Cancelled',
}

export const loadStatusVariant: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline' | 'info'> = {
  BOOKED: 'secondary',
  DISPATCHED: 'info',
  IN_TRANSIT: 'warning',
  DELIVERED: 'success',
  INVOICED: 'default',
  PAID: 'success',
  CANCELLED: 'destructive',
}

// ─── Invoicing (Phase C) ─────────────────────────────────────────────

export const invoiceStatusLabels: Record<string, string> = {
  DRAFT: 'Draft',
  SENT: 'Sent',
  UNPAID: 'Unpaid',
  OVERDUE: 'Overdue',
  PAID: 'Paid',
  FACTORED: 'Sent to factoring',
}

export const invoiceStatusVariant: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline' | 'info'> = {
  DRAFT: 'secondary',
  SENT: 'info',
  UNPAID: 'warning',
  OVERDUE: 'destructive',
  PAID: 'success',
  FACTORED: 'default',
}
