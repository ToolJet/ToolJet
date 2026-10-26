import { getAllChildComponents } from '@/AppBuilder/AppCanvas/appCanvasUtils';
import type { UsageEntry } from './types';
import { getComponentName, getQueries, getQueryName } from './internals';
import { getComponentUsage } from './componentUsage';
import { getQueryUsage } from './queryUsage';

export type DeleteTargets = { componentIds?: string[]; queryIds?: string[] };

export type DeleteSubject = {
  kind: 'component' | 'query';
  id: string;
  name: string;
  /** Widget type of a component subject — the card header icon is resolved from it. */
  componentType?: string;
  /** The raw query, for the datasource icon on a query subject's card header. */
  query?: any;
  /** References from outside the selection that block the delete. */
  dependents: UsageEntry[];
  /**
   * entryKey -> name of the descendant the reference actually points at, for
   * dependents that reach the subject only through a child (deleting a container
   * deletes its children, so their references block the container too).
   */
  viaDescendant: Record<string, string>;
};

const entryKeyOf = (entry: UsageEntry) => `${entry.kind}:${entry.id ?? entry.name}`;

function mergeDependent(bucket: Map<string, UsageEntry>, entry: UsageEntry) {
  const key = entryKeyOf(entry);
  const existing = bucket.get(key);
  if (!existing) {
    bucket.set(key, { ...entry, details: [...entry.details] });
    return;
  }
  entry.details.forEach((detail) => {
    const match = existing.details.find((d) => d.label === detail.label);
    if (!match) existing.details.push(detail);
    else if (!match.expression && detail.expression) match.expression = detail.expression;
  });
}

/**
 * Everything that stops `targets` from being deleted: one entry per target that is
 * still referenced from outside the selection, with the referencing entities.
 *
 * An empty array means the delete is safe to perform. Read-only — like the rest of
 * this module it never writes to the graph or the resolved store.
 *
 * Two kinds of reference are deliberately not blockers:
 *  - references originating inside the selection (they are being deleted too), where
 *    the selection includes every descendant of a selected component
 *  - `unknown` entries, i.e. refs whose target no longer resolves; a stale binding
 *    must never make an entity permanently undeletable
 */
export function getDeleteBlockers(state: any, targets: DeleteTargets, moduleId = 'canvas'): DeleteSubject[] {
  const componentIds = (targets.componentIds ?? []).filter(Boolean);
  const queryIds = (targets.queryIds ?? []).filter(Boolean);
  if (!componentIds.length && !queryIds.length) return [];

  const allComponents = state.getCurrentPageComponents?.(moduleId) ?? {};

  const descendantsOf = new Map<string, string[]>();
  const componentClosure = new Set<string>(componentIds);
  componentIds.forEach((componentId) => {
    const childIds = getAllChildComponents(allComponents, componentId).map((child: any) => child.id);
    descendantsOf.set(componentId, childIds);
    childIds.forEach((childId: string) => componentClosure.add(childId));
  });
  const queryClosure = new Set<string>(queryIds);

  const isInsideSelection = (entry: UsageEntry) =>
    (entry.kind === 'component' && entry.id && componentClosure.has(entry.id)) ||
    (entry.kind === 'query' && entry.id && queryClosure.has(entry.id));

  const isBlocking = (entry: UsageEntry) => entry.kind !== 'unknown' && !isInsideSelection(entry);

  const subjects: DeleteSubject[] = [];

  componentIds.forEach((componentId) => {
    const definition = allComponents[componentId];
    const dependents = new Map<string, UsageEntry>();
    const viaDescendant: Record<string, string> = {};
    const fromSubject = new Set<string>();

    getComponentUsage(state, componentId, moduleId)
      .usedBy.filter(isBlocking)
      .forEach((entry) => {
        fromSubject.add(entryKeyOf(entry));
        mergeDependent(dependents, entry);
      });

    (descendantsOf.get(componentId) ?? []).forEach((childId) => {
      const childName = getComponentName(state, childId, moduleId) ?? childId;
      getComponentUsage(state, childId, moduleId)
        .usedBy.filter(isBlocking)
        .forEach((entry) => {
          const key = entryKeyOf(entry);
          mergeDependent(dependents, entry);
          if (!fromSubject.has(key) && !viaDescendant[key]) viaDescendant[key] = childName;
        });
    });

    if (!dependents.size) return;
    subjects.push({
      kind: 'component',
      id: componentId,
      name: definition?.component?.name ?? componentId,
      componentType: definition?.component?.component,
      dependents: Array.from(dependents.values()),
      viaDescendant,
    });
  });

  const queries = getQueries(state, moduleId);
  queryIds.forEach((queryId) => {
    const usage = getQueryUsage(state, queryId, moduleId);
    const dependents = new Map<string, UsageEntry>();
    [...usage.usedBy, ...usage.triggeredBy].filter(isBlocking).forEach((entry) => mergeDependent(dependents, entry));

    if (!dependents.size) return;
    const query = queries.find((q: any) => q.id === queryId);
    subjects.push({
      kind: 'query',
      id: queryId,
      name: getQueryName(state, queryId, moduleId) ?? query?.name ?? queryId,
      query,
      dependents: Array.from(dependents.values()),
      viaDescendant: {},
    });
  });

  return subjects.sort((a, b) => a.name.localeCompare(b.name));
}
