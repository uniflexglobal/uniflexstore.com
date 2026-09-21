# Uniflex Global Logistics CRM — Local Usage Guide

The app is running locally right now at **http://localhost:3000**.

---

## Logging in

The CRM has its own login, separate from your store's customer/admin login.

**CRM login page:** http://localhost:3000/crm/login

| Role | Email | Password |
|---|---|---|
| Admin | `admin@uniflexlogistics.com` | `Crm@12345` |
| Caller (senior) | `caller@uniflexlogistics.com` | `Crm@12345` |
| Dispatcher | `dispatcher@uniflexlogistics.com` | `Crm@12345` |

The Caller account is marked "senior," meaning it can assign a qualified lead straight to a Dispatcher instead of waiting for Admin. Create real staff accounts (and turn off these test ones) from the Staff page once you're ready to go live — see below.

Everyone lands at the same URL after logging in — what you see depends on your role.

---

## Page map — what's where, and who can see it

### Dashboard
**http://localhost:3000/crm**
Everyone sees this after login. Shows different stat cards depending on your role:
- **Caller:** how many prospects are on your call list, how many you've qualified this week
- **Dispatcher:** newly assigned leads, active carriers, documents expiring soon
- **Admin:** company-wide totals, loads/revenue this month, documents expiring, and the **Awaiting Assignment** queue front and center — every qualified lead waiting for a Dispatcher

### Call List / Prospects
**http://localhost:3000/crm/prospects**
*Caller, Admin*
Your daily call queue — every prospect assigned to you, with buttons to log the outcome of each call (No answer / Call back later / Not interested / Do not call) or qualify them into a full Lead. Admin sees everyone's list and can reassign a prospect to a different Caller.

### Import Prospects
**http://localhost:3000/crm/prospects/import**
*Caller, Admin*
Upload a CSV or Excel (.xlsx) file of names/phone numbers to bulk-add to the call queue. Needs at minimum a "Name" and "Phone" column — email, truck type, and route are picked up automatically if present.

### Leads
**http://localhost:3000/crm/leads**
*Caller, Dispatcher, Admin*
Shows different things per role:
- **Caller:** your qualified-lead history
- **Dispatcher:** leads just assigned to you, not yet turned into an active carrier
- **Admin:** every lead, with an "Assign" button on anything still waiting

### Carriers
**http://localhost:3000/crm/carriers**
*Dispatcher, Admin*
Every signed carrier. Click into one for tabs: **Profile**, **Trucks**, **Drivers**, **Documents**. New carriers start in "Onboarding" — there's a checklist (W-9, insurance certificate, MC/DOT authority letter, signed dispatch agreement) that must be fully uploaded before you can mark the carrier "Active."

### Documents
**http://localhost:3000/crm/documents**
*Dispatcher, Admin*
Every document across every carrier in one place, colour-coded: red = expired, amber = expiring within 30 days, green = valid. This is the page to check before a broker rejects a carrier over a lapsed insurance cert.

### Dispatch Board
**http://localhost:3000/crm/dispatch**
*Dispatcher, Admin*
A Kanban board of every load: Booked → Dispatched → In Transit → Delivered. Click "New Load" to book one against an active carrier's truck/driver. Click into a load for the full detail page — log check calls, upload the rate confirmation and proof of delivery, move it forward a stage. You can't mark a load "Delivered" until at least one check call is logged.

**New load:** http://localhost:3000/crm/dispatch/loads/new

### Invoices
**http://localhost:3000/crm/invoices**
*Dispatcher, Admin*
Uniflex's dispatch-fee invoices to carriers (not the carrier's own invoice to the broker — that's between them and their factoring company). Create one from any delivered load; the fee amount is pre-filled from the load's rate × dispatch-fee %. Draft → Sent → Unpaid → Paid, or mark it sent to factoring.

**New invoice:** http://localhost:3000/crm/invoices/new

### Commissions
**http://localhost:3000/crm/commissions**
*Admin only*
A manual ledger — who earned what, from which load or lead, paid or not. No automatic formula yet; add entries by hand until you've settled on exact commission rules.

### Reports
**http://localhost:3000/crm/reports**
*Admin only*
Revenue over time, the Prospect → Lead → Carrier conversion funnel, loads per Dispatcher, leads qualified per Caller, and a commission summary per staff member.

### Staff
**http://localhost:3000/crm/staff**
*Admin only*
Create Caller/Dispatcher/Admin accounts, deactivate old ones, and toggle the "senior caller" permission.

---

## A full walkthrough, start to finish

This is the same flow I tested end-to-end while building it — follow it once to see how the pieces connect.

1. **Get a lead in.** Either submit the real quote form at http://localhost:3000/logistics, or log in as Admin and go to **Prospects → Import** to bulk-upload a list.
2. **Log in as the Caller** (`caller@uniflexlogistics.com`). Go to **Call List**, find the prospect, click through and log a call outcome — or if it goes well, click "Qualify." Fill in the full profile (MC number, truck type, weight, preferred route, availability). Since this account is a senior caller, you'll see an option to assign it straight to the Dispatcher instead of sending it to Admin.
3. **Log in as the Dispatcher** (`dispatcher@uniflexlogistics.com`). Go to **Leads**, find the newly assigned one, and go to the **Carriers** page — it should already show up as a bare carrier in "Onboarding" status. Upload the four required documents, then click "Mark Carrier Active."
4. **Add a truck and driver** on that carrier's Trucks/Drivers tabs.
5. **Book a load.** Go to **Dispatch Board → New Load**, pick the now-active carrier, its truck and driver, fill in origin/destination/rate/dispatch fee %.
6. **Run the load through the board.** Move it Booked → Dispatched → In Transit, log a check call, then mark it Delivered.
7. **Invoice it.** Go to **Invoices → New Invoice**, pick the delivered load — the fee amount is pre-filled. Move it through Draft → Sent → Paid.
8. **Log in as Admin** and check the **Dashboard** and **Reports** page — the revenue from that invoice should show up in "Revenue this month" and the reports charts.

---

## Stopping/restarting the server

The dev server is currently running in the background. If you need to restart it later:

```
npm run dev
```

Then visit http://localhost:3000 as usual.
