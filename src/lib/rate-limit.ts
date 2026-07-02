import { headers } from 'next/headers'

type Entry = { count: number; resetAt: number }

// In-memory store — works for single-instance deployments.
// Replace with Upstash Redis for multi-instance / serverless.
const store = new Map<string, Entry>()

function check(key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (entry.count >= max) return false
  entry.count++
  return true
}

async function getIp(): Promise<string> {
  const h = await headers()
  return (
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    h.get('x-real-ip') ??
    'unknown'
  )
}

/** 5 login attempts per 15 minutes per IP */
export async function checkLoginRate(): Promise<boolean> {
  const ip = await getIp()
  return check(`login:${ip}`, 5, 15 * 60 * 1000)
}

/** 3 password reset requests per hour per email */
export async function checkPasswordResetRate(email: string): Promise<boolean> {
  return check(`reset:${email}`, 3, 60 * 60 * 1000)
}

/** 10 register attempts per hour per IP */
export async function checkRegisterRate(): Promise<boolean> {
  const ip = await getIp()
  return check(`register:${ip}`, 10, 60 * 60 * 1000)
}

/** 60 search suggestion requests per minute per IP */
export async function checkSearchRate(): Promise<boolean> {
  const ip = await getIp()
  return check(`search:${ip}`, 60, 60 * 1000)
}

/** 20 coupon validation attempts per 5 minutes per IP */
export async function checkCouponRate(): Promise<boolean> {
  const ip = await getIp()
  return check(`coupon:${ip}`, 20, 5 * 60 * 1000)
}

/** 30 chat messages per 5 minutes per IP */
export async function checkChatRate(): Promise<boolean> {
  const ip = await getIp()
  return check(`chat:${ip}`, 30, 5 * 60 * 1000)
}

/** 60 thread saves per hour per IP */
export async function checkThreadRate(): Promise<boolean> {
  const ip = await getIp()
  return check(`thread:${ip}`, 60, 60 * 60 * 1000)
}

/** 20 agent action confirmations per 5 minutes per IP */
export async function checkActionRate(): Promise<boolean> {
  const ip = await getIp()
  return check(`action:${ip}`, 20, 5 * 60 * 1000)
}

/** 5 logistics lead submissions per hour per IP */
export async function checkLogisticsLeadRate(): Promise<boolean> {
  const ip = await getIp()
  return check(`logistics-lead:${ip}`, 5, 60 * 60 * 1000)
}

/** 5 CRM login attempts per 15 minutes per IP — independent bucket from checkLoginRate() */
export async function checkCrmLoginRate(): Promise<boolean> {
  const ip = await getIp()
  return check(`crm-login:${ip}`, 5, 15 * 60 * 1000)
}
