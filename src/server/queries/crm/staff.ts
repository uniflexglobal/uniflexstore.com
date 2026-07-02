import 'server-only'
import { db } from '@/server/db'

export async function getStaff() {
  return db.crmStaff.findMany({
    orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
  })
}
