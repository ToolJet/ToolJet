import { isEqual } from 'lodash';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import { appVersionService } from '@/_services';
import { extractAndReplaceReferencesFromString } from '../ast';
import { replaceEntityReferencesWithIds } from '../utils';
import { savePageChanges } from './pageMenuSlice';
import {
  VARIABLE_SCOPES,
  findVariableCycle,
  isExpressionValue,
  normalizeVariableDefinition,
  normalizeVariableDefinitionMap,
  orderVariableDefinitions,
  parseStaticValue,
  toExpression,
  validateVariableName,
} from '@/AppBuilder/_utils/variableDefinitions';

/**
 * Declared app and page variables (Variables panel).
 *
 * Definitions live in `globalSettings.variables` (app) and `page.variables` (page), each keyed by
 * definition id. At runtime a definition is evaluated into the same place setVariable writes
 * (`exposedValues.variables` / `exposedValues.page.variables`), so bindings, RunJS and events read
 * declared and script-set variables the same way.
 *
 * Expressions are kept current through a sentinel dependency-graph node per definition,
 * `variableDefinitions.<id>.__vardef__`, that depends on everything the expression reads. When one
 * of those changes, applyDependencyUpdate calls recomputeVariableDefinition, which writes through
 * setVariable / setPageVariable so the variable's own dependents follow. The sentinel is never a
 * dependent of `variables.<name>` itself, so a script writing the variable does not trigger a
 * recompute: the script's value lasts until something the expression reads changes.
 */
export const VARIABLE_DEFINITION_NODE_SUFFIX = '.__vardef__';
const nodePathOf = (id) => `variableDefinitions.${id}${VARIABLE_DEFINITION_NODE_SUFFIX}`;

const withScope = (map, scope) => Object.values(map || {}).map((d) => ({ ...normalizeVariableDefinition(d), scope }));
const toStored = (definition) => normalizeVariableDefinition(definition);

export const createVariablesSlice = (set, get) => ({
  getAppVariableDefinitions: () => withScope(get().globalSettings?.variables, VARIABLE_SCOPES.APP),

  getPageVariableDefinitions: (moduleId = 'canvas', pageId = get().getCurrentPageId?.(moduleId)) => {
    const page = get().modules?.[moduleId]?.pages?.find((p) => p.id === pageId);
    return withScope(page?.variables, VARIABLE_SCOPES.PAGE);
  },

  /** App variables plus the current page's variables. */
  getVariableDefinitions: (moduleId = 'canvas') => [
    ...get().getAppVariableDefinitions(),
    ...get().getPageVariableDefinitions(moduleId),
  ],

  getVariableDefinitionById: (id, moduleId = 'canvas') =>
    get()
      .getVariableDefinitions(moduleId)
      .find((d) => d.id === id),

  evaluateVariableDefinition: (definition, moduleId = 'canvas') => {
    if (isExpressionValue(definition)) return get().getResolvedValue(toExpression(definition), {}, moduleId);
    const parsed = parseStaticValue(definition.value);
    return parsed.ok ? parsed.value : definition.value;
  },

  writeVariableDefinitionValue: (definition, value, moduleId = 'canvas') => {
    if (definition.scope === VARIABLE_SCOPES.PAGE) get().setPageVariable(definition.name, value, moduleId);
    else get().setVariable(definition.name, value, moduleId);
  },

  recomputeVariableDefinition: (id, moduleId = 'canvas') => {
    const definition = get().getVariableDefinitionById(id, moduleId);
    if (!definition || !isExpressionValue(definition)) return;
    const exposed = get().resolvedStore.modules[moduleId].exposedValues;
    const values = (definition.scope === VARIABLE_SCOPES.PAGE ? exposed.page?.variables : exposed.variables) ?? {};
    const next = get().evaluateVariableDefinition(definition, moduleId);
    // An unchanged value stops here, so the cascade doesn't re-run for dependents that are already current.
    if (definition.name in values && isEqual(values[definition.name], next)) return;
    get().writeVariableDefinitionValue(definition, next, moduleId);
  },

  registerVariableDefinitionDependencies: (definition, moduleId = 'canvas') => {
    const path = nodePathOf(definition.id);
    const graph = get().dependencyGraph.modules[moduleId]?.graph;
    if (graph?.hasNode(path)) {
      set(
        (state) => {
          state.dependencyGraph.modules[moduleId].graph.removeLeafNode(path);
          return { ...state };
        },
        false,
        'clearVariableDefinitionDeps'
      );
    }
    if (!isExpressionValue(definition)) return;

    const { allRefs } = extractAndReplaceReferencesFromString(
      toExpression(definition),
      get().modules[moduleId].componentNameIdMapping,
      get().modules[moduleId].queryNameIdMapping
    );
    allRefs.forEach(({ entityType, entityNameOrId, entityKey }) => {
      if (!entityKey) return;
      const sourcePath = entityNameOrId ? `${entityType}.${entityNameOrId}.${entityKey}` : `${entityType}.${entityKey}`;
      get().addDependency(sourcePath, path, { definitionId: definition.id }, moduleId);
    });
  },

  unregisterVariableDefinitionDependencies: (id, moduleId = 'canvas') => {
    const path = nodePathOf(id);
    if (!get().dependencyGraph.modules[moduleId]?.graph?.hasNode(path)) return;
    set(
      (state) => {
        state.dependencyGraph.modules[moduleId].graph.removeLeafNode(path);
        return { ...state };
      },
      false,
      'unregisterVariableDefinitionDeps'
    );
  },

  /**
   * Runs when the dependency graph is (re)built: app load, page switch, version or environment
   * switch. Seeds page variables every time; seeds an app variable only when it has no value yet,
   * so app values survive a page switch. Registers every definition's sentinel node, since the
   * graph is rebuilt from scratch each time. Returns the ids it seeded.
   */
  initVariableDefinitions: (moduleId = 'canvas') => {
    const definitions = get().getVariableDefinitions(moduleId);
    if (!definitions.length) return [];

    const { ordered, cyclic } = orderVariableDefinitions(definitions);
    if (cyclic.length) {
      const path = findVariableCycle(definitions);
      get().debugger?.log({
        logLevel: 'error',
        type: 'variable',
        kind: 'variable',
        key: path ? path[0] : cyclic[0].name,
        message: `Circular reference between variables: ${path ? path.join(' → ') : cyclic.map((d) => d.name).join(', ')}. ${
          cyclic.length === 1 ? 'This variable stays' : 'These variables stay'
        } undefined until the loop is removed.`,
        errorTarget: 'Variables',
        error: { message: 'Circular reference between variables' },
      });
    }

    const appValues = get().resolvedStore.modules[moduleId].exposedValues.variables ?? {};
    const seeded = [];
    ordered.forEach((definition) => {
      const keepAppValue = definition.scope === VARIABLE_SCOPES.APP && definition.name in appValues;
      if (!keepAppValue) {
        get().writeVariableDefinitionValue(
          definition,
          get().evaluateVariableDefinition(definition, moduleId),
          moduleId
        );
        seeded.push(definition.id);
      }
      get().registerVariableDefinitionDependencies(definition, moduleId);
    });
    return seeded;
  },

  /**
   * Components' default exposed values are filled in after the variables were first seeded, and
   * without a cascade. Re-evaluate the just-seeded expression variables once, in dependency order,
   * so a value that reads a component starts correct.
   */
  refreshExpressionVariables: (ids = [], moduleId = 'canvas') => {
    if (!ids.length) return;
    const wanted = new Set(ids);
    const { ordered } = orderVariableDefinitions(get().getVariableDefinitions(moduleId));
    ordered
      .filter((d) => wanted.has(d.id) && isExpressionValue(d))
      .forEach((d) => get().recomputeVariableDefinition(d.id, moduleId));
  },

  /** Writes one scope's definition map to the store, for the current page when scope is page. */
  setVariableDefinitionMap: (scope, rawMap, moduleId = 'canvas') => {
    const map = normalizeVariableDefinitionMap(rawMap);
    if (scope === VARIABLE_SCOPES.APP) {
      set(
        (state) => ({ globalSettings: { ...state.globalSettings, variables: map } }),
        false,
        'setAppVariableDefinitions'
      );
      return;
    }
    const pageId = get().getCurrentPageId(moduleId);
    set(
      (state) => {
        const page = state.modules[moduleId].pages.find((p) => p.id === pageId);
        if (page) page.variables = map;
      },
      false,
      'setPageVariableDefinitions'
    );
  },

  persistVariableDefinitions: async (scope, moduleId = 'canvas') => {
    const { appStore, currentVersionId } = get();
    const appId = appStore.modules[moduleId]?.app?.appId;
    const pageId = get().getCurrentPageId(moduleId);
    if (scope === VARIABLE_SCOPES.PAGE) {
      const page = get().modules[moduleId].pages.find((p) => p.id === pageId);
      await savePageChanges(appId, currentVersionId, pageId, { variables: page?.variables ?? {} });
      return;
    }
    try {
      await appVersionService.autoSaveApp(
        appId,
        currentVersionId,
        { globalSettings: { variables: get().globalSettings?.variables ?? {} } },
        'global_settings',
        pageId,
        'update'
      );
    } catch (error) {
      toast.error('App could not be saved.');
      console.error('Error saving variables:', error);
    }
  },

  /**
   * Puts one definition back to a recorded state (`null` = absent): store, runtime value, dependency
   * node and saved copy. Undo and redo use it, so neither re-runs validation.
   */
  applyVariableDefinitionState: async (scope, id, target, moduleId = 'canvas') => {
    const current = get().getVariableDefinitionById(id, moduleId);
    const scopeMap =
      scope === VARIABLE_SCOPES.APP
        ? get().globalSettings?.variables
        : get().modules[moduleId].pages.find((p) => p.id === get().getCurrentPageId(moduleId))?.variables;
    const { [id]: _previous, ...rest } = scopeMap || {};
    get().setVariableDefinitionMap(scope, target ? { ...rest, [id]: toStored(target) } : rest, moduleId);

    if (current && (!target || current.name !== target.name)) {
      if (scope === VARIABLE_SCOPES.PAGE) get().unsetPageVariable(current.name, moduleId);
      else get().unsetVariable(current.name, moduleId);
    }
    if (target) {
      const definition = { ...toStored(target), scope };
      get().registerVariableDefinitionDependencies(definition, moduleId);
      get().writeVariableDefinitionValue(definition, get().evaluateVariableDefinition(definition, moduleId), moduleId);
    } else {
      get().unregisterVariableDefinitionDependencies(id, moduleId);
    }
    await get().persistVariableDefinitions(scope, moduleId);
  },

  recordVariableDefinitionChange: (scope, id, before, after, moduleId = 'canvas') => {
    get().pushUndoRedoCommand?.({
      undo: () => get().applyVariableDefinitionState(scope, id, before, moduleId),
      redo: () => get().applyVariableDefinitionState(scope, id, after, moduleId),
    });
  },

  /**
   * Creates (no `id`) or updates a variable. Rejects an invalid name, invalid JSON or a circular
   * reference before anything changes. On success the value is live at once, then saved.
   * Scope is fixed once created. Returns `{ ok: true, definition }` or `{ ok: false, field, error }`.
   */
  saveVariableDefinition: async (input, moduleId = 'canvas') => {
    const all = get().getVariableDefinitions(moduleId);
    const existing = input.id ? all.find((d) => d.id === input.id) : null;
    const scope = existing?.scope ?? input.scope ?? VARIABLE_SCOPES.APP;
    const fxActive = !!(input.fxActive ?? existing?.fxActive);
    const rawValue = String(input.value ?? existing?.value ?? '');
    const draft = {
      id: existing?.id ?? uuidv4(),
      scope,
      name: input.name ?? existing?.name ?? '',
      // fx values are stored as {{ }} so every editor treats them as expressions.
      value: fxActive && rawValue.trim() ? toExpression({ value: rawValue }) : rawValue,
      fxActive,
    };

    const pageName = get().modules[moduleId].pages.find((p) => p.id === get().getCurrentPageId(moduleId))?.name;
    const nameError = validateVariableName(draft.name, scope, all, draft.id, pageName);
    if (nameError) return { ok: false, field: 'name', error: nameError };

    if (!isExpressionValue(draft)) {
      const parsed = parseStaticValue(draft.value);
      if (!parsed.ok) return { ok: false, field: 'value', error: parsed.error };
    }

    const cycle = findVariableCycle([draft, ...all.filter((d) => d.id !== draft.id)]);
    if (cycle) {
      return {
        ok: false,
        field: 'value',
        error: `Circular reference: ${cycle.join(' → ')}. Change one of these values to break the loop.`,
      };
    }

    const { componentNameIdMapping, queryNameIdMapping } = get().modules[moduleId];
    const stored = toStored({
      ...draft,
      value: replaceEntityReferencesWithIds(draft.value, componentNameIdMapping, queryNameIdMapping),
    });
    const scopeMap =
      scope === VARIABLE_SCOPES.APP
        ? get().globalSettings?.variables
        : get().modules[moduleId].pages.find((p) => p.id === get().getCurrentPageId(moduleId))?.variables;
    get().setVariableDefinitionMap(scope, { ...(scopeMap || {}), [stored.id]: stored }, moduleId);

    if (existing && existing.name !== draft.name) {
      if (scope === VARIABLE_SCOPES.PAGE) get().unsetPageVariable(existing.name, moduleId);
      else get().unsetVariable(existing.name, moduleId);
    }
    const definition = { ...stored, scope };
    get().registerVariableDefinitionDependencies(definition, moduleId);
    get().writeVariableDefinitionValue(definition, get().evaluateVariableDefinition(definition, moduleId), moduleId);

    get().recordVariableDefinitionChange(scope, stored.id, existing ? toStored(existing) : null, stored, moduleId);
    await get().persistVariableDefinitions(scope, moduleId);
    return { ok: true, definition };
  },

  deleteVariableDefinition: async (id, moduleId = 'canvas') => {
    const definition = get().getVariableDefinitionById(id, moduleId);
    if (!definition) return;
    const { scope } = definition;
    const scopeMap =
      scope === VARIABLE_SCOPES.APP
        ? get().globalSettings?.variables
        : get().modules[moduleId].pages.find((p) => p.id === get().getCurrentPageId(moduleId))?.variables;
    const { [id]: _removed, ...rest } = scopeMap || {};
    get().setVariableDefinitionMap(scope, rest, moduleId);
    get().unregisterVariableDefinitionDependencies(id, moduleId);
    if (scope === VARIABLE_SCOPES.PAGE) get().unsetPageVariable(definition.name, moduleId);
    else get().unsetVariable(definition.name, moduleId);
    get().recordVariableDefinitionChange(scope, id, toStored(definition), null, moduleId);
    await get().persistVariableDefinitions(scope, moduleId);
  },
});
