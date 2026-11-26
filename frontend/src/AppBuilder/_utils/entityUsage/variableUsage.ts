import { getQueryCodeAnalyses, ScriptAnalysis } from '@/AppBuilder/_utils/scriptAnalysis';
import type { UsageDetail, UsageEntry } from './types';
import {
  addComponentEntry,
  addEntry,
  addQueryEntry,
  addRefEntry,
  detailOf,
  getComponentName,
  getEvents,
  getQueries,
  getQueryName,
  sorted,
} from './internals';
import { VARIABLE_EVENT_TARGETS } from './eventTargets';
import { getQueryRefs } from './queryRefs';
import { getComponentUsage } from './componentUsage';
import { getVariableRefs, variableKey } from '../variableDefinitions';
import { getVariableDefinitionRefs } from './variableDefinitionRefs';

export type VariableUsage = {
  name: string;
  scope: 'app' | 'page';
  uses: UsageEntry[];
  setBy: UsageEntry[];
  readBy: UsageEntry[];
};

/** Per-component usage the caller has already computed, keyed by component id. */
export type ComponentUsageById = Record<string, ReturnType<typeof getComponentUsage>>;

/**
 * Variable-centric view: who sets / reads each app and page variable.
 * Sources: script analyses (RunJS + JS transformations), {{}} refs in query
 * options, component bindings (via getComponentUsage), declared-variable expressions,
 * and event-handler variable writes. Runtime-only variables (set but never referenced
 * statically) are included via exposedValues keys.
 * Current values are NOT returned — the UI reads them live via selectors.
 *
 * `componentUsageById` lets a caller that has already walked every component (see
 * getDependencySections) hand those results in. Recomputing them here would double the
 * graph traversals for the whole page, which is the dominant cost of a panel refresh.
 */
export function getVariableUsage(
  state: any,
  moduleId = 'canvas',
  componentUsageById?: ComponentUsageById,
  definitionRefs = getVariableDefinitionRefs(state, moduleId)
) {
  type Row = {
    name: string;
    scope: 'app' | 'page';
    uses: Map<string, UsageEntry>;
    setBy: Map<string, UsageEntry>;
    readBy: Map<string, UsageEntry>;
  };
  const rows = new Map<string, Row>();

  const row = (scope: 'app' | 'page', name: string): Row => {
    const key = `${scope}:${name}`;
    let r = rows.get(key);
    if (!r) {
      r = { name, scope, uses: new Map(), setBy: new Map(), readBy: new Map() };
      rows.set(key, r);
    }
    return r;
  };

  const applyAnalysis = (analysis: ScriptAnalysis | null, queryId: string, queryName: string, label: string) => {
    if (!analysis) return;
    const detail = detailOf(label);
    analysis.variableWrites.forEach((n) =>
      addQueryEntry(state, moduleId, row('app', n).setBy, queryId, detail, queryName)
    );
    analysis.variableReads.forEach((n) =>
      addQueryEntry(state, moduleId, row('app', n).readBy, queryId, detail, queryName)
    );
    analysis.pageVariableWrites.forEach((n) =>
      addQueryEntry(state, moduleId, row('page', n).setBy, queryId, detail, queryName)
    );
    analysis.pageVariableReads.forEach((n) =>
      addQueryEntry(state, moduleId, row('page', n).readBy, queryId, detail, queryName)
    );
  };

  getQueries(state, moduleId).forEach((query: any) => {
    const { script, transformation } = getQueryCodeAnalyses(query);
    applyAnalysis(script, query.id, query.name, 'code');
    applyAnalysis(transformation, query.id, query.name, 'transformation');

    getQueryRefs(state, query, moduleId).forEach((ref: any) => {
      const refDetail = detailOf(ref.sourceString && 'value', ref.sourceString);
      if (ref.entityType === 'variables')
        addQueryEntry(state, moduleId, row('app', ref.entityKey).readBy, query.id, refDetail, query.name);
      else if (ref.entityType === 'page' && ref.entityNameOrId === 'variables')
        addQueryEntry(state, moduleId, row('page', ref.entityKey).readBy, query.id, refDetail, query.name);
    });
  });

  const pageComponents = state.getCurrentPageComponents?.(moduleId) ?? {};
  Object.keys(pageComponents).forEach((componentId) => {
    const usage = componentUsageById?.[componentId] ?? getComponentUsage(state, componentId, moduleId, definitionRefs);
    usage.uses.forEach((entry) => {
      if (entry.kind === 'variable') {
        addComponentEntry(state, moduleId, row('app', entry.name).readBy, componentId, entry.details[0]);
      } else if (entry.kind === 'pageVariable') {
        addComponentEntry(state, moduleId, row('page', entry.name).readBy, componentId, entry.details[0]);
      }
    });
  });

  getEvents(state, moduleId).forEach((evt: any) => {
    const action = evt?.event;
    if (!action) return;
    const sourceId = evt?.sourceId;
    const detail: UsageDetail = { label: action.eventId, eventId: action.eventId, actionId: action.actionId };
    const addSource = (bucket: Map<string, UsageEntry>) => {
      if (getComponentName(state, sourceId, moduleId)) addComponentEntry(state, moduleId, bucket, sourceId, detail);
      else if (getQueryName(state, sourceId, moduleId)) addQueryEntry(state, moduleId, bucket, sourceId, detail);
      else {
        const page = state.modules?.[moduleId]?.pages?.find((p: any) => p.id === sourceId);
        if (page) addEntry(bucket, 'page', sourceId, page.name, detail);
      }
    };

    if (action.actionId === 'unset-all-custom-variables') {
      addSource(row('app', 'all app variables').setBy);
      return;
    }
    if (action.actionId === 'unset-all-page-variables') {
      addSource(row('page', 'all page variables').setBy);
      return;
    }

    const writeKind = VARIABLE_EVENT_TARGETS[action.actionId];
    if (!writeKind) return;
    const key = action.key;
    if (typeof key !== 'string' || !key.length || key.includes('{{')) return;
    const scope: 'app' | 'page' = writeKind === 'variable' ? 'app' : 'page';
    addSource(row(scope, key).setBy);
  });

  const exposed = state.resolvedStore?.modules?.[moduleId]?.exposedValues;
  definitionRefs.forEach(
    ({
      definition,
      expression,
      refs,
    }: {
      definition: { scope: 'app' | 'page'; name: string; value: string; fxActive: boolean };
      expression: string;
      refs: any[];
    }) => {
      const reader = row(definition.scope, definition.name);
      refs.forEach((ref) => {
        // Variable edges retain their scoped identities below.
        if (ref.entityType !== 'variables' && !(ref.entityType === 'page' && ref.entityNameOrId === 'variables'))
          addRefEntry(state, moduleId, reader.uses, { ...ref, sourceString: expression });
      });
      getVariableRefs(expression).forEach((source: { scope: 'app' | 'page'; name: string }) => {
        const detail = detailOf('Initial value', expression);
        addEntry(
          reader.uses,
          source.scope === 'app' ? 'variable' : 'pageVariable',
          variableKey(source.scope, source.name),
          source.name,
          detail
        );
        addEntry(
          row(source.scope, source.name).readBy,
          definition.scope === 'app' ? 'variable' : 'pageVariable',
          variableKey(definition.scope, definition.name),
          definition.name,
          detail
        );
      });
    }
  );
  Object.keys(exposed?.variables ?? {}).forEach((n) => row('app', n));
  Object.keys(exposed?.page?.variables ?? {}).forEach((n) => row('page', n));

  const variables: VariableUsage[] = Array.from(rows.values())
    .map((r) => ({
      name: r.name,
      scope: r.scope,
      uses: sorted(r.uses),
      setBy: sorted(r.setBy),
      readBy: sorted(r.readBy),
    }))
    .sort((a, b) => a.scope.localeCompare(b.scope) || a.name.localeCompare(b.name));

  return { variables };
}
