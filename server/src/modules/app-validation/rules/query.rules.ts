import { QueryWrite, Rule, RuleContext, Severity, WriteSource } from '../types';

// Matches the editor's validateQueryName (frontend/src/_helpers/utils.js): queries are
// referenced from code as `queries.<name>`, so names stay identifier-like.
export const QUERY_NAME_PATTERN = /^[A-Za-z0-9_-]+$/;

const BULK_SOURCES: ReadonlySet<WriteSource> = new Set(['import', 'git', 'copy', 'restore']);

function referenceSeverity(source: WriteSource): Severity {
  return BULK_SOURCES.has(source) ? 'medium' : 'high';
}

function labelOf(write: QueryWrite): string {
  return write.data?.name ?? write.id;
}

function touchedField(write: QueryWrite, field: string): boolean {
  if (write.op !== 'update' || !write.touched) return true;
  return write.touched.includes(field);
}

export const queryNameFormat: Rule<QueryWrite> = {
  id: 'query-name-format',
  description: 'The query name is a valid identifier',
  check(write) {
    if (write.op === 'delete' || !write.data?.name || !touchedField(write, 'name')) return [];
    if (QUERY_NAME_PATTERN.test(write.data.name)) return [];
    return [
      {
        code: 'QUERY_NAME_INVALID',
        severity: 'high',
        confidence: 'certain',
        path: `${labelOf(write)}.name`,
        message: `${labelOf(write)} → name: only letters, digits, underscore and hyphen are allowed, got "${write.data.name}"`,
        entity: { type: 'query', id: write.id, name: write.data.name },
        fix: 'Rename the query, e.g. "getOrders".',
      },
    ];
  },
};

// Code resolves queries by name, so a duplicate makes `queries.<name>` ambiguous. Run this
// inside the save transaction after lockForValidation(manager, 'data_query_name', versionId).
export const queryNameUnique: Rule<QueryWrite> = {
  id: 'query-name-unique',
  description: 'The query name is unique in the app version',
  async check(write, ctx: RuleContext) {
    if (write.op === 'delete' || !write.data?.name || !touchedField(write, 'name')) return [];
    const index = await ctx.index();
    const clash = index.queriesNamed(write.data.name).find((query) => query.id !== write.id);
    if (!clash) return [];
    return [
      {
        code: 'QUERY_NAME_TAKEN',
        severity: 'high',
        confidence: 'certain',
        path: `${labelOf(write)}.name`,
        message: `${labelOf(write)} → name: a query named "${write.data.name}" already exists in this app version`,
        entity: { type: 'query', id: write.id, name: write.data.name },
      },
    ];
  },
};

// A query whose options were written for one kind of data source breaks when it runs
// against another. Exports don't store `kind` on the query row, so imports skip the
// mismatch check. Changing the data source of an existing query only warns: workflows
// legitimately move queries across kinds (see changeQueryDataSource).
export const queryDataSourceValid: Rule<QueryWrite> = {
  id: 'query-datasource-valid',
  description: 'The data source exists and matches the query kind',
  async check(write, ctx: RuleContext) {
    if (write.op === 'delete' || !write.data?.dataSourceId || !touchedField(write, 'dataSourceId')) return [];
    const index = await ctx.index();
    const dataSource = index.dataSource(write.data.dataSourceId);

    if (!dataSource) {
      return [
        {
          code: 'QUERY_DATASOURCE_NOT_FOUND',
          severity: referenceSeverity(ctx.source),
          confidence: 'certain',
          path: `${labelOf(write)}.dataSourceId`,
          message: `${labelOf(write)} → data source: no data source with id ${write.data.dataSourceId} is reachable from this app version`,
          entity: { type: 'query', id: write.id, name: write.data.name },
          fix: 'Use a data source of this workspace, or a static one (restapi, runjs, runpy, tooljetdb).',
        },
      ];
    }

    if (write.data.kind && dataSource.kind && write.data.kind !== dataSource.kind) {
      const certainMismatch = write.op === 'create';
      return [
        {
          code: 'QUERY_KIND_MISMATCH',
          severity: certainMismatch ? 'high' : 'medium',
          confidence: certainMismatch ? 'certain' : 'heuristic',
          path: `${labelOf(write)}.kind`,
          message: `${labelOf(write)} → kind: the query is "${write.data.kind}" but the data source is "${dataSource.kind}"`,
          entity: { type: 'query', id: write.id, name: write.data.name },
        },
      ];
    }
    return [];
  },
};

// An empty body is a query that was created and forgotten; it runs and returns nothing.
export const queryBodyNotEmpty: Rule<QueryWrite> = {
  id: 'query-body-not-empty',
  description: 'A JavaScript query has code in it',
  async check(write, ctx: RuleContext) {
    if (write.op === 'delete' || !write.data?.options || !touchedField(write, 'options')) return [];
    const kind = write.data.kind ?? (await ctx.index()).dataSource(write.data.dataSourceId ?? '')?.kind;
    if (kind !== 'runjs') return [];
    const code = write.data.options.code;
    if (typeof code !== 'string' || code.trim() !== '') return [];
    return [
      {
        code: 'QUERY_EMPTY_CODE',
        severity: 'info',
        confidence: 'certain',
        path: `${labelOf(write)}.options.code`,
        message: `${labelOf(write)} → code: the JavaScript body is empty, the query returns nothing`,
        entity: { type: 'query', id: write.id, name: write.data.name },
      },
    ];
  },
};

// Warned, not blocked: the save is legal, but every handler that ran this query dies with it.
export const queryDeleteStillUsed: Rule<QueryWrite> = {
  id: 'query-delete-still-used',
  description: 'Deleting a query that events still run is reported',
  async check(write, ctx: RuleContext) {
    if (write.op !== 'delete') return [];
    const index = await ctx.index();
    const users = index.events().filter((event) => event.refId === write.id && event.sourceId !== write.id);
    if (!users.length) return [];
    return [
      {
        code: 'QUERY_DELETE_IN_USE',
        severity: 'medium',
        confidence: 'certain',
        path: `${labelOf(write)}`,
        message: `${labelOf(write)}: ${users.length} event handler(s) still point at this query and will stop working`,
        entity: { type: 'query', id: write.id, name: write.data?.name },
      },
    ];
  },
};

export const queryRules: Rule<QueryWrite>[] = [
  queryNameFormat,
  queryNameUnique,
  queryDataSourceValid,
  queryBodyNotEmpty,
  queryDeleteStillUsed,
];
