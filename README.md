# Future Self

Write a letter to (or from) your future self. Choose a timeline — 12 months
out to 50 years, or a custom date — and it arrives by email exactly then.

Two tools, one data model underneath:
- **Future Self Commit** — write to your future self about who you are now and what you're committing to.
- **Future Self Connect** — write *as* your future self, describing that life and sending advice back.

Letters are private to the account that wrote them, and lock against
editing 24 hours after being scheduled — see **Auth** and **Sealing**
below.

## Stack

- **Next.js 14** (App Router, TypeScript) — UI + API routes in one app
- **Prisma + SQLite** for storage locally (swap to Postgres for real deployment — see below)
- **Tailwind CSS** for styling
- **Nodemailer** for the delivery email, triggered by a cron-protected API route
- **Auth.js / NextAuth v5** for email magic-link sign-in, using the same SMTP settings as delivery

## Run it locally

```bash
npm install
cp .env.example .env       # then fill in the values, see notes below
npm run db:push            # creates the local SQLite DB from prisma/schema.prisma
npm run dev
```

Open http://localhost:3000 — you'll be redirected to `/signin` first.

> **Note on `npm install` versions:** `next-auth` and `@auth/prisma-adapter`
> are pinned to specific v5 releases in `package.json` as of when this was
> written. If `npm install` complains about a missing version, run
> `npm install next-auth@beta @auth/prisma-adapter@latest` to pick up
> whatever's current — the API used here (Nodemailer provider, JWT
> sessions, Prisma adapter) has been stable across v5 betas.

### Getting email sending working

Both delivery and sign-in use the same Gmail SMTP setup, because it's free
and has no domain verification step:

1. Turn on 2-Step Verification on the Gmail account you'll send from.
2. Create an app password at https://myaccount.google.com/apppasswords.
3. Put the Gmail address in `EMAIL_USER` / `EMAIL_FROM` and the 16-character
   app password in `EMAIL_PASS` in your `.env`.

Any other SMTP provider works too — just change `EMAIL_HOST`/`EMAIL_PORT`.
`lib/email.ts` handles the delivery email; `auth.ts` handles the sign-in
magic link; both read the same `EMAIL_*` vars.

### Signing in

There's no password — enter your email on `/signin` and a link arrives via
the SMTP settings above. Click it on the same device to finish signing in.
Every letter you write is scoped to your account; nobody else can see or
edit it.

### Triggering delivery manually (without waiting years)

Delivery works by a cron-protected endpoint that checks for due letters,
across all users:

```
GET /api/cron/send-due?secret=YOUR_CRON_SECRET
```

To test end-to-end: sign in, write a letter, choose **Custom date**, pick
*today*, save it, then hit that URL (in a browser or `curl`). It'll find
the letter, email it, and mark it `sent`. In real use an external
scheduler hits this URL automatically — see Deploying below.

## Sealing (edit lock)

A letter stays editable for **24 hours** after it's first scheduled, then
locks — you can still view, export, or delete it, but not change the
content, timeline, or recipient. This is deliberate: the point of
"committing" to something is that it stops being negotiable a day later.

Mechanically: `scheduledAt` is stamped once, the first time a letter's
status becomes `"scheduled"` (on creation, or later via "Seal & schedule"
from a draft). Re-saving during the grace period does **not** push the
lock back — otherwise you could dodge it forever by editing every 23
hours. `lib/timeline.ts` has `isSealed()` / `sealTime()`; both the API
(`app/api/letters/[id]/route.ts`, server-side, authoritative) and the
letter detail page (client-side, for the UI) use them.

Letters created before this feature shipped have no `scheduledAt`. The
`GET` route self-heals this the first time such a letter is opened,
backfilling `scheduledAt` from `createdAt` — so old scheduled letters
start their 24-hour clock retroactively from when they were written, the
first time anyone looks at them after upgrading.

Deleting a sealed letter is still allowed — sealing only locks *editing*,
since preventing deletion wasn't part of the ask and adds a second kind of
lock to reason about. Worth revisiting if the product leans harder into
"you can't back out of this."

## Deploying for free

1. **Push to GitHub**, then import the repo into [Vercel](https://vercel.com) (free tier).
2. **Swap SQLite for hosted Postgres**, since Vercel's filesystem is
   ephemeral and won't persist a SQLite file between requests:
   - Create a free Postgres database at [Neon](https://neon.tech) or [Supabase](https://supabase.com).
   - In `prisma/schema.prisma`, change `provider = "sqlite"` to `provider = "postgresql"`.
   - Set `DATABASE_URL` in Vercel's project settings to the connection string they give you.
   - Run `npx prisma db push` once (locally, pointed at that URL) to create the tables.
3. **Set the rest of the env vars** in Vercel's project settings: `EMAIL_HOST`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM`, `CRON_SECRET`, `AUTH_SECRET`.
4. **Schedule the cron.** Two free options:
   - `vercel.json` (already included) registers a daily Vercel Cron job at 9am UTC hitting `/api/cron/send-due` — Vercel automatically sends `CRON_SECRET` as a bearer token, no extra setup needed. Vercel's free Hobby tier supports daily cron jobs.
   - Or use [cron-job.org](https://cron-job.org) (free) to ping `https://your-app.vercel.app/api/cron/send-due?secret=YOUR_SECRET` on whatever schedule you like — useful if you want finer granularity than once a day.

A once-daily check is plenty here: nobody needs their 5-year letter to the
minute, and it keeps everything on free tiers.

> **Schema note:** adding auth made `userId` a required field on `Letter`.
> If you already have letters in a local `dev.db` from before this change,
> `prisma db push` will refuse to apply it against existing rows. Easiest
> path for a prototype: delete `prisma/dev.db` and start fresh. If you
> need to keep existing letters, back-fill a `userId` for them manually
> (assign them all to your own account's id) before running `db:push`.

## Project structure

```
auth.ts                       Auth.js config: email magic links, JWT sessions
middleware.ts                 redirects signed-out requests to /signin
app/
  signin/page.tsx              magic-link sign-in page
  providers.tsx                wraps the app in SessionProvider
  page.tsx                    dashboard: pick a tool, browse saved letters
  write/[type]/page.tsx       the focused writing experience (COMMIT or CONNECT)
  letters/[id]/page.tsx       view / edit / delete / export a single letter, shows sealed state
  api/auth/[...nextauth]/      NextAuth route handler
  api/letters/                 CRUD for letters — auth-gated, scoped to the signed-in user
  api/cron/send-due/          finds due letters (across all users), emails them, marks sent
components/                   TimelinePicker, WritingTimer, WordCount, LetterCard, TimeDepthMark, Header (session-aware)
lib/
  timeline.ts                 timeline options, prompts per letter type, target date math, sealing helpers
  email.ts                    formats and sends the delivery email
  color.ts                    the time-depth color interpolation
  prisma.ts                   Prisma client singleton
prisma/schema.prisma           Letter model + Auth.js's User/Account/Session/VerificationToken
```

The two tools share a single `Letter` model (`type: "COMMIT" | "CONNECT"`)
and the same scheduling/delivery pipeline — they only differ in which
prompts `lib/timeline.ts` shows and how the email is voiced. That's
deliberate: it's one real feature (a scheduled letter to yourself) wearing
two framings, not two separate systems.

## Design notes

Palette and type were chosen to avoid the generic "AI app" look (cream +
terracotta, or black + neon): a muted paper/ink base with a "dusk" gradient
that runs from near-slate-blue to deep indigo. The signature element is the
small dot next to every letter and timeline option — its color literally
deepens the further out the timeline reaches, so a 12-month letter and a
50-year letter *look* different distances away, not just labeled
differently. The wax-seal-colored button ("Seal & schedule") leans into the
letter metaphor rather than a generic "Submit" — and now that letters
actually seal shut after 24 hours, the button's name is literal, not just
thematic.

## What I'd extend next

1. **Delivery reliability.** The cron endpoint sends and marks-sent in a
   loop with no retry or dead-letter handling — if `sendLetterEmail` throws
   partway through a batch, that letter just stays `scheduled` and gets
   retried tomorrow, which is fine for a daily check but would need real
   retry/backoff and an alert if you moved to finer-grained scheduling.
2. **Confirmation on sensitive actions.** Delete still uses a plain
   `confirm()` — worth a "type the letter's name to delete" pattern once
   someone's 20-year letter is at stake, especially now that it's the one
   remaining way to back out of a sealed letter.
3. **Account recovery / multiple devices.** Magic links are tied to
   whichever inbox you used — there's no way to merge accounts or recover
   if you sign in with a typo'd email. Low priority for a prototype, real
   issue at scale.
4. **PDF export**, alongside the current plain-text export, for people who
   want something that reads more like an actual letter.
5. **Autosave** while writing (currently a save is only written to the
   database on submit) so a closed tab mid-letter doesn't lose the draft.
