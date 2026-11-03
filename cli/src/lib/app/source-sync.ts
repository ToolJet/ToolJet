import { createHash } from 'crypto';

import { collectProjectSource, inStepWith, SourceState, StoredSource } from './source-upload';

/*
  `tooljet app dev` and code the ToolJet editor owns: before a build is uploaded, and while it watches, dev asks ToolJet
  which revision it stores. A local copy behind it (the AI or the Code panel saved since the last sync) is never
  uploaded, since the canvas would then show the older code over theirs. When the local files are unchanged since that
  sync, dev pulls the newer code itself; otherwise it says how to bring it in.
*/

const sha256 = (text: string) => createHash('sha256').update(text, 'utf8').digest('hex');

/** The project's files hashed the way ToolJet hashes stored source (each path and file hash, in path order). */
export function hashProjectSource(root: string): string {
  return sha256(
    collectProjectSource(root)
      .map((f) => ({ path: f.path, hash: sha256(f.content) }))
      .sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0))
      .map((f) => `${f.path}\0${f.hash}\n`)
      .join('')
  );
}

export type SourceCheck =
  /** Upload away: ToolJet holds no editor-owned code newer than this copy. */
  | { kind: 'in-step' }
  /** The files already match what ToolJet stores; only source.json's revision is behind. */
  | { kind: 'same-files'; revision: number }
  /** ToolJet holds newer code; `clean` when the local files are unchanged since the last sync, so a pull loses nothing. */
  | { kind: 'behind'; revision: number; clean: boolean };

export function checkAgainstStored(
  local: SourceState | undefined,
  versionId: string,
  stored: StoredSource | undefined,
  localHash: string
): SourceCheck {
  if (!stored?.exists || stored.owner !== 'platform' || inStepWith(local, versionId, stored))
    return { kind: 'in-step' };
  const revision = stored.revision as number;
  if (stored.contentHash && stored.contentHash === localHash) return { kind: 'same-files', revision };
  const synced = local && local.versionId === versionId ? local.contentHash : undefined;
  return { kind: 'behind', revision, clean: !!synced && synced === localHash };
}

export const behindMessage = (revision?: number): string =>
  `ToolJet has newer code (${
    revision !== undefined ? `revision ${revision}, ` : ''
  }changed in the editor or by AI). Run tooljet app source-pull, then save again.`;
