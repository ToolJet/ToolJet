// Sign in once per user through the public login form and reuse Playwright storageState.
// Env: BASE (frontend URL), DEMO_PASSWORD (demo users' password), REC_AUTH (default ./auth).
// The saved files hold session cookies: keep them in the scratchpad, delete after recording.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { Rec } = require('./rec.cjs');
const BASE = process.env.BASE || 'http://localhost:8082';
const AUTH = path.resolve(process.env.REC_AUTH || 'auth');
const VIEW = { width: 1440, height: 900 };
let browser;
const getBrowser = async () => (browser ||= await chromium.launch());

async function login(email, { force } = {}) {
  const f = path.join(AUTH, `${email.split('@')[0]}.json`);
  if (!force && fs.existsSync(f)) return f;
  if (!process.env.DEMO_PASSWORD) throw new Error('set DEMO_PASSWORD');
  fs.mkdirSync(AUTH, { recursive: true });
  const c = await (await getBrowser()).newContext({ viewport: VIEW });
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

// Signed-in context at 1440x900 @2x with the recorder overlay injected.
async function ctxFor(email, opts = {}) {
  const c = await (await getBrowser()).newContext({ viewport: VIEW, deviceScaleFactor: 2, storageState: await login(email), ...opts });
  await Rec.prep(c);
  return c;
}
module.exports = { login, ctxFor, getBrowser, BASE, close: () => browser && browser.close() };
