import { z } from 'zod'

// ─── Staff ────────────────────────────────────────────────────────────

export const CRM_ROLES = ['CALLER', 'DISPATCHER', 'CRM_ADMIN'] as const

export const staffCreateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').trim(),
  email: z.string().email('Enter a valid email address').toLowerCase().trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Za-z]/, 'Must contain at least one letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  role: z.enum(CRM_ROLES),
  phone: z.string().optional(),
  isSeniorCaller: z.boolean().default(false),
})

export const staffUpdateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').trim().optional(),
  role: z.enum(CRM_ROLES).optional(),
  phone: z.string().optional(),
  isActive: z.boolean().optional(),
  isSeniorCaller: z.boolean().optional(),
})

// ─── Prospects ────────────────────────────────────────────────────────

export const PROSPECT_STATUSES = [
  'NEW',
  'NO_ANSWER',
  'CALL_BACK_LATER',
  'NOT_INTERESTED',
  'DO_NOT_CALL',
  'QUALIFIED',
] as const

export const prospectManualSchema = z.object({
  name: z.string().min(1, 'Name is required').trim(),
  phone: z.string().min(7, 'Enter a valid phone number').trim(),
  email: z.string().email().optional().or(z.literal('')),
  truckType: z.string().optional(),
  route: z.string().optional(),
  message: z.string().optional(),
  assignedToId: z.string().optional(),
})

// One row from an imported CSV/Excel file — deliberately loose since import
// data quality varies; only name + phone are required.
export const prospectImportRowSchema = z.object({
  name: z.string().min(1).trim(),
  phone: z.string().min(7).trim(),
  email: z.string().trim().optional(),
  truckType: z.string().trim().optional(),
  route: z.string().trim().optional(),
})

export const callOutcomeSchema = z.object({
  prospectId: z.string().min(1),
  status: z.enum(['NO_ANSWER', 'CALL_BACK_LATER', 'NOT_INTERESTED', 'DO_NOT_CALL']),
  note: z.string().optional(),
  callBackAt: z.string().optional(), // ISO date string, only meaningful for CALL_BACK_LATER
})

// ─── Lead qualification ──────────────────────────────────────────────

export const qualifyLeadSchema = z.object({
  prospectId: z.string().min(1),
  name: z.string().min(1, 'Name is required').trim(),
  phone: z.string().min(7, 'Enter a valid phone number').trim(),
  email: z.string().email('Enter a valid email address').trim(),
  mcNumber: z
    .string()
    .regex(/^MC-\d{6}$/, 'MC number must be in the format MC-123456 (6 digits)')
    .optional(),
  address: z.string().optional(),
  zipCode: z
    .string()
    .regex(/^\d{5}(-\d{4})?$/, 'Enter a valid ZIP code')
    .optional(),
  truckType: z.string().min(1, 'Truck type is required'),
  weightAllowed: z.string().optional(),
  preferredRoute: z.string().optional(),
  availableAt: z.string().optional(), // ISO date string
  notes: z.string().optional(),
  // Only used when the qualifying Caller has isSeniorCaller — assigns the
  // resulting Lead straight to a Dispatcher instead of the admin queue.
  assignToDispatcherId: z.string().optional(),
})

export const assignDispatcherSchema = z.object({
  leadId: z.string().min(1),
  dispatcherId: z.string().min(1),
})
