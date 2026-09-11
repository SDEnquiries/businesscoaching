# Business Coaching Accelerator — coaching portal

A secure web app for coaches to track client progress and business goals.
Coaches and clients each get their own account; a coach only ever sees
their own clients' data (enforced at the database level, not just in the UI).

## What's included

- Email/password signup and login for two roles: **coach** and **client**
- Coaches can invite clients by email (shareable link) or clients can self-register and pick a coach from a list
- Client profile with photo upload, name, and bio
- Business plan: five free-text sections (current state, vision, focus areas, action steps, obstacles & support) filled in by the coachee and viewable by their coach, each with its own space for the coach to leave feedback and suggestions
- Client progress log: free-text journal entries plus structured fields (mood, energy) and an optional photo per entry
- Monthly targets: a rolling plan of up to 12 calendar months (extendable indefinitely) with a goal, an optional focus area/pillar tag, optional target/actual values, a status, and a coach feedback field — either the coach or the client can set or update a month's target
- Row Level Security in the database means coach A can never read coach B's clients, even via a bug in the app code

## 1. Create your Supabase project (free)

1. Go to [supabase.com](https://supabase.com) and create a free account and a new project.
2. Wait for it to finish provisioning (~2 minutes).
3. In the left sidebar, go to **SQL Editor** → **New query**.
4. Open `supabase/schema.sql` from this project, paste the entire contents in, and click **Run**.
   This creates all the tables, security policies, and file storage buckets.
5. Go to **Project Settings → API**. You'll need two values from this page in step 3 below:
   - **Project URL**
   - **anon public** key

## 2. Configure email

By default Supabase requires email confirmation before login. For a smoother client
experience, go to **Authentication → Providers → Email** and turn off "Confirm email"
if you'd rather clients can log in immediately after signup (you can turn it back on
later once you've set up a custom sender domain).

## 3. Run it locally

```bash
npm install
cp .env.local.example .env.local
# edit .env.local and paste in your Project URL and anon key from step 1
npm run dev
```

Visit `http://localhost:3000`. Sign up as a coach first, then either invite a client
by email or sign up a second account as a client and pick your coach from the list.

## 4. Deploy for real

1. Push this folder to a new GitHub repository.
2. Go to [vercel.com](https://vercel.com), sign up free, and click **Add New → Project**, then import your GitHub repo.
3. In the "Environment Variables" step, add the same two values from your `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Click **Deploy**. You'll get a live `*.vercel.app` URL in about a minute.
5. Optional: in Vercel's project settings, add your own custom domain.

Every time you push to GitHub, Vercel redeploys automatically.

## How the security works

- Passwords are never stored or handled by this app's code — Supabase Auth hashes
  and manages them entirely.
- Every database table has Row Level Security turned on: Postgres itself checks,
  on every single query, that the logged-in user is only touching rows they're
  allowed to. A coach's queries are physically incapable of returning another
  coach's client data.
- Uploaded files (avatars, progress photos) are stored in
  separate private buckets with the same per-user access rules, except avatars
  which are public (so they can be shown as profile pictures).

## Extending this

Some natural next additions, roughly in order of effort:
- Password reset emails (Supabase Auth supports this out of the box — just needs a "forgot password" page)
- Coach-side reminders/notifications when a coachee updates their business plan
- A version history for the business plan, instead of each section being a single overwritable field
- Turning "focus area" into a fixed, coach-managed list of pillars per business, rather than free text typed per target
