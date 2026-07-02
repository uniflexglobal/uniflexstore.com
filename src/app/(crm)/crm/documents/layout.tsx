import { requireCrmRole } from '@/lib/dal'

export default async function DocumentsLayout({ children }: { children: React.ReactNode }) {
  await requireCrmRole('DISPATCHER', 'CRM_ADMIN')
  return children
}
