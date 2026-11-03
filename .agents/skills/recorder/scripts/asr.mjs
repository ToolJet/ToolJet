import { pipeline } from '@huggingface/transformers';
import { execFileSync } from 'node:child_process';
const asr = await pipeline('automatic-speech-recognition', 'onnx-community/whisper-base.en', { dtype: 'q8' });
for (const v of process.argv.slice(2)) {
  const raw = execFileSync('ffmpeg', ['-loglevel', 'error', '-i', v, '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'], { maxBuffer: 1 << 28 });
  const audio = new Float32Array(raw.buffer, raw.byteOffset, raw.length / 4);
  console.log('### ' + v);
  for (let s = 0; s < audio.length; s += 16000 * 25) {
    const r = await asr(audio.slice(s, s + 16000 * 25), { return_timestamps: true });
    for (const c of r.chunks) console.log(`${(s / 16000 + c.timestamp[0]).toFixed(1)}-${(s / 16000 + (c.timestamp[1] ?? 25)).toFixed(1)} ${c.text.trim()}`);
  }
}
