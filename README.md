# HeyTable

An AI reservations concierge for restaurants — the restaurant-industry
counterpart to hotel AI concierge platforms like HeyHotel.ai. Guests book,
change, or cancel a table over web chat or WhatsApp; the AI checks live table
availability, confirms instantly, and suggests the chef's specials. Restaurant
staff get a dashboard to see and manage every reservation and conversation.

This is a working MVP prototype, not a finished product: SQLite instead of a
hosted database, a single AI provider, no payments. It supports real
multi-tenant signup (see "Accounts & multi-tenancy" below) alongside a
seeded demo restaurant ("Masa19") that the landing page links to directly. It's
meant to prove out the core product (AI-driven reservations, tool-calling
against real availability data, a pluggable channel layer for web + WhatsApp)
so it can be iterated on.

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
# then edit .env and set ANTHROPIC_API_KEY (SESSION_SECRET is generated
# for you already if you copied .env.example as-is — see below)

npm run db:push   # create the SQLite schema
npm run db:seed    # seed the demo restaurant "Masa19"
npm run dev
```

Visit:

- `http://localhost:3000` — marketing landing page
- `http://localhost:3000/r/masa19` — the demo restaurant's public page, with
  the AI chat widget in the corner
- `http://localhost:3000/admin/masa19` — restaurant staff dashboard (open
  without login — see "Accounts & multi-tenancy"): reservations (with a
  manual "+ New reservation" form for walk-ins/phone bookings and the
  waitlist for slots with no availability), menu & specials and tables
  (both fully editable — add, edit, toggle, delete), conversation
  transcripts, and settings (WhatsApp + POS integration)
- `http://localhost:3000/kayit` — sign up a real (non-demo) restaurant;
  `http://localhost:3000/giris` — log in to one

Without `ANTHROPIC_API_KEY` set, every other part of the app works (pages,
reservation CRUD, dashboard) but the chat widget will return a clear error
instead of a reply.

The product targets the Turkish restaurant market only, so the UI is
Turkish-only — see "Localization" below.

## Accounts & multi-tenancy

A restaurant that signs up at `/kayit` gets its own row (`Restaurant` +
one `User` as its owner) and its admin dashboard is only reachable by that
owner's session — nobody else's login works for it, and every mutating
`/api/restaurants/[slug]/*` route re-checks this server-side (not just the
page), via `assertRestaurantAccess()` in `lib/auth.ts`.

The seeded demo restaurant ("masa19", flagged `isDemo` in the schema) is the
one exception: its dashboard stays open without login, since the landing
page's "Canlı demo" / "Restoran panelini gör" links go straight to it and
that's the point of a demo.

Auth itself has no external dependency — no NextAuth/Clerk/etc: `lib/session.ts`
signs a small JSON payload (`userId`, `restaurantId`, expiry) with
HMAC-SHA256 using `SESSION_SECRET`, stored as an httpOnly cookie.
`proxy.ts` (Next.js 16 renamed `middleware.ts` to this) does a cheap
optimistic check on every `/admin/*` request — is there a validly-signed
cookie at all — and redirects anonymous visitors to `/giris` before the
page even renders; the real check (does *this* session belong to *this*
restaurant) happens in `app/admin/[slug]/page.tsx` and in
`assertRestaurantAccess()`, since that needs a database lookup Proxy
deliberately avoids doing on every request. Passwords are hashed with
Node's built-in `scrypt`, no extra dependency either.

## Localization

The app's own UI chrome (landing page, restaurant page, chat widget, admin
dashboard) is Turkish-only — there is no language switcher and no English
build. `lib/i18n.ts` holds a single flat `dictionary` object rather than a
per-locale lookup table, so every component imports `dictionary` directly
instead of threading a `locale` prop through.

This only covers the app's own UI chrome — not restaurant-specific content
(name, description, menu item names/descriptions), which is free-form text
entered per restaurant. The AI concierge itself replies in whichever
language the guest writes in, by design of its system prompt (useful for
tourists messaging in English or another language even though the product
and its dashboard are Turkish-only).

## How the agent works

`lib/agent.ts` runs a Claude tool-use loop against seven tools backed directly
by the database (`lib/reservations.ts`, `lib/waitlist.ts`, `lib/prisma.ts`):

- `check_availability`, `create_reservation`, `modify_reservation`,
  `cancel_reservation`, `find_reservation`, `join_waitlist`, `get_specials`,
  `get_restaurant_info`

The agent never invents availability or reservation state — every claim it
makes is backed by a tool call against the live database, so it can't
double-book a table or promise a slot that doesn't exist. When
`check_availability` finds nothing free and no nearby time works either, the
agent is instructed to offer `join_waitlist` instead of just failing — see
"Waitlist" below.

Availability is slot-based: each reservation occupies a table for
`reservationDurationMinutes` (default 90) starting at the requested time;
`findAvailableTables` filters tables by capacity and rejects any that overlap
an existing `pending`/`confirmed` reservation. `lib/reservations.ts` also
rejects past dates, non-positive party sizes, and reservations without a
name/phone — these guards apply to every caller (the AI agent, the manual
dashboard form, and the API directly).

**Prompt caching** is on: the (fully static) tool definitions, the
per-restaurant system prompt, and the conversation-history prefix each carry
a `cache_control: { type: "ephemeral" }` breakpoint, so the ~980-token
system+tools overhead and the growing conversation history are billed at
the ~0.1x cache-read rate instead of full price on every turn and every
iteration of the tool loop — see "Pricing rationale" below for the
before/after numbers.

## Dashboard-only bookings

Not every reservation goes through the AI — a phone call answered by a host,
or a walk-in, is entered directly in the dashboard's "+ New reservation"
form. These are tagged with `channel: "staff"` (as opposed to `"web"` /
`"whatsapp"` / `"voice"` for AI-driven bookings) but go through the exact
same availability engine, so they can never double-book a table the AI
already holds, or vice versa.

## Waitlist

When `check_availability` finds nothing free for a requested date/time and
no nearby slot works either, the AI offers to add the guest to the
waitlist instead of just failing — `lib/waitlist.ts`'s `addToWaitlist()`,
called via the agent's `join_waitlist` tool. Entries show up in the
dashboard's Reservations tab, below the reservations table for the
selected date, with a status dropdown (waiting/seated/cancelled). There's
no automatic "a table just freed up" notification loop yet — a host sees
the list and calls the guest, the same as a restaurant's waitlist would
work over the phone today.

## Notifications (SMS/email)

Guests get an SMS (and an email, if they gave one) when a reservation is
confirmed or cancelled — `lib/notifications/{sms,email}.ts`, wired into
`lib/reservations.ts`'s `createReservation`/`cancelReservation` and into
the dashboard's status-dropdown PATCH route. Both send via a plain
`fetch()` to the provider's REST API (Twilio for SMS, Resend for email) —
no SDK dependency, matching this project's style elsewhere (see the
WhatsApp integration). Until `TWILIO_ACCOUNT_SID`/`TWILIO_AUTH_TOKEN`/
`TWILIO_FROM_NUMBER` or `RESEND_API_KEY` are set (see `.env.example`),
sends are logged to the console instead of attempted — same "not
configured yet" treatment as WhatsApp before Meta is set up. A
notification failure is always caught and logged, never allowed to fail
the reservation itself.

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

## POS / reservation-system integration

No specific POS vendor (Toast, Square, OpenTable, a local Turkish POS) is
integrated, since none is chosen yet — integrating one proprietary SDK
blind isn't useful. Instead, `lib/pos.ts` offers a vendor-neutral two-way
integration a restaurant opts into from the dashboard's Settings tab:

- **Push** — `notifyPosWebhook()` POSTs reservation/waitlist events
  (`reservation.created`/`.updated`/`.cancelled`, `waitlist.created`) to a
  URL the restaurant configures, signed with HMAC-SHA256 over the raw body
  (`X-HeyTable-Signature` header) the same way Stripe/GitHub sign
  webhooks, so their receiving end can verify it really came from
  HeyTable.
- **Pull** — `GET /api/restaurants/[slug]/pos/reservations` lets their POS
  (or a Zapier/Make bridge) poll current reservations, authenticated with
  a restaurant-scoped API key (`Authorization: Bearer <key>`, generated
  from Settings) rather than the owner's login session, since the caller
  here is a machine, not the dashboard.

Both directions are no-ops until the restaurant sets them up — no env vars
needed, since the API key and webhook URL/secret are stored per-restaurant
in the database rather than platform-wide config.

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
  admin/[slug]/page.tsx       staff dashboard (auth-guarded, demo excepted)
  kayit/page.tsx              restaurant signup
  giris/page.tsx              restaurant login
  api/auth/                   signup / login / logout
  api/chat/route.ts           web chat endpoint
  api/webhooks/whatsapp/      WhatsApp Cloud API webhook (multi-tenant)
  api/restaurants/[slug]/     reservations / tables / menu-items / sessions /
                              waitlist / whatsapp connect+status / pos / data
proxy.ts                      optimistic auth redirect for /admin/* (Next 16
                              renamed middleware.ts to this)
components/
  landing/LandingPage.tsx     landing page content
  RestaurantPageContent.tsx   restaurant page content
  ChatWidget.tsx              floating web chat widget (client component)
  AdminDashboard.tsx          staff dashboard UI (client component)
  WhatsAppConnect.tsx         Embedded Signup "Connect WhatsApp" button
  PosIntegration.tsx          POS API key + webhook settings
  auth/SignupForm.tsx, LoginForm.tsx
  icons.tsx                   hand-authored line icon set
lib/
  agent.ts                    Claude tool-use loop + system prompt (cached)
  reservations.ts             availability + reservation CRUD (core logic)
  waitlist.ts                 waitlist add/list/status
  auth.ts, session.ts         password hashing + signed session cookie
  notifications/              SMS (Twilio) + email (Resend) confirmations
  pos.ts                      POS webhook signing + API-key auth
  channels/whatsapp.ts        WhatsApp Cloud API send/parse adapter
  whatsapp-onboarding.ts      Embedded Signup token exchange + WABA subscribe
  i18n.ts                     Turkish UI dictionary
  prisma.ts, time.ts, types.ts, slug.ts, constants.ts
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
stateless — the full system+tools+history is resent on every call).
Modeling a typical 2-user-turn booking flow (check availability → collect
name/phone → create reservation → confirm and mention a special — 4 API
calls total) at Claude Sonnet 5 rates ($2/$10 per MTok input/output,
cache writes at 1.25x, cache reads at 0.1x):

- ~4,500 input tokens + ~275 output tokens per conversation, uncached
- ≈ **$0.012 per conversation without caching** (roughly $0.01 simple,
  $0.03-0.04 for a longer back-and-forth or a modify/cancel flow)

**Prompt caching is on** (`cache_control` breakpoints on the tools array,
system prompt, and conversation-history prefix in `lib/agent.ts`): the
first call of a conversation writes the ~980-token system+tools prefix to
cache (at 1.25x), and every later call in that same conversation — 3 of
the 4 calls in the modeled flow — reads it back at 0.1x instead of paying
full price again; the history breakpoint compounds this further as a
conversation gets longer. That drops the modeled conversation to roughly
**$0.007-0.008**, a ~35-40% reduction — savings grow with conversation
length, since a longer back-and-forth means more cache reads relative to
the one-time write.

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
for a healthy SaaS margin — not cost-plus pricing. Revisit the caps once
real conversation volume and the finalized post-October WhatsApp service
rate are known.

## What's next (not in this MVP)

- **Voice/phone channel** — would need a telephony + speech-to-text/
  text-to-speech provider (e.g. Twilio + a realtime STT/TTS pipeline);
  unlike WhatsApp, there's no code path built for this yet since it needs
  a chosen provider's specific API before any of it can be written
  meaningfully.
- **A real end-to-end test with a live `ANTHROPIC_API_KEY`** — every AI-turn
  code path has been verified up to the exact point where the real
  Anthropic API call fires (the same graceful "not configured" behavior
  each time), but never with an actual model response, since no key has
  been set in this environment.
- **Meta Tech Provider approval** — the WhatsApp self-service onboarding
  code (see above) is complete and ready; it's waiting on Meta's business
  verification, which is an external process on Meta's side, not a
  coding task.
