import { createHash } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

import { isServerMode } from '../server-mode';
import { Session } from './session';
import {
  applyStoredSource,
  collectProjectSource,
  fetchStoredSource,
  filesAPullWouldChange,
  inStepWith,
  readSourceState,
  SourceState,
  StoredSource,
  trustFileChanges,
  writeSourceState,
} from './source-upload';

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
  /** ToolJet's files are these files, or the ones this copy last synced (a new draft restarts its revision at 1):
   *  nothing is newer there, and only source.json's revision is behind. */
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
  return compareWithStored(local, versionId, stored, localHash);
}

function compareWithStored(
  local: SourceState | undefined,
  versionId: string,
  stored: StoredSource,
  localHash: string
): Exclude<SourceCheck, { kind: 'in-step' }> {
  const revision = stored.revision as number;
  if (stored.contentHash && (stored.contentHash === localHash || stored.contentHash === local?.contentHash))
    return { kind: 'same-files', revision };
  const synced = local && local.versionId === versionId ? local.contentHash : undefined;
  return { kind: 'behind', revision, clean: !!synced && synced === localHash };
}

export const behindMessage = (revision?: number): string =>
  `ToolJet has newer code (${
    revision !== undefined ? `revision ${revision}, ` : ''
  }changed in the editor or by AI). Run tooljet app source-pull, then save again.`;

export type PullResult =
  | { kind: 'same-files'; revision: number }
  /** Nothing was written: these local files differ from ToolJet's and a pull would lose them. */
  | { kind: 'local-changes'; revision: number; files: string[] }
  /** Nothing was written: the pull changes what a build runs on this machine (build config, packages, ...). */
  | { kind: 'untrusted'; revision: number; files: string[] }
  | { kind: 'pulled'; revision: number; written: number; removed: number; keptIn?: string; kept: number };

const keepCopies = (root: string, files: string[], revision: number): string => {
  const dir = path.join('.tooljet', 'before-pull', `revision-${revision}-${Date.now()}`);
  for (const file of files) {
    const target = path.join(root, dir, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(root, file), target);
  }
  return dir;
};

/**
 * `tooljet app source-pull` for a copy that isn't in step. A pull never loses work without being asked: files changed
 * here since the last sync stop it, and `force` takes ToolJet's code after keeping a copy of them.
 */
export async function pullStoredCode(
  session: Session,
  root: string,
  where: { appId: string; versionId: string },
  summary: StoredSource,
  force: boolean,
  /** Pull even a change to what a build runs here (`--trust-remote-config`). Server mode runs none of it. */
  trust = false
): Promise<PullResult> {
  const local = readSourceState(root);
  const check = compareWithStored(local, where.versionId, summary, hashProjectSource(root));
  const { revision } = check;
  if (check.kind === 'same-files') {
    writeSourceState(root, {
      revision,
      owner: summary.owner as SourceState['owner'],
      versionId: where.versionId,
      ...(summary.contentHash ? { contentHash: summary.contentHash } : {}),
    });
    return { kind: 'same-files', revision };
  }
  const stored = await fetchStoredSource(session, where, true);
  // Someone else's edit to what a build runs does not run here by itself, as in tooljet app dev.
  const untrusted = trust || isServerMode() ? [] : trustFileChanges(root, stored);
  if (untrusted.length) return { kind: 'untrusted', revision, files: untrusted };
  const changed = check.clean ? [] : filesAPullWouldChange(root, stored);
  if (changed.length && !force) return { kind: 'local-changes', revision, files: changed };
  const keptIn = changed.length ? keepCopies(root, changed, revision) : undefined;
  const { written, removed } = applyStoredSource(root, stored, where.versionId);
  return { kind: 'pulled', revision, written, removed, keptIn, kept: changed.length };
}
