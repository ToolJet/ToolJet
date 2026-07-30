import { BadRequestException } from '@nestjs/common';
import { UploadFiles } from './interface/IService';
import { CSS_LIMIT, MANIFEST_LIMIT } from './constants/limits';

type MulterFile = { buffer: Buffer; size: number };
type MulterFields = { bundle?: MulterFile[]; css?: MulterFile[]; manifest?: MulterFile[] };

// Validate multipart parts (trust boundary) and parse manifest JSON. Shared by dev + publish;
// bundleLimit differs (30MB dev / 10MB prod) so it's a param.
export function parseUploadFiles(fields: MulterFields, bundleLimit: number): UploadFiles {
  const bundle = fields?.bundle?.[0];
  const manifest = fields?.manifest?.[0];
  const css = fields?.css?.[0];

  if (!bundle) throw new BadRequestException('Missing required upload part: bundle');
  if (!manifest) throw new BadRequestException('Missing required upload part: manifest');

  if (bundle.size > bundleLimit) throw new BadRequestException(`bundle exceeds ${bundleLimit / (1024 * 1024)}MB`);
  if (css && css.size > CSS_LIMIT) throw new BadRequestException(`css exceeds ${CSS_LIMIT / (1024 * 1024)}MB`);
  if (manifest.size > MANIFEST_LIMIT)
    throw new BadRequestException(`manifest exceeds ${MANIFEST_LIMIT / (1024 * 1024)}MB`);

  let parsedManifest: Record<string, any>;
  try {
    parsedManifest = JSON.parse(manifest.buffer.toString('utf8'));
  } catch {
    throw new BadRequestException('manifest is not valid JSON');
  }

  return { bundle: bundle.buffer, css: css?.buffer, manifest: parsedManifest };
}
