# HeyTable

An AI reservations concierge for restaurants — the restaurant-industry
counterpart to hotel AI concierge platforms like HeyHotel.ai. Guests book,
change, or cancel a table over web chat or WhatsApp; the AI checks live table
availability, confirms instantly, and suggests the chef's specials. Restaurant
staff get a dashboard to see and manage every reservation and conversation.

This is a working MVP prototype, not a finished product: single-tenant demo
data, one seeded restaurant, no auth on the admin dashboard, SQLite instead of
a hosted database. It's meant to prove out the core product (AI-driven
reservations, tool-calling against real availability data, a pluggable channel
layer for web + WhatsApp) so it can be iterated on.

## Stack

- **Next.js 16** (App Router, TypeScript, Tailwind CSS)
- **Prisma + SQLite** for local dev (schema is Postgres-compatible — see
  below to switch)
- **Claude API** (`@anthropic-ai/sdk`) with tool use for the reservations agent

## Getting started

```bash
npm install
cp .env.example .env
# then edit .env and set ANTHROPIC_API_KEY

npm run db:push   # create the SQLite schema
npm run db:seed    # seed the demo restaurant "Masa19"
npm run dev
```

Visit:

- `http://localhost:3000` — marketing landing page
- `http://localhost:3000/r/masa19` — the demo restaurant's public page, with
  the AI chat widget in the corner
- `http://localhost:3000/admin/masa19` — restaurant staff dashboard:
  reservations (with a manual "+ New reservation" form for walk-ins/phone
  bookings), menu & specials and tables (both fully editable — add, edit,
  toggle, delete), and conversation transcripts

Without `ANTHROPIC_API_KEY` set, every other part of the app works (pages,
reservation CRUD, dashboard) but the chat widget will return a clear error
instead of a reply.

## How the agent works

`lib/agent.ts` runs a Claude tool-use loop against six tools backed directly
by the database (`lib/reservations.ts`, `lib/prisma.ts`):

- `check_availability`, `create_reservation`, `modify_reservation`,
  `cancel_reservation`, `find_reservation`, `get_specials`,
  `get_restaurant_info`

The agent never invents availability or reservation state — every claim it
makes is backed by a tool call against the live database, so it can't
double-book a table or promise a slot that doesn't exist.

Availability is slot-based: each reservation occupies a table for
`reservationDurationMinutes` (default 90) starting at the requested time;
`findAvailableTables` filters tables by capacity and rejects any that overlap
an existing `pending`/`confirmed` reservation. `lib/reservations.ts` also
rejects past dates, non-positive party sizes, and reservations without a
name/phone — these guards apply to every caller (the AI agent, the manual
dashboard form, and the API directly).

## Dashboard-only bookings

Not every reservation goes through the AI — a phone call answered by a host,
or a walk-in, is entered directly in the dashboard's "+ New reservation"
form. These are tagged with `channel: "staff"` (as opposed to `"web"` /
`"whatsapp"` / `"voice"` for AI-driven bookings) but go through the exact
same availability engine, so they can never double-book a table the AI
already holds, or vice versa.

## Channels

The same agent logic drives two channels today:

- **Web chat** — `POST /api/chat`, used by the `ChatWidget` component embedded
  on the restaurant page.
- **WhatsApp** — `POST /api/webhooks/whatsapp`. This is fully wired up but
  ships in "stubbed send" mode: without `WHATSAPP_PHONE_NUMBER_ID` /
  `WHATSAPP_ACCESS_TOKEN` set, replies are logged to the server console
  instead of actually sent over WhatsApp. See `lib/channels/whatsapp.ts` for
  the three steps to go live with a real WhatsApp Business number. The
  webhook is currently single-tenant (routes every message to the restaurant
  named by `WHATSAPP_RESTAURANT_SLUG`) — a real multi-restaurant deployment
  would map the inbound WhatsApp phone number ID to a restaurant instead.

Voice (phone) is not implemented in this MVP — see "What's next" below.

## Switching SQLite → Postgres

The schema (`prisma/schema.prisma`) is already Postgres-compatible; SQLite was
chosen only so this MVP runs with zero external services. To move to
Postgres:

1. Change `provider = "sqlite"` to `provider = "postgresql"` in
   `prisma/schema.prisma`.
2. Point `DATABASE_URL` at your Postgres instance.
3. `npx prisma db push` (or set up migrations with `prisma migrate dev`).

## Project structure

```
app/
  page.tsx                    marketing landing page
  r/[slug]/page.tsx           public restaurant page + chat widget
  admin/[slug]/page.tsx       staff dashboard
  api/chat/route.ts           web chat endpoint
  api/webhooks/whatsapp/      WhatsApp Cloud API webhook
  api/restaurants/[slug]/     reservations / tables / menu-items / sessions
                              / restaurant data APIs
components/
  ChatWidget.tsx              floating web chat widget (client component)
  AdminDashboard.tsx          staff dashboard UI (client component)
lib/
  agent.ts                    Claude tool-use loop + system prompt
  reservations.ts             availability + reservation CRUD (core logic)
  channels/whatsapp.ts         WhatsApp Cloud API adapter
  prisma.ts, time.ts, types.ts
prisma/
  schema.prisma, seed.ts
```

## What's next (not in this MVP)

- Voice/phone channel (would need a telephony + speech-to-text/text-to-speech
  provider, e.g. Twilio + a realtime STT/TTS pipeline)
- Multi-tenant restaurant onboarding flow + auth on the admin dashboard
- Real POS/reservation-system integrations (Toast, Square, OpenTable, etc.)
- SMS/email confirmation messages (currently confirmation is only the chat
  reply itself)
- Waitlist handling when a requested slot is fully booked
