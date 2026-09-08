// queryPanel reaches _helpers/utils, which pulls in _services and a bare `config` module
// that jest cannot resolve (58 files import it; there is no mapping for it in the jest
// config). None of these fixtures have query options, so stubbing the extractor keeps the
// module graph loadable without changing what is under test.
jest.mock('@/AppBuilder/_utils/queryPanel', () => ({ extractQueryReferences: () => [] }));

import { getComponentUsage } from '@/AppBuilder/_utils/entityUsage/componentUsage';
import { getVariableUsage } from '@/AppBuilder/_utils/entityUsage/variableUsage';

/**
 * getVariableUsage accepts a precomputed per-component usage map so that
 * getDependencySections does not walk every component twice. These assert that the
 * shortcut reports the same relationships as recomputing — the regression that refactor
 * could silently introduce — plus the behaviour it must not change.
 *
 * Assertions are on *which relationships are found*, never on traversal order or caching.
 */

const MODULE = 'canvas';

/** Minimal graph stub: only the two accessors the selectors call. */
const graphOf = (edges: Record<string, string[]>) => ({
  hasNode: (path: string) => path in edges,
  getDirectDependencies: (path: string) => edges[path] ?? [],
  getDirectDependents: (path: string) =>
    Object.entries(edges)
      .filter(([, targets]) => targets.includes(path))
      .map(([source]) => source),
});

type ComponentFixture = {
  id: string;
  name: string;
  /** section -> property -> raw binding text */
  definition?: Record<string, Record<string, string>>;
};

const stateOf = ({
  components = [],
  edges = {},
  events = [],
  exposedVariables = {},
}: {
  components?: ComponentFixture[];
  edges?: Record<string, string[]>;
  events?: any[];
  exposedVariables?: Record<string, unknown>;
} = {}) => {
  const byId = Object.fromEntries(
    components.map((component) => [
      component.id,
      {
        component: {
          name: component.name,
          component: 'Text',
          definition: Object.fromEntries(
            Object.entries(component.definition ?? {}).map(([section, props]) => [
              section,
              Object.fromEntries(Object.entries(props).map(([prop, value]) => [prop, { value }])),
            ])
          ),
        },
      },
    ])
  );

  return {
    dependencyGraph: { modules: { [MODULE]: { graph: graphOf(edges) } } },
    dataQuery: { queries: { modules: { [MODULE]: [] } } },
    eventsSlice: { module: { [MODULE]: { events } } },
    resolvedStore: { modules: { [MODULE]: { exposedValues: { variables: exposedVariables } } } },
    modules: {
      [MODULE]: {
        pages: [],
        queryIdNameMapping: {},
        queryNameIdMapping: {},
        componentNameIdMapping: Object.fromEntries(components.map((c) => [c.name, c.id])),
      },
    },
    getCurrentPageComponents: () => byId,
    getComponentDefinition: (id: string) => byId[id],
    getCurrentPageId: () => 'page-1',
  };
};

// A text widget whose `text` property is bound to an app variable, expressed as the graph
// edge the engine would have registered plus the definition the expression lives in.
const boundToVariable = () =>
  stateOf({
    components: [
      { id: 'cmp-1', name: 'text1', definition: { properties: { text: '{{variables.userName}}' } } },
      { id: 'cmp-2', name: 'text2', definition: { properties: { text: 'static' } } },
    ],
    edges: {
      'components.cmp-1': ['components.cmp-1.properties.text'],
      'variables.userName': ['components.cmp-1.properties.text'],
    },
  });

describe('getVariableUsage — precomputed component usage', () => {
  it('reports the same variable readers whether or not usage is passed in', () => {
    const state = boundToVariable();
    const precomputed = {
      'cmp-1': getComponentUsage(state, 'cmp-1', MODULE),
      'cmp-2': getComponentUsage(state, 'cmp-2', MODULE),
    };

    const recomputed = getVariableUsage(state, MODULE);
    const shortcut = getVariableUsage(state, MODULE, precomputed);

    expect(shortcut).toEqual(recomputed);
  });

  it('finds the component reading an app variable', () => {
    const state = boundToVariable();
    const { variables } = getVariableUsage(state, MODULE);

    const userName = variables.find((v) => v.name === 'userName' && v.scope === 'app');
    expect(userName).toBeDefined();
    expect(userName?.readBy.map((entry) => entry.name)).toEqual(['text1']);
  });

  it('falls back to computing usage for a component missing from the map', () => {
    const state = boundToVariable();

    // cmp-1 deliberately absent — the reader must still be found.
    const partial = { 'cmp-2': getComponentUsage(state, 'cmp-2', MODULE) };
    const { variables } = getVariableUsage(state, MODULE, partial);

    const userName = variables.find((v) => v.name === 'userName' && v.scope === 'app');
    expect(userName?.readBy.map((entry) => entry.name)).toEqual(['text1']);
  });

  it('keeps variables that are only set by an event handler', () => {
    const state = stateOf({
      components: [{ id: 'cmp-1', name: 'button1' }],
      events: [{ sourceId: 'cmp-1', event: { eventId: 'onClick', actionId: 'set-custom-variable', key: 'counter' } }],
    });

    const { variables } = getVariableUsage(state, MODULE);
    const counter = variables.find((v) => v.name === 'counter' && v.scope === 'app');

    expect(counter?.setBy.map((entry) => entry.name)).toEqual(['button1']);
    expect(counter?.readBy).toEqual([]);
  });

  it('lists a runtime-only variable with no static readers or writers', () => {
    const state = stateOf({ exposedVariables: { orphan: 1 } });
    const { variables } = getVariableUsage(state, MODULE);

    const orphan = variables.find((v) => v.name === 'orphan');
    expect(orphan).toEqual({ name: 'orphan', scope: 'app', setBy: [], readBy: [] });
  });
});
