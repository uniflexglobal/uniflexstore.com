import { db } from '@/server/db'

/**
 * Shared by the admin "assign dispatcher" action and the senior-caller
 * direct-assign path inside qualifyLead — both end at the same result:
 * the Lead moves to ASSIGNED and a bare Carrier-in-progress record is
 * created for the Dispatcher to onboard in Phase B.
 */
export async function convertLeadToCarrierAssignment(
  leadId: string,
  dispatcherId: string,
  actorStaffId: string
) {
  const lead = await db.lead.findUniqueOrThrow({ where: { id: leadId } })

  const carrier = await db.carrier.create({
    data: {
      // Owner-operators often don't have a distinct company name yet at this
      // stage — the Dispatcher refines this during Phase B onboarding.
      companyName: lead.name,
      contactName: lead.name,
      phone: lead.phone,
      email: lead.email,
      mcNumber: lead.mcNumber,
      address: lead.address,
      zipCode: lead.zipCode,
      status: 'ONBOARDING',
      assignedDispatcherId: dispatcherId,
    },
  })

  await db.lead.update({
    where: { id: leadId },
    data: { status: 'ASSIGNED', assignedToId: dispatcherId, convertedCarrierId: carrier.id },
  })

  await db.activityLog.create({
    data: {
      staffId: actorStaffId,
      leadId,
      carrierId: carrier.id,
      type: 'assign',
      note: 'Lead assigned to dispatcher; carrier record created',
    },
  })

  return carrier
}
