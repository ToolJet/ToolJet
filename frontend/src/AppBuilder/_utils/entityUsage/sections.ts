import { getComponentUsage } from './componentUsage';
import { getPageLoadQueries, getQueryOwnEvents, getQueryUsage, type RunsOnLoadSections } from './queryUsage';
import { getVariableUsage, type ComponentUsageById, type VariableUsage } from './variableUsage';
import { getQueries } from './internals';

export type QuerySection = {
  id: string;
  name: string;
  query: any;
  usage: ReturnType<typeof getQueryUsage>;
  ownEvents: ReturnType<typeof getQueryOwnEvents>;
  loadTriggers: { appLoad: boolean; pageLoad: boolean };
};

export type ComponentSection = {
  id: string;
  name: string;
  componentType: string;
  definition: any;
  usage: ReturnType<typeof getComponentUsage>;
};

export type DependencySections = {
  runsOnLoad: RunsOnLoadSections;
  queries: QuerySection[];
  components: ComponentSection[];
  variables: { app: VariableUsage[]; page: VariableUsage[] };
};

/**
 * Everything the Dependencies panel renders, in one traversal.
 *
 * Queries, components and variables are filtered down to those that actually
 * participate in a relationship — an entity nothing references and that
 * references nothing is not a dependency, so it is left out of the lists.
 */
export function getDependencySections(state: any, moduleId = 'canvas'): DependencySections {
  const runsOnLoad = getPageLoadQueries(state, moduleId);
  const appLoadIds = new Set(runsOnLoad.appLoad.map((entry) => entry.id));
  const pageLoadIds = new Set(runsOnLoad.pageLoad.map((entry) => entry.id));

  const queries: QuerySection[] = [];
  getQueries(state, moduleId).forEach((query: any) => {
    const usage = getQueryUsage(state, query.id, moduleId);
    const ownEvents = getQueryOwnEvents(state, query.id, moduleId);
    const loadTriggers = { appLoad: appLoadIds.has(query.id), pageLoad: pageLoadIds.has(query.id) };
    const total =
      usage.uses.length +
      usage.usedBy.length +
      usage.triggeredBy.length +
      ownEvents.onSuccess.length +
      ownEvents.onFailure.length +
      (loadTriggers.appLoad ? 1 : 0) +
      (loadTriggers.pageLoad ? 1 : 0);
    if (total === 0) return;
    queries.push({ id: query.id, name: query.name, query, usage, ownEvents, loadTriggers });
  });
  queries.sort((a, b) => a.name.localeCompare(b.name));

  const components: ComponentSection[] = [];
  const pageComponents = state.getCurrentPageComponents?.(moduleId) ?? {};
  // Kept for every component, not just the ones that survive the relationship filter:
  // getVariableUsage needs the full set, and computing it twice per component was the
  // dominant cost of a refresh.
  const componentUsageById: ComponentUsageById = {};
  Object.entries(pageComponents).forEach(([id, definition]: [string, any]) => {
    const usage = getComponentUsage(state, id, moduleId);
    componentUsageById[id] = usage;
    if (usage.uses.length + usage.usedBy.length + usage.triggers.length === 0) return;
    components.push({
      id,
      name: definition?.component?.name ?? 'Unknown component',
      componentType: definition?.component?.component ?? '',
      definition,
      usage,
    });
  });
  components.sort((a, b) => a.name.localeCompare(b.name));

  const { variables: allVariables } = getVariableUsage(state, moduleId, componentUsageById);
  const relatedVariables = allVariables.filter((v) => v.setBy.length + v.readBy.length > 0);

  return {
    runsOnLoad,
    queries,
    components,
    variables: {
      app: relatedVariables.filter((v) => v.scope === 'app'),
      page: relatedVariables.filter((v) => v.scope === 'page'),
    },
  };
}
