import { BadRequestException, NotFoundException } from '@nestjs/common';
import { readFileSync } from 'fs';
import * as ivm from 'isolated-vm';
import { cloneDeep } from 'lodash';
import { getDynamicVariables, resolveCode } from 'lib/utils';
import { DataQuery } from '@entities/data_query.entity';
import { DataSource } from '@entities/data_source.entity';
import { LibraryQuery } from '@entities/library_query.entity';
import { LibraryQueryDraft } from '@entities/library_query_draft.entity';
import { LibraryQueryVersion } from '@entities/library_query_version.entity';
import { EntityManager } from 'typeorm';

export const LIBRARY_KIND = 'library';
export const LIBRARY_QUERY_IS_CLIENT_SIDE = 'LIBRARY_QUERY_IS_CLIENT_SIDE';
export const CLIENT_SIDE_LIBRARY_KINDS: readonly string[] = ['runjs'];
export const UNSUPPORTED_LIBRARY_KINDS: readonly string[] = ['runpy', 'workflows', 'library'];

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isLibraryUuid = (value: unknown): value is string => typeof value === 'string' && UUID.test(value);

// SQL for a uuid id kept in a consumer's options (`dq.options`, which may be simple-json text). Comparing uuid to uuid
// lets the join use the primary key; a malformed value becomes NULL (matches nothing) instead of failing the cast.
export const consumerOptionUuidSql = (key: 'libraryQueryId' | 'libraryQueryVersionId'): string =>
  `(CASE WHEN dq.options::jsonb ->> '${key}' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'` +
  ` THEN (dq.options::jsonb ->> '${key}')::uuid END)`;

export function parseLibraryReference(options: Record<string, unknown>): { id: string } {
  if (
    !isLibraryUuid(options?.libraryQueryVersionId) ||
    options?.draftId !== undefined ||
    options?.libraryVersionId !== undefined
  )
    throw new BadRequestException('Supply one explicit libraryQueryVersionId UUID');
  return { id: options.libraryQueryVersionId };
}

// A consumer's reference can outlive its target: imports, git pulls and deletes keep it as-is (only release/promote
// refuse it). Builders and end users see these when such a query runs.
export const LIBRARY_QUERY_MISSING =
  "This query uses a library query that isn't in this workspace. Pick one from the library.";
export const LIBRARY_VERSION_MISSING =
  "This query uses a library query version that isn't in this workspace. Pick one from the library.";

export async function resolveLibraryReference(
  queryId: string,
  id: string,
  manager: EntityManager
): Promise<{ kind: 'draft'; snapshot: LibraryQueryDraft } | { kind: 'saved'; snapshot: LibraryQueryVersion }> {
  if (!isLibraryUuid(id)) throw new BadRequestException(LIBRARY_VERSION_MISSING);
  const where = { id, libraryQueryId: queryId };
  const saved = await manager.findOne(LibraryQueryVersion, { where });
  if (saved) return { kind: 'saved', snapshot: saved };
  const draft = await manager.findOne(LibraryQueryDraft, { where });
  if (draft) return { kind: 'draft', snapshot: draft };
  // Saving can commit its same-ID insert/soft-delete between the two reads.
  const savedDuringLookup = await manager.findOne(LibraryQueryVersion, { where });
  if (savedDuringLookup) return { kind: 'saved', snapshot: savedDuringLookup };
  throw new NotFoundException(LIBRARY_VERSION_MISSING);
}

type LibrarySnapshot = { kind: string; dataSourceId: string | null; options: unknown };

type LibraryInput = { name?: string; defaultValue?: unknown };

export type LibraryEnvironment = { id: string; name: string; priority: number };
export type LibraryField = { name: string; defaultValue?: unknown };
export type LibraryCatalogVersion = {
  status: 'PUBLISHED';
  id: string;
  name: string;
  kind: string;
  inputs: LibraryField[];
  createdAt: Date;
  environment: LibraryEnvironment | null;
  isReleased: boolean;
};
export type LibraryCatalogQuery = {
  id: string;
  name: string;
  folder: string | null;
  // One past the highest number ever released, soft-deleted versions included (release never reuses a number).
  nextVersionNumber: number;
  releasedVersionId: string | null;
  drafts: { status: 'DRAFT'; id: string; name: string; kind: string; inputs: LibraryField[]; createdAt: Date }[];
  versions: LibraryCatalogVersion[];
};
export type LibraryCatalog = { queries: LibraryCatalogQuery[] };

export type LibraryCatalogDraft = LibrarySnapshot & {
  id: string;
  libraryQueryId: string;
  name: string;
  createdAt: Date;
};
export type LibraryCatalogVersionRow = LibrarySnapshot & {
  name: string;
  id: string;
  libraryQueryId: string;
  versionNumber: number;
  createdAt: Date;
  currentEnvironmentId?: string | null;
};

// Only names and default values leave the server: no query text, URLs, code or transformation.
const toLibraryFields = (value: unknown): LibraryField[] =>
  (Array.isArray(value) ? (value as LibraryInput[]) : [])
    .filter((field) => field?.name)
    .map(({ name, defaultValue }) => (defaultValue === undefined ? { name } : { name, defaultValue }));

const inputsOf = (options: unknown): LibraryField[] =>
  toLibraryFields((options as Record<string, unknown> | null)?.inputs);

// Pure so it can be unit-tested without a DB. Nested folders show only the immediate folder name.
export function toLibraryCatalog(
  queries: { id: string; name: string }[],
  versions: LibraryCatalogVersionRow[],
  folderByQueryId: Map<string, string>,
  highestNumberByQueryId: Map<string, number> = new Map(),
  environmentsById: Map<string, LibraryEnvironment> = new Map(),
  stateByQueryId: Map<string, { releasedVersionId: string | null }> = new Map(),
  drafts: LibraryCatalogDraft[] = []
): LibraryCatalog {
  const catalogQueries = queries.map((draft): LibraryCatalogQuery => {
    const own = versions
      .filter((version) => version.libraryQueryId === draft.id)
      .sort((a, b) => b.versionNumber - a.versionNumber);
    // Queries without a state row have no Released pointer.
    const state = stateByQueryId.get(draft.id) ?? { releasedVersionId: null };
    return {
      id: draft.id,
      name: draft.name,
      folder: folderByQueryId.get(draft.id) ?? null,
      nextVersionNumber: Math.max(highestNumberByQueryId.get(draft.id) ?? 0, own[0]?.versionNumber ?? 0) + 1,
      releasedVersionId: state.releasedVersionId,
      drafts: drafts
        .filter((row) => row.libraryQueryId === draft.id)
        .map((row) => ({
          status: 'DRAFT',
          id: row.id,
          name: row.name,
          kind: row.kind,
          inputs: inputsOf(row.options),
          createdAt: row.createdAt,
        })),
      versions: own.map((version) => ({
        status: 'PUBLISHED',
        id: version.id,
        name: version.name,
        kind: version.kind,
        inputs: inputsOf(version.options),
        createdAt: version.createdAt,
        environment: environmentsById.get(version.currentEnvironmentId) ?? null,
        isReleased: version.id === state.releasedVersionId,
      })),
    };
  });
  catalogQueries.sort((a, b) => {
    if (a.folder !== b.folder) {
      if (a.folder === null) return -1;
      if (b.folder === null) return 1;
      return a.folder.localeCompare(b.folder);
    }
    return a.name.localeCompare(b.name);
  });
  return { queries: catalogQueries };
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

// The distinct server references in the inputs' defaults, in the form resolveConstants reads.
export function libraryServerReferences(options: Record<string, unknown> | null | undefined): string[] {
  const references = new Set<string>();
  const definitions = options?.inputs;
  for (const { defaultValue } of (Array.isArray(definitions) ? definitions : []) as LibraryInput[]) {
    if (typeof defaultValue !== 'string') continue;
    for (const match of defaultValue.matchAll(SERVER_REFERENCE)) {
      references.add(normalisedReference(match[0], match[1], match[2]));
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
// V8's compiled code is cached with them, so later isolates skip parsing and compiling ~600 KB of JavaScript.
type TemplateBundle = { code: string; cachedData?: ivm.ExternalCopy<ArrayBuffer> };
let templateBundles: TemplateBundle[] | undefined;
const loadTemplateBundles = (): TemplateBundle[] =>
  (templateBundles ??= ['moment/min/moment.min.js', 'lodash/lodash.min.js'].map((path) => ({
    code: readFileSync(require.resolve(path), 'utf8'),
  })));

// A fresh isolate per run (runs never share state) with moment and lodash on its global.
function createTemplateSandbox(): { isolate: ivm.Isolate; context: ivm.Context } {
  const isolate = new ivm.Isolate({ memoryLimit: parseInt(process.env?.WORKFLOW_JS_MEMORY_LIMIT_MB) || 20 });
  try {
    const context = isolate.createContextSync();
    for (const bundle of loadTemplateBundles()) {
      // The typings omit the CachedDataResult that compile returns alongside the Script.
      const script = (
        bundle.cachedData
          ? isolate.compileScriptSync(bundle.code, { cachedData: bundle.cachedData })
          : isolate.compileScriptSync(bundle.code, { produceCachedData: true })
      ) as ivm.Script & ivm.CachedDataResult;
      if (!bundle.cachedData && script.cachedData) bundle.cachedData = script.cachedData;
      script.runSync(context, { timeout: 5000 });
    }
    return { isolate, context };
  } catch (error) {
    if (!isolate.isDisposed) isolate.dispose();
    throw error;
  }
}

// Runs library code (a transformation) on the server the way the browser does: a function body where `return`
// works, with only `scope`'s names plus moment and lodash. Own isolate per run: resolveCode writes `scope` as
// globals, so a shared isolate would leak `input`/`data` into whatever runs next.
export function runLibraryCode(
  code: string,
  scope: Record<string, unknown>,
  // Where `console.log` goes; without it, calling console.log throws.
  addLog?: (message: string) => void
): unknown {
  const { isolate, context } = createTemplateSandbox();
  try {
    return resolveCode({ code, state: scope, isolate, context, wrapInIIFE: true, addLog });
  } finally {
    // A memory-limit kill already disposes the isolate; disposing again would throw and mask the real error.
    if (!isolate.isDisposed) isolate.dispose();
  }
}

export function assertLibraryTarget({
  consumer,
  library,
  consumerApp,
}: {
  consumer: DataQuery;
  library: LibraryQuery | null;
  consumerApp: { organizationId: string };
}): void {
  if (consumer?.kind !== LIBRARY_KIND) throw new BadRequestException('Not a library query');
  if (!library || library.organizationId !== consumerApp.organizationId)
    throw new NotFoundException(LIBRARY_QUERY_MISSING);
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

export type LibraryRunValues = { inputs?: Record<string, unknown> };

// Who runs a consumer: an app (or module) checks query-level permissions on it; a workflow node doesn't,
// like every other workflow node.
export type LibraryRunCaller = 'app' | 'workflow';

// Library templates see `input` and `globals.currentUser` (from the signed-in user, never the client).
// The library editor resolves with the same names (queryPanelSlice), so authors see what consumers get.
export function buildLibraryVariableMap(
  options: Record<string, any>,
  values: LibraryRunValues = {},
  { currentUser, resolveServerText }: LibraryRunContext = {}
): {
  input: Record<string, unknown>;
  // `input` with each default's server references still as text: safe to send to the browser.
  scope: { input: Record<string, unknown> };
  variableMap: Record<string, unknown>;
} {
  // Started on the first template only: most runs have none, and the sandbox is synchronous work on the request thread.
  let sandbox: { isolate: ivm.Isolate; context: ivm.Context } | undefined;
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
    const { isolate, context } = (sandbox ??= createTemplateSandbox());
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
    for (const { name, defaultValue } of (Array.isArray(definitions) ? definitions : []) as LibraryInput[]) {
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
    const { resolved: input, raw: rawInput } = resolveDeclared(options?.inputs, values?.inputs);

    const globals = { currentUser: currentUser ?? {} };
    // The transformation runs in the browser, so its {{ }} are never resolved here (like inputs).
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { inputs: _i, transformation: _t, ...queryOptions } = options ?? {};
    const variableMap: Record<string, unknown> = {};
    for (const text of collectStrings(queryOptions)) {
      for (const variable of getDynamicVariables(text.replace(/\n/g, ' ')) ?? []) {
        if (SERVER_RESOLVED.test(variable) || variable in variableMap) continue;
        variableMap[variable] = evaluate(variable.slice(2, -2), { input, globals }, variable);
      }
    }
    return { input, scope: { input: rawInput }, variableMap };
  } finally {
    // A memory-limit kill already disposes the isolate; disposing again would throw and mask the real error.
    if (sandbox && !sandbox.isolate.isDisposed) sandbox.isolate.dispose();
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
  versionName: string; // persisted draft or saved-version name
};

export function toRunTarget(query: LibraryQuery, snapshot: LibraryQueryVersion | LibraryQueryDraft): LibraryRunTarget {
  return {
    queryId: query.id,
    name: query.name,
    kind: snapshot.kind,
    dataSourceId: snapshot.dataSourceId ?? null,
    options: snapshot.options as Record<string, unknown>,
    versionName: snapshot.name,
  };
}

export type LibraryPin = {
  consumerQueryName: string;
  libraryQueryName: string;
  pinnedVersion: string;
  pinnedVersionId: string | null;
  releasedVersionId: string | null;
  status: 'draft' | 'saved' | 'missing';
  releasedVersion: string | null;
  pinnedEnvironment: { name: string; priority: number } | null;
};

export type LibraryPinRow = {
  consumerQueryName: string;
  libraryQueryName: string | null;
  pinnedVersionName: string | null;
  releasedVersionName: string | null;
  pinnedVersionId: string | null;
  releasedVersionId: string | null;
  draftId: string | null;
  draftName: string | null;
  pinnedEnvironmentName: string | null;
  pinnedEnvironmentPriority: number | null;
};

export function toLibraryPins(rows: LibraryPinRow[]): LibraryPin[] {
  return rows.map((row) => ({
    consumerQueryName: row.consumerQueryName,
    libraryQueryName: row.libraryQueryName ?? 'unknown query',
    pinnedVersion: row.pinnedVersionName ?? row.draftName ?? 'missing',
    releasedVersion: row.releasedVersionName,
    pinnedVersionId: row.pinnedVersionId ?? row.draftId,
    releasedVersionId: row.releasedVersionId,
    status: row.pinnedVersionId ? 'saved' : row.draftId ? 'draft' : 'missing',
    pinnedEnvironment:
      row.pinnedVersionId && row.pinnedEnvironmentName !== null
        ? { name: row.pinnedEnvironmentName, priority: Number(row.pinnedEnvironmentPriority) }
        : null,
  }));
}

type LibraryGateBlock = { error: string; details: string } | null;

// A missing pin (imported or pulled without its library query, or deleted) blocks like a draft pin.
const draftPinSentence = (pin: LibraryPin) =>
  pin.status === 'missing'
    ? `Library query "${pin.consumerQueryName}" uses a library query that isn't in this workspace. Pick one from the library.`
    : `Library query "${pin.consumerQueryName}" is on the draft of "${pin.libraryQueryName}". Pin a saved version.`;

// Wording copies checkModulesPromotableToEnvironment: one offender inline, several counted.
function gateBlock(verb: 'Release' | 'Promote', sentences: Set<string>): LibraryGateBlock {
  if (sentences.size === 0) return null;
  const details = [...sentences].join(' ');
  const error =
    sentences.size === 1
      ? `${verb} blocked - ${details}`
      : `${verb} blocked - ${sentences.size} library queries need attention. ${details}`;
  return { error, details };
}

// Release gate (null = go ahead): every pin must be its query's Released version.
export function libraryReleaseBlock(pins: LibraryPin[]): LibraryGateBlock {
  const sentences = new Set<string>();
  for (const pin of pins) {
    if (pin.status !== 'saved') sentences.add(draftPinSentence(pin));
    else if (pin.pinnedVersionId !== pin.releasedVersionId)
      sentences.add(
        `Library query "${pin.consumerQueryName}" uses "${pin.libraryQueryName}" ${pin.pinnedVersion}, but the released version is ${pin.releasedVersion ?? 'none'}.`
      );
  }
  return gateBlock('Release', sentences);
}

// Promote gate (null = go ahead): every pinned version must already be in the target environment.
export function libraryPromoteBlock(pins: LibraryPin[], targetName: string, targetPriority: number): LibraryGateBlock {
  const sentences = new Set<string>();
  for (const pin of pins) {
    if (pin.status !== 'saved') sentences.add(draftPinSentence(pin));
    else if ((pin.pinnedEnvironment?.priority ?? -Infinity) < targetPriority)
      sentences.add(
        `Library query "${pin.libraryQueryName}" version "${pin.pinnedVersion}" not promoted to ${targetName} yet.`
      );
  }
  return gateBlock('Promote', sentences);
}

// Consumer identity and app metadata remain intact; execution selects library credentials on the default branch.
export function toLibraryRunEntity(target: LibraryRunTarget, dataSource: DataSource, consumer: DataQuery): DataQuery {
  // Execute the library query, but authorise and audit it as the consumer query:
  // EE query-permission checks key off dataQuery.id/permissions (ee/data-queries/util.service.ts).
  return Object.assign(Object.create(Object.getPrototypeOf(consumer)), consumer, {
    id: consumer.id,
    name: target.name,
    kind: target.kind,
    dataSourceId: target.dataSourceId,
    dataSource,
    appVersionId: consumer.appVersionId,
    appVersion: consumer.appVersion,
    permissions: consumer.permissions ?? [],
    options: cloneDeep(target.options),
  });
}

// An app's pin must be a live version of the library query the consumer points at.
export function pickPinnedVersion(version: LibraryQueryVersion | null, libraryQueryId: string): LibraryQueryVersion {
  if (!version || version.libraryQueryId !== libraryQueryId)
    throw new NotFoundException('Library query version not found');
  return version;
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
  // Same rule as the app runner: the editor saves per-language code under `transformations`.
  const language = options.transformationLanguage as string | undefined;
  const perLanguage = options.transformations as Record<string, unknown> | undefined;
  return String(perLanguage?.[language ?? 'javascript'] ?? options.transformation ?? '');
}

// Same strings as APP_TYPES.FRONT_END / MODULE / WORKFLOW, as literals so the type is a plain union.
const CONSUMER_APP_TYPES = ['front-end', 'module', 'workflow'] as const;
export type LibraryConsumerAppType = (typeof CONSUMER_APP_TYPES)[number];

export type LibraryConsumer = {
  appId: string;
  appName: string;
  appType: LibraryConsumerAppType; // apps, modules and workflows consume library queries
  appVersionName: string; // every app version counts as a use, not just the latest
  queryId: string;
  queryName: string;
  libraryQueryId: string;
  libraryQueryVersionId: string;
  status: 'DRAFT' | 'PUBLISHED' | 'MISSING';
  versionName: string; // persisted draft or saved-version name; missing for an unresolved pin
  pinnedEnvironment: string | null; // environment name of the pinned version; null for a draft pin
};

// Shared by DataQueryRepository and AppsService (EE AppsService has its own constructor, so no repo injection).
// Matches consumers whose pointer is a query of the given library app version, whatever app version they sit in.
export async function queryLibraryConsumers(
  manager: EntityManager,
  organizationId: string,
  libraryQueryId?: string,
  libraryVersionId?: string
): Promise<LibraryConsumer[]> {
  // data_queries.options may be simple-json (text): cast to jsonb. Pointer ids are compared as uuid;
  // consumerOptionUuidSql turns a malformed pointer into NULL, so it matches nothing instead of failing the cast.
  const params: unknown[] = [organizationId, LIBRARY_KIND, [...CONSUMER_APP_TYPES]];
  let queryFilter = '';
  if (libraryQueryId) {
    params.push(libraryQueryId);
    queryFilter = `AND lq.id = $4::uuid`;
    if (libraryVersionId) {
      params.push(libraryVersionId);
      queryFilter += ` AND ${consumerOptionUuidSql('libraryQueryVersionId')} = $5::uuid`;
    }
  }
  return manager.query(
    // apps.name is NULL on the branch model; the name lives on app_versions.app_name.
    // Scope both snapshot tables to this query; display names never determine lifecycle status.
    `SELECT a.id AS "appId", COALESCE(av.app_name, a.name) AS "appName", a.type::text AS "appType",
            av.name AS "appVersionName", dq.id AS "queryId", dq.name AS "queryName", lq.id AS "libraryQueryId",
            ${consumerOptionUuidSql('libraryQueryVersionId')} AS "libraryQueryVersionId",
            CASE WHEN lv.id IS NOT NULL THEN 'PUBLISHED' WHEN ld.id IS NOT NULL THEN 'DRAFT' ELSE 'MISSING' END AS status,
            COALESCE(lv.name, ld.name, 'missing') AS "versionName",
            env.name AS "pinnedEnvironment"
       FROM data_queries dq
       JOIN data_sources data_source ON data_source.id = dq.data_source_id AND data_source.kind = $2
       JOIN app_versions av ON av.id = dq.app_version_id
       JOIN apps a ON a.id = av.app_id
       JOIN library_queries lq ON lq.id = ${consumerOptionUuidSql('libraryQueryId')} AND lq.organization_id = $1
       LEFT JOIN library_query_versions lv ON lv.id = ${consumerOptionUuidSql('libraryQueryVersionId')}
                                          AND lv.library_query_id = lq.id AND lv.deleted_at IS NULL
       LEFT JOIN library_query_drafts ld ON ld.id = ${consumerOptionUuidSql('libraryQueryVersionId')}
                                        AND ld.library_query_id = lq.id AND ld.deleted_at IS NULL
       LEFT JOIN app_environments env ON env.id = lv.current_environment_id
      WHERE a.organization_id = $1
        AND a.type::text = ANY($3::text[])
        ${queryFilter}
      ORDER BY "appName", av.name, dq.name`,
    params
  );
}

export type LibraryUsageEntry = {
  id: string;
  name: string;
  queries: {
    id: string;
    name: string;
    appVersionName: string;
    libraryQueryId: string;
    libraryQueryVersionId: string;
    status: 'DRAFT' | 'PUBLISHED' | 'MISSING';
    versionName: string;
    pinnedEnvironment: string | null;
  }[];
};

// Split by app type. The `apps` key keeps its V1 meaning: front-end apps only.
export function toLibraryUsage(consumers: LibraryConsumer[]): {
  apps: LibraryUsageEntry[];
  modules: LibraryUsageEntry[];
  workflows: LibraryUsageEntry[];
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
        libraryQueryVersionId: row.libraryQueryVersionId,
        status: row.status,
        versionName: row.versionName,
        pinnedEnvironment: row.pinnedEnvironment ?? null,
      });
      byApp.set(row.appId, entry);
    }
    return [...byApp.values()];
  };
  return { apps: group('front-end'), modules: group('module'), workflows: group('workflow') };
}

// The delete-in-use message: counts apps, modules and workflows, lists each app version once.
export function libraryUsedByMessage(consumers: LibraryConsumer[]): string {
  const countOf = (appType: LibraryConsumerAppType) =>
    new Set(consumers.filter((consumer) => consumer.appType === appType).map((consumer) => consumer.appId)).size;
  const labels: Record<LibraryConsumerAppType, string> = {
    'front-end': 'app(s)',
    module: 'module(s)',
    workflow: 'workflow(s)',
  };
  const counts = CONSUMER_APP_TYPES.filter((appType) => countOf(appType)).map(
    (appType) => `${countOf(appType)} ${labels[appType]}`
  );
  const countText =
    counts.length > 1 ? `${counts.slice(0, -1).join(', ')} and ${counts[counts.length - 1]}` : counts[0];
  // Same order as the counts: apps, then modules, then workflows.
  const ordered = [...consumers].sort(
    (a, b) => CONSUMER_APP_TYPES.indexOf(a.appType) - CONSUMER_APP_TYPES.indexOf(b.appType)
  );
  const list = [...new Set(ordered.map((consumer) => `${consumer.appName} · ${consumer.appVersionName}`))].join(', ');
  return `Used by ${countText}: ${list}. Remove it from those first.`;
}
