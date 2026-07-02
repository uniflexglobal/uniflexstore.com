import { requireCrmRole } from '@/lib/dal'

export default async function ProspectsLayout({ children }: { children: React.ReactNode }) {
  await requireCrmRole('CALLER', 'CRM_ADMIN')
  return children
}
