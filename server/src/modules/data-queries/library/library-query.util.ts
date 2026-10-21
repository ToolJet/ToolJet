import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import * as ivm from 'isolated-vm';
import { cloneDeep } from 'lodash';
import { getDynamicVariables, resolveCode } from 'lib/utils';
import { APP_TYPES } from '@modules/apps/constants';
import { DataQuery } from '@entities/data_query.entity';
import { EntityManager } from 'typeorm';

export const LIBRARY_KIND = 'library';
export const LIBRARY_QUERY_IS_CLIENT_SIDE = 'LIBRARY_QUERY_IS_CLIENT_SIDE';
export const CLIENT_SIDE_LIBRARY_KINDS: readonly string[] = ['runjs'];
export const UNSUPPORTED_LIBRARY_KINDS: readonly string[] = ['runpy', 'workflows', 'library'];

// Resolved later by parseQueryOptionsInternal → resolveConstants; never evaluate them here.
const SERVER_RESOLVED = /^\{\{\s*(constants|secrets|globals\.server)\./;
const WHOLE_TEMPLATE = /^\{\{([\s\S]*)\}\}$/;

type LibraryParameter = { name?: string; defaultValue?: unknown };

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
  if (UNSUPPORTED_LIBRARY_KINDS.includes(library.kind)) {
    throw new BadRequestException(`${library.kind} queries can't be used from a query library`);
  }
}

export function assertSameLibrary(primary: DataQuery, sibling: DataQuery | null): void {
  // Sibling calls exist only for library RunJS (spec D15). Without this, anyone who can run an
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
};

// Library templates see `parameters` and `globals.currentUser` (from the signed-in user, never the client).
// The library editor resolves with the same names (queryPanelSlice), so authors see what consumers get.
export function buildLibraryVariableMap(
  options: Record<string, any>,
  inputs: Record<string, unknown> = {},
  { currentUser }: LibraryRunContext = {}
): { parameters: Record<string, unknown>; variableMap: Record<string, unknown> } {
  const memoryLimit = parseInt(process.env?.WORKFLOW_JS_MEMORY_LIMIT_MB) || 20;
  const isolate = new ivm.Isolate({ memoryLimit });
  const context = isolate.createContextSync();
  // resolveCode throws raw V8 errors (TypeError, ReferenceError, timeout, ...). Map them to a
  // client error that names the template, so a bad query template is a 400, not a 500.
  const evaluate = (code: string, state: Record<string, unknown>, template: string) => {
    try {
      return resolveCode({ code, state, isolate, context, wrapInIIFE: false });
    } catch (error) {
      throw new BadRequestException(`Could not resolve ${template}: ${error?.message ?? error}`);
    }
  };

  try {
    const safeInputs = inputs ?? {};
    const parameters: Record<string, unknown> = {};
    for (const { name, defaultValue } of (options?.parameters ?? []) as LibraryParameter[]) {
      if (!name) continue;
      if (safeInputs[name] !== undefined) {
        parameters[name] = safeInputs[name];
        continue;
      }
      const match = typeof defaultValue === 'string' ? defaultValue.trim().match(WHOLE_TEMPLATE) : null;
      parameters[name] = match ? evaluate(match[1], {}, defaultValue as string) : defaultValue;
    }

    const globals = { currentUser: currentUser ?? {} };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { parameters: _definitions, ...queryOptions } = options ?? {};
    const variableMap: Record<string, unknown> = {};
    for (const text of collectStrings(queryOptions)) {
      for (const variable of getDynamicVariables(text.replace(/\n/g, ' ')) ?? []) {
        if (SERVER_RESOLVED.test(variable) || variable in variableMap) continue;
        variableMap[variable] = evaluate(variable.slice(2, -2), { parameters, globals }, variable);
      }
    }
    return { parameters, variableMap };
  } finally {
    // A memory-limit kill already disposes the isolate; disposing again would throw and mask the real error.
    if (!isolate.isDisposed) isolate.dispose();
  }
}

export function toLibraryRunEntity(library: DataQuery, consumer: DataQuery): DataQuery {
  // Execute the library query, but authorise and audit it as the consumer query:
  // EE query-permission checks key off dataQuery.id/permissions (ee/data-queries/util.service.ts).
  return Object.assign(Object.create(Object.getPrototypeOf(library)), library, {
    id: consumer.id,
    permissions: consumer.permissions ?? [],
    options: cloneDeep(library.options),
  });
}

export type LibraryConsumer = {
  appId: string;
  appName: string;
  queryId: string;
  queryName: string;
  libraryQueryId: string;
};

// Shared by DataQueryRepository and AppsService (EE AppsService has its own constructor, so no repo injection).
export async function queryLibraryConsumers(
  manager: EntityManager,
  organizationId: string,
  libraryAppId: string,
  libraryQueryId?: string
): Promise<LibraryConsumer[]> {
  // data_queries.options may be simple-json (text) — cast to jsonb to read the pointer.
  const params: unknown[] = [organizationId, libraryAppId];
  let queryFilter = '';
  if (libraryQueryId) {
    params.push(libraryQueryId);
    queryFilter = `AND dq.options::jsonb ->> 'libraryQueryId' = $3`;
  }
  return manager.query(
    `SELECT a.id AS "appId", a.name AS "appName", dq.id AS "queryId", dq.name AS "queryName",
            dq.options::jsonb ->> 'libraryQueryId' AS "libraryQueryId"
       FROM data_queries dq
       JOIN data_sources ds ON ds.id = dq.data_source_id AND ds.kind = '${LIBRARY_KIND}'
       JOIN app_versions av ON av.id = dq.app_version_id
       JOIN apps a ON a.id = av.app_id
      WHERE a.organization_id = $1
        AND dq.options::jsonb ->> 'libraryAppId' = $2
        ${queryFilter}
      ORDER BY a.name, dq.name`,
    params
  );
}
