import * as fs from 'fs';
import * as path from 'path';

/*
  An app project: what `tooljet app init` or `clone` creates and the other commands work in.

    app.json            the app: its ToolJet id, the code page and the code page's routes
    frontend/           the code page's React + TypeScript source (built into the app's code page)
    frontend/src/tooljet.gen.ts   typed hooks for the app's queries and routes (`tooljet app pull`)
    .tooljet/snapshot.json        what `pull` last read from ToolJet (queries, tables, pages), for `check`
*/

export interface RouteDecl {
  id: string;
  path: string;
  title?: string;
}

export interface AppJson {
  name: string;
  appId?: string;
  /** The ToolJet version the project works on (`tooljet app checkout`); absent means the app's editing version. */
  version?: { id: string; name: string };
  /** The workspace git branch to work on, instead of the branch this folder's git checkout is on. */
  branch?: string;
  codePage: { handle: string; name: string };
  routes: RouteDecl[];
}

export const APP_FILE = 'app.json';
export const FRONTEND_DIR = 'frontend';
export const GEN_FILE = path.join('src', 'tooljet.gen.ts');
export const SNAPSHOT_FILE = path.join('.tooljet', 'snapshot.json');

const ROUTE_ID = /^[a-z][a-z0-9_-]*$/;

export const validateAppJson = (data: unknown): string[] => {
  const errors: string[] = [];
  const app = data as Partial<AppJson>;
  if (!app || typeof app !== 'object') return ['app.json is not an object'];
  if (typeof app.name !== 'string' || !app.name.trim()) errors.push('app.json: "name" is required');
  if (!app.codePage || typeof app.codePage.handle !== 'string' || !/^[a-z0-9][a-z0-9-]*$/.test(app.codePage.handle)) {
    errors.push('app.json: "codePage.handle" must be lowercase letters, digits and hyphens');
  }
  if (!Array.isArray(app.routes) || app.routes.length === 0)
    errors.push('app.json: "routes" must list at least one route');
  if (
    app.version !== undefined &&
    (!app.version || typeof app.version.id !== 'string' || typeof app.version.name !== 'string')
  ) {
    errors.push('app.json: "version" must be { "id", "name" } (set it with `tooljet app checkout`)');
  }
  if (app.branch !== undefined && (typeof app.branch !== 'string' || !app.branch.trim())) {
    errors.push('app.json: "branch" must be a git branch name');
  }
  const ids = new Set<string>();
  const paths = new Set<string>();
  for (const route of app.routes ?? []) {
    if (!route || typeof route.id !== 'string' || !ROUTE_ID.test(route.id)) {
      errors.push(
        `app.json: route id "${route?.id}" must start with a letter and use lowercase letters, digits, _ and -`
      );
      continue;
    }
    if (ids.has(route.id)) errors.push(`app.json: route id "${route.id}" is listed twice`);
    ids.add(route.id);
    if (typeof route.path !== 'string' || !route.path.startsWith('/'))
      errors.push(`app.json: route "${route.id}" needs a path starting with /`);
    else if (paths.has(route.path)) errors.push(`app.json: path "${route.path}" is used by two routes`);
    else paths.add(route.path);
  }
  return errors;
};

export class Project {
  constructor(readonly root: string) {}

  static find(start: string = process.cwd()): Project {
    let dir = path.resolve(start);
    for (;;) {
      if (fs.existsSync(path.join(dir, APP_FILE))) return new Project(dir);
      const parent = path.dirname(dir);
      if (parent === dir)
        throw new Error(`No ${APP_FILE} here or above: run this inside an app project (tooljet app init / clone).`);
      dir = parent;
    }
  }

  get frontend(): string {
    return path.join(this.root, FRONTEND_DIR);
  }

  readApp(): AppJson {
    const file = path.join(this.root, APP_FILE);
    let data: unknown;
    try {
      data = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (err) {
      throw new Error(`${APP_FILE} is not valid JSON: ${(err as Error).message}`);
    }
    const errors = validateAppJson(data);
    if (errors.length) throw new Error(errors.join('\n'));
    return data as AppJson;
  }

  writeApp(app: AppJson): void {
    fs.writeFileSync(path.join(this.root, APP_FILE), JSON.stringify(app, null, 2) + '\n');
  }

  readLibraryConfig(): { libraryName: string; correlationId: string } {
    return JSON.parse(fs.readFileSync(path.join(this.frontend, '.tooljet', 'config.json'), 'utf8'));
  }

  /**
   * The library ToolJet says the app builds into (remote.ts appLibrary). When it is not the one the config names (the
   * app already has its own, or a new one got a name of its own), the config follows it, keeping its other settings,
   * so the code stored next names it.
   */
  async useAppLibrary<T extends { name: string; correlationId: string }>(
    resolve: (wanted: { correlationId: string; name: string }) => Promise<T>
  ): Promise<{ library: T; changed: boolean }> {
    const file = path.join(this.frontend, '.tooljet', 'config.json');
    const config = JSON.parse(fs.readFileSync(file, 'utf8'));
    const library = await resolve({ correlationId: config.correlationId, name: config.libraryName });
    const changed = library.correlationId !== config.correlationId || library.name !== config.libraryName;
    if (changed) {
      const next = { ...config, libraryName: library.name, correlationId: library.correlationId };
      fs.writeFileSync(file, JSON.stringify(next, null, 2) + '\n');
    }
    return { library, changed };
  }

  readSnapshot(): Snapshot | null {
    const file = path.join(this.root, SNAPSHOT_FILE);
    return fs.existsSync(file) ? (JSON.parse(fs.readFileSync(file, 'utf8')) as Snapshot) : null;
  }

  writeSnapshot(snapshot: Snapshot): void {
    fs.mkdirSync(path.join(this.root, '.tooljet'), { recursive: true });
    fs.writeFileSync(path.join(this.root, SNAPSHOT_FILE), JSON.stringify(snapshot, null, 2) + '\n');
  }

  /** The entry component's name, from the frontend's index.ts (the one export the build turns into the code page). */
  rootComponentName(): string {
    const index = fs.readFileSync(path.join(this.frontend, 'src', 'index.ts'), 'utf8');
    const match = /export\s*\{\s*(\w+)/.exec(index);
    return match ? match[1] : 'App';
  }
}

export interface SnapshotColumn {
  name: string;
  type: string;
  nullable: boolean;
}

export interface SnapshotQuery {
  name: string;
  kind: string;
  operation?: string;
  table?: string;
  params: string[];
}

export interface Snapshot {
  appId: string;
  appName: string;
  versionId: string;
  versionName?: string;
  pulledAt: string;
  pages: { id: string; handle: string; name: string; hidden: boolean }[];
  queries: SnapshotQuery[];
  tables: Record<string, SnapshotColumn[]>;
}
