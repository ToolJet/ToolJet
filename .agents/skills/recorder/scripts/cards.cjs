// V0 opening (logo intro + problem statement) and closing (summary + outro), narrated.
const { chromium } = require('playwright');
const { Rec, sleep } = require('./recorder.cjs');
const SLIDE = (h, p) => `<!doctype html><html><head><style>html,body{margin:0;height:100%;background:radial-gradient(1200px 700px at 50% 40%,#16223f 0%,#0b1222 70%);overflow:hidden}
.w{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:'IBM Plex Sans',Inter,-apple-system,sans-serif;color:#fff;text-align:center}
h1{font-size:44px;font-weight:600;margin:0 0 18px;max-width:1000px;line-height:1.2}p{font-size:24px;color:#aeb8d6;margin:0;max-width:900px;line-height:1.45}</style></head>
<body><div class="w"><h1>${h}</h1><p>${p}</p></div></body></html>`;
async function piece(name, fn) {
  const b = await chromium.launch(); const c = await b.newContext({ viewport: { width: 1440, height: 900 } });
  await Rec.prep(c);
  const r = new Rec(name); await fn(r, c); console.log(JSON.stringify(await r.stop())); await b.close();
}
async function slide(r, c, h, p, narr) {
  const pg = await c.newPage(); await pg.setContent(SLIDE(h, p)); await sleep(200);
  r.pause(); await r.attach(pg, { cursor: false }); await r.resume();
  await r.line(narr);
}
// usage: node cards.cjs cards.json
// cards.json: { "open": { "name": "V0-open", "title": "...", "subtitle": "...", "slides": [["Headline", "sub line", "narration"]] },
//               "close": { "name": "V0-close", "slides": [[...]] } }
module.exports = { piece, slide };
if (require.main === module) (async () => {
  const C = JSON.parse(require('fs').readFileSync(process.argv[2], 'utf8'));
  await piece(C.open.name, async (r, c) => {
    await r.intro(c, C.open.title, C.open.subtitle, 2800);
    r.chapter('The problem');
    for (const [h, p, n] of C.open.slides) await slide(r, c, h, p, n);
  });
  await piece(C.close.name, async (r, c) => {
    r.chapter('Summary');
    for (const [h, p, n] of C.close.slides) await slide(r, c, h, p, n);
    await r.outro(c);
  });
})().catch((e) => { console.error(e); process.exit(1); });
