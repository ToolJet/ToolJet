import { FileValidator } from '@nestjs/common';

const SIGNATURES: Array<{ mime: string; bytes: number[]; offset?: number }> = [
  { mime: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
  { mime: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47] },
  { mime: 'image/gif', bytes: [0x47, 0x49, 0x46, 0x38] },
  { mime: 'image/webp', bytes: [0x57, 0x45, 0x42, 0x50], offset: 8 },
];

export class ImageMagicBytesValidator extends FileValidator {
  constructor() {
    super({});
  }

  // ponytail: any avoids IFile union incompatibility — we only need .buffer
  isValid(file: any): boolean {
    const buf = file?.buffer;
    if (!buf || buf.length < 12) return false;
    return SIGNATURES.some(({ bytes, offset = 0 }) =>
      bytes.every((b, i) => buf[offset + i] === b)
    );
  }

  buildErrorMessage(): string {
    return 'Only JPEG, PNG, GIF, and WebP images are allowed';
  }
}
