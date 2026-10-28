import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { readFileSync } from 'fs';
import * as ivm from 'isolated-vm';
import { cloneDeep, isEqual } from 'lodash';
import { getDynamicVariables, resolveCode } from 'lib/utils';
import { APP_TYPES } from '@modules/apps/constants';
import { DataQuery } from '@entities/data_query.entity';
import { DataSource } from '@entities/data_source.entity';
import { LibraryQueryVersion } from '@entities/library_query_version.entity';
import { EntityManager } from 'typeorm';

export const LIBRARY_KIND = 'library';
export const LIBRARY_QUERY_IS_CLIENT_SIDE = 'LIBRARY_QUERY_IS_CLIENT_SIDE';
export const CLIENT_SIDE_LIBRARY_KINDS: readonly string[] = ['runjs'];
export const UNSUPPORTED_LIBRARY_KINDS: readonly string[] = ['runpy', 'workflows', 'library'];

// Pin sentinel for "run the draft"; a missing or empty ref means the same.
export const LIBRARY_DRAFT = 'draft';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isLibraryUuid = (value: unknown): value is string => typeof value === 'string' && UUID.test(value);

// SQL for a uuid id kept in a consumer's options (`dq.options`, which may be simple-json text). Comparing uuid to uuid
// lets the join use the primary key; a malformed value becomes NULL (matches nothing) instead of failing the cast.
export const consumerOptionUuidSql = (key: 'libraryQueryId' | 'libraryQueryVersionId'): string =>
  `(CASE WHEN dq.options::jsonb ->> '${key}' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'` +
  ` THEN (dq.options::jsonb ->> '${key}')::uuid END)`;

// `strict` is off, so a discriminated union would not narrow at call sites; `versionId` is set whenever `draft` is false.
export function parseLibraryVersionRef(ref: unknown): { draft: boolean; versionId?: string } {
  if (ref === undefined || ref === null || ref === '' || ref === LIBRARY_DRAFT) return { draft: true };
  if (typeof ref === 'string' && UUID.test(ref)) return { draft: false, versionId: ref };
  throw new BadRequestException('Library query version not found');
}

export const libraryVersionName = (v: { versionNumber: number }): string => `v${v.versionNumber}`;

type LibrarySnapshot = { kind: string; dataSourceId: string | null; options: unknown };

// A release identical to the latest version is refused, so a release always changes something.
export const isSameLibrarySnapshot = (a: LibrarySnapshot, b: LibrarySnapshot): boolean =>
  a.kind === b.kind && (a.dataSourceId ?? null) === (b.dataSourceId ?? null) && isEqual(a.options, b.options);

type LibraryParameter = { name?: string; defaultValue?: unknown };

export type LibraryField = { name: string; defaultValue?: unknown };
export type LibraryCatalogVersion = {
  id: string;
  name: string;
  kind: string;
  inputs: LibraryField[];
  parameters: LibraryField[];
  createdAt: Date;
};
export type LibraryCatalogQuery = {
  id: string;
  name: string;
  folder: string | null;
  // One past the highest number ever released, soft-deleted versions included (release never reuses a number).
  nextVersionNumber: number;
  draft: { kind: string; inputs: LibraryField[]; parameters: LibraryField[]; matchesLatestVersion: boolean };
  versions: LibraryCatalogVersion[];
};
export type LibraryCatalog = { queries: LibraryCatalogQuery[] };

export type LibraryCatalogDraft = LibrarySnapshot & { id: string; name: string };
export type LibraryCatalogVersionRow = LibrarySnapshot & {
  id: string;
  dataQueryId: string;
  versionNumber: number;
  createdAt: Date;
};

// Only names and default values leave the server: no query text, URLs, code or transformation.
const toLibraryFields = (value: unknown): LibraryField[] =>
  (Array.isArray(value) ? (value as LibraryParameter[]) : [])
    .filter((field) => field?.name)
    .map(({ name, defaultValue }) => (defaultValue === undefined ? { name } : { name, defaultValue }));

const optionsField = (options: unknown, key: 'inputs' | 'parameters'): LibraryField[] =>
  toLibraryFields((options as Record<string, unknown> | null)?.[key]);

// Pure so it can be unit-tested without a DB. Nested folders show only the immediate folder name.
export function toLibraryCatalog(
  drafts: LibraryCatalogDraft[],
  versions: LibraryCatalogVersionRow[],
  folderByQueryId: Map<string, string>,
  highestNumberByQueryId: Map<string, number> = new Map()
): LibraryCatalog {
  const queries = drafts
    .filter((draft) => !UNSUPPORTED_LIBRARY_KINDS.includes(draft.kind))
    .map((draft): LibraryCatalogQuery => {
      const own = versions
        .filter((version) => version.dataQueryId === draft.id)
        .sort((a, b) => b.versionNumber - a.versionNumber);
      return {
        id: draft.id,
        name: draft.name,
        folder: folderByQueryId.get(draft.id) ?? null,
        nextVersionNumber: Math.max(highestNumberByQueryId.get(draft.id) ?? 0, own[0]?.versionNumber ?? 0) + 1,
        draft: {
          kind: draft.kind,
          inputs: optionsField(draft.options, 'inputs'),
          parameters: optionsField(draft.options, 'parameters'),
          matchesLatestVersion: own.length > 0 && isSameLibrarySnapshot(draft, own[0]),
        },
        versions: own.map((version) => ({
          id: version.id,
          name: libraryVersionName(version),
          kind: version.kind,
          inputs: optionsField(version.options, 'inputs'),
          parameters: optionsField(version.options, 'parameters'),
          createdAt: version.createdAt,
        })),
      };
    });
  queries.sort((a, b) => {
    if (a.folder !== b.folder) {
      if (a.folder === null) return -1;
      if (b.folder === null) return 1;
      return a.folder.localeCompare(b.folder);
    }
    return a.name.localeCompare(b.name);
  });
  return { queries };
}

export function assertSupportedLibraryKind(kind: string): void {
  if (UNSUPPORTED_LIBRARY_KINDS.includes(kind)) {
    throw new BadRequestException(`${kind} queries can't be used from a query library`);
  }
}

// Release-time checks on a draft: SQL/REST/RunJS only, and transformations must be JavaScript (no Python on the server).
export function assertReleasableLibraryDraft(kind: string, options: Record<string, unknown> | null | undefined): void {
  assertSupportedLibraryKind(kind);
  if (options?.enableTransformation && options?.transformationLanguage === 'python') {
    throw new BadRequestException('Library transformations must be JavaScript');
  }
}

// Resolved later by parseQueryOptionsInternal → resolveConstants; never evaluate them here.
const SERVER_RESOLVED = /^\{\{\s*(constants|secrets|globals\.server)\./;
const TEMPLATE = /\{\{([\s\S]*?)\}\}/g;

// `{{constants.x}}` / `{{secrets.x}}` in a DEFAULT value are read against the consumer's environment by the server
// (resolveConstants matches exactly these two, with no space after `{{`). Supplied values are never resolved: a
// caller must not be able to read a constant or secret by sending its name. `{{globals.server.*}}` in a default
// stays literal text.
const SERVER_REFERENCE = /\{\{\s*(constants|secrets)\.(.*?)\s*\}\}/g;
const normalisedReference = (_match: string, kind: string, key: string): string => `{{${kind}.${key}}}`;

// The distinct server references in the inputs' and parameters' defaults, in the form resolveConstants reads.
export function libraryServerReferences(options: Record<string, unknown> | null | undefined): string[] {
  const references = new Set<string>();
  for (const key of ['inputs', 'parameters']) {
    const definitions = options?.[key];
    for (const { defaultValue } of (Array.isArray(definitions) ? definitions : []) as LibraryParameter[]) {
      if (typeof defaultValue !== 'string') continue;
      for (const match of defaultValue.matchAll(SERVER_REFERENCE)) {
        references.add(normalisedReference(match[0], match[1], match[2]));
      }
    }
  }
  return [...references];
}

// Every occurrence is replaced; a reference with no resolved value is left as it is.
export const replaceLibraryServerReferences = (text: string, resolved: ReadonlyMap<string, string>): string =>
  text.replace(SERVER_REFERENCE, (match, kind: string, key: string) => {
    const reference = normalisedReference(match, kind, key);
    return resolved.has(reference) ? resolved.get(reference) : match;
  });

// Whole template `{{5}}` → the typed value. Mixed text `id-{{1+1}}` → text with each template's result in place.
// Server-resolved templates stay text for the server to resolve later against the consumer's environment.
export function resolveLibraryDefault(
  defaultValue: unknown,
  evaluate: (code: string, template: string) => unknown
): unknown {
  if (typeof defaultValue !== 'string') return defaultValue;
  const templates = defaultValue.match(TEMPLATE);
  if (!templates) return defaultValue;
  const run = (template: string) => evaluate(template.slice(2, -2), template);
  if (defaultValue.trim() === templates[0])
    return SERVER_RESOLVED.test(templates[0]) ? defaultValue : run(templates[0]);
  return defaultValue.replace(TEMPLATE, (template) => {
    if (SERVER_RESOLVED.test(template)) return template;
    const value = run(template);
    return value !== null && typeof value === 'object' ? JSON.stringify(value) : String(value);
  });
}

// Read once per process. moment and lodash are UMD bundles: run in an isolate they attach `moment` / `_` to its global.
let templateBundles: string[] | undefined;
const loadTemplateBundles = (): string[] =>
  (templateBundles ??= ['moment/min/moment.min.js', 'lodash/lodash.min.js'].map((path) =>
    readFileSync(require.resolve(path), 'utf8')
  ));

export function assertLibraryTarget({
  consumer,
  library,
  consumerApp,
  libraryApp,
}: {
  consumer: DataQuery;
  library: DataQuery | null;
  consumerApp: { organizationId: string };
  libraryApp: { organizationId: string; type: string } | null;
}): void {
  if (consumer?.kind !== LIBRARY_KIND) throw new BadRequestException('Not a library query');
  if (!library || !libraryApp) throw new NotFoundException('Library query not found');
  if (libraryApp.organizationId !== consumerApp.organizationId) throw new ForbiddenException();
  if (libraryApp.type !== APP_TYPES.QUERY_LIBRARY) throw new BadRequestException('Not a query library');
  // The kind is checked on the run target (assertSupportedLibraryKind): the draft may have changed since the pinned release.
}

// `primary.kind` is the kind of the version being run, which can differ from its draft.
export function assertSameLibrary(primary: Pick<DataQuery, 'kind' | 'appVersionId'>, sibling: DataQuery | null): void {
  // Sibling calls exist only for library RunJS. Without this, anyone who can run an
  // app's SQL/REST library query could run any other query in that library.
  if (!CLIENT_SIDE_LIBRARY_KINDS.includes(primary.kind)) {
    throw new ForbiddenException('Only RunJS library queries can run other library queries');
  }
  if (!sibling) throw new NotFoundException('Library query not found');
  if (sibling.appVersionId !== primary.appVersionId) {
    throw new ForbiddenException('Library query is not in the same library');
  }
}

function collectStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => collectStrings(v, out));
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => collectStrings(v, out));
  return out;
}

export type LibraryRunContext = {
  currentUser?: { id?: string; email?: string; firstName?: string; lastName?: string };
  // Applied to a default's final text only (never to a supplied value), after its templates are evaluated.
  resolveServerText?: (text: string) => string;
};

export type LibraryRunValues = { inputs?: Record<string, unknown>; parameters?: Record<string, unknown> };

// Library templates see `input`, `parameters` and `globals.currentUser` (from the signed-in user, never the client).
// The library editor resolves with the same names (queryPanelSlice), so authors see what consumers get.
export function buildLibraryVariableMap(
  options: Record<string, any>,
  values: LibraryRunValues = {},
  { currentUser, resolveServerText }: LibraryRunContext = {}
): {
  input: Record<string, unknown>;
  parameters: Record<string, unknown>;
  // `input` / `parameters` with each default's server references still as text: safe to send to the browser.
  scope: { input: Record<string, unknown>; parameters: Record<string, unknown> };
  variableMap: Record<string, unknown>;
} {
  const memoryLimit = parseInt(process.env?.WORKFLOW_JS_MEMORY_LIMIT_MB) || 20;
  const isolate = new ivm.Isolate({ memoryLimit });
  const context = isolate.createContextSync();
  // resolveCode throws raw V8 errors (TypeError, ReferenceError, timeout, ...). Map them to a
  // client error that names the template, so a bad query template is a 400, not a 500.
  // V8 messages can quote a value (`"TOPSECRET" is not valid JSON`), so a resolved default is shown as its reference.
  const maskResolvedDefaults = (message: string): string => {
    if (!resolveServerText) return message;
    return libraryServerReferences(options)
      .map((reference) => ({ reference, value: resolveServerText(reference) }))
      .filter(({ reference, value }) => value && value !== reference)
      .sort((a, b) => b.value.length - a.value.length)
      .reduce((masked, { reference, value }) => masked.split(value).join(reference), message);
  };
  const evaluate = (code: string, state: Record<string, unknown>, template: string) => {
    try {
      return resolveCode({ code, state, isolate, context, wrapInIIFE: false });
    } catch (error) {
      throw new BadRequestException(maskResolvedDefaults(`Could not resolve ${template}: ${error?.message ?? error}`));
    }
  };

  // Only declared names are kept; a supplied value wins over the default, per name. `resolved` is what templates
  // see; `raw` keeps defaults unresolved (server text) for the scope sent to the browser.
  const resolveDeclared = (definitions: unknown, supplied: Record<string, unknown> = {}) => {
    const resolved: Record<string, unknown> = {};
    const raw: Record<string, unknown> = {};
    for (const { name, defaultValue } of (Array.isArray(definitions) ? definitions : []) as LibraryParameter[]) {
      if (!name) continue;
      // Own properties only: a declared name like `constructor` must not pick up Object.prototype members.
      if (Object.prototype.hasOwnProperty.call(supplied ?? {}, name) && supplied[name] !== undefined) {
        resolved[name] = raw[name] = supplied[name];
        continue;
      }
      const value = resolveLibraryDefault(defaultValue, (code, template) => evaluate(code, {}, template));
      raw[name] = value;
      resolved[name] = typeof value === 'string' && resolveServerText ? resolveServerText(value) : value;
    }
    return { resolved, raw };
  };

  try {
    // ponytail: lodash + moment are re-compiled into each run's isolate (~ms per run); cache compiled code via ivm cachedData if run latency matters
    for (const bundle of loadTemplateBundles()) isolate.compileScriptSync(bundle).runSync(context, { timeout: 5000 });
    const { resolved: input, raw: rawInput } = resolveDeclared(options?.inputs, values?.inputs);
    const { resolved: parameters, raw: rawParameters } = resolveDeclared(options?.parameters, values?.parameters);

    const globals = { currentUser: currentUser ?? {} };
    // The transformation runs in the browser, so its {{ }} are never resolved here (like inputs and parameters).
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { inputs: _i, parameters: _p, transformation: _t, ...queryOptions } = options ?? {};
    const variableMap: Record<string, unknown> = {};
    for (const text of collectStrings(queryOptions)) {
      for (const variable of getDynamicVariables(text.replace(/\n/g, ' ')) ?? []) {
        if (SERVER_RESOLVED.test(variable) || variable in variableMap) continue;
        variableMap[variable] = evaluate(variable.slice(2, -2), { input, parameters, globals }, variable);
      }
    }
    return { input, parameters, scope: { input: rawInput, parameters: rawParameters }, variableMap };
  } finally {
    // A memory-limit kill already disposes the isolate; disposing again would throw and mask the real error.
    if (!isolate.isDisposed) isolate.dispose();
  }
}

// A library run's response must not show the library query's own request (url, params, body): non-RunJS library
// options never reach the browser, and the request can hold a resolved secret. That covers `metadata.request`,
// `metadata.queryDefinition` and, on an HTTP error, `data.requestObject`. Response-side details are kept.
export function withoutLibraryRequestDetails<T extends object>(result: T): T {
  const { metadata, data } = result as { metadata?: unknown; data?: unknown };
  const out: Record<string, unknown> = { ...(result as Record<string, unknown>) };
  if (metadata && typeof metadata === 'object') {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { request: _request, queryDefinition: _queryDefinition, ...rest } = metadata as Record<string, unknown>;
    out.metadata = rest;
  }
  if (data && typeof data === 'object' && !Array.isArray(data) && 'requestObject' in data) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { requestObject: _requestObject, ...rest } = data as Record<string, unknown>;
    out.data = rest;
  }
  return out as T;
}

export type LibraryRunTarget = {
  queryId: string;
  name: string;
  kind: string;
  dataSourceId: string | null;
  options: Record<string, any>;
  versionName: string; // 'v3' or 'draft'
};

// A pinned version runs from its own snapshot; the draft is only used when there is no version.
export function toRunTarget(draft: DataQuery, version: LibraryQueryVersion | null): LibraryRunTarget {
  const source = version ?? draft;
  return {
    queryId: draft.id,
    name: draft.name,
    kind: source.kind,
    dataSourceId: source.dataSourceId ?? null,
    options: source.options as Record<string, any>,
    versionName: version ? libraryVersionName(version) : LIBRARY_DRAFT,
  };
}

// ponytail: static scan; queries[name] dynamic access is missed — add a declared-siblings list if that shows up
export function findSiblingNames(code: string): string[] {
  const names = new Set<string>();
  for (const [, name] of (code ?? '').matchAll(/\bqueries\.([A-Za-z_$][\w$]*)/g)) names.add(name);
  return [...names];
}

export type LibraryPin = {
  consumerQueryName: string;
  libraryQueryName: string;
  pinnedVersion: string; // 'v1' | 'draft'
  latestVersion: string | null;
  siblings: { name: string; runsVersion: string | null }[];
};

// One consumer query joined to its pinned version. A null pinnedVersionNumber means the pin is a draft or
// resolves to no live version of that library query (V1-era row, deleted version, other workspace).
export type LibraryPinRow = {
  consumerQueryName: string;
  libraryQueryName: string | null;
  libraryAppVersionId: string | null;
  pinnedVersionNumber: number | null;
  latestVersionNumber: number | null;
  pinnedKind: string | null;
  pinnedOptions: unknown;
};

// Latest live version of every query in a library, so a RunJS pin's `queries.x` calls can be resolved.
export type LibrarySiblingRelease = { libraryAppVersionId: string; name: string; latestVersionNumber: number | null };

const versionLabel = (versionNumber: number | null): string | null =>
  versionNumber === null ? null : libraryVersionName({ versionNumber });

// Pure so the release gate and the library-pins endpoint (and the unit tests) share one decision.
export function toLibraryPins(rows: LibraryPinRow[], siblingReleases: LibrarySiblingRelease[]): LibraryPin[] {
  return rows.map((row) => {
    const pinned = row.pinnedVersionNumber !== null;
    const code = (row.pinnedOptions as { code?: unknown } | null)?.code;
    const siblings =
      pinned && CLIENT_SIDE_LIBRARY_KINDS.includes(row.pinnedKind ?? '') && typeof code === 'string'
        ? findSiblingNames(code).flatMap((name) => {
            const match = siblingReleases.find(
              (sibling) => sibling.libraryAppVersionId === row.libraryAppVersionId && sibling.name === name
            );
            return match ? [{ name, runsVersion: versionLabel(match.latestVersionNumber) }] : [];
          })
        : [];
    return {
      consumerQueryName: row.consumerQueryName,
      libraryQueryName: row.libraryQueryName ?? 'unknown query',
      pinnedVersion: versionLabel(row.pinnedVersionNumber) ?? LIBRARY_DRAFT,
      latestVersion: versionLabel(row.latestVersionNumber),
      siblings,
    };
  });
}

// The release-gate message for an app version's pins (null = release may go ahead). Any released version passes;
// only draft/unresolvable pins and pins whose RunJS calls a never-released sibling block.
export function libraryReleaseBlock(pins: LibraryPin[]): { error: string; details: string } | null {
  const sentences = new Set<string>();
  for (const pin of pins) {
    if (pin.pinnedVersion === LIBRARY_DRAFT) {
      sentences.add(
        `Library query "${pin.consumerQueryName}" is not on a released version. Pick a released version of "${pin.libraryQueryName}".`
      );
      continue;
    }
    for (const sibling of pin.siblings) {
      if (sibling.runsVersion !== null) continue;
      sentences.add(
        `Library query "${pin.libraryQueryName}" ${pin.pinnedVersion} calls "${sibling.name}", which has no released version. Release "${sibling.name}" first.`
      );
    }
  }
  if (sentences.size === 0) return null;
  const details = [...sentences].join(' ');
  const error =
    sentences.size === 1
      ? `Release blocked - ${details}`
      : `Release blocked - ${sentences.size} library queries need a released version. ${details}`;
  return { error, details };
}

// appVersionId/appVersion come from the library draft, not the consumer: the snapshot's data source belongs to the
// library, which always lives on the default branch.
export function toLibraryRunEntity(
  target: LibraryRunTarget,
  libraryDraft: DataQuery,
  dataSource: DataSource,
  consumer: DataQuery
): DataQuery {
  // Execute the library query, but authorise and audit it as the consumer query:
  // EE query-permission checks key off dataQuery.id/permissions (ee/data-queries/util.service.ts).
  return Object.assign(Object.create(Object.getPrototypeOf(consumer)), consumer, {
    id: consumer.id,
    name: target.name,
    kind: target.kind,
    dataSourceId: target.dataSourceId,
    dataSource,
    appVersionId: libraryDraft.appVersionId,
    appVersion: libraryDraft.appVersion,
    permissions: consumer.permissions ?? [],
    options: cloneDeep(target.options),
  });
}

// An app's pin must be a live version of the library query the consumer points at.
export function pickPinnedVersion(version: LibraryQueryVersion | null, libraryQueryId: string): LibraryQueryVersion {
  if (!version || version.dataQueryId !== libraryQueryId)
    throw new NotFoundException('Library query version not found');
  return version;
}

// Sibling calls run the sibling's latest release; a never-released sibling can't be called.
export function latestReleaseOrThrow(siblingName: string, latest: LibraryQueryVersion | null): LibraryQueryVersion {
  if (!latest) throw new BadRequestException(`Library query "${siblingName}" has no released version`);
  return latest;
}

// A deleted data source leaves the snapshot behind with a null data source id.
export function assertLibraryDataSource(dataSource: DataSource | null): DataSource {
  if (!dataSource) throw new NotFoundException('Library query data source not found');
  return dataSource;
}

// The transformation travels with the result and runs in the browser (like the app's own query transformations).
// A Python transformation can't run on this path; releases refuse one, and this covers draft runs.
export function libraryTransformationOf(options: Record<string, unknown>): string | undefined {
  if (!options?.enableTransformation) return undefined;
  if (options.transformationLanguage === 'python') {
    throw new BadRequestException('Library transformations must be JavaScript');
  }
  return String(options.transformation ?? '');
}

export type LibrarySibling = { id: string; name: string; kind: string; released: boolean };

// Pure so it can be unit-tested without a DB. `versions` may hold several versions per query.
export function toLibrarySiblings(
  drafts: { id: string; name: string; kind: string }[],
  versions: { dataQueryId: string; versionNumber: number; kind: string }[]
): LibrarySibling[] {
  return drafts.map((draft) => {
    const latest = versions
      .filter((version) => version.dataQueryId === draft.id)
      .reduce<(typeof versions)[number] | null>((a, b) => (!a || b.versionNumber > a.versionNumber ? b : a), null);
    return { id: draft.id, name: draft.name, kind: latest?.kind ?? draft.kind, released: !!latest };
  });
}

// Same strings as APP_TYPES.FRONT_END / APP_TYPES.MODULE, as literals so the type is a plain union.
const CONSUMER_APP_TYPES = ['front-end', 'module'] as const;
export type LibraryConsumerAppType = (typeof CONSUMER_APP_TYPES)[number];

export type LibraryConsumer = {
  appId: string;
  appName: string;
  appType: LibraryConsumerAppType; // only apps and modules consume library queries
  appVersionName: string; // every app version counts as a use, not just the latest
  queryId: string;
  queryName: string;
  libraryQueryId: string;
  versionName: string; // 'v2', or 'draft' when the pin doesn't resolve to a live version
};

// Shared by DataQueryRepository and AppsService (EE AppsService has its own constructor, so no repo injection).
// Matches consumers whose pointer is a query of the given library app version, whatever app version they sit in.
export async function queryLibraryConsumers(
  manager: EntityManager,
  organizationId: string,
  libraryAppVersionId: string,
  libraryQueryId?: string,
  libraryVersionId?: string
): Promise<LibraryConsumer[]> {
  // data_queries.options may be simple-json (text): cast to jsonb. Pointer ids are compared as uuid;
  // consumerOptionUuidSql turns a malformed pointer into NULL, so it matches nothing instead of failing the cast.
  const params: unknown[] = [organizationId, libraryAppVersionId, LIBRARY_KIND, [...CONSUMER_APP_TYPES]];
  let queryFilter = '';
  if (libraryQueryId) {
    params.push(libraryQueryId);
    queryFilter = `AND lq.id = $5::uuid`;
    if (libraryVersionId) {
      params.push(libraryVersionId);
      queryFilter += ` AND lv.id = $6::uuid`;
    }
  }
  return manager.query(
    // apps.name is NULL on the branch model; the name lives on app_versions.app_name.
    // The pin resolves like getLibraryPinsForAppVersion: a live version of that very query, else it reads as draft.
    `SELECT a.id AS "appId", COALESCE(av.app_name, a.name) AS "appName", a.type::text AS "appType",
            av.name AS "appVersionName", dq.id AS "queryId", dq.name AS "queryName", lq.id AS "libraryQueryId",
            CASE WHEN lv.id IS NULL THEN '${LIBRARY_DRAFT}' ELSE 'v' || lv.version_number END AS "versionName"
       FROM data_queries dq
       JOIN data_sources ds ON ds.id = dq.data_source_id AND ds.kind = $3
       JOIN app_versions av ON av.id = dq.app_version_id
       JOIN apps a ON a.id = av.app_id
       JOIN data_queries lq ON lq.id = ${consumerOptionUuidSql('libraryQueryId')} AND lq.app_version_id = $2::uuid
       LEFT JOIN library_query_versions lv ON lv.id = ${consumerOptionUuidSql('libraryQueryVersionId')}
                                          AND lv.data_query_id = lq.id AND lv.deleted_at IS NULL
      WHERE a.organization_id = $1
        AND a.type::text = ANY($4::text[])
        ${queryFilter}
      ORDER BY "appName", av.name, dq.name`,
    params
  );
}

export type LibraryUsageEntry = {
  id: string;
  name: string;
  queries: { id: string; name: string; appVersionName: string; libraryQueryId: string; versionName: string }[];
};

// Split by app type. The `apps` key keeps its V1 meaning: front-end apps only.
export function toLibraryUsage(consumers: LibraryConsumer[]): {
  apps: LibraryUsageEntry[];
  modules: LibraryUsageEntry[];
} {
  const group = (appType: LibraryConsumerAppType): LibraryUsageEntry[] => {
    const byApp = new Map<string, LibraryUsageEntry>();
    for (const row of consumers.filter((consumer) => consumer.appType === appType)) {
      const entry = byApp.get(row.appId) ?? { id: row.appId, name: row.appName, queries: [] };
      entry.queries.push({
        id: row.queryId,
        name: row.queryName,
        appVersionName: row.appVersionName,
        libraryQueryId: row.libraryQueryId,
        versionName: row.versionName,
      });
      byApp.set(row.appId, entry);
    }
    return [...byApp.values()];
  };
  return { apps: group('front-end'), modules: group('module') };
}

// The delete-in-use message: counts apps and modules, lists each app version once.
export function libraryUsedByMessage(consumers: LibraryConsumer[]): string {
  const countOf = (appType: LibraryConsumerAppType) =>
    new Set(consumers.filter((consumer) => consumer.appType === appType).map((consumer) => consumer.appId)).size;
  const counts = [
    [countOf('front-end'), 'app(s)'],
    [countOf('module'), 'module(s)'],
  ]
    .filter(([n]) => n)
    .map(([n, label]) => `${n} ${label}`)
    .join(' and ');
  // Apps first, then modules, matching the counts.
  const ordered = [...consumers].sort((a, b) => Number(a.appType === 'module') - Number(b.appType === 'module'));
  const list = [...new Set(ordered.map((consumer) => `${consumer.appName} · ${consumer.appVersionName}`))].join(', ');
  return `Used by ${counts}: ${list}. Remove it from those first.`;
}

export type ReleasedLibraryCode = { queryId: string; queryName: string; versionNumber: number; code: string | null };

// Pure half of the called-by-released-versions guard. Names the oldest calling version: it is the first one that has to be retired.
// `excludeQueryId` skips a query's own versions (deleting a query takes them with it).
export function calledByReleasedVersion(
  queryName: string,
  releasedCode: ReleasedLibraryCode[],
  excludeQueryId?: string
): { caller: string; versionNumber: number } | null {
  const callers = releasedCode
    .filter((row) => row.queryId !== excludeQueryId && findSiblingNames(row.code ?? '').includes(queryName))
    .sort((a, b) => a.queryName.localeCompare(b.queryName) || a.versionNumber - b.versionNumber);
  return callers.length ? { caller: callers[0].queryName, versionNumber: callers[0].versionNumber } : null;
}

// Renaming or deleting a library query is refused while a live released version of another query calls it
// by name, because released code can't be edited.
export async function assertNotCalledByReleasedVersions(
  libraryAppVersionId: string,
  queryName: string,
  manager: EntityManager,
  excludeQueryId?: string
): Promise<void> {
  const released: ReleasedLibraryCode[] = await manager.query(
    `SELECT lq.id AS "queryId", lq.name AS "queryName", lv.version_number AS "versionNumber",
            lv.options ->> 'code' AS "code"
       FROM library_query_versions lv
       JOIN data_queries lq ON lq.id = lv.data_query_id
      WHERE lq.app_version_id = $1::uuid AND lv.deleted_at IS NULL AND lv.kind = ANY($2::text[])`,
    [libraryAppVersionId, CLIENT_SIDE_LIBRARY_KINDS]
  );
  const calledBy = calledByReleasedVersion(queryName, released, excludeQueryId);
  if (calledBy) {
    throw new BadRequestException(
      `${queryName} is called by ${calledBy.caller} v${calledBy.versionNumber}. Release a version of ${calledBy.caller} that doesn't call it, then delete the older versions that do.`
    );
  }
}
