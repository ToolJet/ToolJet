/** @group working */
import * as sharp from 'sharp';
import {
  MAX_OPENAI_ATTACHMENT_PART_CHARS,
  openAiAttachmentText,
  prepareOpenAiImage,
} from '@modules/ai/services/ai-attachment-openai';

const imageBytes = (url: string) => Buffer.from(url.split(',')[1], 'base64');

test.each(['png', 'jpeg', 'webp'] as const)('prepares readable %s pixels without a remote URL', async (format) => {
  const original = await sharp({ create: { width: 64, height: 32, channels: 4, background: '#287b51' } })
    .toFormat(format)
    .toBuffer();
  const url = await prepareOpenAiImage(original);
  expect(url).toMatch(/^data:image\/png;base64,/);
  expect(url.length).toBeLessThanOrEqual(MAX_OPENAI_ATTACHMENT_PART_CHARS);
  expect(await sharp(imageBytes(url)).metadata()).toMatchObject({ width: 64, height: 32 });
  // Small images retain their decoded pixels, including transparency, without lossy re-encoding.
  expect(await sharp(imageBytes(url)).ensureAlpha().raw().toBuffer()).toEqual(
    await sharp(original).ensureAlpha().raw().toBuffer()
  );
});

test('compresses a large detailed image below the encoded limit and preserves usable dimensions', async () => {
  const pixels = Buffer.alloc(1800 * 1200 * 3);
  let seed = 913;
  for (let i = 0; i < pixels.length; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    pixels[i] = seed >>> 24;
  }
  const original = await sharp(pixels, { raw: { width: 1800, height: 1200, channels: 3 } })
    .png()
    .toBuffer();
  expect(original.toString('base64').length).toBeGreaterThan(MAX_OPENAI_ATTACHMENT_PART_CHARS);
  const url = await prepareOpenAiImage(original);
  expect(url).toMatch(/^data:image\/jpeg;base64,/);
  expect(url.length).toBeLessThanOrEqual(MAX_OPENAI_ATTACHMENT_PART_CHARS);
  const { width, height } = await sharp(imageBytes(url)).metadata();
  expect(width).toBeGreaterThanOrEqual(1000);
  expect(width / height).toBeCloseTo(1.5, 2);
});

test('applies camera orientation before removing metadata', async () => {
  const original = await sharp({ create: { width: 80, height: 40, channels: 3, background: '#287b51' } })
    .jpeg()
    .withMetadata({ orientation: 6 })
    .toBuffer();
  const metadata = await sharp(imageBytes(await prepareOpenAiImage(original))).metadata();
  expect(metadata).toMatchObject({ width: 40, height: 80 });
  expect(metadata.orientation).toBeUndefined();
});

test.each([
  Buffer.from('not an image'),
  Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>'),
])('rejects malformed or unsupported image data', async (data) => {
  await expect(prepareOpenAiImage(data)).rejects.toThrow('Unable to prepare this image');
});

test('rejects a truncated image even if its header contains readable dimensions', async () => {
  const image = await sharp({ create: { width: 64, height: 32, channels: 3, background: '#287b51' } })
    .png()
    .toBuffer();
  await expect(prepareOpenAiImage(image.subarray(0, 50))).rejects.toThrow('Unable to prepare this image');
});

test('splits long Unicode text without losing contents or breaking characters', () => {
  const text = 'x'.repeat(MAX_OPENAI_ATTACHMENT_PART_CHARS - 1) + '🧭\n終わり';
  const parts = openAiAttachmentText(text);
  expect(parts).toHaveLength(2);
  expect(
    parts.every((part) => part.type === 'input_text' && part.text.length <= MAX_OPENAI_ATTACHMENT_PART_CHARS)
  ).toBe(true);
  expect(parts[1].text).toBe('🧭\n終わり');
  expect(parts.map((part) => part.text).join('')).toBe(text);
  expect(openAiAttachmentText('x'.repeat(MAX_OPENAI_ATTACHMENT_PART_CHARS))).toHaveLength(1);
});
