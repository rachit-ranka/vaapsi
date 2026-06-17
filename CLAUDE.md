# CLAUDE.md

Context for AI assistants working in this repo.

## What this is

Marketing **landing page + waitlist** for **Vaapsi**, a managed farmland service
operating in **Indore & Bhopal, Madhya Pradesh, India**.

"Vaapsi" means *return*. The pitch: bring idle/ancestral land back to life, or
build a working farm for first-time investors — without the owner needing to be
on-site.

### Two target customers
1. **Ancestral land owners** — inherited family/village land they can't manage
   from the city.
2. **First-time farmland investors** — have capital, no land/time/farming
   experience.

### Farming approaches offered (referenced in copy)
Hydroponics · Orchards · Polyhouse · Controlled farming · Permaculture · Organic.

## Stack

- **Static site**, no framework, no build step: `index.html` + `styles.css` + `main.js`.
- **Fonts:** Google Fonts (Fraunces + Karla).
- **Backend for signups:** Google Sheet via a Google Apps Script web app
  (`apps-script/Code.gs`).
- **Hosting:** Vercel (static; `vercel.json` adds clean URLs + security headers).

## How the waitlist works

`main.js` POSTs the form as JSON to `WAITLIST_ENDPOINT` (the Apps Script `/exec`
URL). It uses `Content-Type: text/plain` **on purpose** — this keeps it a CORS
"simple request" so the browser skips the preflight OPTIONS call, which Apps
Script web apps cannot answer. `Code.gs` `doPost()` parses the raw body and
`appendRow()`s to the sheet.

Spam protection: a hidden honeypot field (`#company`), checked in both `main.js`
and `Code.gs`, plus email regex validation on both ends.

## Important conventions / gotchas

- **Keep the original design, copy, and hero animation intact** unless explicitly
  asked to change them. The CSS/JS were extracted verbatim from a single-file
  original; only the form-submission logic was rewritten.
- `WAITLIST_ENDPOINT` in `main.js` must be set to the deployed Apps Script URL.
  A placeholder (`PASTE_...`) means the form is not yet wired up.
- After editing `Code.gs`, you must **re-deploy a new version** in Apps Script
  for changes to take effect (see README).
- The Apps Script URL in client code is intentional and safe here (append-only
  endpoint). Don't treat it as a leaked secret.
- No secrets in the repo; no `.env` is required for the static site.

## Common tasks

- **Local preview:** `python3 -m http.server 8000` then open `localhost:8000`.
- **Change form fields:** update the markup in `index.html`, the `entry` object
  in `main.js`, and `HEADERS` + the `row` array in `apps-script/Code.gs` together.
- **Deploy:** push to the repo (Vercel auto-deploys) or `vercel --prod`.

See `README.md` for the full backend setup and deployment walkthrough.
