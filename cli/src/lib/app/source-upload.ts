import * as fs from 'fs';
import * as path from 'path';

import { lockWithPublishedSdk, manifestWithPublishedSdk, repairSdk } from './sdk';
import { Session } from './session';

/**
 * `--source`: the project's source uploaded beside the bundle, so ToolJet stores it per app version
 * (code-mode-source on the server). `repository` keeps the repository the owner and the editor read-only, and is sent
 * on every build; `platform` hands editing to the ToolJet editor, once.
 */
export type SourceOwner = 'repository' | 'platform';
export const SOURCE_OWNERS: SourceOwner[] = ['repository', 'platform'];

const ROOT_FILES = [
  'app.json',
  'README.md',
  'frontend/package.json',
  'frontend/package-lock.json',
  'frontend/tsconfig.json',
  'frontend/.tooljet/config.json',
  'frontend/.npmrc',
  ...['tailwind', 'postcss'].flatMap((name) => ['js', 'cjs', 'mjs', 'ts'].map((ext) => `frontend/${name}.config.${ext}`)),
];
const TREES = ['frontend/src', 'frontend/styles'];
const TEXT = /\.(tsx?|jsx?|mjs|cjs|css|json|md|svg|txt)$/;

/*
  app.json's `version` is the version this checkout follows (tooljet app checkout), not part of the app's code: it is
  never stored, and pulling stored code keeps the local one.
*/
const APP_JSON = 'app.json';

const parseJson = (content: string): Record<string, unknown> | undefined => {
  try {
    const value = JSON.parse(content);
    return value && typeof value === 'object' && !Array.isArray(value) ? value : undefined;
  } catch {
    return undefined;
  }
};

const withVersion = (content: string, version: unknown): string => {
  const app = parseJson(content);
  if (!app || (!('version' in app) && version === undefined)) return content;
  const rest = { ...app };
  delete rest.version;
  return JSON.stringify(version === undefined ? rest : { ...rest, version }, null, 2) + '\n';
};

/** What ToolJet stores for a file: without what belongs to this checkout, its followed version and its local SDK path. */
const storedContent = (rel: string, content: string): string => {
  if (rel === APP_JSON) return withVersion(content, undefined);
  if (rel === 'frontend/package.json') return manifestWithPublishedSdk(content);
  if (rel === 'frontend/package-lock.json') return lockWithPublishedSdk(content);
  return content;
};

/** The files the server stores, as { path, content } with paths relative to the project root and '/' separators. */
export function collectProjectSource(root: string): { path: string; content: string }[] {
  const files: { path: string; content: string }[] = [];
  const add = (rel: string) => {
    const content = fs.readFileSync(path.join(root, rel), 'utf8');
    files.push({ path: rel, content: storedContent(rel, content) });
  };
  for (const rel of ROOT_FILES) if (fs.existsSync(path.join(root, rel))) add(rel);
  const walk = (rel: string) => {
    for (const entry of fs.readdirSync(path.join(root, rel), { withFileTypes: true })) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
      const child = `${rel}/${entry.name}`;
      if (entry.isDirectory()) walk(child);
      else if (entry.isFile() && TEXT.test(entry.name)) add(child);
    }
  };
  for (const tree of TREES) if (fs.existsSync(path.join(root, tree))) walk(tree);
  return files;
}

export interface SourceUploadResult {
  revision: number;
  owner: SourceOwner;
  contentHash?: string;
  files: { path: string }[];
}

export async function uploadSource(
  session: Session,
  target: { appId: string; versionId: string; root: string },
  options: { owner: SourceOwner; replace?: boolean; baseRevision?: number; builtBundle?: boolean }
): Promise<SourceUploadResult> {
  return session.api(`/code-mode-source/${target.appId}/versions/${target.versionId}/import`, {
    method: 'POST',
    body: {
      files: collectProjectSource(target.root),
      owner: options.owner,
      replace: !!options.replace,
      ...(options.baseRevision !== undefined ? { baseRevision: options.baseRevision } : {}),
      // This user's dev build was just made from these files: Save version may freeze it.
      ...(options.builtBundle ? { builtBundle: true } : {}),
    },
  });
}

/*
  The revision of ToolJet's stored source this project was last in step with (uploaded or pulled), in
  .tooljet/source.json. A platform-owned upload names it, so edits saved in the ToolJet editor since then are never
  overwritten: the server answers 409 and `tooljet app source-pull` brings them down first.
  Revision numbers count per app version (a new draft starts again at 1), so the state also records the version and
  the content hash it was in step with; a state from another version, or one without a version, is not in step.
*/
export interface SourceState {
  revision: number;
  owner: SourceOwner;
  versionId?: string;
  contentHash?: string;
}

/** The base revision for an upload to `versionId`: the recorded one, if it was recorded for that version. */
export const baseRevisionFor = (local: SourceState | undefined, versionId: string): number | undefined =>
  local && (!local.versionId || local.versionId === versionId) ? local.revision : undefined;

/** Whether the project is in step with what ToolJet stores for `versionId`. */
export function inStepWith(local: SourceState | undefined, versionId: string, stored: StoredSource): boolean {
  if (!local || !stored.exists || local.versionId !== versionId || local.revision !== stored.revision) return false;
  return !local.contentHash || !stored.contentHash || local.contentHash === stored.contentHash;
}

const stateFile = (root: string) => path.join(root, '.tooljet', 'source.json');

export function readSourceState(root: string): SourceState | undefined {
  try {
    const state = JSON.parse(fs.readFileSync(stateFile(root), 'utf8'));
    return typeof state?.revision === 'number' ? state : undefined;
  } catch {
    return undefined;
  }
}

export function writeSourceState(root: string, state: SourceState): void {
  fs.mkdirSync(path.dirname(stateFile(root)), { recursive: true });
  fs.writeFileSync(stateFile(root), JSON.stringify(state, null, 2) + '\n');
}

export interface StoredSource {
  exists: boolean;
  revision?: number;
  owner?: SourceOwner;
  contentHash?: string;
  files?: { path: string; content?: string }[];
}

export async function fetchStoredSource(
  session: Session,
  target: { appId: string; versionId: string },
  withContent = false
): Promise<StoredSource> {
  return session.api(`/code-mode-source/${target.appId}/versions/${target.versionId}${withContent ? '?content=1' : ''}`);
}

/** Whether a stored path is one this project keeps (and so may be written or removed here). */
const isProjectPath = (rel: string) =>
  !rel.split('/').some((part) => part === '..' || part === '') &&
  (ROOT_FILES.includes(rel) || TREES.some((tree) => rel.startsWith(`${tree}/`)));

/**
 * Bring ToolJet's stored source into the project when it is newer than the project's last sync: files written,
 * files the editor deleted removed. Returns what changed, or `pulled: false` when the project is already in step.
 */
export function applyStoredSource(
  root: string,
  stored: StoredSource,
  versionId?: string
): { pulled: boolean; written: number; removed: number } {
  const files = (stored.files ?? []).filter((f) => isProjectPath(f.path) && typeof f.content === 'string');
  const keep = new Set(files.map((f) => f.path));
  let removed = 0;
  for (const local of collectProjectSource(root)) {
    if (!keep.has(local.path) && TREES.some((tree) => local.path.startsWith(`${tree}/`))) {
      fs.rmSync(path.join(root, local.path));
      removed++;
    }
  }
  for (const f of files) {
    const target = path.join(root, f.path);
    let content = f.content as string;
    if (f.path === APP_JSON && fs.existsSync(target)) {
      content = withVersion(content, parseJson(fs.readFileSync(target, 'utf8'))?.version);
    }
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content);
  }
  // Code stored before ToolJet kept local SDK paths out of it.
  repairSdk(path.join(root, 'frontend'));
  writeSourceState(root, {
    revision: stored.revision as number,
    owner: stored.owner as SourceOwner,
    ...(versionId ? { versionId } : {}),
    ...(stored.contentHash ? { contentHash: stored.contentHash } : {}),
  });
  return { pulled: true, written: files.length, removed };
}

/**
 * `--source` on dev and publish: upload the project's source with the revision it last synced, so edits saved in the
 * ToolJet editor since then are refused (409) rather than overwritten; never take a repository-owned source over
 * unless asked (replace). Records the new revision in .tooljet/source.json.
 */
export async function storeSource(
  session: Session,
  target: { appId: string; versionId: string; root: string },
  options: { owner: SourceOwner; replace?: boolean; builtBundle?: boolean }
): Promise<SourceUploadResult> {
  const where = { appId: target.appId, versionId: target.versionId };
  if (options.owner === 'platform' && !options.replace) {
    const current = await fetchStoredSource(session, where);
    if (current.exists && current.owner === 'repository')
      throw new Error("This app's source is owned by its repository; push there, or pass --source-replace to move it to ToolJet.");
  }
  const stored = await uploadSource(session, target, {
    owner: options.owner,
    replace: options.replace,
    // Only a revision of this same version is a base: numbers restart at 1 in every new draft.
    baseRevision: baseRevisionFor(readSourceState(target.root), target.versionId),
    builtBundle: options.builtBundle,
  });
  writeSourceState(target.root, {
    revision: stored.revision,
    owner: stored.owner,
    versionId: target.versionId,
    ...(stored.contentHash ? { contentHash: stored.contentHash } : {}),
  });
  return stored;
}
