import * as fs from 'fs';
import * as path from 'path';

import { manifestWithPublishedSdk } from '../app/sdk';
import { Confinement, confinementDenial, projectConfinement } from './confinement';

/** The library's source tree as the manifest carries it: path (with forward slashes) to text content. */
export interface ManifestSource {
  files: Record<string, string>;
  /** Files left out: too large, binary, or past the total cap. */
  skipped: string[];
}

// Keep the manifest small enough to upload (the server caps it) and quick to open in the builder.
const FILE_LIMIT = 200 * 1024;
const TOTAL_LIMIT = 1024 * 1024;
const TEXT_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.json',
  '.css',
  '.scss',
  '.sass',
  '.less',
  '.md',
  '.txt',
  '.svg',
  '.html',
  '.yml',
  '.yaml',
]);
const ROOT_FILES = ['package.json', 'tsconfig.json', 'README.md'];

const walk = (dir: string, out: string[]) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
};

/** src/ plus the project's root files, as the manifest's `source` entry. Text files only, size-capped. */
export function collectSource(
  projectRoot: string,
  warnings: string[],
  confinement: Confinement = projectConfinement(projectRoot, true)
): ManifestSource {
  const candidates: string[] = [];
  const srcDir = path.join(projectRoot, 'src');
  if (fs.existsSync(srcDir)) walk(srcDir, candidates);
  for (const name of ROOT_FILES) {
    const full = path.join(projectRoot, name);
    if (fs.existsSync(full)) candidates.push(full);
  }
  candidates.sort();

  const files: Record<string, string> = {};
  const skipped: string[] = [];
  let total = 0;
  for (const full of candidates) {
    const rel = path.relative(projectRoot, full).split(path.sep).join('/');
    const ext = path.extname(full).toLowerCase();
    // A symlink to a file outside the project is not the project's source.
    if (confinementDenial(confinement, full)) {
      skipped.push(rel);
      continue;
    }
    const size = fs.statSync(full).size;
    if (!TEXT_EXTENSIONS.has(ext) || size > FILE_LIMIT || total + size > TOTAL_LIMIT) {
      skipped.push(rel);
      continue;
    }
    const content = fs.readFileSync(full, 'utf8');
    // A local SDK path stays on this machine (lib/app/sdk.ts).
    files[rel] = rel === 'package.json' ? manifestWithPublishedSdk(content) : content;
    total += size;
  }
  if (skipped.length)
    warnings.push(
      `Source: ${skipped.length} file(s) left out of the manifest (binary or too large): ${skipped
        .slice(0, 5)
        .join(', ')}`
    );
  return { files, skipped };
}
