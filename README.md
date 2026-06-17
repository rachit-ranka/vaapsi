# Vaapsi — landing page

Marketing landing page + waitlist for **Vaapsi**, a managed farmland service in
**Indore & Bhopal**. It serves two audiences: people with ancestral/family land
they can't manage themselves, and people who want to invest in farmland without
farming experience.

This is a static site (plain HTML/CSS/JS — no build step, no framework). Waitlist
signups are stored in a **Google Sheet** via a **Google Apps Script** web app.

## Project structure

```
.
├── index.html          # The landing page (markup only)
├── styles.css          # All styles (extracted from the original single file)
├── main.js             # Interactions + waitlist form submission
├── apps-script/
│   └── Code.gs          # Google Apps Script backend — paste into Apps Script editor
├── vercel.json          # Static hosting config + security headers
├── CLAUDE.md            # Context for future AI sessions
└── README.md            # This file
```

## How the waitlist works

```
Browser form (main.js)
   │  POST JSON, Content-Type: text/plain  ── avoids a CORS preflight that
   ▼                                          Apps Script can't answer
Google Apps Script web app (Code.gs)
   │  appendRow(...)
   ▼
Google Sheet  ← you read signups here
```

The Apps Script URL lives in the client JS (`WAITLIST_ENDPOINT` in `main.js`).
That's expected and fine for a waitlist: the endpoint only *appends* rows and never
reads data back. Spam is mitigated with a hidden honeypot field (checked both in the
browser and in `Code.gs`) and email validation on both ends.

---

## Setup

### 1. Set up the Google Sheet backend

1. Create a new Google Sheet (sheets.new). The default tab is named `Sheet1`
   — if you rename it, update `SHEET_NAME` at the top of `apps-script/Code.gs`.
2. In the sheet: **Extensions → Apps Script**.
3. Delete the boilerplate `myFunction` code, then paste the entire contents of
   [`apps-script/Code.gs`](apps-script/Code.gs).
4. Click **Deploy → New deployment**.
   - Click the gear ⚙ next to "Select type" → **Web app**.
   - **Execute as:** `Me`
   - **Who has access:** `Anyone`  *(required so the public form can POST)*
   - Click **Deploy**, then **Authorize access** and approve the permissions
     prompt (it's your own script writing to your own sheet).
5. Copy the **Web app URL** — it ends in `/exec`.
6. Sanity check: open that URL in a browser. You should see
   `{"ok":true,"service":"vaapsi-waitlist"}`.

> ⚠️ Whenever you edit `Code.gs`, you must **Deploy → Manage deployments →
> edit → New version** for changes to take effect. (Or create a new deployment.)

### 2. Wire the form to your endpoint

Open `main.js` and replace the placeholder:

```js
const WAITLIST_ENDPOINT = "PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE";
```

with the `/exec` URL you copied. Commit the change.

### 3. Test locally

No build step needed. Serve the folder with any static server, e.g.:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Submit the form, then check your Google Sheet — a new row should appear.

---

## Deploying to Vercel (free)

You can deploy either by connecting the Git repo (recommended — auto-deploys on
every push) or with the CLI.

### Option A — Git integration (recommended)

1. Push this repo to GitHub (already set up if you're reading this from the repo).
2. Go to <https://vercel.com> and sign up / log in (free "Hobby" plan).
3. **Add New… → Project → Import** your `vaapsi` repository.
4. Framework preset: **Other**. Leave Build Command empty and Output Directory
   empty/`.` — Vercel serves the static files as-is.
5. Click **Deploy**. You'll get a `*.vercel.app` URL in ~30 seconds.
6. Every push to your branch now auto-deploys.

### Option B — Vercel CLI

```bash
npm i -g vercel
vercel          # first run: links/creates the project, deploys a preview
vercel --prod   # promote to your production URL
```

### Custom domain

In the Vercel project: **Settings → Domains → Add**, enter your domain
(e.g. `vaapsi.in`), and follow the DNS instructions. HTTPS is automatic and free.

> Prefer Netlify instead? This static site works there too: drag-and-drop the
> folder at <https://app.netlify.com/drop>, or connect the repo with build
> command empty and publish directory `.`. Only the host config differs — the
> Google Sheets backend is identical.

---

## Notes & limits

- **Apps Script quotas** are generous for a waitlist (thousands of calls/day on a
  free Google account) — far beyond early-stage volume.
- **No PII beyond what's submitted** is stored. The sheet is private to your
  Google account; share it deliberately.
- If you later outgrow Sheets, the swap is small: keep `main.js`'s POST shape and
  point `WAITLIST_ENDPOINT` at an Airtable/Supabase-backed function instead.
