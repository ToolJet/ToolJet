import { isEqual } from 'lodash';
import toast from 'react-hot-toast';
import { appVersionService } from '@/_services';
import { extractAndReplaceReferencesFromString } from '../ast';
import { getDynamicVariables, replaceEntityReferencesWithIds, resolveCode } from '../utils';
import { removeNestedDoubleCurlyBraces } from '@/_helpers/utils';
import {
  VARIABLE_SCOPES,
  definitionsOf,
  findVariableCycle,
  isExpressionValue,
  normalizeVariableDefinition,
  parseStaticValue,
  readVariableDefinitionMap,
  orderVariableDefinitions,
  toExpression,
  validateVariableName,
  variableKey,
} from '@/AppBuilder/_utils/variableDefinitions';

/**
 * Declared app and page variables (Variables panel).
 *
 * A declared variable is an ordinary app or page variable with an initial value: definitions live
 * in `globalSettings.variables` (app) and `page.variables` (that page), keyed by name, and are
 * evaluated into the same place setVariable writes (`exposedValues.variables` /
 * `exposedValues.page.variables`). Bindings, RunJS and events read declared and script-set
 * variables the same way. A variable is identified by its scope and name within its module (and
 * page, for page variables); there is no separate definition id.
 *
 * Expressions are kept current through a sentinel dependency-graph node per definition,
 * `variableDefinitions.<scope>:<name>.__vardef__`, that depends on everything the expression reads.
 * When one of those changes, applyDependencyUpdate calls recomputeVariableDefinition, which writes
 * through setVariable / setPageVariable so the variable's own dependents follow. The sentinel is
 * never a dependent of `variables.<name>` itself, so a script writing the variable does not trigger
 * a recompute: the script's value lasts until something the expression reads changes.
 */
export const VARIABLE_DEFINITION_NODE_SUFFIX = '.__vardef__';
// One path segment for scope and name, so every sentinel gets its own base node in the graph.
const nodePathOf = (scope, name) => `variableDefinitions.${variableKey(scope, name)}${VARIABLE_DEFINITION_NODE_SUFFIX}`;

/**
 * What a change applies to: one scope's map in one module of one app version, and for page
 * variables one page. The version is part of it, so nothing from a version that has since been
 * switched away from (a late save, its undo step) can reach the version now open.
 */
const contextKeyOf = ({ versionId, moduleId, scope, pageId }) =>
  scope === VARIABLE_SCOPES.PAGE ? `${versionId}|${moduleId}|page|${pageId}` : `${versionId}|${moduleId}|app`;

const storedOf = (definition) => normalizeVariableDefinition(definition);
const withName = (name, stored) => (stored ? { name, ...normalizeVariableDefinition(stored) } : null);

export const createVariablesSlice = (set, get) => {
  // Transient save bookkeeping per context (see contextKeyOf); never persisted.
  // `revisions` counts local writes to that context's map. `savedThrough` is the highest revision a
  // successful save has carried to the server: each save sends the whole map as it is when the
  // request goes out. `saveQueues` sends one save at a time, so an older map can't land after a newer one.
  // `confirmed` is the map the server last accepted for the context, tagged with its version; a
  // failed change returns the names it touched to it.
  const revisions = new Map();
  const savedThrough = new Map();
  const saveQueues = new Map();
  const confirmed = new Map();

  /**
   * Saves the context's map after any save already queued for it; resolves to whether it saved.
   * The save belongs to the version that was open when it was queued: if another version has been
   * opened by the time it would be sent, it is dropped, so it can't overwrite that version.
   */
  const saveInOrder = (context) => {
    const key = contextKeyOf(context);
    const { versionId } = context;
    const send = async () => {
      if (get().currentVersionId !== versionId) {
        toast.error('Variable changes made before switching versions were not saved.');
        return false;
      }
      const revision = revisions.get(key) ?? 0;
      const sent = rawMapOf(context);
      const ok = await get().persistVariableDefinitions(context.scope, context.moduleId, context.pageId, versionId);
      if (ok) {
        savedThrough.set(key, Math.max(savedThrough.get(key) ?? 0, revision));
        confirmed.set(key, { versionId, map: readVariableDefinitionMap(sent).definitions });
      }
      return ok;
    };
    const result = (saveQueues.get(key) ?? Promise.resolve()).then(send);
    saveQueues.set(
      key,
      result.catch(() => false)
    );
    return result;
  };

  const rawMapOf = ({ moduleId, scope, pageId }) =>
    scope === VARIABLE_SCOPES.APP
      ? get().getGlobalSettings(moduleId)?.variables
      : get().modules?.[moduleId]?.pages?.find((p) => p.id === pageId)?.variables;

  /** The context of a change made now: the open version, the module and scope, the page on screen. */
  const variableContextOf = (scope, moduleId) => ({
    versionId: get().currentVersionId,
    moduleId,
    scope,
    pageId: get().getCurrentPageId(moduleId),
  });

  /** Runtime value and dependency node exist only for app variables and the page on screen. */
  const isLive = ({ moduleId, scope, pageId }) =>
    scope === VARIABLE_SCOPES.APP || pageId === get().getCurrentPageId(moduleId);

  /** The map with `fromName` replaced by `target` in the same position (appended when new). */
  const replaceEntry = (map, fromName, target) => {
    const next = {};
    let placed = false;
    Object.entries(map).forEach(([name, stored]) => {
      if (name === fromName) {
        if (target) next[target.name] = storedOf(target);
        placed = true;
      } else if (!target || name !== target.name) {
        next[name] = stored;
      }
    });
    if (target && !placed) next[target.name] = storedOf(target);
    return next;
  };

  /** The map with `definition` put back at `index` (its place before it was deleted). */
  const insertAt = (map, definition, index) => {
    const entries = Object.entries(map).filter(([name]) => name !== definition.name);
    entries.splice(index < 0 ? entries.length : Math.min(index, entries.length), 0, [
      definition.name,
      storedOf(definition),
    ]);
    return Object.fromEntries(entries);
  };

  /**
   * Brings the runtime side in line after a map change: the removed name's value and dependency
   * node go, the added definition is registered and evaluated. Only for a live context.
   */
  const syncRuntime = (context, removedName, added) => {
    if (!isLive(context)) return;
    const { moduleId, scope } = context;
    if (removedName && removedName !== added?.name) {
      get().unregisterVariableDefinitionDependencies(scope, removedName, moduleId);
      if (scope === VARIABLE_SCOPES.PAGE) get().unsetPageVariable(removedName, moduleId);
      else get().unsetVariable(removedName, moduleId);
    }
    if (added) {
      const definition = { scope, ...withName(added.name, added) };
      get().registerVariableDefinitionDependencies(definition, moduleId);
      get().writeVariableDefinitionValue(definition, get().evaluateVariableDefinition(definition, moduleId), moduleId);
    }
  };

  return {
    getAppVariableDefinitions: (moduleId = 'canvas') =>
      definitionsOf(get().getGlobalSettings(moduleId)?.variables, VARIABLE_SCOPES.APP),

    getPageVariableDefinitions: (moduleId = 'canvas', pageId = get().getCurrentPageId?.(moduleId)) => {
      const page = get().modules?.[moduleId]?.pages?.find((p) => p.id === pageId);
      return definitionsOf(page?.variables, VARIABLE_SCOPES.PAGE);
    },

    /** App variables plus the current page's variables. */
    getVariableDefinitions: (moduleId = 'canvas') => [
      ...get().getAppVariableDefinitions(moduleId),
      ...get().getPageVariableDefinitions(moduleId),
    ],

    /** One declared variable by scope and name (the current page's, unless `pageId` is given). */
    getVariableDefinition: (scope, name, moduleId = 'canvas', pageId = get().getCurrentPageId?.(moduleId)) => {
      const list =
        scope === VARIABLE_SCOPES.APP
          ? get().getAppVariableDefinitions(moduleId)
          : get().getPageVariableDefinitions(moduleId, pageId);
      return list.find((d) => d.name === name) ?? null;
    },

    evaluateVariableDefinition: (definition, moduleId = 'canvas') => {
      if (isExpressionValue(definition)) return get().getResolvedValue(toExpression(definition), {}, moduleId);
      const parsed = parseStaticValue(definition.value);
      return parsed.ok ? parsed.value : definition.value;
    },

    /**
     * What the Variables panel previews: the value, or why it can't be worked out. `getResolvedValue`
     * swallows errors, so each `{{ }}` part is run once more with errors kept, and the first one wins.
     */
    evaluateVariableDefinitionWithError: (definition, moduleId = 'canvas') => {
      if (!isExpressionValue(definition)) {
        const parsed = parseStaticValue(definition.value);
        return parsed.ok ? { value: parsed.value, error: null } : { value: undefined, error: parsed.error };
      }
      const { valueWithBrackets } = extractAndReplaceReferencesFromString(
        toExpression(definition),
        get().modules[moduleId].componentNameIdMapping,
        get().modules[moduleId].queryNameIdMapping
      );
      const exposed = get().resolvedStore.modules[moduleId].exposedValues;
      for (const part of getDynamicVariables(valueWithBrackets) || []) {
        const [, error] = resolveCode(removeNestedDoubleCurlyBraces(part), exposed, {}, true, []);
        if (error) return { value: undefined, error: error?.message ?? String(error) };
      }
      return { value: get().evaluateVariableDefinition(definition, moduleId), error: null };
    },

    writeVariableDefinitionValue: (definition, value, moduleId = 'canvas') => {
      if (definition.scope === VARIABLE_SCOPES.PAGE) get().setPageVariable(definition.name, value, moduleId);
      else get().setVariable(definition.name, value, moduleId);
    },

    recomputeVariableDefinition: (scope, name, moduleId = 'canvas') => {
      const definition = get().getVariableDefinition(scope, name, moduleId);
      if (!definition || !isExpressionValue(definition)) return;
      const exposed = get().resolvedStore.modules[moduleId].exposedValues;
      const values = (definition.scope === VARIABLE_SCOPES.PAGE ? exposed.page?.variables : exposed.variables) ?? {};
      const next = get().evaluateVariableDefinition(definition, moduleId);
      // An unchanged value stops here, so the cascade doesn't re-run for dependents that are already current.
      if (definition.name in values && isEqual(values[definition.name], next)) return;
      get().writeVariableDefinitionValue(definition, next, moduleId);
    },

    registerVariableDefinitionDependencies: (definition, moduleId = 'canvas') => {
      const path = nodePathOf(definition.scope, definition.name);
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
        const sourcePath = entityNameOrId
          ? `${entityType}.${entityNameOrId}.${entityKey}`
          : `${entityType}.${entityKey}`;
        get().addDependency(sourcePath, path, { scope: definition.scope, name: definition.name }, moduleId);
      });
    },

    unregisterVariableDefinitionDependencies: (scope, name, moduleId = 'canvas') => {
      const path = nodePathOf(scope, name);
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
     * graph is rebuilt from scratch each time. Returns the keys (`scope:name`) it seeded.
     */
    initVariableDefinitions: (moduleId = 'canvas') => {
      const pageId = get().getCurrentPageId?.(moduleId);
      [VARIABLE_SCOPES.APP, VARIABLE_SCOPES.PAGE].forEach((scope) => {
        const { duplicates } = readVariableDefinitionMap(rawMapOf({ moduleId, scope, pageId }));
        if (!duplicates.length) return;
        get().debugger?.log({
          logLevel: 'error',
          type: 'variable',
          kind: 'variable',
          key: duplicates[0],
          message: `More than one saved ${scope} variable is named ${duplicates.join(', ')}. Only the first is used; save the variables again to keep one.`,
          errorTarget: 'Variables',
          error: { message: 'Duplicate variable names' },
        });
      });
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
          seeded.push(variableKey(definition.scope, definition.name));
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
    refreshExpressionVariables: (keys = [], moduleId = 'canvas') => {
      if (!keys.length) return;
      const wanted = new Set(keys);
      const { ordered } = orderVariableDefinitions(get().getVariableDefinitions(moduleId));
      ordered
        .filter((d) => wanted.has(variableKey(d.scope, d.name)) && isExpressionValue(d))
        .forEach((d) => get().recomputeVariableDefinition(d.scope, d.name, moduleId));
    },

    /** One scope's saved map, keyed by name: the app map, or one page's (the current page by default). */
    getVariableDefinitionMap: (scope, moduleId = 'canvas', pageId = get().getCurrentPageId(moduleId)) =>
      readVariableDefinitionMap(rawMapOf({ moduleId, scope, pageId })).definitions,

    /** Writes one scope's map (`{ [name]: { value, fxActive } }`) to the store. */
    setVariableDefinitionMap: (scope, rawMap, moduleId = 'canvas', pageId = get().getCurrentPageId(moduleId)) => {
      const key = contextKeyOf({ versionId: get().currentVersionId, moduleId, scope, pageId });
      const map = readVariableDefinitionMap(rawMap).definitions;
      if (scope === VARIABLE_SCOPES.APP) {
        get().setGlobalSettings({ ...get().getGlobalSettings(moduleId), variables: map }, moduleId);
      } else {
        set(
          (state) => {
            const page = state.modules[moduleId].pages.find((p) => p.id === pageId);
            if (page) page.variables = map;
          },
          false,
          'setPageVariableDefinitions'
        );
      }
      revisions.set(key, (revisions.get(key) ?? 0) + 1);
    },

    persistVariableDefinitions: async (
      scope,
      moduleId = 'canvas',
      pageId = get().getCurrentPageId(moduleId),
      versionId = get().currentVersionId
    ) => {
      const { appStore } = get();
      const appId = appStore.modules[moduleId]?.app?.appId;
      const isPage = scope === VARIABLE_SCOPES.PAGE;
      const variables = rawMapOf({ moduleId, scope, pageId }) ?? {};
      try {
        await get().trackAppSave(
          () =>
            appVersionService.autoSaveApp(
              appId,
              versionId,
              isPage ? { variables } : { globalSettings: { variables } },
              isPage ? 'pages' : 'global_settings',
              pageId,
              'update'
            ),
          moduleId
        );
        return true;
      } catch (error) {
        toast.error('Variable changes could not be saved.');
        console.error('Error saving variables:', error);
        return false;
      }
    },

    /**
     * Replaces the variable named `fromName` (null = none) with `target` (`{ name, value, fxActive }`,
     * null = none) in one context: the saved map, the runtime value and the dependency node, then
     * saves. Create, edit, rename, delete, undo and redo all go through here, so none re-runs
     * validation. Returns whether the save succeeded.
     *
     * A failed save undoes only this change, and only while it is still unsaved and still in the
     * store: not once a later successful save has carried it to the server, and not when a newer
     * edit, rename, delete or same-name variable has replaced it. Other changes are left alone.
     */
    applyVariableDefinitionChange: async (context, fromName, target, persist = true) => {
      const { versionId, moduleId, scope, pageId } = context;
      // A change for a version that is no longer open (an undo step or a late save from it) is refused.
      if (get().currentVersionId !== versionId) return false;
      const key = contextKeyOf(context);
      const map = get().getVariableDefinitionMap(scope, moduleId, pageId);
      // The first change to a map since it was loaded: what it holds until now is what was saved.
      if (confirmed.get(key)?.versionId !== versionId) confirmed.set(key, { versionId, map });
      const previous = fromName ? withName(fromName, map[fromName]) : null;
      const position = fromName ? Object.keys(map).indexOf(fromName) : -1;
      get().setVariableDefinitionMap(scope, replaceEntry(map, fromName, target), moduleId, pageId);
      const revision = revisions.get(key);
      syncRuntime(context, previous?.name ?? null, target);
      if (!persist || (await saveInOrder(context))) return true;

      if (get().currentVersionId !== versionId || (savedThrough.get(key) ?? 0) >= revision) return false;
      const current = get().getVariableDefinitionMap(scope, moduleId, pageId);
      const has = (name) => Object.prototype.hasOwnProperty.call(current, name);
      const stillHeld = target ? isEqual(current[target.name], storedOf(target)) : !previous || !has(previous.name);
      // A rename can't go back once a newer variable has claimed the old name: keeping it renamed
      // leaves both in the map, and the next successful save carries them.
      const nameFree = !previous || previous.name === target?.name || !has(previous.name);
      if (!stillHeld || !nameFree) return false;
      // Return the names this change touched to what the server last accepted, which may be
      // older than `previous` when an earlier change also failed.
      const saved = confirmed.get(key)?.versionId === versionId ? confirmed.get(key).map : {};
      const touched = [target?.name, previous?.name].filter(
        (name, index, names) => name && names.indexOf(name) === index
      );
      let restored = current;
      touched.forEach((name) => {
        const savedDefinition = saved[name] ? withName(name, saved[name]) : null;
        if (!savedDefinition) {
          restored = replaceEntry(restored, name, null);
        } else if (Object.prototype.hasOwnProperty.call(restored, name)) {
          restored = replaceEntry(restored, name, savedDefinition);
        } else {
          const at = name === previous?.name && target?.name !== name ? position : Object.keys(saved).indexOf(name);
          restored = insertAt(restored, savedDefinition, at);
        }
      });
      get().setVariableDefinitionMap(scope, restored, moduleId, pageId);
      touched.forEach((name) => {
        const savedDefinition = saved[name] ? withName(name, saved[name]) : null;
        syncRuntime(context, savedDefinition ? null : name, savedDefinition);
      });
      return false;
    },

    /** Records one undo step. A replay whose save fails puts the step back so it can be retried. */
    recordVariableDefinitionChange: (context, before, after) => {
      // The step belongs to its version's history: a save that finishes after another version was
      // opened records nothing, and a step replayed in another version does nothing.
      const isOpen = () => get().currentVersionId === context.versionId;
      if (!isOpen()) return;
      const replay = (fromName, target) => {
        const run = async () => {
          if (!isOpen()) return;
          if (!(await get().applyVariableDefinitionChange(context, fromName, target)))
            get().returnUndoRedoCommand?.(run);
        };
        return run;
      };
      get().pushUndoRedoCommand?.({
        undo: replay(after?.name ?? null, before),
        redo: replay(before?.name ?? null, after),
      });
    },

    /**
     * Creates a variable, or edits the one named `previousName` (renaming it when `name` differs).
     * Rejects an invalid name, invalid JSON or a circular reference before anything changes. On
     * success the value is live at once, then saved. Scope is fixed once created.
     * Returns `{ ok: true, definition }` or `{ ok: false, field, error }`.
     */
    saveVariableDefinition: async (input, moduleId = 'canvas') => {
      if (get().getShouldFreeze()) return { ok: false, field: 'value', error: 'This version is read-only.' };
      const scope = input.scope ?? VARIABLE_SCOPES.APP;
      if (scope === VARIABLE_SCOPES.PAGE && get().getAppType(moduleId) === 'module') {
        return { ok: false, field: 'name', error: 'Page variables are not supported in modules.' };
      }
      const context = variableContextOf(scope, moduleId);
      const all = get().getVariableDefinitions(moduleId);
      const existing = input.previousName ? all.find((d) => d.scope === scope && d.name === input.previousName) : null;
      if (input.previousName && !existing) {
        return { ok: false, field: 'name', error: 'This variable no longer exists.' };
      }
      const fxActive = !!(input.fxActive ?? existing?.fxActive);
      const rawValue = String(input.value ?? existing?.value ?? '');
      const draft = {
        scope,
        name: input.name ?? existing?.name ?? '',
        // fx values are stored as {{ }} so every editor treats them as expressions.
        value: fxActive && rawValue.trim() ? toExpression({ value: rawValue }) : rawValue,
        fxActive,
      };

      const pageName = get().modules[moduleId].pages.find((p) => p.id === context.pageId)?.name;
      const nameError = validateVariableName(draft.name, scope, all, existing?.name ?? null, pageName);
      if (nameError) return { ok: false, field: 'name', error: nameError };

      if (!isExpressionValue(draft)) {
        const parsed = parseStaticValue(draft.value);
        if (!parsed.ok) return { ok: false, field: 'value', error: parsed.error };
      }

      const others = all.filter((d) => !(existing && d.scope === scope && d.name === existing.name));
      const cycle = findVariableCycle([draft, ...others]);
      if (cycle) {
        return {
          ok: false,
          field: 'value',
          error: `Circular reference: ${cycle.join(' → ')}. Change one of these values to break the loop.`,
        };
      }

      const { componentNameIdMapping, queryNameIdMapping } = get().modules[moduleId];
      const target = {
        name: draft.name,
        ...storedOf({
          ...draft,
          value: replaceEntityReferencesWithIds(draft.value, componentNameIdMapping, queryNameIdMapping),
        }),
      };
      const before = existing ? withName(existing.name, existing) : null;
      if (!(await get().applyVariableDefinitionChange(context, before?.name ?? null, target))) {
        return { ok: false, field: 'value', error: 'Variable changes could not be saved. Try again.' };
      }
      get().recordVariableDefinitionChange(context, before, target);
      return { ok: true, definition: { scope, ...target } };
    },

    deleteVariableDefinition: async (scope, name, moduleId = 'canvas') => {
      if (get().getShouldFreeze()) return { ok: false };
      const context = variableContextOf(scope, moduleId);
      const existing = get().getVariableDefinition(scope, name, moduleId, context.pageId);
      if (!existing) return { ok: true };
      const before = withName(name, existing);
      if (!(await get().applyVariableDefinitionChange(context, name, null))) return { ok: false };
      get().recordVariableDefinitionChange(context, before, null);
      return { ok: true };
    },
  };
};
