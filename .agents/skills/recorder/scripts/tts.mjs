// Kokoro TTS (local). say(text) -> { file, dur } cached by hash.
import { KokoroTTS } from 'kokoro-js';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
const DIR = resolve(process.env.DEMO_TTS_CACHE || 'tts') + '/';
mkdirSync(DIR, { recursive: true });
const VOICE = process.env.VOICE || 'af_heart', SPEED = Number(process.env.SPEED || 1.1);
let tts;
export async function say(text) {
  const h = createHash('sha1').update(`${VOICE}|${SPEED}|${text}`).digest('hex').slice(0, 16);
  const file = `${DIR}${h}.wav`;
  if (!existsSync(file)) {
    tts ||= await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', { dtype: 'q8', device: 'cpu' });
    const audio = await tts.generate(text, { voice: VOICE, speed: SPEED });
    await audio.save(file);
  }
  const dur = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file], { encoding: 'utf8' }));
  return { file, dur };
}
if (process.argv[2]) console.log(await say(process.argv.slice(2).join(' ')));
