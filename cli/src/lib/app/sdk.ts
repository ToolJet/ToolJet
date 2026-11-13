import * as fs from 'fs';
import * as path from 'path';
import fetch = require('node-fetch');

import {
  detectPackageManager,
  formatCommand,
  installCommand,
  installDependencies,
  lockMismatch,
  needsInstall,
  Runner,
} from './deps';
import { isServerMode } from '../server-mode';

/*
  The custom component SDK in an app project. A local build replaces its import (lib/library/builder.ts), so a project
  needs it for types only, and those types decide whether a build is uploaded.

  A machine-local SDK (a file: path) never leaves the machine. An older ToolJet wrote its own path into
  frontend/package.json and the lockfile, and a teammate's clone then had no SDK (TS2307), so:
  - what is uploaded or put in a build's manifest names the template's published version, whatever this checkout uses;
  - a file: path that does not exist on this machine becomes that version, with the lockfile entry to match.

  npm's published SDK can lag behind this server (0.1.0-beta.3 has no useQuery, useGlobals, useNavigation or useTheme). So
  after an install a project whose SDK lacks those types gets the one TOOLJET_SDK_SPEC names, else the one its ToolJet
  serves, with --no-save: package.json and the lockfile keep naming the published version.
*/

export const SDK_PACKAGE = '@tooljet/custom-component-sdk';
const LOCK_KEY = `node_modules/${SDK_PACKAGE}`;
const SECTIONS = ['dependencies', 'devDependencies'];
const LOCAL_SPEC = /^(file:|link:|\.{0,2}\/)/;
export const SDK_TYPES_FILE = 'node_modules/@tooljet/custom-component-sdk/dist/types.d.ts';

/** The version the app template pins, and its lockfile entry: the template's package-lock.json is the one source. */
export function publishedSdk(): { version: string; entry: Record<string, unknown> } {
  const lock = path.join(__dirname, '..', '..', 'app-template', 'frontend', 'package-lock.json');
  const entry = JSON.parse(fs.readFileSync(lock, 'utf8')).packages[LOCK_KEY];
  return { version: entry.version, entry };
}

const toJson = (value: unknown) => JSON.stringify(value, null, 2) + '\n';

const parse = (content: string): Record<string, any> | undefined => {
  try {
    const value = JSON.parse(content);
    return value && typeof value === 'object' ? value : undefined;
  } catch {
    return undefined;
  }
};

const pinLocalSpec = (manifest: Record<string, any> | undefined, version: string): boolean => {
  let changed = false;
  for (const section of SECTIONS) {
    const spec = manifest?.[section]?.[SDK_PACKAGE];
    if (typeof spec === 'string' && LOCAL_SPEC.test(spec)) {
      (manifest as Record<string, any>)[section][SDK_PACKAGE] = version;
      changed = true;
    }
  }
  return changed;
};

/** package.json's text with a local SDK path replaced by the published version; the same text when it has none. */
export function manifestWithPublishedSdk(content: string): string {
  const manifest = parse(content);
  return pinLocalSpec(manifest, publishedSdk().version) ? toJson(manifest) : content;
}

/** package-lock.json's text with a local SDK link replaced by the published entry; the same text when it has none. */
export function lockWithPublishedSdk(content: string): string {
  const lock = parse(content);
  const packages = lock?.packages;
  if (!lock || !packages) return content;
  const { version, entry } = publishedSdk();
  const pinned = pinLocalSpec(packages[''], version);
  const linked = packages[LOCK_KEY]?.link === true;
  if (!pinned && !linked) return content;
  if (linked) {
    const target = packages[LOCK_KEY].resolved as string;
    for (const key of Object.keys(packages)) if (key === target || key.startsWith(`${target}/`)) delete packages[key];
  }
  packages[LOCK_KEY] = entry;
  return toJson(lock);
}

/** The local SDK path this project's package.json names, resolved; undefined when it names none. */
const localSdkPath = (frontend: string, manifest: Record<string, any> | undefined): string | undefined => {
  for (const section of SECTIONS) {
    const spec = manifest?.[section]?.[SDK_PACKAGE];
    if (typeof spec === 'string' && LOCAL_SPEC.test(spec))
      return path.resolve(frontend, spec.replace(/^(file:|link:)/, ''));
  }
  return undefined;
};

/** Replaces an SDK path that does not exist on this machine with the published version. True when it changed anything. */
export function repairSdk(frontend: string): boolean {
  const manifestFile = path.join(frontend, 'package.json');
  if (!fs.existsSync(manifestFile)) return false;
  const content = fs.readFileSync(manifestFile, 'utf8');
  const local = localSdkPath(frontend, parse(content));
  if (!local || fs.existsSync(local)) return false;
  fs.writeFileSync(manifestFile, manifestWithPublishedSdk(content));
  const lockFile = path.join(frontend, 'package-lock.json');
  if (fs.existsSync(lockFile)) fs.writeFileSync(lockFile, lockWithPublishedSdk(fs.readFileSync(lockFile, 'utf8')));
  return true;
}

const hasCodeModeTypes = (frontend: string) => {
  try {
    return fs.readFileSync(path.join(frontend, SDK_TYPES_FILE), 'utf8').includes('useNavigation');
  } catch {
    return false;
  }
};

export const sdkTarballUrl = (server: string) =>
  `${server.replace(/\/+$/, '')}/api/code-mode/cli/custom-component-sdk.tgz`;

/** The SDK this ToolJet serves, if it does: a gzip answer, since a dev frontend answers every path with its HTML. */
async function servedSdk(server: string): Promise<string | undefined> {
  const url = sdkTarballUrl(server);
  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'error', timeout: 5000 });
    return res.ok && /gzip|octet-stream/.test(res.headers.get('content-type') ?? '') ? url : undefined;
  } catch {
    return undefined;
  }
}

export type SdkSource = 'current' | 'installed' | 'unavailable';

/** True when node_modules holds the SDK as a link to a folder elsewhere (npm's install of a file: spec). */
export const sdkIsLinked = (frontend: string): boolean => {
  try {
    return fs.lstatSync(path.join(frontend, 'node_modules', SDK_PACKAGE)).isSymbolicLink();
  } catch {
    return false;
  }
};

/**
 * Gives a project whose SDK lacks the app types the right one, without recording it in the project's files.
 *
 * In server mode the SDK is copied into node_modules (--install-links), never linked: a server-mode build reads only
 * the project (lib/library/confinement.ts), so a linked SDK's types were out of its reach. Every `ToolJet` import then
 * failed with TS2307 and every hook result was `any` (TS7006 on each callback): 33 failed build rounds in 17 AI builds
 * on 2026-11-04, some of which declared the module themselves to get past it. A linked SDK is replaced the same way.
 */
export async function installCodeModeSdk(
  frontend: string,
  options: { server?: string; run?: Runner } = {}
): Promise<SdkSource> {
  const copyIn = isServerMode();
  if (hasCodeModeTypes(frontend) && !(copyIn && sdkIsLinked(frontend))) return 'current';
  if (detectPackageManager(frontend) !== 'npm') return 'unavailable';
  const spec = process.env.TOOLJET_SDK_SPEC || (options.server ? await servedSdk(options.server) : undefined);
  if (!spec) return 'unavailable';
  const { env } = installCommand('npm', false);
  const args = [
    'install',
    '--no-save',
    '--ignore-scripts',
    '--no-audit',
    '--no-fund',
    ...(copyIn ? ['--install-links'] : []),
    spec,
  ];
  installDependencies(frontend, { run: options.run, command: { command: 'npm', args, env } });
  return 'installed';
}

/**
 * Makes a project's dependencies ready, for every command that installs: repairs a foreign SDK path, installs when asked
 * (`always`), when that repair needs it or when nothing is installed, then checks the SDK's types. Returns what to tell
 * the user.
 */
export async function prepareDependencies(
  frontend: string,
  options: { always?: boolean; frozen?: boolean; server?: string; run?: Runner } = {}
): Promise<{ success: string[]; warnings: string[] }> {
  const success: string[] = [];
  const warnings: string[] = [];
  const repaired = repairSdk(frontend);
  if (repaired) success.push(`Replaced an SDK path from another machine with ${SDK_PACKAGE}@${publishedSdk().version}`);
  const stale = !options.always && !repaired && !needsInstall(frontend) ? lockMismatch(frontend) : undefined;
  if (options.always || repaired || stale || needsInstall(frontend)) {
    // A stale install is put right from the lockfile exactly: npm ci, which fails if package.json disagrees with it.
    const cmd = installDependencies(frontend, { frozen: options.frozen || !!stale, run: options.run });
    success.push(
      `${stale ? `Reinstalled, as ${stale}, with` : 'Installed with'} ${formatCommand(cmd)} (no install scripts ran)`
    );
  }
  const sdk = await installCodeModeSdk(frontend, { server: options.server, run: options.run });
  if (sdk === 'installed') success.push('Installed the custom component SDK that matches this ToolJet');
  if (sdk === 'unavailable') {
    warnings.push(
      `${SDK_PACKAGE} here has no app types, and ${
        options.server ?? 'no signed-in ToolJet server'
      } does not offer them: ` + 'expect TypeScript errors on ToolJet.useQuery, useGlobals and useNavigation.'
    );
  }
  return { success, warnings };
}
