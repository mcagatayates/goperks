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

## Design system

`app/globals.css` defines the whole visual language as CSS custom properties
— `--background`, `--foreground`, `--muted`, `--border`, `--surface`, and a
warm terracotta `--accent` — each with a light and a `prefers-color-scheme:
dark` value, exposed to Tailwind as `bg-background`, `text-muted`,
`border-border`, `bg-accent-soft`, etc. Components should use these tokens
rather than raw `black/10` or `dark:white/10` opacities, so light/dark
theming stays centralized.

Typography pairs Geist Sans (body/UI, `font-sans`) with a self-hosted
Fraunces variable serif for display headings (`font-display`) — no page
relies on the platform's default system font. `components/icons.tsx` holds
a small hand-authored line-icon set (24×24, 1.5px stroke) used everywhere an
icon is needed instead of emoji.

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

Every page above also has an English counterpart at the same paths under
`/en` (e.g. `/en`, `/en/r/masa19`, `/en/admin/masa19`), with an EN/TR link in
each page's header to switch between them. See "Localization" below.

## Localization

Turkish is the default/primary locale — it serves at bare paths (`/`,
`/r/[slug]`, `/admin/[slug]`) since Turkey is the target market; English
lives under `/en` instead of the more common other-way-around convention.
`lib/i18n.ts`'s `defaultLocale` and `localePrefix()` are the single place
this is decided — every link in the app computes its href through
`localePrefix()` rather than hardcoding which locale is bare.

`lib/i18n.ts` holds the full UI dictionary for both locales. The English
dictionary (`en`) is the source of truth for shape (this is independent of
which locale is the *default route* — see above); the Turkish one (`tr`) is
typed as `typeof en`, so a missing translation key is a compile error, not a
silent fallback to English text. Covers the landing page, the restaurant
page, the chat widget, and the admin dashboard (including reservation
status and channel display labels).

This only localizes the app's own UI chrome — not restaurant-specific
content (name, description, menu item names/descriptions), which is stored
once in the database regardless of locale. The AI concierge itself doesn't
need any of this: it already replies in whichever language the guest writes
in, by design of its system prompt.

Routes are duplicated per locale rather than using a `[locale]` dynamic
segment:

- `/`, `/r/[slug]`, `/admin/[slug]` — Turkish (default)
- `/en`, `/en/r/[slug]`, `/en/admin/[slug]` — English

Both variants render the same shared components (`LandingPage`,
`RestaurantPageContent`, `AdminDashboard`, `ChatWidget`) with a `locale`
prop — no page has its own copy of the UI logic.

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
- **WhatsApp** — `POST /api/webhooks/whatsapp`, multi-tenant: it looks up the
  restaurant by the inbound message's `phone_number_id` (via the
  `WhatsAppConnection` model) rather than a single global number, so one
  deployment can serve many restaurants' own WhatsApp Business numbers.
  Without a real access token stored for a restaurant, replies are logged to
  the server console instead of actually sent (see `lib/channels/whatsapp.ts`).

Voice (phone) is not implemented in this MVP — see "What's next" below.

## WhatsApp self-service onboarding

The dashboard's Settings tab has a "Connect WhatsApp" button meant to let a
restaurant owner connect their own WhatsApp Business number themselves —
no one from HeyTable has to touch their Meta account. This uses Meta's
official **Embedded Signup** flow: a Facebook-Login-style popup where the
restaurant picks or creates their WhatsApp Business Account, and we get back
a `waba_id` + `phone_number_id` we can start messaging through immediately.

**This has a real prerequisite that isn't just code**: to offer Embedded
Signup at all, HeyTable itself must first be approved by Meta as a **Tech
Provider** — a business-verification process on Meta's side (submitting the
company's legal/business details, then an app review for the
`whatsapp_business_management` / `whatsapp_business_messaging` permissions).
That's a one-time step for the whole product, done once by HeyTable, not
per restaurant — but it can't be done from this codebase; it's an
application you file at
[developers.facebook.com](https://developers.facebook.com/documentation/business-messaging/whatsapp/solution-providers/get-started-for-tech-providers)
and then wait on Meta's approval.

What's already built and ready to go the moment that approval lands:

- `prisma/schema.prisma`'s `WhatsAppConnection` model — one row per
  restaurant, holding its own `phoneNumberId` / `wabaId` / access token.
- `components/WhatsAppConnect.tsx` — the dashboard button. It loads the
  Facebook JS SDK, drives `FB.login()` with your Embedded Signup
  configuration, and posts the result to the connect endpoint below. Until
  `META_APP_ID`/`META_APP_SECRET` are set, it shows a clear
  "not configured yet" message instead of a broken button.
- `lib/whatsapp-onboarding.ts` + `POST /api/restaurants/[slug]/whatsapp/connect`
  — exchanges the signup code for an access token, subscribes HeyTable's
  app to that WABA's webhooks, and stores the connection.
- The webhook (`POST /api/webhooks/whatsapp`) already routes by
  `phone_number_id`, so newly connected restaurants work with zero further
  code changes.

Once you have Tech Provider approval: create a Meta App with the WhatsApp
product, create an Embedded Signup configuration under it, and set
`META_APP_ID`, `META_APP_SECRET`, `NEXT_PUBLIC_META_APP_ID`, and
`NEXT_PUBLIC_META_CONFIG_ID` (see `.env.example`) — the whole flow goes live
without touching any of the code above.

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
  page.tsx                    marketing landing page (tr, default)
  en/page.tsx                 marketing landing page (en)
  r/[slug]/page.tsx           public restaurant page + chat widget (tr)
  en/r/[slug]/page.tsx        public restaurant page + chat widget (en)
  admin/[slug]/page.tsx       staff dashboard (tr)
  en/admin/[slug]/page.tsx    staff dashboard (en)
  api/chat/route.ts           web chat endpoint
  api/webhooks/whatsapp/      WhatsApp Cloud API webhook (multi-tenant)
  api/restaurants/[slug]/     reservations / tables / menu-items / sessions
                              / whatsapp connect+status / restaurant data APIs
components/
  landing/LandingPage.tsx     landing page content, shared across locales
  RestaurantPageContent.tsx   restaurant page content, shared across locales
  ChatWidget.tsx              floating web chat widget (client component)
  AdminDashboard.tsx          staff dashboard UI (client component)
  WhatsAppConnect.tsx         Embedded Signup "Connect WhatsApp" button
  icons.tsx                   hand-authored line icon set
lib/
  agent.ts                    Claude tool-use loop + system prompt
  reservations.ts             availability + reservation CRUD (core logic)
  channels/whatsapp.ts        WhatsApp Cloud API send/parse adapter
  whatsapp-onboarding.ts      Embedded Signup token exchange + WABA subscribe
  i18n.ts                     en/tr UI dictionary
  prisma.ts, time.ts, types.ts
prisma/
  schema.prisma, seed.ts
```

## Pricing rationale

The landing page's pricing section isn't arbitrary — here's the cost model
behind it, so it can be revisited as real usage data comes in.

**Claude API cost per conversation.** Measured directly from the actual
`tools` array + system prompt in `lib/agent.ts` (not estimated): the tool
schemas serialize to ~730 tokens and the system prompt to ~250 tokens, so
every API call carries a fixed ~980-token overhead (the Anthropic API is
stateless — the full system+tools+history is resent on every call; this
codebase doesn't use prompt caching yet, see below). Modeling a typical
2-user-turn booking flow (check availability → collect name/phone → create
reservation → confirm and mention a special — 4 API calls total) at Claude
Sonnet 5 rates ($2/$10 per MTok input/output):

- ~4,500 input tokens + ~275 output tokens per conversation
- ≈ **$0.012 per conversation** (roughly $0.01 simple, $0.03-0.04 for a
  longer back-and-forth or a modify/cancel flow)

**Prompt caching would cut this further** (not yet implemented): caching
the ~980-token system+tools prefix drops its repeat-call cost by ~90%
(cache reads are priced at 0.1x). Worth adding once conversation volume
justifies the engineering time.

**WhatsApp messaging cost.** Under Meta's current pricing, guest-initiated
("service") replies within the 24-hour window are free (plus 1,000 free
service conversations/month per WhatsApp Business Account regardless).
**This changes October 1, 2026**, when Meta starts charging per business
message — including service replies. Using utility-tier rates as a stand-in
for the not-yet-published post-change service rate (~$0.004-$0.01/message
range in most markets) and ~2-3 assistant replies per conversation, that
adds roughly **$0.01-0.03 per WhatsApp conversation** once the change takes
effect. Web chat conversations are unaffected — there's no per-message fee.

**Blended planning number:** ~₺1 (≈ $0.03) per conversation, covering the
post-October-2026 WhatsApp world with margin, used as the basis for the
plan conversation caps and the overage rate below. Infra (hosting +
Postgres) and payment processing are amortized across all restaurants
rather than priced per-conversation, and aren't broken out here.

Tier caps and overage pricing were sized against this cost with headroom
for a healthy SaaS margin — not cost-plus pricing. Revisit both the caps
and the caching decision once real conversation volume and the finalized
post-October WhatsApp service rate are known.

## What's next (not in this MVP)

- Voice/phone channel (would need a telephony + speech-to-text/text-to-speech
  provider, e.g. Twilio + a realtime STT/TTS pipeline)
- Multi-tenant restaurant onboarding flow + auth on the admin dashboard
- Real POS/reservation-system integrations (Toast, Square, OpenTable, etc.)
- SMS/email confirmation messages (currently confirmation is only the chat
  reply itself)
- Waitlist handling when a requested slot is fully booked
