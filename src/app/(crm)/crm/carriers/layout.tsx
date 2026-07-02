import { requireCrmRole } from '@/lib/dal'

export default async function CarriersLayout({ children }: { children: React.ReactNode }) {
  await requireCrmRole('DISPATCHER', 'CRM_ADMIN')
  return children
}
