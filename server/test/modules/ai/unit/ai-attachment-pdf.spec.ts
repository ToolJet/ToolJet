/** @group working */
import { execFileSync } from 'child_process';
import { resolve } from 'path';

// Independently generated two-page PDF with text and vector artwork, including an oversized page.
function samplePdf() {
  const drawing = '0 0.6 0 rg 10 10 40 30 re f BT /F1 12 Tf 10 70 Td (Specimen 63) Tj ET';
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R 4 0 R] /Count 2 >>',
    ...[200, 4000].map(
      (width) =>
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${width / 2}] /Resources << /Font << /F1 6 0 R >> >> /Contents 5 0 R >>`
    ),
    `<< /Length ${drawing.length} >>\nstream\n${drawing}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((body, index) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${offsets.length}\n0000000000 65535 f \n`;
  pdf += offsets
    .slice(1)
    .map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`)
    .join('');
  pdf += `trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf);
}

test('renders ordered, bounded PDF pages and rejects unreadable or excessive content with cleanup', () => {
  // PDF.js imports its worker dynamically. Run the real renderer outside Jest's VM.
  execFileSync(
    process.execPath,
    [
      '-r',
      'ts-node/register/transpile-only',
      '-e',
      `
    const assert = require('node:assert/strict');
    // Initialize the pixel-inspection canvas before PDF.js installs its canvas globals.
    const { createCanvas, loadImage } = require('@napi-rs/canvas');
    const { PDFParse } = require('pdf-parse');
    const { renderAttachmentPdf } = require('./src/modules/ai/services/ai-attachment-pdf');
    const data = require('node:fs').readFileSync(0);
    let destroyed = 0;
    const destroy = PDFParse.prototype.destroy;
    PDFParse.prototype.destroy = async function () { destroyed++; return destroy.call(this); };
    (async () => {
      const images = await renderAttachmentPdf(data, 20, 20 * 1024 * 1024);
      assert.equal(images.length, 2);
      const dimensions = images.map(({ image_url }) => {
        const png = Buffer.from(image_url.url.split(',')[1], 'base64');
        assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
        return [png.readUInt32BE(16), png.readUInt32BE(20)];
      });
      assert.deepEqual(dimensions, [[400, 200], [1600, 800]]);
      assert.notEqual(images[0].image_url.url, images[1].image_url.url);
      const canvas = createCanvas(400, 200);
      const context = canvas.getContext('2d');
      context.drawImage(await loadImage(images[0].image_url.url), 0, 0);
      // The text is above the rectangle: colored pixels here prove base-14 glyphs rendered.
      const pixels = context.getImageData(20, 35, 150, 30).data;
      let ink = 0;
      for (let i = 0; i < pixels.length; i += 4) if (pixels[i] < 150 && pixels[i + 3] > 0) ink++;
      assert.ok(ink > 100, 'Expected visible Helvetica text above the artwork');
      assert.equal(destroyed, 1);
      await assert.rejects(renderAttachmentPdf(data, 20, 1), /exceeds 20 MB/);
      assert.equal(destroyed, 2);
      await assert.rejects(renderAttachmentPdf(Buffer.from('not a PDF'), 20, 1024), /valid, unencrypted PDF/);
      assert.equal(destroyed, 3);
      let renders = 0;
      PDFParse.prototype.getScreenshot = async () => { renders++; throw new Error('Internal renderer failure'); };
      await assert.rejects(renderAttachmentPdf(data, 1, 1024 * 1024), /20 PDF pages/);
      assert.equal(renders, 0);
      assert.equal(destroyed, 4);
      await assert.rejects(renderAttachmentPdf(data, 20, 1024 * 1024), /valid, unencrypted PDF/);
      assert.equal(renders, 1);
      assert.equal(destroyed, 5);
    })().catch(error => { console.error(error); process.exitCode = 1; });
  `,
    ],
    {
      cwd: resolve(__dirname, '../../../..'),
      input: samplePdf(),
      timeout: 15000,
    }
  );
});
