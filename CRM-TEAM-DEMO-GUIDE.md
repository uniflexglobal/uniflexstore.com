# Uniflex Logistics CRM — Team Demo Script

You'll be screen-sharing and driving this yourself, switching between the three logins live. This guide is written in the order to actually click through, not just a reference — follow it top to bottom and it tells a complete story.

---

## Before you go live

1. Start the app: open a terminal in the project folder and run `npm run dev`, wait for "Ready", then confirm **http://localhost:3000/crm/login** loads.
2. Have all three passwords handy (below).
3. Open three separate browser profiles/incognito windows if you want to stay logged into more than one role at once — otherwise just log out and back in as you switch roles (Sign out is bottom-left of the sidebar).

| Role | Email | Password |
|---|---|---|
| Admin | `admin@uniflexlogistics.com` | `admin12345` |
| Dispatcher | `dispatcher@uniflexlogistics.com` | `Crm@12345` |
| Caller | `caller@uniflexlogistics.com` | `Crm@12345` |

The account names your team will actually see: **Ahmed (Admin), Osaid (Dispatcher), Talha (Caller)**.

---

## The 90-second version to say out loud before you start clicking

> "Right now, when someone fills out our website's quote form, it's just an email — nothing tracked, nobody assigned. This system fixes that. A lead comes in, a Caller works it and qualifies it, an Admin (or a trusted senior Caller) hands it to a Dispatcher, the Dispatcher signs the carrier up, gets their trucks and paperwork on file, books loads for them, and we invoice our dispatch fee. Every step is logged. I'm going to show you the whole thing end to end, then show each of you your own screen."

---

## PART 1 — Log in as Talha (Caller)

**http://localhost:3000/crm/login** → `caller@uniflexlogistics.com` / `Crm@12345`

### Dashboard
First thing after login. Two numbers: **how many prospects are on your call list today**, and **how many you've qualified this week**. This is a Caller's "what do I do today" screen — nothing more.

### Call List (sidebar)
This is the actual job. Every row is someone to call.
- Point out: name, phone number (with the **copy icon** next to it — click it, show the toast, mention it copies as `+1XXXXXXXXXX` ready to paste into a dialer)
- Point out the status filter tabs across the top (New, No answer, Call back later, etc.)
- **Click "Call" on any row that isn't already Qualified.** A dialog opens:
  - Four outcome buttons: No answer / Call back later / Not interested / Do not call — click one live, show the toast, show the row's status badge update
  - Then re-open a fresh one and click the **teal "This call was successful — Qualify"** button instead
  - Now show the qualify form: name, phone, email, MC number, truck type, weight, preferred route, availability date, notes
  - Fill it in with anything and hit **Qualify lead** — explain: *"Because I'm a senior Caller, I could optionally assign this straight to a Dispatcher right here — normally it goes to Admin's queue instead."* (Show the "Assign to dispatcher now" dropdown in that form, but leave it blank for this demo so it goes to Admin's queue — that's Part 2.)

### Import Prospects (sidebar)
- Show the upload box, mention it accepts CSV or Excel with at minimum a Name and Phone column
- If you have a real sample list, upload it live; otherwise just explain the flow

### Leads (sidebar)
- This is Talha's own history of everyone he's qualified, and what happened after (still waiting / assigned / signed)

**Wrap-up line for Callers on your team:** *"Your whole day lives on the Call List page. Qualify a lead right and it's out of your hands — Admin or the Dispatcher takes it from here."*

---

## PART 2 — Log in as Ahmed (Admin)

Sign out, log back in as `admin@uniflexlogistics.com` / `admin12345`.

### Dashboard
- Company-wide numbers up top: prospects, leads, active carriers, staff, loads this month, revenue this month, documents expiring
- **The big one: "Awaiting Assignment" queue right on the dashboard.** The lead Talha just qualified in Part 1 should be sitting right here.
- **Click "Assign"** on it, pick Osaid from the dropdown, confirm. Explain: *"This is the one moment Admin controls who gets which carrier."*

### Leads (sidebar)
- Same page Callers see, but Admin sees **everyone's** leads, with Qualified-by and Dispatcher columns, and can assign or delete any lead from here too (trash icon, admin-only)

### Carriers (sidebar)
- Every signed carrier company-wide. Click into one — show the tabs (Profile / Trucks / Drivers / Documents) and mention Admin can reassign a carrier to a different Dispatcher from the list view

### Documents (sidebar)
- **This is a big one to sell.** Company-wide list of every uploaded document, colour-coded: red = expired, amber = expiring within 30 days, green = valid. *"This is how we never get caught with an expired insurance cert again."*

### Dispatch Board (sidebar)
- Company-wide Kanban of every load in motion, across every Dispatcher

### Invoices / Commissions (sidebar)
- Invoices: every dispatch-fee invoice, its status
- Commissions: manual ledger of what each staff member has earned, paid or not

### Reports (sidebar)
- Revenue over time chart, the Prospect → Lead → Carrier conversion funnel, loads per Dispatcher, leads qualified per Caller, commission summary table. *"This is how we'll know who's performing."*

### Staff (sidebar)
- **Save this for last — it's the one your team needs to actually use after today.** Show "Add Staff": name, email, temporary password, role (Caller/Dispatcher/Admin), and the "senior caller" toggle. Explain: *"This is how we create everyone's real login once we're done testing."*

**Wrap-up line for Admin:** *"You're the only one who sees everything. Your two jobs day-to-day are the Awaiting Assignment queue and keeping an eye on Documents."*

---

## PART 3 — Log in as Osaid (Dispatcher)

Sign out, log back in as `dispatcher@uniflexlogistics.com` / `Crm@12345`.

### Dashboard
- Newly assigned leads, active carriers, documents expiring — a Dispatcher's own numbers only

### Leads (sidebar)
- The lead Ahmed assigned in Part 2 should be sitting here now, status "Assigned"

### Carriers (sidebar)
- Click into the new carrier record (created automatically the moment it was assigned)
- **Onboarding checklist banner at the top** — W-9, Certificate of Insurance, MC/DOT Authority Letter, Dispatch Agreement. "Mark carrier Active" is greyed out until all four are on file.
- Click the **Documents tab**, click **Upload document**, pick a type, upload any test file, set an expiry date — show it land in the list with a **View** button
- Once all four types exist (even just re-using a test file four times for the demo), the "Mark carrier Active" button lights up — click it

### Trucks / Drivers tabs
- Add a truck (unit number, equipment type), add a driver, assign the driver to the truck

### Dispatch Board (sidebar)
- Click **New Load** — pick the now-active carrier, its truck/driver auto-populate as options, fill in origin/destination/rate/dispatch fee %, create it
- Show it land in the **Booked** column of the Kanban board
- Click into it, show the **check-call log** (log one), show the **rate confirmation / POD upload** slots, then move it through Dispatched → In Transit → Delivered
- Mention: *"It won't let you mark Delivered until at least one check call is logged — keeps the record honest."*

### Invoices (sidebar)
- Click **New Invoice**, pick that delivered load — the fee amount pre-fills from rate × dispatch fee %. Create it, show the status move Draft → Sent → Paid.

**Wrap-up line for Dispatchers:** *"Once a lead lands on your desk, you own it end to end — sign them up, get their paperwork, run their loads, get us paid."*

---

## Closing the demo

Good talking points to end on:
- **What's not built yet, on purpose:** live load-board search (DAT/Truckstop), automatic call/SMS logging, e-signatures — all need paid third-party accounts we don't have yet. The system is built to slot those in later without a rebuild.
- **What happens after today:** go to Staff (as Ahmed) and create everyone's real account, then have them log in and change nothing else — the test accounts (Ahmed/Osaid/Talha) can be deactivated once real ones exist.
- **If anything looks off:** note it and send it over — this is still early and easy to adjust.

---

## Quick reference — every page, who sees it

| Page | URL | Who |
|---|---|---|
| Dashboard | `/crm` | Everyone (content differs by role) |
| Call List | `/crm/prospects` | Caller, Admin |
| Import Prospects | `/crm/prospects/import` | Caller, Admin |
| Leads | `/crm/leads` | Everyone (scope differs by role) |
| Carriers | `/crm/carriers` | Dispatcher, Admin |
| Documents | `/crm/documents` | Dispatcher, Admin |
| Dispatch Board | `/crm/dispatch` | Dispatcher, Admin |
| Invoices | `/crm/invoices` | Dispatcher, Admin |
| Commissions | `/crm/commissions` | Admin only |
| Reports | `/crm/reports` | Admin only |
| Staff | `/crm/staff` | Admin only |

Full technical/page reference: `CRM-USAGE-GUIDE.md`. Original plan and feature rationale: `CRM.md`. Both in the project root alongside this file.
