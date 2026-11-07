import * as esbuild from 'esbuild';
import * as fs from 'fs';
import * as path from 'path';
import type * as TS from 'typescript';

import { isServerMode } from '../server-mode';

/*
  What a build may read: the project and the packages installed for it. Every file esbuild loads (JS and CSS imports,
  CSS url() assets, tsconfig paths targets) and every file the TypeScript program or tsconfig names is checked after
  following symlinks, before it is read, so source cannot pull another project's files or a host file into the bundle,
  the manifest or an error report.

  Server mode allows only the project itself, its own node_modules included. A local build also allows node_modules
  folders above the project (a workspace that hoists packages) and packages node_modules links elsewhere (npm link,
  workspace packages): those links are made by the developer's package manager, not by the source being built.
*/
export interface Confinement {
  projectRoot: string;
  /** Real paths a file the build reads may sit in. */
  roots: string[];
}

const realpath = (file: string): string => {
  try {
    return fs.realpathSync.native(file);
  } catch {
    // A path that does not exist yet: resolve its nearest existing parent, so a symlinked parent still counts.
    const parent = path.dirname(file);
    return parent === file ? file : path.join(realpath(parent), path.basename(file));
  }
};

const isInside = (file: string, root: string) => {
  const rel = path.relative(root, file);
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
};

/** The real folders of the packages a node_modules folder links elsewhere (`pkg` and `@scope/pkg` entries). */
const linkedPackages = (folder: string): string[] => {
  const linked: string[] = [];
  const visit = (dir: string, depth: number) => {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isSymbolicLink()) linked.push(realpath(full));
      else if (depth === 0 && entry.isDirectory() && entry.name.startsWith('@')) visit(full, 1);
    }
  };
  visit(folder, 0);
  return linked;
};

export function projectConfinement(projectRoot: string, serverMode: boolean = isServerMode()): Confinement {
  const absolute = path.resolve(projectRoot);
  const roots = new Set([realpath(absolute)]);
  if (!serverMode) {
    for (let dir = absolute; ; dir = path.dirname(dir)) {
      const folder = path.join(dir, 'node_modules');
      if (fs.existsSync(folder)) {
        roots.add(realpath(folder));
        for (const linked of linkedPackages(folder)) roots.add(linked);
      }
      if (path.dirname(dir) === dir) break;
    }
  }
  return { projectRoot: absolute, roots: [...roots] };
}

/** Why `file` may not be read by this build, or undefined when it may. */
export function confinementDenial(confinement: Confinement, file: string): string | undefined {
  const real = realpath(path.resolve(confinement.projectRoot, file));
  if (confinement.roots.some((root) => isInside(real, root))) return undefined;
  return `${file} is outside the project; a build reads only the project and its installed packages.`;
}

/**
 * esbuild plugin, registered first: refuses to load a file outside the confinement, before esbuild or another plugin
 * reads it. A check at load time sees every file the bundle takes in, however it was resolved.
 */
export const confinementPlugin = (confinement: Confinement): esbuild.Plugin => ({
  name: 'tooljet-confinement',
  setup(build) {
    build.onLoad({ filter: /.*/, namespace: 'file' }, (args) => {
      const denial = confinementDenial(confinement, args.path);
      return denial ? { errors: [{ text: `Refused: ${denial}` }] } : undefined;
    });
  },
});

/** Throws when tsconfig.json, or a config it extends, or a file it includes, is outside the confinement. */
export function assertTsconfigConfined(ts: typeof TS, confinement: Confinement, tsconfigPath: string): void {
  const denial = confinementDenial(confinement, tsconfigPath);
  if (denial) throw new Error(`Refused tsconfig.json: ${denial}`);
  const { config, error } = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
  if (error || !config) return; // the build reports an unreadable tsconfig itself
  const refused: string[] = [];
  const guard =
    <T>(fallback: T, read: (file: string) => T) =>
    (file: string) => {
      const reason = confinementDenial(confinement, file);
      if (reason) {
        refused.push(file);
        return fallback;
      }
      return read(file);
    };
  const host: TS.ParseConfigHost = {
    useCaseSensitiveFileNames: ts.sys.useCaseSensitiveFileNames,
    // A lookup outside (an `extends` package searched for in folders above) just finds nothing; only a read is refused.
    fileExists: (file) => !confinementDenial(confinement, file) && ts.sys.fileExists(file),
    readFile: guard<string | undefined>(undefined, ts.sys.readFile),
    readDirectory: (root, extensions, excludes, includes, depth) =>
      confinementDenial(confinement, root)
        ? (refused.push(root), [])
        : ts.sys.readDirectory(root, extensions, excludes, includes, depth),
  };
  const parsed = ts.parseJsonConfigFileContent(config, host, path.dirname(tsconfigPath));
  for (const file of parsed.fileNames) if (confinementDenial(confinement, file)) refused.push(file);
  if (refused.length)
    throw new Error(
      `Refused tsconfig.json: it names ${[...new Set(refused)].slice(0, 3).join(', ')}, outside the project; ` +
        'a build reads only the project and its installed packages.'
    );
}

/**
 * A TypeScript compiler host that sees only the confinement and TypeScript's own lib files: a file outside does not
 * exist for it, so the program never reads it and an error report never quotes it.
 */
export function confinedCompilerHost(
  ts: typeof TS,
  confinement: Confinement,
  options: TS.CompilerOptions
): TS.CompilerHost {
  const host = ts.createCompilerHost(options);
  const libDir = realpath(path.dirname(ts.getDefaultLibFilePath(options)));
  const allowed = (file: string) =>
    isInside(realpath(path.resolve(file)), libDir) || !confinementDenial(confinement, file);
  return {
    ...host,
    fileExists: (file) => allowed(file) && host.fileExists(file),
    readFile: (file) => (allowed(file) ? host.readFile(file) : undefined),
    directoryExists: host.directoryExists ? (dir) => allowed(dir) && host.directoryExists!(dir) : undefined,
    getSourceFile: (file, languageVersion, onError, shouldCreate) =>
      allowed(file) ? host.getSourceFile(file, languageVersion, onError, shouldCreate) : undefined,
  };
}
