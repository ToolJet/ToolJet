// Sign in once per user through the login form; reuse Playwright storageState.
// Env: BASE (frontend URL), DEMO_PASSWORD (demo users' password, never in a file), DEMO_AUTH (default ./auth).
// Saved files hold session cookies: keep them in the scratchpad, delete after recording.
const { chromium } = require('playwright');
const fs = require('fs');
const BASE = process.env.BASE || 'http://localhost:8082';
const AUTH = require('path').resolve(process.env.DEMO_AUTH || 'auth'); // storageState per user; delete when done (session cookies)
require('fs').mkdirSync(AUTH, { recursive: true });
let browser;
async function getBrowser() { return browser ||= await chromium.launch(); }
async function login(email, { force } = {}) {
  const f = `${AUTH}/${email.split('@')[0]}${process.env.AUTH_SUFFIX || ''}.json`;
  if (!force && fs.existsSync(f)) return f;
  if (!process.env.DEMO_PASSWORD) throw new Error('set DEMO_PASSWORD');
  const b = await getBrowser();
  const c = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await c.newPage();
  await p.goto(BASE + '/login');
  await p.waitForSelector('input[type=password]', { timeout: 90000 });
  await p.fill('input[name=email], input[type=email]', email);
  await p.fill('input[type=password]', process.env.DEMO_PASSWORD);
  await p.keyboard.press('Enter');
  await p.waitForURL((u) => !/login/.test(u.toString()), { timeout: 90000 });
  await p.waitForTimeout(2500);
  await c.storageState({ path: f });
  await c.close();
  return f;
}
async function ctxFor(email, opts = {}) {
  const b = await getBrowser();
  const c = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, storageState: await login(email), ...opts });
  await require('./recorder.cjs').Rec.prep(c);
  return c;
}
module.exports = { login, ctxFor, getBrowser, BASE, close: () => browser && browser.close() };
