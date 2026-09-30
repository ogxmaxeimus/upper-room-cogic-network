# Coordinator Quick Start

Short runbook for managing the Upper Room COGIC Professional Network.

## Before you begin

- **Production URL:** deploy on Netlify and bookmark the live address (not `localhost`).
- **Admin password:** set both `VITE_ADMIN_PASSWORD` (build-time UI) and `ADMIN_PASSWORD` (server function) in Netlify env vars. Use the same value.
- **Coordinator email:** set `VITE_COORDINATOR_EMAIL` (default: `network@upperroomgospel.org`).
- **Email notifications:** set `VITE_FORMSPREE_ENDPOINT` to a [Formspree](https://formspree.io) form URL so join applications and introduction requests email the coordinator. Without it, the site opens a mailto draft as a fallback.
- **Shared data:** production uses **Netlify Functions + Blobs** so Admin on any device sees the same members, applications, and contact requests. Local `npm run dev` falls back to browser storage unless you run `netlify dev`.

## Environment variables

| Variable | Where | Purpose |
|----------|-------|---------|
| `VITE_ADMIN_PASSWORD` | Netlify / `.env` | Admin login + client admin API header |
| `ADMIN_PASSWORD` | Netlify (functions) | Server-side gate for admin reads/writes |
| `VITE_COORDINATOR_EMAIL` | Netlify / `.env` | Shown in UI + notification templates |
| `VITE_FORMSPREE_ENDPOINT` | Netlify / `.env` | Email notify on join + contact |
| `VITE_API_BASE` | Optional | Override API path (default `/.netlify/functions/network`) |

Copy `.env.example` → `.env` for local builds.

## Deploy (Netlify)

1. Connect the GitHub repo (or drag-drop `dist` after `npm run build`)
2. Build command: `npm run build` · Publish: `dist` · Functions: `netlify/functions`
3. Set env vars above, then trigger a redeploy
4. Confirm `/.netlify/functions/network?action=health` returns `{ "ok": true }`
5. Sign in at `/admin/login` and confirm dashboard counts

## Sign in

1. Go to `/admin/login`
2. Enter the coordinator password
3. You will land on the dashboard with pending application and contact counts
4. Dashboard shows **Shared (Netlify)** or **This browser only** so you know which storage mode is active
5. To change the password later: Dashboard → **Change password** (requires current password; shared mode syncs via Netlify Blobs)

## Review join applications

1. Open **Applications** in the admin sidebar
2. Click an applicant name to view full details
3. Choose one of:
   - **Approve & publish** — creates a live public profile immediately
   - **Approve with edits…** — review and adjust fields before publishing
   - **Reject** — optionally add a reason (shown on the applicant status page)

### Notify the applicant

After approve or reject, click **Send notification email** to open a pre-filled message to the applicant.

Share the applicant status link if needed:
`/join/status/{application-id}`

## Manage published members

1. Open **Members** in the admin sidebar
2. **Add member** for manual entry (no application required)
3. **Edit** to update photo, skills, featured status, or archive a listing
4. Toggle **Featured** to show a member on the home page

**Current seed roster (lean):** Bishop Patrick L. Wooden Sr., Clarence “Rocky” Raeford, Brandon J. Fonville & Rufus Pritchett Jr., Damian Little. Additional real members will be added after leadership walkthrough — do not invent congregation profiles.

## Contact / introduction requests

Introduction requests are stored in shared backend (when deployed) and the coordinator is emailed via Formspree when configured. Check the dashboard count and follow up.

## LocalStorage / stale demo data

Seed data is versioned (`SEED_VERSION` in `src/data/network.js`). After deploy, if an old browser still shows fake demo professionals:

1. Open Admin → Dashboard → **Reset local cache**, or
2. DevTools → Application → Local Storage → clear `ur-network-*` keys, then refresh

Custom/approved members (non-seed) are preserved across seed version bumps when possible.

## Supabase (shared Postgres backend)

1. Create/open a Supabase project and run `supabase/schema.sql` in the SQL editor.
2. Copy **Project URL**, **anon** key, and **service_role** key from Project Settings → API into `.env` (see `.env.example`).
3. Local shared mode: `npx netlify dev` (loads Vite + the network function with the service role).
4. Public directory reads and join/contact inserts can also use the anon key directly; admin writes stay on the Netlify function so the service role never ships to the browser.

Without `SUPABASE_SERVICE_ROLE_KEY` / `netlify dev`, the app still loads published members from Supabase but falls back to localStorage for admin seeding and approvals.

## Common issues

| Problem | Likely cause | Fix |
|---------|--------------|-----|
| Application not in admin | Local-only mode / different device | Deploy Netlify functions + set `ADMIN_PASSWORD`; confirm health endpoint |
| Empty or old fake directory | Stale localStorage seed | Reset local cache / bump already applied in v4 seed |
| No coordinator email | Missing Formspree | Set `VITE_FORMSPREE_ENDPOINT` and rebuild |
| Admin login fails | Wrong password env var | Verify `VITE_ADMIN_PASSWORD` on host and rebuild |

## Ministry contacts

- **Church website:** [upperroomgospel.org](https://upperroomgospel.org)
- **Directory questions:** network@upperroomgospel.org (or your configured `VITE_COORDINATOR_EMAIL`)

## Related docs

- `docs/coordinator-responsibilities.md` — full role description
- `docs/one-page-summary.md` — leadership overview
- `/privacy` — public privacy policy
