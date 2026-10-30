import { createHash } from 'crypto';
import { existsSync, readdirSync, readFileSync } from 'fs';
import * as path from 'path';

// Component packs that ship with ToolJet, like native widgets: the release build (packs/build-builtin.mjs) puts each
// pack's `tooljet library build` output in builtin-packs/<pack>/ with a builtin.json naming it. Nothing goes into the
// database, so every workspace and edition sees the same packs, and upgrading the server upgrades them. Files are
// served under a hash of their content, so a browser that cached the old files fetches the new ones.

export interface BuiltinPack {
  pack: string;
  displayName: string;
  version: string;
  /** Hash of the pack's files: part of every file URL, so the URL changes whenever the content does. */
  hash: string;
  hasCss: boolean;
}

/** The files a pack ships; anything else in its folder (builtin.json) is never served. */
const PACK_FILES = ['index.js', 'index.css', 'manifest.json'];

// BUILTIN_PACKS_PATH, else next to the server: the process starts in server/ in development and in the image's app
// root (one level up) in production.
export const builtinPacksDir = (): string => {
  if (process.env.BUILTIN_PACKS_PATH) return process.env.BUILTIN_PACKS_PATH;
  const candidates = [path.join(process.cwd(), 'builtin-packs'), path.join(process.cwd(), 'server', 'builtin-packs')];
  return candidates.find((dir) => existsSync(dir)) ?? candidates[0];
};

/** The packs in `dir`: [] when the server was built without them. A folder without builtin.json is not a pack. */
export const loadBuiltinPacks = (dir: string): BuiltinPack[] => {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(path.join(dir, entry.name, 'builtin.json')))
    .map((entry) => {
      const folder = path.join(dir, entry.name);
      const meta = JSON.parse(readFileSync(path.join(folder, 'builtin.json'), 'utf8'));
      const hash = createHash('sha256');
      for (const file of PACK_FILES) {
        const filePath = path.join(folder, file);
        if (existsSync(filePath)) hash.update(file).update(readFileSync(filePath));
      }
      return {
        pack: entry.name,
        displayName: meta.displayName ?? entry.name,
        version: String(meta.version ?? ''),
        hash: hash.digest('hex').slice(0, 16),
        hasCss: existsSync(path.join(folder, 'index.css')),
      };
    });
};

/** One of a pack's files, only at its current hash; null for anything else (a stale hash, a path outside the pack). */
export const readBuiltinPackFile = (
  dir: string,
  packs: BuiltinPack[],
  pack: string,
  hash: string,
  file: string
): Buffer | null => {
  const found = packs.find((p) => p.pack === pack);
  if (!found || found.hash !== hash || !PACK_FILES.includes(file)) return null;
  const filePath = path.join(dir, found.pack, file);
  return existsSync(filePath) ? readFileSync(filePath) : null;
};
