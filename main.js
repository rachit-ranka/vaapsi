/* ============================================================
   Vaapsi — landing page interactions + waitlist submission
   ============================================================ */

/* -----------------------------------------------------------
   CONFIG — paste your Google Apps Script Web App URL here.
   See README.md → "Setting up the Google Sheet backend".
   It looks like: https://script.google.com/macros/s/XXXX.../exec
   ----------------------------------------------------------- */
const WAITLIST_ENDPOINT = "https://script.google.com/macros/s/AKfycbzuF1SqGpsDk6VYVYTkINyU-gYo390wRpq1obudTmqTKVsSWHtksDvuEtTrr9B-xBKd5Q/exec";

/* --- Sticky nav background on scroll --- */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => { nav.classList.toggle('scrolled', window.scrollY > 40); });

/* --- Reveal-on-scroll for sections --- */
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => { if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

/* --- Pill selection (single-select persona, multi-select farming) --- */
document.querySelectorAll('.pill-group').forEach(group => {
  const multi = group.dataset.group === 'farming';
  group.querySelectorAll('.pill').forEach(pill => {
    pill.addEventListener('click', () => {
      if (multi) { pill.classList.toggle('selected'); }
      else { group.querySelectorAll('.pill').forEach(p => p.classList.remove('selected')); pill.classList.add('selected'); }
    });
  });
});
function getSelected(groupName){
  const group = document.querySelector('.pill-group[data-group="'+groupName+'"]');
  return Array.from(group.querySelectorAll('.pill.selected')).map(p => p.dataset.value);
}

/* --- Waitlist form submission --- */
const form = document.getElementById('waitlistForm');
const submitBtn = document.getElementById('submitBtn');
const emailInput = document.getElementById('email');
const emailError = document.getElementById('emailError');
function isValidEmail(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = emailInput.value.trim();
  if (!isValidEmail(email)) { emailError.style.display='block'; emailInput.style.borderColor='#B5651D'; return; }
  emailError.style.display='none'; emailInput.style.borderColor='';

  // Honeypot: if a bot filled the hidden "company" field, silently fake success.
  const honeypot = (document.getElementById('company') || {}).value || '';
  if (honeypot.trim() !== '') {
    document.getElementById('formView').style.display='none';
    document.getElementById('successView').style.display='block';
    return;
  }

  submitBtn.disabled = true; submitBtn.textContent = 'Joining...';

  const entry = {
    email,
    persona: getSelected('persona'),
    region: document.getElementById('region').value.trim(),
    size: document.getElementById('size').value.trim(),
    farmingInterest: getSelected('farming'),
    timestamp: new Date().toISOString(),
    company: honeypot // forwarded so the server can double-check the honeypot
  };

  try {
    if (!WAITLIST_ENDPOINT || WAITLIST_ENDPOINT.startsWith('PASTE_')) {
      throw new Error('WAITLIST_ENDPOINT is not configured. See README.md.');
    }

    // NOTE: we send Content-Type "text/plain" on purpose. This keeps the request
    // a CORS "simple request" so the browser does NOT fire a preflight OPTIONS
    // call — which Google Apps Script web apps do not handle. The Apps Script
    // doPost() reads the raw body via e.postData.contents and JSON.parse()s it.
    const res = await fetch(WAITLIST_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(entry),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.ok === false) {
      throw new Error(data.error || ('Request failed with status ' + res.status));
    }

    document.getElementById('formView').style.display='none';
    document.getElementById('successView').style.display='block';
  } catch (err) {
    console.error('Failed to save waitlist entry:', err);
    submitBtn.disabled = false; submitBtn.textContent = 'Join the waitlist';
    alert('Something went wrong saving your entry. Please try again in a moment.');
  }
});
