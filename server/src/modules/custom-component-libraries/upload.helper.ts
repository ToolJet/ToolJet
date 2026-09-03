import { BadRequestException } from '@nestjs/common';
import { UploadFiles } from './interface/IService';
import { CSS_LIMIT, MANIFEST_LIMIT, MB } from './constants/limits';

type MulterFile = { buffer: Buffer; size: number };
type MulterFields = { bundle?: MulterFile[]; css?: MulterFile[]; manifest?: MulterFile[] };

const VERSION_PATTERN = /^(\d+)(?:\.(\d+))?(?:\.(\d+))?$/;

// Accepts X, X.Y, or X.Y.Z (digits only — no pre-release/build suffixes) and fills in missing
// parts with 0, so "1" -> "1.0.0" and "1.1" -> "1.1.0". Normalizing to a single canonical form
// keeps duplicate-version checks and storage paths (digits and dots only) unambiguous — otherwise
// "1.1" and "1.1.0" would collide in meaning but not in the DB's uniqueness check.
export function normalizeVersion(version: string): string {
  const match = version ? VERSION_PATTERN.exec(version.trim()) : null;
  if (!match) {
    throw new BadRequestException('Version must be in the format X, X.Y, or X.Y.Z (e.g. 1, 1.1, or 1.2.0)');
  }
  const [, major, minor = '0', patch = '0'] = match;
  return `${major}.${minor}.${patch}`;
}

function formatLimit(bytes: number): string {
  return `${(bytes / MB).toFixed(2)}MB`;
}

// Validate multipart parts (trust boundary) and parse manifest JSON. Shared by dev + publish;
// bundleLimit differs (30MB dev / 10MB prod) so it's a param.
export function parseUploadFiles(fields: MulterFields, bundleLimit: number): UploadFiles {
  const bundle = fields?.bundle?.[0];
  const manifest = fields?.manifest?.[0];
  const css = fields?.css?.[0];

  if (!bundle) throw new BadRequestException('No JS bundle to upload');
  if (!manifest) throw new BadRequestException('No manifest file to upload');

  if (bundle.size > bundleLimit)
    throw new BadRequestException(
      `JS bundle size is ${formatLimit(bundle.size)} which exceeds ${formatLimit(bundleLimit)} limit`
    );
  if (css && css.size > CSS_LIMIT)
    throw new BadRequestException(`CSS size is ${formatLimit(css.size)} which exceeds ${formatLimit(CSS_LIMIT)} limit`);
  if (manifest.size > MANIFEST_LIMIT)
    throw new BadRequestException(
      `Manifest size is ${formatLimit(manifest.size)} which exceeds ${formatLimit(MANIFEST_LIMIT)} limit`
    );

  let parsedManifest: Record<string, any>;
  try {
    parsedManifest = JSON.parse(manifest.buffer.toString('utf8'));
  } catch {
    throw new BadRequestException('Manifest is not valid JSON');
  }

  if (Object.keys(parsedManifest?.components ?? {}).length === 0) {
    throw new BadRequestException('Library must contain at least one component to be uploaded');
  }

  return { bundle: bundle.buffer, css: css?.buffer, manifest: parsedManifest };
}
