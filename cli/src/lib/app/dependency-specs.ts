import * as fs from 'fs';
import * as path from 'path';

/*
  An app project's dependencies come from the npm registry only. npm fetches or links whatever package.json or the
  lockfile names: `file:/` becomes a symlink to the host's root in node_modules, and a git or tarball URL is fetched
  from the build host before anything scans it. ToolJet refuses to store such a project (server/ee
  code-mode-source/dependencies.ts, the same rules), and in server mode the CLI refuses to install one, so a project
  stored before that check cannot reach npm either.

  Registries: https://registry.npmjs.org/ (and registry.yarnpkg.com), npm_config_registry and the comma-separated
  TOOLJET_CODE_NPM_REGISTRIES.
*/

const SPEC_FIELDS = ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies', 'resolutions'];
const REGISTRY_SPEC = /^[A-Za-z0-9._^~<>=*|+ \t-]*$/;
const OVERRIDE_REFERENCE = /^\$(@[a-z0-9][a-z0-9._~-]*\/)?[a-z0-9][a-z0-9._~-]*$/;
const DEFAULT_REGISTRIES = ['https://registry.npmjs.org/', 'https://registry.yarnpkg.com/'];

const withSlash = (url: string) => (url.endsWith('/') ? url : `${url}/`);

export function allowedRegistries(env: NodeJS.ProcessEnv = process.env): string[] {
  const configured = [
    env.npm_config_registry,
    env.NPM_CONFIG_REGISTRY,
    ...(env.TOOLJET_CODE_NPM_REGISTRIES ?? '').split(','),
  ]
    .map((url) => url?.trim())
    .filter((url): url is string => !!url && /^https?:\/\//i.test(url));
  return [...new Set([...DEFAULT_REGISTRIES, ...configured].map(withSlash))];
}

export function specProblem(spec: unknown): string | undefined {
  if (typeof spec !== 'string') return 'is not a version';
  if (spec.trim().startsWith('npm:')) return `is an alias (${spec}); name the package itself`;
  return REGISTRY_SPEC.test(spec) ? undefined : `is "${spec}", not a version from the npm registry`;
}

function overrideProblems(overrides: unknown, at: string, out: string[]): void {
  if (!overrides || typeof overrides !== 'object') return;
  for (const [name, value] of Object.entries(overrides)) {
    const where = `${at} > ${name}`;
    if (typeof value === 'string') {
      const problem = OVERRIDE_REFERENCE.test(value) ? undefined : specProblem(value);
      if (problem) out.push(`override ${where} ${problem}`);
    } else overrideProblems(value, where, out);
  }
}

export function manifestProblems(manifest: Record<string, any>): string[] {
  const out: string[] = [];
  for (const field of SPEC_FIELDS) {
    const specs = manifest[field];
    if (!specs || typeof specs !== 'object') continue;
    for (const [name, spec] of Object.entries(specs)) {
      const problem = specProblem(spec);
      if (problem) out.push(`"${name}" in ${field} ${problem}`);
    }
  }
  if (manifest.overrides) overrideProblems(manifest.overrides, 'overrides', out);
  if (manifest.workspaces) out.push('"workspaces" links folders into the install; Code mode projects have none');
  return out;
}

/**
 * Lockfile entries that link a folder or resolve outside the registries. With `registries` null (an upload: the
 * server knows its own registries and checks the host), only addresses that are not http(s) at all are refused.
 */
export function lockfileProblems(lock: Record<string, any>, registries: string[] | null): string[] {
  const out: string[] = [];
  const resolvedProblem = (name: string, resolved: unknown): string | undefined => {
    if (resolved === undefined) return undefined;
    if (typeof resolved !== 'string') return `${name} has no registry address`;
    const ok = registries ? registries.some((r) => resolved.startsWith(r)) : /^https?:\/\//i.test(resolved);
    return ok ? undefined : `${name} resolves to ${resolved.slice(0, 120)}, not an allowed npm registry`;
  };
  const packages = lock.packages;
  if (packages && typeof packages === 'object') {
    for (const [key, entry] of Object.entries<any>(packages)) {
      if (key === '') {
        if (entry && typeof entry === 'object') out.push(...manifestProblems(entry));
        continue;
      }
      if (!key.startsWith('node_modules/')) out.push(`${key} is a local folder, not an installed package`);
      else if (entry?.link) out.push(`${key} is a link to ${String(entry.resolved ?? 'a folder')}`);
      else {
        const problem = resolvedProblem(key, entry?.resolved);
        if (problem) out.push(problem);
      }
    }
  } else {
    const walk = (deps: unknown, at: string) => {
      if (!deps || typeof deps !== 'object') return;
      for (const [name, entry] of Object.entries<any>(deps)) {
        const where = at ? `${at} > ${name}` : name;
        if (typeof entry?.version === 'string' && /[:/#]/.test(entry.version))
          out.push(`${where} is "${entry.version.slice(0, 120)}", not a registry version`);
        const problem = resolvedProblem(where, entry?.resolved);
        if (problem) out.push(problem);
        walk(entry?.dependencies, where);
      }
    };
    walk(lock.dependencies, '');
  }
  return [...new Set(out)];
}

const parse = (content: string): Record<string, any> | undefined => {
  try {
    const value = JSON.parse(content);
    return value && typeof value === 'object' && !Array.isArray(value) ? value : undefined;
  } catch {
    return undefined;
  }
};

/** Problems with one project file ('frontend/package.json' or 'frontend/package-lock.json'); empty for any other. */
export function dependencyProblems(rel: string, content: string, registries: string[] | null): string[] {
  const json = rel === 'frontend/package.json' || rel === 'frontend/package-lock.json' ? parse(content) : undefined;
  if (!json) return [];
  return rel === 'frontend/package.json' ? manifestProblems(json) : lockfileProblems(json, registries);
}

export class NonRegistryDependencyError extends Error {
  constructor(rel: string, problems: string[]) {
    super(
      `${rel}: ${problems.slice(0, 5).join('; ')}${problems.length > 5 ? ` (and ${problems.length - 5} more)` : ''}. ` +
        'Code mode installs packages from the npm registry only: no git, URL, file:, link:, alias or workspace dependencies.'
    );
  }
}

/** Throws when the files name a dependency that is not from the registry. */
export function assertRegistryOnly(files: { path: string; content: string }[], registries: string[] | null): void {
  for (const file of files) {
    const problems = dependencyProblems(file.path, file.content, registries);
    if (problems.length) throw new NonRegistryDependencyError(file.path, problems);
  }
}

/** The same for a project's frontend folder on disk (server-mode installs), against this host's registries. */
export function assertRegistryOnlyProject(frontend: string, env: NodeJS.ProcessEnv = process.env): void {
  const files = ['package.json', 'package-lock.json']
    .filter((name) => fs.existsSync(path.join(frontend, name)))
    .map((name) => ({ path: `frontend/${name}`, content: fs.readFileSync(path.join(frontend, name), 'utf8') }));
  assertRegistryOnly(files, allowedRegistries(env));
}

/**
 * Symlinks under node_modules that lead outside the project, which a registry install never makes (its .bin links
 * point inside). Walks node_modules folders only: each package's own node_modules, never its files.
 */
export function linksOutOfProject(frontend: string): string[] {
  const root = fs.realpathSync(frontend);
  const out: string[] = [];
  const inside = (target: string) => target === root || target.startsWith(root + path.sep);
  const visitModules = (dir: string, depth: number) => {
    if (depth > 64) return;
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isSymbolicLink()) {
        let target: string;
        try {
          target = fs.realpathSync(full);
        } catch {
          continue; // dangling: nothing to read through it
        }
        if (!inside(target)) out.push(path.relative(frontend, full));
        continue;
      }
      if (!entry.isDirectory()) continue;
      if (entry.name.startsWith('@') || entry.name === '.bin') visitModules(full, depth + 1);
      else visitModules(path.join(full, 'node_modules'), depth + 1);
    }
  };
  visitModules(path.join(frontend, 'node_modules'), 0);
  return out;
}
