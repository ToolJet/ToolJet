// Recorder: CDP screencast segments joined with crossfades, Kokoro voiceover per line,
// argo human cursor, burned subtitle pill + soft SRT, chapters, branded intro/outro.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const FF = 'ffmpeg', FP = 'ffprobe'; // from PATH
const OUT = path.resolve(process.env.DEMO_OUT || 'out');
fs.mkdirSync(OUT, { recursive: true });
const W = 1440, H = 900, F = 0.6; // crossfade seconds
const FONT = `'IBM Plex Sans', Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
// Wordmark that reads on navy: TJ_LOGO=<repo>/frontend/assets/images/logo-dark.svg (scripts run from a scratch copy).
if (!process.env.TJ_LOGO) throw new Error('set TJ_LOGO to <repo>/frontend/assets/images/logo-dark.svg');
const LOGO = fs.readFileSync(process.env.TJ_LOGO, 'utf8');
const NAVY = '#0b1222';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let argo; const A = async () => (argo ||= await import('@argo-video/cli'));
let tts; const T = async () => (tts ||= await import(path.join(__dirname, 'tts.mjs')));

const INIT = `(() => {
  const css = \`
#__demo_sub{position:fixed;left:50%;bottom:28px;transform:translateX(-50%);z-index:2147483645;pointer-events:none;
 background:rgba(12,16,26,.78);color:#fff;font:600 23px/1.35 ${FONT};padding:9px 22px;border-radius:999px;
 max-width:1100px;text-align:center;box-shadow:0 6px 24px rgba(0,0,0,.22);letter-spacing:.1px;backdrop-filter:blur(4px)}
#__demo_sub:empty{display:none}
#__demo_l3{position:fixed;left:28px;top:24px;z-index:2147483645;pointer-events:none;background:rgba(12,16,26,.78);color:#fff;
 font:600 15px/1.2 ${FONT};padding:7px 14px;border-radius:8px;letter-spacing:.3px}
#__demo_l3:empty{display:none}
html::-webkit-scrollbar,body::-webkit-scrollbar,*::-webkit-scrollbar{width:0!important;height:0!important;display:none!important}
*{scrollbar-width:none!important}
html{scroll-behavior:smooth}\`;
  const ensure = () => {
    const root = document.documentElement; if (!root) return;
    if (!document.getElementById('__demo_style')) { const st = document.createElement('style'); st.id = '__demo_style'; st.textContent = css; root.appendChild(st); }
    for (const [id, key] of [['__demo_sub', '__demo_sub'], ['__demo_l3', '__demo_l3']]) {
      let s = document.getElementById(id);
      if (!s) { s = document.createElement('div'); s.id = id; root.appendChild(s); }
      const t = sessionStorage.getItem(key) || '';
      if (s.textContent !== t) s.textContent = t;
    }
    // argo cursor nodes live outside <body> so a zoomed body never displaces them
    if (document.body) for (const n of [...document.body.children]) if (/argo/.test(n.id || '') || /argo/.test(String(n.className || ''))) root.appendChild(n);
  };
  window.__demoEnsure = ensure;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ensure); else ensure();
  new MutationObserver(ensure).observe(document, { childList: true, subtree: false });
  setInterval(ensure, 150);
})();`;

const srtTime = (s) => {
  const ms = Math.max(0, Math.round(s * 1000));
  const p = (n, w = 2) => String(n).padStart(w, '0');
  return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`;
};

class Rec {
  constructor(name, { seed } = {}) {
    this.name = name; this.seed = seed || name;
    this.dir = path.join(OUT, name + '.frames');
    fs.rmSync(this.dir, { recursive: true, force: true }); fs.mkdirSync(this.dir, { recursive: true });
    this.n = 0; this.acc = 0; this.segStart = 0; this.speed = 1; this.rec = false;
    this.segs = []; this.latest = null; this.lastCut = -99;
    this.cues = []; this.audio = []; this.chapters = []; this.cursors = new Map();
  }
  static async prep(context) { await context.addInitScript(INIT); }
  now() { return this.rec ? this.acc + (Date.now() - this.segStart) / 1000 / this.speed : this.acc; }
  async prewarm(lines) { const { say } = await T(); for (const l of lines) if (l) await say(l); }

  async attach(page, { cursor = true } = {}) {
    if (this.cdp) { await this.cdp.send('Page.stopScreencast').catch(() => {}); this.cdp.removeAllListeners(); await this.cdp.detach().catch(() => {}); }
    this.page = page;
    await page.bringToFront();
    await page.evaluate(INIT).catch(() => {});
    if (cursor && !this.cursors.has(page)) {
      const { createHumanCursor, cursorHighlight } = await A();
      await cursorHighlight(page, { mode: 'click' });
      this.cursors.set(page, await createHumanCursor(page, { seed: this.seed, size: 30 }));
    }
    if (process.env.DRY) return;
    this.cdp = await page.context().newCDPSession(page);
    this.cdp.on('Page.screencastFrame', ({ data, sessionId }) => {
      this.cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
      const file = path.join(this.dir, `f${String(++this.n).padStart(6, '0')}.jpg`);
      fs.writeFileSync(file, Buffer.from(data, 'base64'));
      this.latest = file;
      if (this.rec) this.segs[this.segs.length - 1].frames.push({ file, t: this.now() });
    });
    await this.cdp.send('Page.startScreencast', { format: 'jpeg', quality: 90, maxWidth: W, maxHeight: H, everyNthFrame: 1 });
    await this.poke();
  }
  get cursor() { return this.cursors.get(this.page); }
  async poke() {
    await this.page.evaluate(() => { document.documentElement.dataset.pk = String(Date.now()); window.__demoEnsure && window.__demoEnsure(); }).catch(() => {});
    await sleep(150);
  }
  async resume() {
    await this.poke();
    this.speed = 1; this.segStart = Date.now(); this.rec = true;
    this.segs.push({ start: this.acc, frames: this.latest ? [{ file: this.latest, t: this.acc }] : [] });
    this.lastCut = this.acc;
  }
  pause() { if (!this.rec) return; this.acc = this.now(); this.rec = false; this.segs[this.segs.length - 1].end = this.acc; }
  async cut(fn) { const was = this.rec; this.pause(); const r = await fn(); await sleep(200); if (was) await this.resume(); return r; }
  setSpeed(s) { if (this.rec) { this.acc = this.now(); this.segStart = Date.now(); } this.speed = s; }
  async fast(fn, s = 2) { this.setSpeed(s); try { return await fn(); } finally { this.setSpeed(1); } }
  async hold(ms) { await sleep(ms); }
  chapter(title) { this.chapters.push({ title, t: this.now() }); }

  async setSub(text) { await this.page.evaluate((x) => { sessionStorage.setItem('__demo_sub', x || ''); window.__demoEnsure && window.__demoEnsure(); }, text || '').catch(() => {}); }
  async lowerThird(text) { await this.page.evaluate((x) => { sessionStorage.setItem('__demo_l3', x || ''); window.__demoEnsure && window.__demoEnsure(); }, text || '').catch(() => {}); }

  // One narrated beat: subtitle + voice start together (after any crossfade), fn runs while it plays,
  // then hold until the clip has finished (+ tail).
  // Split a narration line into ≤2 cues at a natural pause (sentence end, then colon/semicolon, then comma).
  static split(text) {
    if (text.split(/\s+/).length <= 11) return [text];
    const mid = text.length / 2;
    for (const re of [/[.!?]\s/g, /[:;]\s/g, /,\s/g]) {
      let best = null;
      for (const m of text.matchAll(re)) { const i = m.index + 1; if (i > 8 && text.length - i > 8 && (best === null || Math.abs(i - mid) < Math.abs(best - mid))) best = i; }
      if (best !== null) return [text.slice(0, best).trim(), text.slice(best).trim()];
    }
    return [text];
  }
  // One narrated beat. Subtitle cues = the exact spoken text, each timed to its own TTS clip.
  // fn runs while the voice plays; any zoom/spotlight/circle lingers 1.6s past the voice, then eases out.
  async line(narr, fn, { tail = 0.35, min = 0 } = {}) {
    const wait = this.lastCut + F + 0.05 - this.now();
    if (wait > 0) await sleep(wait * 1000);
    const { say } = await T();
    const parts = Rec.split(narr);
    const clips = [];
    for (const t of parts) clips.push({ text: t, ...(await say(t)) });
    const GAP = 0.12;
    const start = this.now();
    let off = 0;
    const timers = [];
    for (const c of clips) {
      const t0 = start + off;
      this.audio.push({ file: c.file, t: t0 });
      this.cues.push({ text: c.text, start: t0, end: t0 + c.dur });
      timers.push(setTimeout(() => this.setSub(c.text), Math.max(0, (t0 - start) * 1000)));
      off += c.dur + GAP;
    }
    const spoken = off - GAP;
    timers.push(setTimeout(() => this.setSub(''), (spoken + 0.15) * 1000));
    this.emph = false;
    if (fn) await fn();
    const need = start + Math.max(spoken + tail, min) - this.now();
    if (need > 0) await sleep(need * 1000);
    if (process.env.DRY) { this.dn = (this.dn || 0) + 1; await this.page.screenshot({ path: `${OUT}/dry-${this.name}-${String(this.dn).padStart(2, '0')}.png` }).catch(() => {}); }
    if (this.emph) { await sleep(1500); await this.unmark(); if (this.zoomed) await this.unzoom(); this.emph = false; }
    for (const t of timers) clearTimeout(t);
    await this.setSub('');
  }

  async card(context, { title, subtitle, ms = 2300, outro = false }) {
    this.pause();
    const p = await context.newPage();
    await p.setViewportSize({ width: W, height: H });
    const html = `<!doctype html><html><head><style>
      html,body{margin:0;height:100%;background:radial-gradient(1200px 700px at 50% 40%, #16223f 0%, ${NAVY} 70%);overflow:hidden}
      .wrap{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:${FONT};color:#fff}
      .logo svg{height:${outro ? 56 : 64}px;width:auto;display:block}
      .logo{opacity:0;transform:scale(.94);animation:in .7s cubic-bezier(.2,.7,.2,1) .1s forwards}
      h1{font-size:46px;font-weight:600;margin:38px 0 10px;letter-spacing:-.3px;opacity:0;transform:translateY(8px);animation:up .6s ease-out .55s forwards}
      p{font-size:22px;margin:0;color:#aeb8d6;opacity:0;transform:translateY(8px);animation:up .6s ease-out .75s forwards}
      .rule{width:56px;height:3px;border-radius:2px;background:#4368e3;margin-top:22px;opacity:0;animation:up .6s ease-out .9s forwards}
      @keyframes in{to{opacity:1;transform:scale(1)}} @keyframes up{to{opacity:1;transform:none}}
    </style></head><body><div class="wrap"><div class="logo">${LOGO}</div>
      ${title ? `<h1>${title}</h1>` : ''}${subtitle ? `<p>${subtitle}</p>` : ''}${outro ? '' : '<div class="rule"></div>'}</div></body></html>`;
    await p.setContent(html);
    await sleep(100);
    const prev = this.page;
    await this.attach(p, { cursor: false });
    await this.resume();
    await sleep(ms);
    this.pause();
    if (prev) await prev.bringToFront();
    return p;
  }
  async intro(context, title, subtitle, ms) { this.chapters.push({ title: 'Intro', t: this.acc }); return this.card(context, { title, subtitle, ms }); }
  async outro(context, title = process.env.DEMO_OUTRO_TITLE || 'ToolJet', subtitle = process.env.DEMO_OUTRO_SUB || '') { this.chapters.push({ title: 'Outro', t: this.acc }); await this.setSub(''); return this.card(context, { title, subtitle, ms: 1700, outro: true }); }

  async zoom(target, scale = 1.6) {
    const b = target.boundingBox ? await target.boundingBox() : target;
    if (!b) return;
    const cx = b.x + b.width / 2, cy = b.y + b.height / 2;
    let tx = W / 2 - scale * cx, ty = H / 2 - scale * cy;
    tx = Math.min(0, Math.max(W - scale * W, tx)); ty = Math.min(0, Math.max(H - scale * H, ty));
    await this.page.evaluate(([tx, ty, s]) => { const b = document.body; b.style.transformOrigin = '0 0'; b.style.transition = 'transform .7s cubic-bezier(.45,0,.25,1)'; b.style.transform = `translate(${tx}px,${ty}px) scale(${s})`; }, [tx, ty, scale]);
    this.zoomed = true; this.emph = true;
    await sleep(750);
  }
  async unzoom() { await this.page.evaluate(() => { const b = document.body; b.style.transition = 'transform .6s cubic-bezier(.45,0,.25,1)'; b.style.transform = ''; }); this.zoomed = false; await sleep(650); }

  // Emphasis: spotlight (dim the rest) or hand-drawn circle; tracks the element (scroll/zoom), cleared at line end.
  async mark(locator, kind = 'spot') {
    await locator.evaluate((el, kind) => {
      const root = document.documentElement;
      document.getElementById('__demo_mark')?.remove();
      const pad = kind === 'spot' ? 8 : 12;
      let node;
      if (kind === 'spot') {
        node = document.createElement('div');
        node.style.cssText = 'position:fixed;z-index:2147483640;pointer-events:none;border-radius:10px;box-shadow:0 0 0 4000px rgba(10,14,24,.42);opacity:0;transition:opacity .35s ease';
      } else {
        node = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        node.style.cssText = 'position:fixed;z-index:2147483640;pointer-events:none;overflow:visible;transform:rotate(-2.5deg);transition:opacity .25s ease';
        node.innerHTML = '<path fill="none" stroke="#F5A524" stroke-width="3" stroke-linecap="round"/>';
      }
      node.id = '__demo_mark';
      root.appendChild(node);
      const place = () => {
        const r = el.getBoundingClientRect();
        const x = r.left - pad, y = r.top - pad, w = r.width + pad * 2, h = r.height + pad * 2;
        Object.assign(node.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' });
        if (kind !== 'spot') {
          node.setAttribute('viewBox', `0 0 ${w} ${h}`);
          const path = node.querySelector('path');
          const rx = w / 2, ry = h / 2, cx = w / 2, cy = h / 2;
          // imperfect ellipse: start upper-left, overshoot the join a little
          const pts = [];
          for (let i = 0; i <= 64; i++) { const a = -2.4 + (i / 64) * (Math.PI * 2 + 0.35); const k = 1 + 0.03 * Math.sin(i / 5); pts.push([cx + rx * k * Math.cos(a), cy + ry * k * Math.sin(a)]); }
          path.setAttribute('d', 'M' + pts.map((p) => p.map((v) => v.toFixed(1)).join(' ')).join(' L'));
        }
      };
      place();
      const tick = () => { if (!node.isConnected) return; place(); requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
      if (kind === 'spot') requestAnimationFrame(() => (node.style.opacity = '1'));
      else {
        const path = node.querySelector('path'); const len = path.getTotalLength();
        path.style.strokeDasharray = len; path.style.strokeDashoffset = len;
        path.getBoundingClientRect();
        path.style.transition = 'stroke-dashoffset .5s cubic-bezier(.4,0,.2,1)'; path.style.strokeDashoffset = '0';
      }
    }, kind);
    this.emph = true;
    await sleep(kind === 'spot' ? 350 : 520);
  }
  async unmark() {
    await this.page.evaluate(() => { const n = document.getElementById('__demo_mark'); if (n) { n.style.transition = 'opacity .4s ease'; n.style.opacity = '0'; setTimeout(() => n.remove(), 450); } }).catch(() => {});
  }
  // for elements that never settle (Playwright 'stable' check): glide by coordinates, click there
  async clickXY(locator) {
    const b = await locator.boundingBox();
    await this.page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 18 }); await sleep(150);
    await this.page.mouse.down(); await this.page.mouse.up(); await sleep(200);
  }
  async point(locator, ms = 550) { await this.cursor.moveTo(locator, { durationMs: ms }); }
  async click(locator) { await this.cursor.click(locator, { durationMs: 550 }); }
  async type(locator, text) { await this.cursor.click(locator, { durationMs: 500 }); await locator.pressSequentially(text, { delay: 45 }); }
  async scrollTo(locator) { await locator.evaluate((e) => e.scrollIntoView({ behavior: 'smooth', block: 'center' })); await sleep(900); }

  async stop() {
    if (process.env.DRY) return { dry: true, lines: this.dn, chapters: this.chapters.map((c) => c.title) };
    const end = this.now(); this.pause();
    if (this.cdp) await this.cdp.send('Page.stopScreencast').catch(() => {});
    return this.encode(end);
  }
  segVideo(seg, i, pad) {
    const fr = seg.frames.filter((f, k, a) => k === a.length - 1 || a[k + 1].t > f.t + 1e-6);
    const end = seg.end + pad;
    let list = '';
    for (let k = 0; k < fr.length; k++) {
      const d = (k + 1 < fr.length ? fr[k + 1].t : end) - fr[k].t;
      if (d > 0) list += `file '${fr[k].file}'\nduration ${d.toFixed(4)}\n`;
    }
    list += `file '${fr[fr.length - 1].file}'\n`;
    const lf = path.join(this.dir, `seg${i}.txt`); fs.writeFileSync(lf, list);
    const out = path.join(this.dir, `seg${i}.mp4`);
    execFileSync(FF, ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', lf, '-vf', `fps=30,scale=${W}:${H}:flags=lanczos,format=yuv420p`,
      '-c:v', 'libx264', '-preset', 'fast', '-crf', '16', '-t', (end - seg.start).toFixed(3), out]);
    return { out, len: end - seg.start };
  }
  encode(end) {
    const segs = this.segs.filter((s) => s.frames.length && s.end > s.start);
    if (segs.length !== this.segs.length) console.warn('dropped segments', this.segs.length - segs.length);
    const parts = segs.map((s, i) => this.segVideo(s, i, i < segs.length - 1 ? F : 0));
    // crossfade chain: segment k starts F before the padded tail of k-1 ends → original timeline kept
    const video = path.join(this.dir, 'video.mp4');
    if (parts.length === 1) fs.copyFileSync(parts[0].out, video);
    else {
      const inputs = parts.flatMap((p) => ['-i', p.out]);
      let fc = '', cur = parts[0].len, last = '[0:v]';
      for (let k = 1; k < parts.length; k++) {
        const o = k === parts.length - 1 ? '[v]' : `[x${k}]`;
        fc += `${last}[${k}:v]xfade=transition=fade:duration=${F}:offset=${(cur - F).toFixed(3)}${o};`;
        cur = cur + parts[k].len - F; last = o;
      }
      execFileSync(FF, ['-y', '-loglevel', 'error', ...inputs, '-filter_complex', fc.slice(0, -1), '-map', '[v]', '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', video]);
    }
    const vdur = Number(execFileSync(FP, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', video], { encoding: 'utf8' }));
    // narration: each clip at its line start; normalised to -16 LUFS
    const audio = path.join(this.dir, 'audio.m4a');
    const ain = this.audio.flatMap((a) => ['-i', a.file]);
    const af = this.audio.map((a, k) => `[${k}:a]adelay=${Math.round(a.t * 1000)}:all=1[a${k}]`).join(';') +
      `;${this.audio.map((_, k) => `[a${k}]`).join('')}amix=inputs=${this.audio.length}:normalize=0,apad,atrim=0:${vdur.toFixed(3)},loudnorm=I=-16:TP=-1.5:LRA=11[a]`;
    execFileSync(FF, ['-y', '-loglevel', 'error', ...ain, '-filter_complex', af, '-map', '[a]', '-ar', '48000', '-c:a', 'aac', '-b:a', '96k', audio]);
    const srt = path.join(OUT, `${this.name}.srt`);
    fs.writeFileSync(srt, this.cues.map((c, i) => `${i + 1}\n${srtTime(c.start)} --> ${srtTime(c.end)}\n${c.text}\n`).join('\n'));
    const meta = path.join(OUT, `${this.name}.chapters.txt`);
    let m = ';FFMETADATA1\ntitle=' + this.name + '\n';
    this.chapters.forEach((c, i) => {
      const s = Math.round(c.t * 1000), e = Math.round((i + 1 < this.chapters.length ? this.chapters[i + 1].t : vdur) * 1000);
      if (e > s) m += `\n[CHAPTER]\nTIMEBASE=1/1000\nSTART=${s}\nEND=${e}\ntitle=${c.title}\n`;
    });
    fs.writeFileSync(meta, m);
    const final = path.join(OUT, `${this.name}.mp4`);
    const enc = (crf) => execFileSync(FF, ['-y', '-loglevel', 'error', '-i', video, '-i', audio, '-i', srt, '-i', meta, '-map', '0:v', '-map', '1:a', '-map', '2:s', '-map_metadata', '3', '-map_chapters', '3',
      '-c:v', 'libx264', '-preset', 'slow', '-crf', String(crf), '-tune', 'stillimage', '-pix_fmt', 'yuv420p', '-maxrate', '2200k', '-bufsize', '4400k',
      '-c:a', 'copy', '-c:s', 'mov_text', '-metadata:s:s:0', 'language=eng', '-metadata:s:a:0', 'language=eng', '-movflags', '+faststart', final]);
    let crf = 23; enc(crf);
    while (fs.statSync(final).size > 9 * 1024 * 1024 && crf < 33) { crf += 2; enc(crf); }
    return { final, duration: vdur, size: fs.statSync(final).size, crf, segments: parts.length, cues: this.cues.length };
  }
}
module.exports = { Rec, sleep, W, H, F };
