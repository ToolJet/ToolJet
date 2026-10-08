// Overview video: open + clips from the case videos (by subtitle cue) + close, crossfaded; section lower-thirds; SRT + chapters.
const fs = require('fs'), path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');
const FF = 'ffmpeg', FP = 'ffprobe'; // from PATH
const OUT = path.resolve(process.env.DEMO_OUT || 'out'), TMP = path.join(OUT, 'overview.parts');
fs.rmSync(TMP, { recursive: true, force: true }); fs.mkdirSync(TMP, { recursive: true });
const X = 0.5;
const dur = (f) => Number(execFileSync(FP, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f], { encoding: 'utf8' }));
const ts = (s) => { const [h, m, r] = s.split(':'); const [sec, ms] = r.split(','); return +h * 3600 + +m * 60 + +sec + +ms / 1000; };
const srt = (f) => fs.readFileSync(f, 'utf8').trim().split(/\n\n+/).map((b) => { const l = b.split('\n'); const [a, z] = l[1].split(' --> '); return { start: ts(a), end: ts(z), text: l.slice(2).join(' ') }; });
const pick = (v) => fs.readdirSync(OUT).find((f) => f.startsWith(v + '-') && f.endsWith('.mp4'));
// usage: node assemble-overview.cjs plan.json
// plan.json: { "name": "V0-feature-overview", "items": [ { "file": "V0-open.mp4", "whole": true },
//   { "v": "V1", "a": 1, "b": 4, "sec": "Who used what" }, ... ] }  a/b = 1-based subtitle cue range in that video
const SPEC = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const PLAN = SPEC.items;

(async () => {
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const clips = [];
  for (const [i, s] of PLAN.entries()) {
    const src = path.join(OUT, s.file || pick(s.v));
    const cues = srt(src.replace(/\.mp4$/, '.srt'));
    const D = dur(src);
    let from = 0, to = D, used = cues;
    if (!s.whole) {
      const A = cues[s.a - 1], B = cues[s.b - 1], prev = cues[s.a - 2], next = cues[s.b];
      from = Math.max(A.start - 0.6, prev ? prev.end + 0.1 : 0);
      to = Math.min(B.end + 1.9, next ? next.start - 0.25 : D, D);
      used = cues.slice(s.a - 1, s.b);
    }
    const out = path.join(TMP, `c${i}.mp4`);
    const args = ['-y', '-loglevel', 'error', '-ss', from.toFixed(3), '-to', to.toFixed(3), '-i', src];
    let vf = '[0:v]fps=30,format=yuv420p[v]';
    if (s.sec) {
      const png = path.join(TMP, `l${i}.png`);
      await pg.setContent(`<html><body style="margin:0;background:transparent"><div style="position:fixed;left:28px;top:24px;background:rgba(12,16,26,.82);color:#fff;font:600 17px/1.2 'IBM Plex Sans',Inter,-apple-system,sans-serif;padding:9px 16px;border-radius:9px;letter-spacing:.3px">${s.sec}</div></body></html>`);
      await pg.screenshot({ path: png, omitBackground: true });
      args.push('-loop', '1', '-t', (to - from).toFixed(3), '-i', png);
      vf = `[1:v]format=rgba,fade=in:st=0.2:d=0.4:alpha=1,fade=out:st=3.6:d=0.4:alpha=1[l];[0:v][l]overlay=0:0:shortest=1,fps=30,format=yuv420p[v]`;
    }
    args.push('-filter_complex', vf, '-map', '[v]', '-map', '0:a', '-c:v', 'libx264', '-preset', 'fast', '-crf', '16', '-c:a', 'aac', '-b:a', '128k', '-ar', '48000', out);
    execFileSync(FF, args);
    clips.push({ out, len: dur(out), from, cues: used, sec: s.sec ?? (s.whole ? (s.file.includes('open') ? 'Intro' : 'Summary') : undefined) });
  }
  await b.close();
  // chain crossfades
  const inputs = clips.flatMap((c) => ['-i', c.out]);
  let fc = '', vl = '[0:v]', al = '[0:a]', cur = clips[0].len; const offs = [0];
  for (let k = 1; k < clips.length; k++) {
    const vo = k === clips.length - 1 ? '[v]' : `[v${k}]`, ao = k === clips.length - 1 ? '[a]' : `[a${k}]`;
    fc += `${vl}[${k}:v]xfade=transition=fade:duration=${X}:offset=${(cur - X).toFixed(3)}${vo};${al}[${k}:a]acrossfade=d=${X}${ao};`;
    offs.push(cur - X); cur = cur + clips[k].len - X; vl = vo; al = ao;
  }
  const joined = path.join(TMP, 'joined.mp4');
  execFileSync(FF, ['-y', '-loglevel', 'error', ...inputs, '-filter_complex', fc.slice(0, -1) + ';[a]loudnorm=I=-16:TP=-1.5:LRA=11[an]', '-map', '[v]', '-map', '[an]', '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-c:a', 'aac', '-b:a', '96k', '-ar', '48000', joined]);
  // subtitles + chapters
  const p2 = (n, w = 2) => String(n).padStart(w, '0');
  const st = (s) => { const ms = Math.round(s * 1000); return `${p2(Math.floor(ms / 3600000))}:${p2(Math.floor(ms / 60000) % 60)}:${p2(Math.floor(ms / 1000) % 60)},${p2(ms % 1000, 3)}`; };
  const cues = clips.flatMap((c, k) => c.cues.map((q) => ({ ...q, start: q.start - c.from + offs[k], end: q.end - c.from + offs[k] })));
  const name = SPEC.name;
  fs.writeFileSync(path.join(OUT, name + '.srt'), cues.map((q, i) => `${i + 1}\n${st(q.start)} --> ${st(q.end)}\n${q.text}\n`).join('\n'));
  const total = dur(joined);
  const chs = clips.map((c, k) => ({ t: offs[k], title: c.sec })).filter((c) => c.title);
  let m = `;FFMETADATA1\ntitle=${name}\n`;
  chs.forEach((c, i) => { m += `\n[CHAPTER]\nTIMEBASE=1/1000\nSTART=${Math.round(c.t * 1000)}\nEND=${Math.round((i + 1 < chs.length ? chs[i + 1].t : total) * 1000)}\ntitle=${c.title}\n`; });
  fs.writeFileSync(path.join(OUT, name + '.chapters.txt'), m);
  const final = path.join(OUT, name + '.mp4');
  const enc = (crf) => execFileSync(FF, ['-y', '-loglevel', 'error', '-i', joined, '-i', path.join(OUT, name + '.srt'), '-i', path.join(OUT, name + '.chapters.txt'), '-map', '0:v', '-map', '0:a', '-map', '1:s', '-map_metadata', '2', '-map_chapters', '2',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', String(crf), '-tune', 'stillimage', '-pix_fmt', 'yuv420p', '-maxrate', '1800k', '-bufsize', '3600k', '-c:a', 'copy', '-c:s', 'mov_text', '-metadata:s:s:0', 'language=eng', '-movflags', '+faststart', final]);
  let crf = 23; enc(crf);
  while (fs.statSync(final).size > 9 * 1024 * 1024 && crf < 35) { crf += 2; enc(crf); }
  console.log(JSON.stringify({ final, duration: total, size: fs.statSync(final).size, crf, clips: clips.length, cues: cues.length }));
})().catch((e) => { console.error(e); process.exit(1); });
