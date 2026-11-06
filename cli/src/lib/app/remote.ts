import { randomUUID } from 'crypto';

import { ApiError, type Session } from './session';
import type { AppJson, Snapshot, SnapshotColumn } from './project';

/* The ToolJet calls `tooljet app` makes, all through the user's session (session.ts). */

export interface RemoteApp {
  id: string;
  name: string;
  slug: string;
  versionId: string;
  versionStatus?: string;
  versionName?: string;
  globalSettings: Record<string, any>;
  pages: any[];
  queries: any[];
}

/** The app as ToolJet's editor reads it: its editing version, or the given version (`tooljet app checkout`). */
export async function readApp(session: Session, appId: string, versionId?: string): Promise<RemoteApp> {
  const app = await session.api(versionId ? `/v2/apps/${appId}/versions/${versionId}` : `/apps/${appId}`);
  const version = app.editing_version ?? {};
  return {
    id: app.id,
    name: app.name,
    slug: app.slug,
    versionId: version.id,
    versionStatus: version.status,
    versionName: version.name,
    globalSettings: version.global_settings ?? version.globalSettings ?? {},
    pages: app.pages ?? [],
    queries: app.data_queries ?? [],
  };
}

export async function createApp(session: Session, name: string): Promise<{ id: string }> {
  const app = await session.api('/apps', { method: 'POST', body: { name, type: 'front-end' } });
  return { id: app.id };
}

/** Reads the app's queries, the ToolJet DB tables they use and its pages, as `check` and the type generator need. */
export async function pullSnapshot(session: Session, appId: string, versionId?: string): Promise<Snapshot> {
  const app = await readApp(session, appId, versionId);
  const tables: Record<string, SnapshotColumn[]> = {};
  const needsTables = app.queries.some((q) => q.kind === 'tooljetdb' && q.options?.table_id);
  const tableNames = new Map<string, string>();
  if (needsTables) {
    const listed = await session.api(`/tooljet-db/organizations/${session.organizationId}/tables`);
    for (const t of listed?.result ?? []) tableNames.set(t.id, t.table_name);
  }
  const queries = app.queries.map((q) => {
    const table = q.kind === 'tooljetdb' ? tableNames.get(q.options?.table_id) : undefined;
    return {
      name: q.name,
      kind: q.kind,
      operation: q.options?.operation,
      ...(table ? { table } : {}),
      params: Array.isArray(q.options?.parameters)
        ? q.options.parameters.map((p: any) => String(p.name)).filter(Boolean)
        : [],
    };
  });
  for (const name of new Set(queries.map((q) => q.table).filter((t): t is string => !!t))) {
    const schema = await session.api(
      `/tooljet-db/organizations/${session.organizationId}/table/${encodeURIComponent(name)}`
    );
    tables[name] = (schema?.result?.columns ?? []).map((c: any) => ({
      name: c.column_name,
      type: c.data_type,
      nullable: !(c.constraints_type?.is_not_null || c.constraints_type?.is_primary_key),
    }));
  }
  return {
    appId: app.id,
    appName: app.name,
    versionId: app.versionId,
    ...(app.versionName ? { versionName: app.versionName } : {}),
    pulledAt: new Date().toISOString(),
    pages: app.pages.map((p) => ({ id: p.id, handle: p.handle, name: p.name, hidden: isTrue(p.hidden) })),
    queries,
    tables,
  };
}

const isTrue = (v: unknown) => v === true || (v as any)?.value === '{{true}}' || (v as any)?.value === true;

export interface VersionInfo {
  id: string;
  name: string;
  status?: string;
}

export async function listVersions(session: Session, appId: string): Promise<VersionInfo[]> {
  const res = await session.api(`/apps/${appId}/versions`);
  const list = (Array.isArray(res) ? res : res?.versions ?? []) as any[];
  return list.map((v) => ({ id: v.id, name: v.name, ...(v.status ? { status: v.status } : {}) }));
}

/** The version a `checkout` argument names: an exact id, else an exact name, else a unique case-insensitive name. */
export function pickVersion(versions: VersionInfo[], wanted: string): VersionInfo {
  const byId = versions.find((v) => v.id === wanted);
  if (byId) return byId;
  const exact = versions.filter((v) => v.name === wanted);
  if (exact.length === 1) return exact[0];
  const loose = versions.filter((v) => v.name.toLowerCase() === wanted.toLowerCase());
  if (loose.length === 1) return loose[0];
  const names = versions.map((v) => `${v.name}${v.status ? ` (${v.status.toLowerCase()})` : ''}`).join(', ');
  if (exact.length > 1 || loose.length > 1)
    throw new Error(`More than one version is named "${wanted}"; give its id. Versions: ${names}`);
  throw new Error(`No version "${wanted}". Versions: ${names || 'none'}`);
}

export const routePageHandle = (codeHandle: string, routeId: string) => `${codeHandle}-${routeId}`;

export interface SyncResult {
  appId: string;
  versionId: string;
  codePageId: string;
  rootComponentId: string;
  createdPages: string[];
  pin: string;
  editorUrl: (base: string) => string;
}

/**
 * Makes the app match the project: the code page, one hidden route page per route (it carries that route's page
 * permissions), the code page's root component (the app project's library component, with codePage set and the
 * route registry), and the version pinned to `pin` (`dev:<userId>` for the dev track, else a published version).
 */
export async function syncApp(
  session: Session,
  app: AppJson,
  library: { id: string; correlationId: string; name: string; componentName: string },
  pin: string
): Promise<SyncResult> {
  if (!app.appId)
    throw new Error(
      'app.json has no appId: create the app with `tooljet app init --create` or link one with `tooljet app clone`.'
    );
  let remote = await readApp(session, app.appId, app.version?.id);
  if (remote.versionStatus && remote.versionStatus !== 'DRAFT') {
    const which = app.version ? `Version ${app.version.name}` : "The app's editing version";
    throw new Error(
      `${which} is ${remote.versionStatus}, which cannot change. Check out a draft version (tooljet app checkout) or create one in ToolJet.`
    );
  }
  const base = `/v2/apps/${remote.id}/versions/${remote.versionId}`;
  const created: string[] = [];
  const byHandle = (handle: string) => remote.pages.find((p) => p.handle === handle);

  const ensurePage = async (handle: string, name: string, hidden: boolean) => {
    const existing = byHandle(handle);
    if (existing) return existing.id as string;
    const id = randomUUID();
    const index = remote.pages.length + created.length + 1;
    await session.api(`${base}/pages`, { method: 'POST', body: { id, name, handle, index } });
    if (hidden)
      await session.api(`${base}/pages`, {
        method: 'PUT',
        body: { pageId: id, diff: { hidden: { value: '{{true}}', fxActive: false } } },
      });
    created.push(handle);
    return id;
  };

  const codePageId = await ensurePage(app.codePage.handle, app.codePage.name, false);
  const registry = [];
  for (const route of app.routes) {
    const pageId = await ensurePage(
      routePageHandle(app.codePage.handle, route.id),
      `${app.codePage.name}: ${route.title ?? route.id}`,
      true
    );
    registry.push({ id: route.id, path: route.path, ...(route.title ? { title: route.title } : {}), pageId });
  }
  if (created.length) remote = await readApp(session, app.appId, app.version?.id);

  const codePage = remote.pages.find((p) => p.id === codePageId);
  const components = codePage?.components ?? {};
  const rootId = Object.keys(components).find((id) => {
    const c = components[id]?.component;
    return (
      c?.component === 'LibraryComponent' &&
      !c.parent &&
      c.definition?.properties?.correlationId?.value === library.correlationId
    );
  });
  const routesValue = JSON.stringify(registry);
  const identity = {
    libraryId: { value: library.id },
    correlationId: { value: library.correlationId },
    libraryName: { value: library.name },
    componentName: { value: library.componentName },
    codePage: { value: '{{true}}' },
    routes: { value: routesValue },
  };
  let rootComponentId = rootId;
  if (!rootId) {
    rootComponentId = randomUUID();
    const layout = { top: 0, left: 0, width: 43, height: 100 };
    await session.api(`${base}/components`, {
      method: 'POST',
      body: {
        is_user_switched_version: false,
        pageId: codePageId,
        diff: {
          [rootComponentId]: {
            name: 'app',
            type: 'LibraryComponent',
            properties: { ...identity, visibility: { value: '{{true}}' } },
            styles: {},
            validation: {},
            others: { showOnDesktop: { value: '{{true}}' }, showOnMobile: { value: '{{true}}' } },
            general: {},
            generalStyles: { boxShadow: { value: '0px 0px 0px 0px #00000040' } },
            layouts: { desktop: layout, mobile: layout },
          },
        },
      },
    });
  } else {
    await session.api(`${base}/components`, {
      method: 'PUT',
      body: {
        is_user_switched_version: false,
        pageId: codePageId,
        diff: { [rootId]: { component: { definition: { properties: identity } } } },
      },
    });
  }

  // The server merges globalSettings key by key, so send only the pins. The app read returns the settings with
  // snake_case keys; writing those back would store a second copy of every setting.
  const existingPins =
    remote.globalSettings.customComponentLibraries ?? remote.globalSettings.custom_component_libraries ?? {};
  const pins = { ...existingPins, [library.correlationId.replace(/-/g, '')]: pin };
  await session.api(base, { method: 'PUT', body: { globalSettings: { customComponentLibraries: pins } } });

  return {
    appId: remote.id,
    versionId: remote.versionId,
    codePageId,
    rootComponentId: rootComponentId!,
    createdPages: created,
    pin,
    editorUrl: (appUrl: string) =>
      `${appUrl}/${session.organizationSlug ?? session.organizationId}/apps/${remote.id}/${app.codePage.handle}`,
  };
}

export interface AppLibrary {
  id: string;
  name: string;
  correlationId: string;
  created: boolean;
  /** The app's own library, which the project's .tooljet/config.json did not name. */
  reused?: boolean;
  /** The version's stored code named no library and now names this one. */
  linked?: boolean;
}

/**
 * The library this app's project builds into, asked of ToolJet for the app: an app in Code mode keeps its own library
 * whatever the project names, so a new project folder for an existing app (or a git branch's draft) never makes a
 * second library with the app's name. A ToolJet without the route: find-or-create by the project's correlationId.
 */
export async function appLibrary(
  session: Session,
  target: { appId: string; versionId?: string },
  wanted: { correlationId: string; name: string }
): Promise<AppLibrary> {
  try {
    return (await session.api(`/code-mode-source/${target.appId}/library`, {
      method: 'POST',
      body: { ...wanted, ...(target.versionId ? { versionId: target.versionId } : {}) },
    })) as AppLibrary;
  } catch (err) {
    const missingRoute =
      err instanceof ApiError && err.status === 404 && /Cannot POST/i.test(`${err.message} ${err.body}`);
    if (!missingRoute) throw err;
  }
  return findOrCreateLibrary(session, wanted.correlationId, wanted.name);
}

/** What dev and publish say when the project's config now names another library. */
export const appLibraryLine = (library: AppLibrary): string =>
  library.reused
    ? `Building into the app's component library "${library.name}" (frontend/.tooljet/config.json updated)`
    : `Building into a new component library "${library.name}" (frontend/.tooljet/config.json updated)`;

/** The app project's library on the server (created on first use), and the signed-in user's dev bundle owner id. */
export async function findOrCreateLibrary(session: Session, correlationId: string, name: string) {
  const res = await fetchWithToken(session, '/custom-component-libraries/find-or-create', { correlationId, name });
  return res as { id: string; name: string; correlationId: string; created: boolean };
}

async function fetchWithToken(session: Session, path: string, body: unknown) {
  // The library routes take the personal access token itself, or (an in-product build) the user's session.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const fetch = require('node-fetch');
  const auth =
    session.kind === 'session'
      ? { Cookie: `tj_auth_token=${session.token}`, 'tj-workspace-id': session.organizationId }
      : { Authorization: `Bearer ${session.token}` };
  const res = await fetch(`${session.url}/api${path}`, {
    method: 'POST',
    headers: { ...auth, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    let message = text;
    try {
      message = JSON.parse(text).message ?? text;
    } catch {
      /* not JSON */
    }
    throw new Error(`POST ${path} failed (HTTP ${res.status}) on ${session.url}: ${message}`);
  }
  return JSON.parse(text);
}

/**
 * The id of the signed-in user's dev bundle owner for a library (the dev track keys bundles by user id), once the
 * server lists the upload. The list names builds by user id only; a session token without one falls back to the email
 * an older server listed.
 */
export async function devBundleOwnerId(session: Session, libraryId: string): Promise<string> {
  const libraries = (await session.api('/custom-component-libraries')) as any[];
  const library = libraries.find((l) => l.id === libraryId);
  const mine = (d: any) =>
    session.userId
      ? d.userId === session.userId
      : String(d.userEmail ?? '').toLowerCase() === session.email.toLowerCase();
  const own = (library?.devBundles ?? []).find(mine);
  if (!own?.userId) throw new Error("The live preview hasn't picked up your upload yet; save again.");
  return own.userId;
}
