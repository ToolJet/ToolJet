import { BadRequestException } from '@nestjs/common';

export const MAX_AI_ATTACHMENT_CONTENT_BYTES = 20 * 1024 * 1024;

// Render locally: sending a PDF to OpenRouter would invoke a separate parsing model.
export async function renderAttachmentPdf(data: Uint8Array, maxPages: number, maxBytes: number) {
  const { PDFParse } = await import('pdf-parse');
  const parser = new PDFParse({ data, isEvalSupported: false });
  try {
    const { total } = await parser.getInfo();
    if (total > maxPages) {
      throw new BadRequestException(
        'DeepSeek supports up to 20 PDF pages per chat. Split the PDF or start a new chat.'
      );
    }
    const { pages } = await parser.getInfo({ parsePageInfo: true });
    const images: { type: 'image_url'; image_url: { url: string } }[] = [];
    for (const page of pages) {
      const longestSide = Math.max(page.width, page.height);
      if (!Number.isFinite(longestSide) || page.width <= 0 || page.height <= 0) throw new Error('Invalid page size');
      const result = await parser.getScreenshot({
        partial: [page.pageNumber],
        scale: Math.min(2, 1600 / longestSide),
        imageBuffer: false,
      });
      const url = result.pages[0]?.dataUrl;
      if (!url?.startsWith('data:image/png;base64,')) throw new Error('Missing rendered page');
      const image = { type: 'image_url' as const, image_url: { url } };
      maxBytes -= Buffer.byteLength(JSON.stringify(image));
      if (maxBytes < 0) {
        throw new BadRequestException('DeepSeek attachment content exceeds 20 MB after rendering. Use smaller files.');
      }
      images.push(image);
    }
    return images;
  } catch (error) {
    if (error instanceof BadRequestException) throw error;
    throw new BadRequestException('Unable to read this PDF. Upload a valid, unencrypted PDF.');
  } finally {
    await parser.destroy();
  }
}
