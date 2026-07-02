# Uniflex Global Logistics — CRM Guide (uniflexstore.com/crm)

## What this is, in plain terms

Right now, when someone fills out the quote form on your `/logistics` page, it just sends you an email. Nothing is tracked, nobody's assigned to follow up, and if that email gets buried, the lead is gone. And there's no system at all for the cold-calling side of the business — lists of prospects to call live wherever they live today (spreadsheets, notebooks, someone's memory).

The CRM fixes both: your team gets a real system to run the dispatch business day-to-day. Callers get a daily call list (from your website form and from imported spreadsheets), qualify prospects into full leads, Admin hands qualified leads to a Dispatcher, the Dispatcher signs them up and runs their trucks and loads — and you (Admin) see everything happening across the whole operation, with reports on how the business and your staff are performing.

It lives at **uniflexstore.com/crm**, completely separate from your online store — different login, different look, built for your staff to use all day, not for customers.

---

## The flow

This is a **two-stage** process before a carrier is actually signed: **Prospects** (people to call) become **Leads** (qualified, full profile) once a call is successful, and only then does Admin (or a senior Caller) hand it to a Dispatcher.

1. **Prospects enter the system two ways:**
   - Automatically, from the `/logistics` quote form (name, phone, email, truck type, route — whatever they typed in)
   - In bulk, when Admin (or a Caller) **imports an Excel/CSV file** of names/numbers to cold-call
2. **Every prospect is assigned to a Caller.** Once assigned, it lands on that Caller's **daily call list** — their to-do queue for the day.
3. **The Caller calls each one.** If there's no answer, not interested, wrong number, etc. — they mark the outcome and it either stays in the queue for a follow-up call or gets closed out.
4. **If the call is successful, the Caller "qualifies" the prospect into a full Lead** by filling out a proper profile:
   - Name, phone, email
   - MC number
   - Address
   - Truck type
   - Weight allowed (capacity)
   - Preferred route(s)
   - Available start date
5. **The system saves this and routes it for assignment:**
   - By default, it shows up in Admin's "awaiting assignment" queue, and **Admin assigns a Dispatcher**.
   - **Unless that Caller has been given "senior" permission by Admin** — in that case, the Caller can pick the Dispatcher themselves, right on the qualify screen, skipping the Admin queue entirely. Admin still sees it happen (it shows up in their records), just doesn't have to personally do the assigning.
6. **The Dispatcher calls next** — finishes onboarding (collects paperwork: W-9, insurance certificate, verifies MC/DOT authority, gets the dispatch agreement signed), and once that's done, the lead becomes an active **Carrier** record with real trucks/drivers attached.
7. From here it's the flow from before: Dispatcher books loads for the carrier, runs them through the dispatch board, documents are watched for expiry, invoices go out.

---

## The three logins

Everyone logs in at `/crm/login`. Nobody self-registers — Admin creates every account.

### 🧑‍💼 Caller — works the daily call list, qualifies leads

**Their pages:**
- **Dashboard** — today's call list, how many prospects left to call today, how many qualified this week
- **My Call List** — every prospect assigned to them (from the website or from an import), with call-outcome buttons (No Answer / Not Interested / Call Back Later / Qualified)
- **Import Prospects** — upload an Excel/CSV file of names and numbers to add to their own call list (or Admin imports and assigns to whichever Caller)
- **Qualify Lead** — the detailed form filled out after a successful call (name, phone, email, MC number, address, truck type, weight allowed, preferred routes, available start date). For most Callers, submitting this sends it to Admin's assignment queue. **If Admin has marked this Caller as "senior"**, the form also lets them pick a Dispatcher and assign it directly, no Admin step in between.
- **My Qualified Leads** — a history of leads they've successfully qualified, and what happened to them after (assigned, signed, etc.)
- **My Profile** — change their own password

> A Caller doesn't have a different login for this — it's a permission Admin flips on for a specific person (see Staff page below), not a separate role. Keeps it simple: still just Caller / Dispatcher / Admin, with one optional extra permission.

### 🚛 Dispatcher — onboards qualified leads, then runs their trucks and loads

**Their pages:**
- **Dashboard** — leads just assigned to them awaiting first contact, their active carriers, loads in progress, documents about to expire
- **My Assigned Leads** — qualified leads Admin has handed them, not yet signed — call to finish onboarding
- **Onboard Carrier** — collect/upload W-9, insurance certificate, MC/DOT verification, signed agreement — converts the lead into an active Carrier once complete
- **My Carriers** — every signed carrier assigned to them
- **Carrier Detail** — company info, trucks, drivers, documents (with expiry status), load history, notes
- **Add Truck / Add Driver**
- **Dispatch Board** — visual board of every load (Booked → Dispatched → In Transit → Delivered)
- **Load Detail** — route, rate, assigned truck/driver, check-call log, rate confirmation & proof of delivery upload, mark delivered
- **My Profile**

### 👑 Admin — sees and controls everything, assigns leads to dispatchers

**Their pages:**
- **Dashboard** — company-wide numbers, **plus the "Awaiting Assignment" queue** — every freshly-qualified lead that needs a Dispatcher assigned, front and center
- **All Prospects** — every caller's call list, company-wide, can reassign
- **Import Prospects** — bulk Excel/CSV upload, assign the imported batch to one or more Callers
- **All Leads** — every qualified lead and its status (awaiting assignment / assigned / signed)
- **Assign Dispatcher** — the action of handing a qualified lead to a specific Dispatcher
- **All Carriers** — every dispatcher's carriers, can reassign
- **Dispatch Board (company-wide)** — every load, from every dispatcher
- **Documents** — every expiring/expired document across all carriers
- **Staff** — create/deactivate Caller and Dispatcher logins, reset passwords, and toggle **"senior caller"** permission on/off per Caller (lets that Caller assign qualified leads straight to a Dispatcher instead of waiting in the queue)
- **Invoices** — *(Phase C)*
- **Reports** — *(Phase C)* revenue, conversion rates (prospect → lead → carrier), performance per Caller/Dispatcher
- **Settings**

---

## What makes this "best of the best"

- **A real daily call list**, not a spreadsheet someone has to manually update — Callers open the CRM and know exactly who to call today.
- **Bulk import from Excel/CSV** — if you buy or build a list of prospects, it loads straight into the system and gets assigned out, instead of someone retyping names one at a time.
- **A clean two-step handoff** (Caller qualifies → Admin assigns → Dispatcher onboards) so nothing gets signed without you knowing about it, and every qualified lead is visible the moment it's ready — **with the option to fast-track trusted senior Callers** to assign straight to a Dispatcher when you don't need to be the bottleneck.
- **A traffic-light system for paperwork** (green/yellow/red) so an expired insurance certificate never sneaks up on you and costs a load.
- **Nothing gets lost** — every call outcome, note, and status change is saved permanently, even if staff turn over.
- **A real visual dispatch board**, not a spreadsheet — see every load's status at a glance.
- **Built-in performance reporting** — see which Caller is qualifying the most leads and which Dispatcher is signing and running the most carriers.
- **Room to grow without a rebuild** — later you can plug in DAT/Truckstop load board search, automatic call/SMS logging, or e-signatures, without redoing work already built.

---

## How we'll build it — four phases, one at a time

You approve each phase before the next one starts.

### Phase A — Logins, Prospect Import, Call Queue, Lead Qualification *(building this one first)*
- Staff logins for Caller / Dispatcher / Admin
- `/logistics` quote form submissions and bulk Excel/CSV imports both create Prospects, assigned to a Caller
- Caller's daily call list with call-outcome tracking
- "Qualify Lead" form → creates a full Lead, then either notifies Admin's assignment queue, or — for Callers Admin has marked "senior" — lets the Caller assign a Dispatcher directly
- Admin's "Awaiting Assignment" queue + assign-to-Dispatcher action
- Admin can create staff accounts and toggle "senior caller" permission per person
- Assigning a lead to a Dispatcher (whether by Admin or a senior Caller) creates a basic Carrier-in-progress record, ready for Phase B onboarding

**You'll be able to try:** import a CSV of test prospects, log in as a Caller and work the call list, qualify one, see it hit the Admin's assignment queue, assign it to a Dispatcher.

### Phase B — Carrier Onboarding, Trucks, Dispatch Board & Document Tracking
- Dispatcher's onboarding flow: collect W-9/COI/MC verification, signed agreement → converts to active Carrier
- Full carrier profiles: trucks, drivers, documents
- Green/yellow/red document expiry tracker
- Visual dispatch board for loads, check-call logging, rate confirmation/POD uploads

### Phase C — Invoicing & Reports
- Generate and track invoices per load, mark paid / sent to factoring
- Company-wide reporting: revenue, prospect → lead → carrier conversion rates, staff performance
- Commission tracking for Callers/Dispatchers (exact commission rules confirmed with you before this phase starts)

### Phase D — Later / optional upgrades
Need paid third-party accounts you don't have yet:
- Live load board search (DAT, Truckstop) instead of manual load entry
- Automatic call/SMS logging (Twilio) instead of manual notes
- E-signatures for carrier agreements instead of manual PDF upload
- Automatic MC/DOT authority verification lookup

---

## A couple of small assumptions made — flag if wrong

- A prospect that isn't reached today automatically **stays on the Caller's list** for tomorrow (doesn't disappear), unless marked "Not Interested" / "Do Not Call" / successfully qualified.
- Admin's notification for a new qualified lead is an **in-app alert on the dashboard** (not an email/SMS) for Phase A — easy to add email later if wanted.
- Excel/CSV import expects at minimum a **name and phone number column**; any other columns present (email, truck type, etc.) get mapped in during import.
