import { BadRequestException } from '@nestjs/common';
import * as sharp from 'sharp';

// Agents limits each input string, including the data URL prefix and base64 expansion.
export const MAX_OPENAI_ATTACHMENT_PART_CHARS = 1024 * 1024;
const MAX_IMAGE_PIXELS = 40_000_000;

export function openAiAttachmentText(text: string) {
  const parts: { type: 'input_text'; text: string }[] = [];
  for (let start = 0; start < text.length; ) {
    let end = Math.min(start + MAX_OPENAI_ATTACHMENT_PART_CHARS, text.length);
    // Keep Unicode surrogate pairs together when a long document is split across parts.
    if (end < text.length && /[\uD800-\uDBFF]/.test(text[end - 1])) end--;
    parts.push({ type: 'input_text', text: text.slice(start, end) });
    start = end;
  }
  return parts;
}

export async function prepareOpenAiImage(data: Uint8Array): Promise<string> {
  try {
    const source = sharp(data, { limitInputPixels: MAX_IMAGE_PIXELS, failOn: 'warning' });
    const metadata = await source.metadata();
    if (!['png', 'jpeg', 'webp'].includes(metadata.format)) throw new Error('Unsupported image');
    const image = source.rotate();
    const toUrl = (bytes: Buffer, mime: string) => `data:image/${mime};base64,${bytes.toString('base64')}`;
    // Prefer lossless pixels for screenshots and diagrams. Decode before sending so corrupt
    // uploads fail here instead of starting a build without a usable visual reference.
    let edge = Math.min(4096, Math.max(metadata.width, metadata.height));
    const resized = () => image.clone().resize({ width: edge, height: edge, fit: 'inside', withoutEnlargement: true });
    const png = toUrl(await resized().png().toBuffer(), 'png');
    if (png.length <= MAX_OPENAI_ATTACHMENT_PART_CHARS) return png;
    for (let attempt = 0; attempt < 8; attempt++) {
      for (const quality of [90, 80, 70]) {
        const jpeg = toUrl(await resized().flatten({ background: '#ffffff' }).jpeg({ quality }).toBuffer(), 'jpeg');
        if (jpeg.length <= MAX_OPENAI_ATTACHMENT_PART_CHARS) return jpeg;
      }
      edge = Math.max(1, Math.floor(edge * 0.75));
    }
    throw new Error('Image exceeds encoded size limit');
  } catch {
    throw new BadRequestException(
      'Unable to prepare this image for OpenAI. Upload a valid PNG, JPEG or WebP image of up to 40 megapixels, or use a smaller image.'
    );
  }
}
