// Removes exactly the demo data created by prisma/seed-crm-demo.ts —
// never touches real staff accounts or anything a real user created.
// Matches the same tags the seed script used:
//   - Prospect / Lead / Carrier: email ends with "@demo.uniflexlogistics.test"
//   - Load: loadNumber starts with "LD-DEMO-"
//   - Invoice: invoiceNumber starts with "INV-DEMO-"
//
// Run: npx tsx prisma/delete-crm-demo.ts

import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

const connectionString = process.env.DATABASE_URL!
const adapter = new PrismaPg({ connectionString })
const db = new PrismaClient({ adapter })

const DOMAIN = '@demo.uniflexlogistics.test'

async function main() {
  console.log('🧹 Removing CRM demo data…')

  const [prospects, leads, carriers, loads, invoices] = await Promise.all([
    db.prospect.findMany({ where: { OR: [{ email: { endsWith: DOMAIN } }, { importBatch: 'DEMO_SEED' }] }, select: { id: true } }),
    db.lead.findMany({ where: { email: { endsWith: DOMAIN } }, select: { id: true } }),
    db.carrier.findMany({ where: { email: { endsWith: DOMAIN } }, select: { id: true } }),
    db.load.findMany({ where: { loadNumber: { startsWith: 'LD-DEMO-' } }, select: { id: true } }),
    db.invoice.findMany({ where: { invoiceNumber: { startsWith: 'INV-DEMO-' } }, select: { id: true } }),
  ])

  const prospectIds = prospects.map((p) => p.id)
  const leadIds = leads.map((l) => l.id)
  const carrierIds = carriers.map((c) => c.id)
  const loadIds = loads.map((l) => l.id)
  const invoiceIds = invoices.map((i) => i.id)

  if (!prospectIds.length && !leadIds.length && !carrierIds.length && !loadIds.length && !invoiceIds.length) {
    console.log('Nothing to remove — no demo data found.')
    return
  }

  // Children first, in dependency order. Truck/Driver/Document cascade
  // automatically when their Carrier is deleted; CheckCall cascades
  // automatically when its Load is deleted — no need to touch those here.

  const activityLog = await db.activityLog.deleteMany({
    where: {
      OR: [
        { prospectId: { in: prospectIds } },
        { leadId: { in: leadIds } },
        { carrierId: { in: carrierIds } },
        { loadId: { in: loadIds } },
      ],
    },
  })

  const commissions = await db.commission.deleteMany({
    where: { OR: [{ loadId: { in: loadIds } }, { leadId: { in: leadIds } }] },
  })

  const invoicesDeleted = await db.invoice.deleteMany({
    where: { OR: [{ id: { in: invoiceIds } }, { carrierId: { in: carrierIds } }, { loadId: { in: loadIds } }] },
  })

  const loadsDeleted = await db.load.deleteMany({
    where: { OR: [{ id: { in: loadIds } }, { carrierId: { in: carrierIds } }] },
  })

  // Break the Prospect <-> Lead link before deleting either side.
  await db.prospect.updateMany({ where: { id: { in: prospectIds } }, data: { qualifiedLeadId: null } })
  await db.lead.updateMany({ where: { id: { in: leadIds }, convertedCarrierId: { not: null } }, data: { convertedCarrierId: null } })

  const carriersDeleted = await db.carrier.deleteMany({ where: { id: { in: carrierIds } } })
  const leadsDeleted = await db.lead.deleteMany({ where: { id: { in: leadIds } } })
  const prospectsDeleted = await db.prospect.deleteMany({ where: { id: { in: prospectIds } } })

  console.log('✅ Demo data removed:')
  console.log(`   ${prospectsDeleted.count} prospects, ${leadsDeleted.count} leads, ${carriersDeleted.count} carriers`)
  console.log(`   ${loadsDeleted.count} loads, ${invoicesDeleted.count} invoices, ${commissions.count} commissions`)
  console.log(`   ${activityLog.count} activity log entries`)
  console.log('   (Trucks/drivers/documents/check calls were removed automatically via cascade.)')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
