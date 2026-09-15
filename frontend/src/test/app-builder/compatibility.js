import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { deepFreeze } from './shared';

const root = path.resolve(__dirname, '../../../test-resources/app-builder/compatibility');

export function loadCompatibilityFixture(name, { edition } = {}) {
  if (!edition) throw new Error('Compatibility fixture loading requires an explicit edition');
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
  const entry = manifest.fixtures[name];
  if (!entry) throw new Error(`Unknown compatibility fixture: ${name}`);
  for (const field of ['path', 'sha256', 'schemaVersion', 'provenance', 'applicability', 'oracle']) {
    if (!entry[field]) throw new Error(`Compatibility fixture ${name} is missing ${field}`);
  }
  if (!entry.applicability.includes(edition))
    throw new Error(`Compatibility fixture ${name} does not apply to ${edition}`);

  const file = path.resolve(root, entry.path);
  if (!file.startsWith(`${root}${path.sep}`)) throw new Error(`Compatibility fixture ${name} escapes the fixture root`);
  const source = fs.readFileSync(file);
  const actual = crypto.createHash('sha256').update(source).digest('hex');
  if (actual !== entry.sha256) throw new Error(`Checksum mismatch for compatibility fixture ${name}`);
  const payload = JSON.parse(source.toString('utf8'));
  if (payload.schemaVersion !== entry.schemaVersion)
    throw new Error(`Schema mismatch for compatibility fixture ${name}`);
  const oraclePath = path.resolve(root, entry.oracle);
  if (!oraclePath.startsWith(`${root}${path.sep}`) || !fs.existsSync(oraclePath)) {
    throw new Error(`Invalid oracle linkage for compatibility fixture ${name}`);
  }
  const oracle = JSON.parse(fs.readFileSync(oraclePath, 'utf8'));
  return deepFreeze({ metadata: { ...entry }, payload, oracle });
}
