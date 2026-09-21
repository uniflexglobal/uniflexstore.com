// Non-destructive seed for CRM (uniflexstore.com/crm) test accounts.
// Safe to re-run — upserts by email, never touches storefront data or
// runs any deletes. NOT part of `prisma db seed` (that command reseeds
// the whole storefront catalog and is destructive); run this one directly:
//
//   npx tsx prisma/seed-crm-staff.ts

import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

// .env.local carries the real DATABASE_URL; .env only has a localhost stub.
// dotenv skips keys already set, so loading .env.local first wins.
dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

const connectionString = process.env.DATABASE_URL!
const adapter = new PrismaPg({ connectionString })
const db = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding CRM staff test accounts…')

  const passwordHash = await bcrypt.hash('Crm@12345', 12)

  await db.crmStaff.upsert({
    where: { email: 'admin@uniflexlogistics.com' },
    update: {},
    create: {
      name: 'Ahmed',
      email: 'admin@uniflexlogistics.com',
      passwordHash,
      role: 'CRM_ADMIN',
    },
  })

  await db.crmStaff.upsert({
    where: { email: 'caller@uniflexlogistics.com' },
    update: {},
    create: {
      name: 'Talha',
      email: 'caller@uniflexlogistics.com',
      passwordHash,
      role: 'CALLER',
      isSeniorCaller: true,
    },
  })

  await db.crmStaff.upsert({
    where: { email: 'dispatcher@uniflexlogistics.com' },
    update: {},
    create: {
      name: 'Osaid',
      email: 'dispatcher@uniflexlogistics.com',
      passwordHash,
      role: 'DISPATCHER',
    },
  })

  console.log('✅ CRM staff ready')
  console.log('\n📋 Test accounts (password: Crm@12345 — admin password may have been changed separately, check with whoever last reset it):')
  console.log('  Admin      → admin@uniflexlogistics.com  (Ahmed)')
  console.log('  Caller     → caller@uniflexlogistics.com  (Talha — senior, can assign directly to a dispatcher)')
  console.log('  Dispatcher → dispatcher@uniflexlogistics.com  (Osaid)')
  console.log('\nSign in at /crm/login')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
