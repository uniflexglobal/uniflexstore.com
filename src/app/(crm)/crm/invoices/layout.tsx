import { requireCrmRole } from '@/lib/dal'

export default async function InvoicesLayout({ children }: { children: React.ReactNode }) {
  await requireCrmRole('CRM_ADMIN', 'DISPATCHER')
  return children
}
