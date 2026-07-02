import { requireCrmRole } from '@/lib/dal'

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  await requireCrmRole('CRM_ADMIN')
  return children
}
