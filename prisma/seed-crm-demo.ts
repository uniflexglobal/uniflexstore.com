// Demo/sample data for the CRM — prospects, leads, carriers, trucks,
// drivers, documents (including expired/expiring ones), loads, invoices,
// and commissions across every status so the UI has something real to
// look at.
//
// Every record here is tagged so it can be cleanly removed later without
// touching anything a real user created:
//   - Prospect / Lead / Carrier: email ends with "@demo.uniflexlogistics.test"
//   - Load: loadNumber starts with "LD-DEMO-"
//   - Invoice: invoiceNumber starts with "INV-DEMO-"
//
// Run:    npx tsx prisma/seed-crm-demo.ts
// Remove: npx tsx prisma/delete-crm-demo.ts
//
// Requires the CRM staff seed to have run first (prisma/seed-crm-staff.ts).

import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

// .env.local carries the real DATABASE_URL; .env only has a localhost stub.
dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

const connectionString = process.env.DATABASE_URL!
const adapter = new PrismaPg({ connectionString })
const db = new PrismaClient({ adapter })

const DOMAIN = '@demo.uniflexlogistics.test'
const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000)
const daysFromNow = (n: number) => new Date(Date.now() + n * 24 * 60 * 60 * 1000)

async function main() {
  console.log('🌱 Seeding CRM demo data…')

  const caller = await db.crmStaff.findUniqueOrThrow({ where: { email: 'caller@uniflexlogistics.com' } })
  const dispatcher = await db.crmStaff.findUniqueOrThrow({ where: { email: 'dispatcher@uniflexlogistics.com' } })

  // ─── Prospects (call queue) ─────────────────────────────────────────
  const prospects = await Promise.all([
    db.prospect.create({
      data: {
        name: 'Marcus Webb', phone: '469-555-0148', email: `marcus.webb${DOMAIN}`,
        truckType: 'Reefer', route: 'TX/OK regional', source: 'LOGISTICS_FORM', status: 'NEW',
        assignedToId: caller.id, createdAt: daysAgo(1),
      },
    }),
    db.prospect.create({
      data: {
        name: 'Diane Torres', phone: '214-555-0172', email: `diane.torres${DOMAIN}`,
        truckType: 'Dry Van', source: 'IMPORT', importBatch: 'DEMO_SEED', status: 'NO_ANSWER',
        assignedToId: caller.id, createdAt: daysAgo(4),
      },
    }),
    db.prospect.create({
      data: {
        name: 'Roger Kim', phone: '972-555-0113', email: `roger.kim${DOMAIN}`,
        truckType: 'Flatbed', source: 'IMPORT', importBatch: 'DEMO_SEED', status: 'CALL_BACK_LATER',
        callBackAt: daysFromNow(2), assignedToId: caller.id, createdAt: daysAgo(3),
      },
    }),
    db.prospect.create({
      data: {
        name: 'Angela Ruiz', phone: '817-555-0199', email: `angela.ruiz${DOMAIN}`,
        truckType: 'Box Truck', source: 'IMPORT', importBatch: 'DEMO_SEED', status: 'NOT_INTERESTED',
        assignedToId: caller.id, createdAt: daysAgo(6),
      },
    }),
    db.prospect.create({
      data: {
        name: 'Felix Owusu', phone: '682-555-0164', email: `felix.owusu${DOMAIN}`,
        truckType: 'Dry Van', source: 'IMPORT', importBatch: 'DEMO_SEED', status: 'DO_NOT_CALL',
        assignedToId: caller.id, createdAt: daysAgo(8),
      },
    }),
    db.prospect.create({
      data: {
        name: 'Vanessa Cole', phone: '903-555-0187', email: `vanessa.cole${DOMAIN}`,
        truckType: 'Reefer', route: 'Southeast regional', source: 'LOGISTICS_FORM', status: 'NEW',
        assignedToId: caller.id, createdAt: daysAgo(0),
      },
    }),
    db.prospect.create({
      data: {
        name: 'Terrence Boyd', phone: '469-555-0221', email: `terrence.boyd${DOMAIN}`,
        truckType: 'Dry Van', source: 'IMPORT', importBatch: 'DEMO_SEED', status: 'NEW',
        assignedToId: caller.id, createdAt: daysAgo(2),
      },
    }),
  ])
  console.log(`  ${prospects.length} prospects`)

  // ─── Leads (qualified) ───────────────────────────────────────────────

  // Qualified from a prospect (Priscilla isn't in the prospect list above —
  // she's created fresh here as the "already qualified" example, linked back)
  const priscillaProspect = await db.prospect.create({
    data: {
      name: 'Priscilla Nguyen', phone: '512-555-0142', email: `priscilla.nguyen${DOMAIN}`,
      truckType: 'Dry Van', source: 'LOGISTICS_FORM', status: 'QUALIFIED',
      assignedToId: caller.id, createdAt: daysAgo(10),
    },
  })
  const leadPriscilla = await db.lead.create({
    data: {
      name: 'Priscilla Nguyen', phone: '512-555-0142', email: `priscilla.nguyen${DOMAIN}`,
      truckType: 'Dry Van', weightAllowed: '44,000 lbs', preferredRoute: 'TX statewide',
      mcNumber: '812233', qualifiedById: caller.id, status: 'AWAITING_ASSIGNMENT',
      createdAt: daysAgo(9),
    },
  })
  await db.prospect.update({ where: { id: priscillaProspect.id }, data: { qualifiedLeadId: leadPriscilla.id } })

  const leadDamon = await db.lead.create({
    data: {
      name: 'Damon Fitzgerald', phone: '281-555-0176', email: `damon.fitzgerald${DOMAIN}`,
      truckType: 'Flatbed', weightAllowed: '48,000 lbs', preferredRoute: 'Gulf Coast',
      mcNumber: '798821', qualifiedById: caller.id, status: 'AWAITING_ASSIGNMENT',
      createdAt: daysAgo(5),
    },
  })

  const leadTrina = await db.lead.create({
    data: {
      name: 'Trina Delgado', phone: '346-555-0159', email: `trina.delgado${DOMAIN}`,
      truckType: 'Reefer', qualifiedById: caller.id, status: 'LOST',
      lostReason: 'Went with another dispatch service', createdAt: daysAgo(14),
    },
  })
  void leadTrina

  // ─── Carriers (signed + onboarded) ──────────────────────────────────

  const carrierBriggs = await db.carrier.create({
    data: {
      companyName: 'Briggs Freight LLC', contactName: 'Yolanda Briggs', phone: '469-555-0301',
      email: `yolanda.briggs${DOMAIN}`, mcNumber: '901442', dotNumber: '3312280',
      address: '1420 Freight Yard Rd, Fort Worth, TX 76106', status: 'ACTIVE',
      assignedDispatcherId: dispatcher.id, createdAt: daysAgo(30),
    },
  })
  const leadBriggs = await db.lead.create({
    data: {
      name: 'Yolanda Briggs', phone: '469-555-0301', email: `yolanda.briggs${DOMAIN}`,
      truckType: 'Dry Van', mcNumber: '901442', qualifiedById: caller.id,
      assignedToId: dispatcher.id, status: 'ASSIGNED', convertedCarrierId: carrierBriggs.id,
      createdAt: daysAgo(32),
    },
  })
  void leadBriggs

  const carrierBloom = await db.carrier.create({
    data: {
      companyName: 'Bloom Transport Inc', contactName: 'Isaac Bloom', phone: '214-555-0388',
      email: `isaac.bloom${DOMAIN}`, mcNumber: '887215', dotNumber: '2998104',
      address: '88 Harbor Dr, Houston, TX 77002', status: 'ACTIVE',
      assignedDispatcherId: dispatcher.id, createdAt: daysAgo(45),
    },
  })
  const leadBloom = await db.lead.create({
    data: {
      name: 'Isaac Bloom', phone: '214-555-0388', email: `isaac.bloom${DOMAIN}`,
      truckType: 'Flatbed', mcNumber: '887215', qualifiedById: caller.id,
      assignedToId: dispatcher.id, status: 'SIGNED', convertedCarrierId: carrierBloom.id,
      createdAt: daysAgo(47),
    },
  })
  void leadBloom

  const carrierSundown = await db.carrier.create({
    data: {
      companyName: 'Sundown Logistics', contactName: 'Renee Castillo', phone: '972-555-0410',
      email: `renee.castillo${DOMAIN}`, status: 'ONBOARDING',
      assignedDispatcherId: dispatcher.id, createdAt: daysAgo(2),
    },
  })
  console.log('  3 carriers (Briggs Freight — Active, Bloom Transport — Active, Sundown Logistics — Onboarding)')

  // ─── Trucks & Drivers ────────────────────────────────────────────────

  const truckBriggs1 = await db.truck.create({
    data: { carrierId: carrierBriggs.id, unitNumber: 'T-204', equipmentType: 'Dry Van', make: 'Freightliner', model: 'Cascadia', year: 2021 },
  })
  const truckBriggs2 = await db.truck.create({
    data: { carrierId: carrierBriggs.id, unitNumber: 'T-207', equipmentType: 'Reefer', make: 'Kenworth', model: 'T680', year: 2022 },
  })
  const driverBriggs1 = await db.driver.create({
    data: { carrierId: carrierBriggs.id, truckId: truckBriggs1.id, name: 'Hector Alvarez', phone: '469-555-0512', cdlNumber: 'TX-88213042' },
  })
  await db.driver.create({
    data: { carrierId: carrierBriggs.id, truckId: truckBriggs2.id, name: 'Sonia Blake', phone: '469-555-0587', cdlNumber: 'TX-77120915' },
  })

  const truckBloom1 = await db.truck.create({
    data: { carrierId: carrierBloom.id, unitNumber: 'T-115', equipmentType: 'Flatbed', make: 'Peterbilt', model: '579', year: 2020 },
  })
  const driverBloom1 = await db.driver.create({
    data: { carrierId: carrierBloom.id, truckId: truckBloom1.id, name: 'Willa Grant', phone: '214-555-0623', cdlNumber: 'TX-65590221' },
  })
  console.log('  3 trucks, 3 drivers')

  // ─── Documents (expired / expiring / valid, to exercise the traffic light) ──

  await db.document.createMany({
    data: [
      // Briggs Freight — fully onboarded, one doc expiring soon
      { carrierId: carrierBriggs.id, type: 'W9', fileUrl: 'https://picsum.photos/seed/demo-w9-briggs/400/520', fileName: 'briggs-w9.pdf', uploadedById: dispatcher.id },
      { carrierId: carrierBriggs.id, type: 'COI', fileUrl: 'https://picsum.photos/seed/demo-coi-briggs/400/520', fileName: 'briggs-coi.pdf', issuedAt: daysAgo(353), expiresAt: daysFromNow(12), uploadedById: dispatcher.id },
      { carrierId: carrierBriggs.id, type: 'AUTHORITY_LETTER', fileUrl: 'https://picsum.photos/seed/demo-auth-briggs/400/520', fileName: 'briggs-authority.pdf', expiresAt: daysFromNow(200), uploadedById: dispatcher.id },
      { carrierId: carrierBriggs.id, type: 'DISPATCH_AGREEMENT', fileUrl: 'https://picsum.photos/seed/demo-agreement-briggs/400/520', fileName: 'briggs-agreement.pdf', uploadedById: dispatcher.id },

      // Bloom Transport — fully onboarded, insurance already EXPIRED
      { carrierId: carrierBloom.id, type: 'W9', fileUrl: 'https://picsum.photos/seed/demo-w9-bloom/400/520', fileName: 'bloom-w9.pdf', uploadedById: dispatcher.id },
      { carrierId: carrierBloom.id, type: 'COI', fileUrl: 'https://picsum.photos/seed/demo-coi-bloom/400/520', fileName: 'bloom-coi.pdf', issuedAt: daysAgo(375), expiresAt: daysAgo(10), uploadedById: dispatcher.id },
      { carrierId: carrierBloom.id, type: 'AUTHORITY_LETTER', fileUrl: 'https://picsum.photos/seed/demo-auth-bloom/400/520', fileName: 'bloom-authority.pdf', expiresAt: daysFromNow(150), uploadedById: dispatcher.id },
      { carrierId: carrierBloom.id, type: 'DISPATCH_AGREEMENT', fileUrl: 'https://picsum.photos/seed/demo-agreement-bloom/400/520', fileName: 'bloom-agreement.pdf', uploadedById: dispatcher.id },

      // Sundown Logistics — mid-onboarding, only W-9 so far
      { carrierId: carrierSundown.id, type: 'W9', fileUrl: 'https://picsum.photos/seed/demo-w9-sundown/400/520', fileName: 'sundown-w9.pdf', uploadedById: dispatcher.id },
    ],
  })
  console.log('  9 documents (1 expired, 1 expiring soon, rest valid)')

  // ─── Loads & check calls ─────────────────────────────────────────────

  const loadBooked = await db.load.create({
    data: {
      carrierId: carrierBriggs.id, truckId: truckBriggs1.id, driverId: driverBriggs1.id, dispatcherId: dispatcher.id,
      loadNumber: 'LD-DEMO-001', broker: 'TQL', originCity: 'Dallas', originState: 'TX', destCity: 'Houston', destState: 'TX',
      pickupAt: daysFromNow(1), rate: 1800, dispatchFeePct: 8, status: 'BOOKED', createdAt: daysAgo(1),
    },
  })
  void loadBooked

  const loadInTransit = await db.load.create({
    data: {
      carrierId: carrierBriggs.id, truckId: truckBriggs2.id, dispatcherId: dispatcher.id,
      loadNumber: 'LD-DEMO-002', broker: 'Landstar', originCity: 'Memphis', originState: 'TN', destCity: 'Nashville', destState: 'TN',
      pickupAt: daysAgo(1), rate: 1200, dispatchFeePct: 8, status: 'IN_TRANSIT', createdAt: daysAgo(2),
    },
  })
  await db.checkCall.create({
    data: { loadId: loadInTransit.id, note: 'Crossed into TN, on schedule for tomorrow AM delivery', location: 'Jackson, TN', loggedById: dispatcher.id },
  })

  const loadDelivered = await db.load.create({
    data: {
      carrierId: carrierBriggs.id, truckId: truckBriggs1.id, driverId: driverBriggs1.id, dispatcherId: dispatcher.id,
      loadNumber: 'LD-DEMO-003', broker: 'Coyote Logistics', originCity: 'Atlanta', originState: 'GA', destCity: 'Charlotte', destState: 'NC',
      pickupAt: daysAgo(6), deliveryAt: daysAgo(5), rate: 2100, dispatchFeePct: 8, status: 'PAID', createdAt: daysAgo(7),
    },
  })
  await db.checkCall.createMany({
    data: [
      { loadId: loadDelivered.id, note: 'Picked up, all paperwork signed', location: 'Atlanta, GA', loggedById: dispatcher.id },
      { loadId: loadDelivered.id, note: 'Delivered on time, POD signed', location: 'Charlotte, NC', loggedById: dispatcher.id },
    ],
  })
  const invoiceDelivered = await db.invoice.create({
    data: {
      loadId: loadDelivered.id, carrierId: carrierBriggs.id, invoiceNumber: 'INV-DEMO-001',
      amount: 168, status: 'PAID', dueDate: daysAgo(2), paidAt: daysAgo(1), createdAt: daysAgo(5),
    },
  })

  const loadDispatched = await db.load.create({
    data: {
      carrierId: carrierBloom.id, truckId: truckBloom1.id, driverId: driverBloom1.id, dispatcherId: dispatcher.id,
      loadNumber: 'LD-DEMO-004', broker: 'RXO', originCity: 'Phoenix', originState: 'AZ', destCity: 'Denver', destState: 'CO',
      pickupAt: daysAgo(0), rate: 1600, dispatchFeePct: 7.5, status: 'DISPATCHED', createdAt: daysAgo(1),
    },
  })
  void loadDispatched
  console.log('  4 loads (Booked, In Transit, Paid, Dispatched) + 3 check calls')

  const invoiceDraft = await db.invoice.create({
    data: {
      carrierId: carrierBloom.id, invoiceNumber: 'INV-DEMO-002', amount: 150,
      status: 'DRAFT', notes: 'Flat monthly admin fee', createdAt: daysAgo(1),
    },
  })
  void invoiceDraft
  console.log('  2 invoices (Paid, Draft)')

  // ─── Commissions (manual ledger) ─────────────────────────────────────

  await db.commission.create({
    data: {
      staffId: dispatcher.id, loadId: loadDelivered.id, amount: 50,
      type: 'dispatch_fee_share', earnedAt: daysAgo(5), paidAt: daysAgo(1),
    },
  })
  await db.commission.create({
    data: { staffId: caller.id, amount: 25, type: 'signed_bonus', earnedAt: daysAgo(30) },
  })
  console.log('  2 commission entries (1 paid, 1 unpaid)')

  // ─── Activity log (recent activity feel on carrier/lead pages) ──────

  await db.activityLog.createMany({
    data: [
      { staffId: caller.id, prospectId: priscillaProspect.id, leadId: leadPriscilla.id, type: 'qualify', createdAt: daysAgo(9) },
      { staffId: dispatcher.id, carrierId: carrierBriggs.id, type: 'status_change', note: 'Marked carrier Active — all required documents on file', createdAt: daysAgo(28) },
      { staffId: dispatcher.id, carrierId: carrierBloom.id, type: 'status_change', note: 'Marked carrier Active — all required documents on file', createdAt: daysAgo(43) },
      { staffId: dispatcher.id, carrierId: carrierBriggs.id, loadId: loadDelivered.id, type: 'status_change', note: 'Load LD-DEMO-003 delivered', createdAt: daysAgo(5) },
      { staffId: dispatcher.id, carrierId: carrierSundown.id, type: 'document_upload', note: 'Uploaded W-9', createdAt: daysAgo(2) },
    ],
  })
  console.log('  5 activity log entries')

  console.log('\n✅ Demo data seeded.')
  console.log('   Sign in at /crm/login and check: Prospects, Leads, Carriers, Documents, Dispatch Board, Invoices, Commissions, Reports.')
  console.log('   To remove all of it later: npx tsx prisma/delete-crm-demo.ts')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
