import * as fs from 'fs';
import * as path from 'path';

import { confinementDenial, projectConfinement } from '../library/confinement';
import { isServerMode } from '../server-mode';
import { assertRegistryOnly } from './dependency-specs';
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
  ...['tailwind', 'postcss'].flatMap((name) =>
    ['js', 'cjs', 'mjs', 'ts'].map((ext) => `frontend/${name}.config.${ext}`)
  ),
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

/*
  Source sync reads and writes only the project itself: every folder it walks, every file it reads and every file it
  writes or removes is checked after following symlinks (confinement.ts), so a symlinked frontend/src, frontend or root
  file cannot send another folder's files to ToolJet, or let a pull write outside the project. Packages are never
  source, so the hoisted and linked node_modules a local build may read do not count here.
*/
export const projectPath = (root: string, rel: string): string => {
  const full = path.join(root, rel);
  if (confinementDenial(projectConfinement(root, true), full))
    throw new Error(
      `Refused ${rel}: it leads outside the project (a symlink), so source sync does not read or write it.`
    );
  return full;
};

/** The files the server stores, as { path, content } with paths relative to the project root and '/' separators. */
export function collectProjectSource(root: string): { path: string; content: string }[] {
  const files: { path: string; content: string }[] = [];
  const add = (rel: string) => {
    const content = fs.readFileSync(projectPath(root, rel), 'utf8');
    files.push({ path: rel, content: storedContent(rel, content) });
  };
  for (const rel of ROOT_FILES) if (fs.existsSync(path.join(root, rel))) add(rel);
  const walk = (rel: string) => {
    for (const entry of fs.readdirSync(projectPath(root, rel), { withFileTypes: true })) {
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
  const files = collectProjectSource(target.root);
  // ToolJet refuses the same; saying so here names the file before anything is sent. The registry's host is the
  // server's to check, since it may allow a mirror this machine does not use.
  assertRegistryOnly(files, null);
  return session.api(`/code-mode-source/${target.appId}/versions/${target.versionId}/import`, {
    method: 'POST',
    body: {
      files,
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
    const state = JSON.parse(fs.readFileSync(projectPath(root, path.relative(root, stateFile(root))), 'utf8'));
    return typeof state?.revision === 'number' ? state : undefined;
  } catch {
    return undefined;
  }
}

export function writeSourceState(root: string, state: SourceState): void {
  const file = projectPath(root, path.relative(root, stateFile(root)));
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(state, null, 2) + '\n');
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
  return session.api(
    `/code-mode-source/${target.appId}/versions/${target.versionId}${withContent ? '?content=1' : ''}`
  );
}

/*
  What a project trusts to run on this machine: a build loads the config files, and an install follows package.json, the
  lockfile and .npmrc. Live sync pulls edits other people make on ToolJet, so one that changes these needs a decision.
*/
const BUILD_TRUST_FILES = ROOT_FILES.filter(
  (rel) =>
    /\/(?:postcss|tailwind)\.config\./.test(rel) ||
    [
      'frontend/package.json',
      'frontend/package-lock.json',
      'frontend/.npmrc',
      'frontend/.tooljet/config.json',
    ].includes(rel)
);

const localStoredContent = (root: string, rel: string): string | undefined => {
  try {
    const full = projectPath(root, rel);
    return fs.statSync(full).isFile() ? storedContent(rel, fs.readFileSync(full, 'utf8')) : undefined;
  } catch {
    return undefined;
  }
};

const STYLESHEET = /\.(?:css|pcss|postcss|scss|sass|less)$/i;
const CODE_FILE = /\.(?:[cm]?[jt]s|[jt]sx)$/i;

/*
  Stylesheet directives that make a local build load code: Tailwind's @config and @plugin, and an @import naming a
  script. A stylesheet is source, outside the fixed trust files, so a pull that adds or changes one of these runs
  someone else's code here unless it is checked the same way.
*/
const CODE_DIRECTIVE =
  /@(?:config|plugin)\b[^;{}]*|@import\s+(?:url\()?\s*["']?[^"');\s]+\.(?:[cm]?[jt]s|[jt]sx|json)\b[^;{}]*/gi;

const codeDirectives = (css: string | undefined): string[] =>
  (css ?? '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .match(CODE_DIRECTIVE)
    ?.map((directive) => directive.replace(/\s+/g, ' ').trim()) ?? [];

/** What a stylesheet directive names: its quoted argument, else its first bare word. */
const directiveSpec = (directive: string): string | undefined =>
  /["']([^"']+)["']/.exec(directive)?.[1] ??
  /^@(?:config|plugin|import)\s+(?:url\(\s*)?([^\s;)"']+)/i.exec(directive)?.[1];

/*
  Every literal module name a file names: require('x'), import('x'), import 'x', and the `from 'x'` of an import or
  export. Read in comments too; a false alarm only asks for approval.
*/
const IMPORT_SPECIFIER = /(?:\brequire\s*\(\s*|\bimport\s*\(\s*|\bfrom\s+|\bimport\s+)(["'])([^"'\r\n]*)\1/g;
/*
  Other quoted strings that start like a relative path. PostCSS configs name plugins by path as plain object keys
  (`plugins: { './plugin.cjs': {} }`), and the build resolves and requires them, so a string that names a project
  file counts as a load of it. A glob (Tailwind's content list) names no single file.
*/
const RELATIVE_STRING = /(["'`])(\.{1,2}\/[^"'`\r\n]*)\1/g;
const GLOB = /[*?{}[\]!$]/;
/*
  Where Node's loaders (and the TypeScript loaders build tools use) look for a relative name: the file itself, the
  file with each script or data extension, then the folder's index. Every candidate that exists counts, so a pull
  that removes one cannot hand the load to another unseen.
*/
const RESOLVE_SUFFIXES = [
  '',
  ...['.js', '.cjs', '.mjs', '.ts', '.cts', '.mts', '.jsx', '.tsx', '.json', '.node'].flatMap((ext) => [
    ext,
    `/index${ext}`,
  ]),
];
/** Node parses a .json file it is asked to load; nothing in it runs, or loads anything else. */
const DATA_FILE = /\.json$/i;
/** An npm package name, with an optional subpath that never steps out of the package. */
const PACKAGE_NAME = /^(?:@[a-z0-9~][\w.~-]*\/)?[a-z0-9~][\w.~-]*(?:\/[\w.~@+-]+)*$/i;
const isPackageName = (spec: string) =>
  /^node:[\w/]+$/.test(spec) ||
  (PACKAGE_NAME.test(spec) && !spec.split('/').some((part) => part === '.' || part === '..'));

/** A path from the project root, '/' separated; undefined when it leaves the project. */
const joinedPath = (from: string, spec: string): string | undefined => {
  const target = path.posix.normalize(path.posix.join(path.posix.dirname(from), spec)).replace(/\/+$/, '');
  return target === '.' || target === '..' || target.startsWith('../') || path.posix.isAbsolute(target)
    ? undefined
    : target;
};

interface BuildInventory {
  /** The project files a local build may run as code, in the order they were reached. */
  runs: Set<string>;
  /** Of those, the ones only a quoted path string names, not a module load: the weakest reason to count one. */
  namedByString: Set<string>;
  /**
   * Set when the walk cannot say which files the build runs: a file in it loads by a computed name, is not a
   * script (Node's CommonJS loader runs a required file of any other extension as JavaScript), or names a module
   * this walk cannot resolve. Then every change a pull makes counts.
   */
  unbounded?: string;
}

/**
 * The project files a local build runs as code: the root build configs, what stylesheet @config, @plugin and script
 * @import directives name, and everything those files load in turn, whatever their extension. Read from both the
 * local copy and the pull, so a file either side has is followed.
 */
function buildInventory(root: string, incoming: Map<string, string | undefined>): BuildInventory {
  const read = (rel: string): string[] =>
    [incoming.get(rel), localStoredContent(root, rel)].filter((c): c is string => typeof c === 'string');
  const exists = (rel: string) => incoming.has(rel) || localStoredContent(root, rel) !== undefined;
  // A package naming itself resolves through its own package.json "exports", into the project.
  const ownNames = read('frontend/package.json')
    .map((content) => parseJson(content)?.name)
    .filter((name): name is string => typeof name === 'string' && name.length > 0);
  const runs = new Set<string>();
  const namedByString = new Set<string>();
  const queue: string[] = [];
  let unbounded: string | undefined;
  const reach = (rel: string) => {
    namedByString.delete(rel);
    if (runs.has(rel)) return;
    runs.add(rel);
    queue.push(rel);
  };
  const reachNamed = (rel: string) => {
    if (runs.has(rel)) return;
    reach(rel);
    namedByString.add(rel);
  };
  /** Reaches every file a load of `target` could pick; false when none exists or a package.json picks it. */
  const reachPath = (target: string): boolean => {
    const found = RESOLVE_SUFFIXES.map((suffix) => target + suffix).filter(exists);
    found.forEach(reach);
    return found.length > 0 && !exists(`${target}/package.json`);
  };
  const unresolved = (from: string, spec: string) =>
    (unbounded ??= `${from} loads '${spec}', which this check cannot resolve`);
  /** A module name in `from`, resolved the way the loader would. */
  const load = (from: string, spec: string, cssPath = false) => {
    if (spec === '.' || spec === '..' || spec.startsWith('./') || spec.startsWith('../')) {
      const target = joinedPath(from, spec);
      if (!target || !reachPath(target)) unresolved(from, spec);
      return;
    }
    // A stylesheet names files relative to itself, with or without './' (Tailwind's @config always does).
    if (cssPath) {
      const target = joinedPath(from, spec);
      if (target && reachPath(target)) return;
    }
    if (isPackageName(spec) && !ownNames.some((name) => spec === name || spec.startsWith(`${name}/`))) return;
    // An absolute path, a URL, a '#' subpath import, a self-reference: any of them can lead into the project.
    unresolved(from, spec);
  };

  for (const rel of BUILD_TRUST_FILES.filter((r) => /\.config\./.test(r))) if (exists(rel)) reach(rel);
  const stylesheets = new Set([
    ...[...incoming.keys()].filter((rel) => STYLESHEET.test(rel)),
    ...collectProjectSource(root)
      .map((f) => f.path)
      .filter((rel) => STYLESHEET.test(rel)),
  ]);
  for (const sheet of stylesheets)
    for (const content of read(sheet))
      for (const directive of codeDirectives(content)) {
        const spec = directiveSpec(directive);
        if (spec) load(sheet, spec, true);
      }
  while (queue.length) {
    const rel = queue.shift() as string;
    if (DATA_FILE.test(rel)) continue;
    if (!CODE_FILE.test(rel)) unbounded ??= `the build runs ${rel} as code`;
    for (const content of read(rel)) {
      if (loadsByComputedName(content)) unbounded ??= `${rel} loads files by a computed name`;
      for (const match of content.matchAll(IMPORT_SPECIFIER)) load(rel, match[2]);
      for (const match of content.matchAll(RELATIVE_STRING)) {
        const target = GLOB.test(match[2]) ? undefined : joinedPath(rel, match[2]);
        if (target)
          RESOLVE_SUFFIXES.map((suffix) => target + suffix)
            .filter(exists)
            .forEach(reachNamed);
      }
    }
  }
  return { runs, namedByString, unbounded };
}

/*
  The inventory above follows literal imports only. A file the build runs that names what it loads at run time
  (`require(configName)`, `import(x)`, require passed around, eval or Function, createRequire, fs, process,
  globalThis, constructor tricks) could load any project file, and no reading of JavaScript can say which. Such a
  file is matched loosely on purpose: anything that might be indirect counts as indirect. A literal
  `require('./x')` or `import x from 'y'` does not.
*/
const LITERAL_REQUIRE = /\brequire\s*\(\s*(["'])[^"'`$\\]*\1\s*\)/g;
const LITERAL_DYNAMIC_IMPORT = /\bimport\s*\(\s*(["'])[^"'`$\\]*\1\s*\)/g;
const INDIRECT_LOAD =
  /require|\bimport\s*\(|import\.meta|\beval\b|\bFunction\b|\bconstructor\b|createRequire|\bjiti\b|\bglobalThis\b|\bglobal\b|\bprocess\b|\barguments\b|\bmodule\s*(?:\[|\.(?!exports\b))|\bReflect\b|\bvm\b/;
/** Node built-ins that read files or load code, named anywhere (a literal require of one is still indirect). */
const LOADER_BUILTIN = /["'](?:node:)?(?:fs|fs\/promises|vm|module|child_process|worker_threads)["']/;

/**
 * Whether code may load a file by a name computed at run time. Comments are read too: stripping them from JavaScript
 * by pattern can swallow code (a glob such as './src/**' opens one), and a false alarm only asks for approval.
 */
export function loadsByComputedName(code: string): boolean {
  return (
    LOADER_BUILTIN.test(code) ||
    INDIRECT_LOAD.test(code.replace(LITERAL_REQUIRE, '0').replace(LITERAL_DYNAMIC_IMPORT, '0'))
  );
}

const recordsRenders = (root: string): boolean => {
  const config = parseJson(localStoredContent(root, 'frontend/.tooljet/config.json') ?? '');
  return config?.recordRender === true;
};

/** Whether a stored path is one this project keeps (and so may be written or removed here). */
const isProjectPath = (rel: string) =>
  !rel.split('/').some((part) => part === '..' || part === '') &&
  (ROOT_FILES.includes(rel) || TREES.some((tree) => rel.startsWith(`${tree}/`)));

/** The stored files a pull of `stored` writes. */
const filesAPullWrites = (stored: StoredSource) =>
  (stored.files ?? []).filter((f) => isProjectPath(f.path) && typeof f.content === 'string');

/** The project's files a pull of `stored` removes: source files under the trees that it does not write. */
const filesAPullRemoves = (root: string, stored: StoredSource): string[] => {
  const keep = new Set(filesAPullWrites(stored).map((f) => f.path));
  return collectProjectSource(root)
    .map((local) => local.path)
    .filter((rel) => !keep.has(rel) && TREES.some((tree) => rel.startsWith(`${tree}/`)));
};

/** A folder Node and the bundler resolve package names from. This CLI never uploads one, so a pull should not hold one. */
const PACKAGE_FOLDER = /(?:^|\/)node_modules\//;

/**
 * What a pull of `stored` would change here that a local build runs: the fixed build-trust files, a stylesheet that
 * adds or changes a code-loading directive, a file such a directive or a build config loads (followed through every
 * file it loads, whatever the extension), any file under a node_modules folder, and, when this project renders
 * components in Node (recordRender), any changed component code. A change is a file the pull adds, rewrites or
 * removes, so a deletion or a rename counts wherever an addition would. When the walk cannot bound what the build
 * runs (BuildInventory.unbounded: a computed name, a required non-script file, a name it cannot resolve), in this
 * copy or in the pull, every change counts, whatever its extension: such a loader can read a document, plain text,
 * an SVG or a stylesheet and run what it holds (fs.readFileSync and new Function). Compared as stored, so a local
 * SDK path is no change.
 */
export function trustFileChanges(root: string, stored: StoredSource): string[] {
  const files = new Map((stored.files ?? []).map((f) => [f.path, f.content]));
  const removed = new Set(filesAPullRemoves(root, stored));
  const changes = (rel: string) =>
    removed.has(rel) || (files.has(rel) && files.get(rel) !== localStoredContent(root, rel));
  // Before and after together: everything the pull carries, and everything it takes away.
  const touched = [...new Set([...files.keys(), ...removed])].filter(changes);
  const entry = (rel: string, why: string) => `${rel} (${removed.has(rel) ? `removed; ${why}` : why})`;
  // Pulling never removes a root file, so a file stored source lacks changes nothing here.
  const changed = BUILD_TRUST_FILES.filter(changes);
  const named = new Set(changed);
  const note = (text: string, rel: string) => {
    if (named.has(rel)) return;
    named.add(rel);
    changed.push(text);
  };
  for (const [rel, content] of files) {
    if (!STYLESHEET.test(rel) || !changes(rel)) continue;
    const before = new Set(codeDirectives(localStoredContent(root, rel)));
    const added = codeDirectives(content).filter((directive) => !before.has(directive));
    if (added.length) note(`${rel} (${added.map((d) => d.split(' ')[0]).join(', ')})`, rel);
  }
  for (const rel of touched)
    if (PACKAGE_FOLDER.test(rel)) note(entry(rel, 'a package folder the build resolves packages from'), rel);
  const { runs, namedByString, unbounded } = buildInventory(root, files);
  for (const rel of runs) if (!namedByString.has(rel) && changes(rel)) note(entry(rel, 'loaded by the build'), rel);
  if (unbounded) {
    // No extension is safe here: the loader decides how it reads a file, so a changed .txt, .md or .svg counts too.
    for (const rel of touched) note(entry(rel, unbounded), rel);
  }
  for (const rel of namedByString) if (changes(rel)) note(entry(rel, 'loaded by the build'), rel);
  if (recordsRenders(root)) {
    for (const rel of touched)
      if (CODE_FILE.test(rel) && TREES.some((tree) => rel.startsWith(`${tree}/`)))
        note(entry(rel, 'recordRender runs it'), rel);
  }
  return changed;
}

/** The project's files a pull of `stored` would overwrite with other content or remove. */
export function filesAPullWouldChange(root: string, stored: StoredSource): string[] {
  const incoming = new Map((stored.files ?? []).map((f) => [f.path, f.content]));
  return collectProjectSource(root)
    .filter((local) =>
      incoming.has(local.path)
        ? incoming.get(local.path) !== local.content
        : TREES.some((tree) => local.path.startsWith(`${tree}/`))
    )
    .map((local) => local.path);
}

/**
 * Bring ToolJet's stored source into the project when it is newer than the project's last sync: files written,
 * files the editor deleted removed. Returns what changed, or `pulled: false` when the project is already in step.
 */
export function applyStoredSource(
  root: string,
  stored: StoredSource,
  versionId?: string
): { pulled: boolean; written: number; removed: number } {
  const files = filesAPullWrites(stored);
  // Code stored before ToolJet refused non-registry dependencies never reaches a server-mode install (which also checks
  // the registry host against this host's registries).
  if (isServerMode()) assertRegistryOnly(files as { path: string; content: string }[], null);
  let removed = 0;
  // Every target is checked before anything is written, so a refused pull changes nothing.
  for (const f of files) projectPath(root, f.path);
  projectPath(root, 'frontend/package.json');
  // The same list trustFileChanges counts, so nothing is removed that it did not weigh.
  for (const rel of filesAPullRemoves(root, stored)) {
    fs.rmSync(projectPath(root, rel));
    removed++;
  }
  for (const f of files) {
    const target = projectPath(root, f.path);
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
      throw new Error(
        "This app's source is owned by its repository; push there, or pass --source-replace to move it to ToolJet."
      );
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
