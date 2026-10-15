# Resource reservation system

People book shared rooms and equipment. A confirmed booking blocks that resource until it ends, so two people cannot be given the same thing at the same time.

I built this with Next.js (App Router), TypeScript, PostgreSQL, Prisma, and Zod. Tailwind handles the layout. PostgreSQL runs in Docker for local development.

## What you can do

- See today's confirmed bookings and which resources are in use right now.
- Add, rename, and deactivate resources. A deactivated resource stays in the list, and it cannot be booked.
- Book a resource. The form checks the title, the times, and a minimum length of 30 minutes.
- Search and filter reservations, and cancel a booking.
- Open a week calendar for one resource. Days go across and hours go down.
- See confirmed hours per resource and per person on the usage page.

There is no login. The header has a current-user menu. New bookings are saved as the person selected there.

## Run it locally

You need Node.js 20, Docker, and npm.

1. Start PostgreSQL:

```bash
docker compose up -d
```

2. Copy the environment file:

```bash
cp .env.example .env
```

On Windows PowerShell, use `Copy-Item .env.example .env`.

3. Install dependencies, create the tables, and load sample data:

```bash
npm install
npm run db:deploy
npm run db:seed
```

4. Start the app:

```bash
npm run dev
```

Open http://localhost:3000.

The database is published on port **5433**, because 5432 is often already used by a local PostgreSQL install. The connection string in `.env.example` matches that port. Bookings are stored in a Docker volume, so they remain after `docker compose down`. Start the database again with `docker compose up -d`.

Re-running `npm run db:seed` refreshes a few sample bookings so the dashboard has something on the current day. The sample people are Damon Salvatore and Jeremy Gilbert.

## Data

Three tables:

| Table | What it stores |
| --- | --- |
| `users` | A person who can make a booking |
| `resources` | A room or piece of equipment, and whether it is active |
| `reservations` | A booking: who, which resource, title, start, end, and status |

A reservation belongs to one user and one resource. Status is `pending`, `confirmed`, or `cancelled`. The booking form always saves `confirmed`.

Times are `timestamptz` values in UTC. A booking covers `[start, end)`, so a later booking may start at the exact moment the previous one ends.

Overlaps are rejected in the database, not only in the form. The migration enables `btree_gist` and adds an exclusion constraint, `reservations_no_confirmed_overlap`. It applies to confirmed rows for the same resource. A check constraint, `reservations_end_after_start`, rejects an end time that is not after the start. When the exclusion constraint fails, the form looks up the conflicting booking and names it.

## Design decisions

I left out accounts, roles, approvals, email, and payments. The problem to solve is double-booking, and those features do not change that rule.

I store the selected person in an httpOnly cookie named `currentUserId`. If the cookie is missing, the first person is used.

Cancelled bookings stay in the list so there is a record. They no longer block the time, because the exclusion constraint only covers confirmed rows.

The calendar shows confirmed bookings only. The week starts on Monday, in UTC.

Validation lives in Zod before the insert: the start must be in the future, the booking must last at least 30 minutes, and the end must be after the start. Zod cannot see a booking saved by someone else at the same moment. That is why the database constraint is the real guard.

The page is grey, with white cards and royal blue actions. Confirmed bookings are green, cancelled bookings are red, and inactive resources are grey. Lists use tables. Resources use cards.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the app |
| `npm run build` | Generate the Prisma client and build |
| `npm run db:deploy` | Apply migrations |
| `npm run db:seed` | Load sample users, resources, and bookings |
