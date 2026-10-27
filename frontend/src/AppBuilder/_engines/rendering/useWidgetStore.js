import { useRef } from 'react';

const sameList = (a, b) => a.length === b.length && a.every((value, i) => Object.is(value, b[i]));

/**
 * Several values a widget reads from the app store, with one subscription instead of one each.
 *
 * Every store write runs every subscription's selector, so a canvas of thousands of widgets with a dozen subscriptions
 * each ran tens of thousands of selectors on each keystroke. Here a widget's `fields` are read together, and only when
 * one of `inputs(state)` changed: the store objects the fields read, which the store's structural sharing keeps the
 * same object while nothing in them changed. `deps` are the props the fields read.
 *
 * `fields` is `{ name: [select(state), equal] }`, each compared as its own subscription was (`equal`, else Object.is):
 * a field that is equal keeps its previous value, and the widget re-renders when any field changed, as it did.
 */
// Development only: a field that changed while its inputs didn't reads store state missing from `inputs`.
const warned = new Set();
const warnOnStaleFields = (fields, state, value) => {
  for (const name of Object.keys(fields)) {
    const [select, equal = Object.is] = fields[name];
    if (warned.has(name) || equal(value[name], select(state))) continue;
    warned.add(name);
    console.warn(`useWidgetStore: "${name}" changed but none of its inputs did; add what it reads to \`inputs\`.`);
  }
};

export function useWidgetStore(useStore, inputs, deps, fields) {
  const memo = useRef(null);
  return useStore((state) => {
    const nextInputs = inputs(state);
    const previous = memo.current;
    if (previous && sameList(previous.inputs, nextInputs) && sameList(previous.deps, deps)) {
      if (process.env.NODE_ENV === 'development') warnOnStaleFields(fields, state, previous.value);
      return previous.value;
    }
    const next = {};
    let changed = !previous;
    for (const name of Object.keys(fields)) {
      const [select, equal = Object.is] = fields[name];
      const selected = select(state);
      if (previous && equal(previous.value[name], selected)) next[name] = previous.value[name];
      else {
        next[name] = selected;
        changed = true;
      }
    }
    const value = changed ? next : previous.value;
    memo.current = { inputs: nextInputs, deps, value };
    return value;
  });
}

/**
 * The store objects a widget's own values are read from (`getComponentDefinition`, `getResolvedComponent`,
 * `getExposedPropertyForAdditionalActions`, `getContainerChildrenMapping`, its parent's custom resolvables):
 * - the definitions (the module's pages, and the canvas's, which `getComponentTypeFromId` reads by default);
 * - its resolved values;
 * - the exposed values of itself, its parent and its grandparent (a ListView or Form keeps its children's, and a
 *   ListView inside a Form is kept by the Form);
 * - its children list and its parent's custom resolvables.
 */
export const widgetInputs = (state, id, moduleId, resolvablesId) => {
  const module = state.modules[moduleId];
  const resolved = state.resolvedStore.modules[moduleId];
  const exposed = resolved?.exposedValues?.components;
  const parentId = state.getComponentDefinition(id, moduleId)?.component?.parent;
  const baseParentId = parentId && (state.getBaseParentId?.(parentId) || parentId);
  const grandparentId = baseParentId && state.getComponentDefinition(baseParentId, moduleId)?.component?.parent;
  return [
    module?.pages,
    module?.currentPageId,
    module?.currentPageIndex,
    state.modules.canvas?.pages,
    state.modules.canvas?.currentPageIndex,
    resolved?.components?.[id],
    exposed?.[id],
    baseParentId && exposed?.[baseParentId],
    grandparentId && exposed?.[grandparentId],
    state.containerChildrenMapping?.[id],
    resolved?.customResolvables?.[resolvablesId ?? parentId],
  ];
};
