// One case video. Copy next to recorder.cjs/auth.cjs in the scratch workspace and edit.
// DRY=1 node journey.cjs  → no capture; out/dry-<name>-NN.png per narration line (then montage.sh).
// node journey.cjs        → out/<name>.mp4 + .srt + .chapters.txt
const { ctxFor, BASE, close } = require('./auth.cjs');
const { Rec, sleep } = require('./recorder.cjs');
const reset = () => {}; // restore the demo state (SQL snapshot restore); call at start, after each state change, and on error

// Narration = subtitles, word for word. Long lines split into ≤2 cues at a pause automatically.
const L = {
  intro: 'Admins see every user and their role in one table.',
  sort: 'Sort by name to find someone quickly.',
};

(async () => {
  reset();
  const r = new Rec('V1-example');
  await r.prewarm(Object.values(L).flatMap((x) => Rec.split(x)));       // generate TTS before any capture
  const c = await ctxFor('admin@example.com'); const p = await c.newPage();
  await p.goto(BASE + '/<deep-link-to-the-screen>'); await p.getByRole('table').first().waitFor();
  // pre-load every other page you will show (other users, other tabs) here, before recording starts

  await r.intro(c, 'Admins see every user', 'Feature · Users table');
  await r.attach(p); await r.resume();
  r.chapter('C01 Users table');
  await r.line(L.intro, async () => { await r.zoom(p.locator('section').first(), 1.4); await r.mark(p.locator('section').first()); });
  await r.line(L.sort, async () => { await r.click(p.getByRole('button', { name: 'Sort' })); await r.click(p.getByRole('menuitemradio', { name: 'Name' })); });
  await r.cut(async () => { /* waits, reloads, SQL state changes: hidden behind a crossfade */ });

  await r.outro(c);
  console.log(JSON.stringify(await r.stop()));
  reset(); await close();
})().catch((e) => { console.error(e); try { reset(); } catch {} process.exit(1); });
