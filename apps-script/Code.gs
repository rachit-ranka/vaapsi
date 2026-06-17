/**
 * Vaapsi waitlist — Google Apps Script backend.
 *
 * This script turns a Google Sheet into a tiny, free waitlist API.
 * The landing page (main.js) POSTs each signup here and we append a row.
 *
 * ── Setup (see README.md for the full walkthrough) ──────────────────
 *  1. Create a Google Sheet. Note the tab (sheet) name — default "Sheet1".
 *  2. Extensions → Apps Script. Delete the boilerplate, paste this file.
 *  3. Update SHEET_NAME below if your tab isn't "Sheet1".
 *  4. Deploy → New deployment → type "Web app".
 *       - Execute as: Me
 *       - Who has access: Anyone
 *  5. Copy the "/exec" Web app URL into WAITLIST_ENDPOINT in main.js.
 *  6. Re-deploy a NEW VERSION whenever you change this file.
 * ────────────────────────────────────────────────────────────────────
 */

var SHEET_NAME = 'Sheet1';

// Column order written to the sheet. Row 1 is created as a header automatically.
var HEADERS = [
  'timestamp',
  'email',
  'persona',
  'region',
  'size',
  'farmingInterest',
];

/**
 * Handles POST requests from the landing-page form.
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000); // avoid two simultaneous writes clobbering each other

    var body = {};
    if (e && e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    }

    // Honeypot: bots fill the hidden "company" field. Pretend success, write nothing.
    if (body.company && String(body.company).trim() !== '') {
      return json({ ok: true });
    }

    var email = (body.email || '').toString().trim();
    if (!isValidEmail(email)) {
      return json({ ok: false, error: 'Invalid email' });
    }

    var sheet = getSheet_();

    var row = [
      body.timestamp || new Date().toISOString(),
      email,
      arr(body.persona),
      (body.region || '').toString().trim(),
      (body.size || '').toString().trim(),
      arr(body.farmingInterest),
    ];

    sheet.appendRow(row);
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: err.message });
  } finally {
    lock.releaseLock();
  }
}

/**
 * A GET on the web app URL returns a tiny health-check, so you can confirm
 * the deployment is live by just opening the URL in a browser.
 */
function doGet() {
  return json({ ok: true, service: 'vaapsi-waitlist' });
}

/* ---------- helpers ---------- */

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
  }
  return sheet;
}

function arr(v) {
  if (Array.isArray(v)) return v.join(', ');
  return (v == null) ? '' : String(v);
}

function isValidEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
