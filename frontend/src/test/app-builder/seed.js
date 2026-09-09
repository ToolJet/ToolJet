/**
 * Seeds the REAL composed App Builder store with a page of components and a
 * live dependency graph, which is the minimum needed to observe how exposed
 * values cascade into other components' resolved values.
 *
 * No slice is mocked. The bug class these tests exist for — "the event fired
 * but the handler read the previous value" — lives entirely in the timing
 * between real slices, so a mocked store cannot express it.
 *
 * Ordering below is load-bearing, not stylistic:
 *   setPages -> setCurrentPageId -> setComponentNameIdMapping -> initDependencyGraph
 * The name->id mapping must exist before the graph is built, otherwise
 * `createReferenceObject` (_stores/ast.js) registers the edge under the
 * component *name* while the cascade later emits `components.<id>.<key>`, and
 * the two never meet.
 */
import useStore from '@/AppBuilder/_stores/store';
import { componentTypeDefinitionMap } from '@/AppBuilder/WidgetManager/componentTypes';

/** Component definition in the shape `buildComponentDefinition` produces. */
export function componentDefinition(id, name, type, properties = {}, { styles, validation, others } = {}) {
  // Seed from the widget's OWN registered `definition` and let the caller
  // override any bucket. A spec then states only what it varies, and can never
  // drift from production defaults the way a hand-copied table does.
  //
  // Every bucket is an argument so callers never have to reach into the returned
  // object and overwrite it — a definition leaves here complete.
  const registered = componentTypeDefinitionMap[type]?.definition ?? {};
  return {
    id,
    name,
    component: {
      component: type,
      name,
      displayName: type,
      definition: {
        properties: { ...registered.properties, ...properties },
        styles: { ...registered.styles, ...styles },
        validation: { ...registered.validation, ...validation },
        general: { ...registered.general },
        generalStyles: { ...registered.generalStyles },
        others: { ...registered.others, ...others },
      },
    },
    layouts: { desktop: { top: 0, left: 0, width: 8, height: 40 } },
  };
}

/**
 * @param components  map of componentId -> componentDefinition()
 * @returns the store state getter, for convenience
 */
export function seedApp(components, { moduleId = 'canvas', pageId = 'page-1' } = {}) {
  const store = useStore.getState();
  // MANDATORY first, and not obvious: the DependencyGraph is a class INSTANCE
  // held by reference in the slice's initial state, so zustand's
  // setState(initialState, true) reset in __mocks__/zustand.js restores the
  // reference — not a fresh graph. Edges registered by an earlier test survive
  // into this one. initializeDependencySlice mints a new DependencyGraph
  // (dependencySlice.js:22-26), which is the only way to actually clear it.
  store.initializeDependencySlice(moduleId);
  store.setPages([{ id: pageId, handle: 'home', name: 'Home', components }], moduleId);
  store.setCurrentPageId(pageId, moduleId);
  store.setComponentNameIdMapping(moduleId);
  store.initDependencyGraph(moduleId);
  return () => useStore.getState();
}

/** Property value shape the resolver reads: `{ value: '<expression>' }`. */
export function binding(expression) {
  return { value: expression };
}

/**
 * Force-closes any exposed-value bracket a test left open.
 *
 * `_exposedValueBatch` is closure state inside resolvedSlice, so the zustand
 * reset in __mocks__/zustand.js cannot reach it. A leaked bracket silently
 * buffers every exposed-value write in the NEXT test, which shows up as
 * baffling `{}` reads in a spec that looks correct.
 *
 * Leaks are easy: a failed assertion — or a `test.failing` body, which throws by
 * design — skips whatever cleanup you wrote after it. Call this from afterEach
 * in any spec that opens a bracket, never inline at the end of a test.
 */
export function drainExposedValueBatch() {
  const store = useStore.getState();
  let guard = 0;
  while (store.isExposedValueBatching?.() && guard < 50) {
    store.flushExposedValueBatch();
    guard += 1;
  }
}
