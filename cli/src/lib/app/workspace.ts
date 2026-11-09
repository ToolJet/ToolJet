import * as fs from 'fs';
import * as path from 'path';

import { ApiError, type Session } from './session';
import { Project, GEN_FILE, Snapshot } from './project';
import { listVersions, pickVersion, pullSnapshot, readApp, VersionInfo } from './remote';
import { scaffoldApp } from './scaffold';
import { repairSdk } from './sdk';
import { findCodeRoot, parseRegistry } from './existing';
import { generateTypes } from './typegen';
import { applyStoredSource, fetchStoredSource, type SourceOwner } from './source-upload';
import { workingApp } from './branch';
import { writeProjectInstance } from './instance';

/*
  What `tooljet app clone`, `pull` and `checkout` do to a project folder, apart from the command line, so tests can
  run them against a fake session.
*/

/** Reads the app (the checked-out version, else the editing one) and refreshes the snapshot and the typed hooks. */
export async function pullProject(session: Session, project: Project): Promise<Snapshot> {
  const app = project.readApp();
  if (!app.appId) throw new Error('app.json has no appId: create the app (tooljet app init --create) or clone one.');
  const { version } = (await workingApp(session, project.root, app)).app;
  const snapshot = await pullSnapshot(session, app.appId, version?.id);
  project.writeSnapshot(snapshot);
  fs.writeFileSync(path.join(project.frontend, GEN_FILE), generateTypes(app, snapshot));
  repairSdk(project.frontend);
  return snapshot;
}

export interface CloneResult {
  dir: string;
  project: Project;
  name: string;
  snapshot: Snapshot;
  /** The app already has a code page (its route registry was copied into app.json). */
  hasCodePage: boolean;
  /** The code ToolJet stores for the cloned version, written into the project; null when none is stored. */
  source: { revision: number; owner: SourceOwner; written: number } | null;
  /** The instance the project now belongs to (.tooljet/instance.json). */
  instance: string;
}

/** A new project folder linked to an existing app: app.json from its code page and routes, then a pull. */
export async function cloneApp(session: Session, appId: string, dir?: string): Promise<CloneResult> {
  const remote = await readApp(session, appId);
  const target = dir ?? remote.slug ?? remote.id;
  scaffoldApp(target, remote.name);
  const project = new Project(path.resolve(target));
  const app = project.readApp();
  const code = findCodeRoot(remote.pages);
  if (code) {
    app.codePage = { handle: code.page.handle, name: code.page.name };
    const routes = parseRegistry(code.component);
    if (routes.length)
      app.routes = routes.map(({ id, path: p, title }) => ({ id, path: p, ...(title ? { title } : {}) }));
    const correlationId = code.component.definition?.properties?.correlationId?.value;
    if (correlationId) {
      const configFile = path.join(project.frontend, '.tooljet', 'config.json');
      const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
      fs.writeFileSync(configFile, JSON.stringify({ ...config, correlationId }, null, 2) + '\n');
    }
  }
  project.writeApp({ ...app, name: remote.name, appId: remote.id });
  writeProjectInstance(project.root, session.url);
  const snapshot = await pullProject(session, project);
  const source = code ? await pullStoredSource(session, project, remote.id, snapshot.versionId) : null;
  return { dir: target, project, name: remote.name, snapshot, hasCodePage: !!code, source, instance: new URL(session.url).origin };
}

/** Writes the version's stored code over the starter template (and records it in .tooljet/source.json). */
async function pullStoredSource(
  session: Session,
  project: Project,
  appId: string,
  versionId: string
): Promise<CloneResult['source']> {
  const where = { appId, versionId };
  try {
    if (!(await fetchStoredSource(session, where)).exists) return null;
  } catch (err) {
    // A ToolJet without stored source answers 404: the app's code then lives only in its repository.
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
  const stored = await fetchStoredSource(session, where, true);
  const { written } = applyStoredSource(project.root, stored, versionId);
  return { revision: stored.revision as number, owner: stored.owner as SourceOwner, written };
}

export interface CheckoutResult {
  /** The version now checked out; null when the project follows the app's editing version again. */
  version: VersionInfo | null;
  snapshot: Snapshot;
  /** dev and publish change the version they work on, which only a draft allows. */
  readOnly: boolean;
}

/**
 * Points the project at one ToolJet version (by name or id), or back at the editing version (`wanted` null), and
 * pulls it. A checked-out version wins over the git branch the folder is on (see branch.ts).
 */
export async function checkoutVersion(
  session: Session,
  project: Project,
  wanted: string | null
): Promise<CheckoutResult> {
  const app = project.readApp();
  if (!app.appId) throw new Error('app.json has no appId: create the app (tooljet app init --create) or clone one.');
  let version: VersionInfo | null = null;
  if (wanted !== null) version = pickVersion(await listVersions(session, app.appId), wanted);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { version: _previous, ...rest } = app;
  project.writeApp(version ? { ...rest, version: { id: version.id, name: version.name } } : rest);
  const snapshot = await pullProject(session, project);
  const status = version?.status ?? (await readApp(session, app.appId, version?.id)).versionStatus;
  return { version, snapshot, readOnly: !!status && status !== 'DRAFT' };
}
