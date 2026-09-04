/**
 * Shared scaffolding for widget behaviour specs in this directory.
 *
 * Every spec here needs the same things (a scenario, a session, a page seeded
 * with the widget's real definition, `RenderWidget` fed the same props
 * AppCanvas/Container would pass) to exercise a widget through the REAL
 * composed store — see test/app-builder/seed.js for why that's non-negotiable
 * (the stale-exposed-value bug class is invisible to a mocked store).
 *
 * This module is that repeated setup, written once. A spec file is left to
 * describe only what's specific to its widget: its default properties and
 * its own element lookups/assertions.
 *
 * Load-bearing, inherited from the RTL seam canary
 * (AppCanvas/__tests__/integration/renderWidget.spec.jsx) — do not change
 * without reading its header:
 *   1. `onOptionChange` / `onOptionsChange` must be functions, not undefined:
 *      RenderWidget only skips them when they are exactly `null`.
 *   2. `capabilities.observers: true` — jsdom has no ResizeObserver, and
 *      several widgets (anything using OverflowTooltip) mount one.
 *   3. `setEditorLoading(false)` + `setCurrentMode('edit')` are MANDATORY, or
 *      `fireEvent` hard-returns and every event silently no-ops
 *      (eventsSlice.js:104).
 */
import React from 'react';
import RenderWidget from '@/AppBuilder/AppCanvas/RenderWidget';
import useStore from '@/AppBuilder/_stores/store';
import {
  AppBuilderTestSession,
  defineAppBuilderScenario,
  seedApp,
  componentDefinition,
  binding,
  drainExposedValueBatch,
} from '@/test/app-builder';

export const MODULE_ID = 'canvas';
export const store = () => useStore.getState();
/** Lets every awaited handler in the dispatch loop run to completion. */
export const drain = () => new Promise((resolve) => setTimeout(resolve, 0));
export { binding };

/** The props AppCanvas/Container passes down, minus its editor-only extras. */
export function widgetProps(id, componentType, { darkMode = false, widgetHeight = 40, widgetWidth = 200 } = {}) {
  return {
    id,
    componentType,
    moduleId: MODULE_ID,
    currentMode: 'edit',
    currentLayout: 'desktop',
    widgetHeight,
    widgetWidth,
    inCanvas: true,
    darkMode,
    onOptionChange: () => {},
    onOptionsChange: () => {},
  };
}

/**
 * Builds everything one widget's spec file needs: a scenario, a session per
 * test, and a `render()` that seeds the widget (plus any siblings) and
 * mounts it through the real RenderWidget.
 *
 * @param componentType  the widget's registered type, e.g. 'Button'
 * @param handle         the component's `name` in the definition, e.g. 'button1'
 * @param id             the component id used throughout the spec, e.g. 'btn1'
 * @param defaultProperties  properties every test gets unless overridden
 * @param capabilities   extra AppBuilderTestSession capabilities beyond the
 *                        observers/media baseline every widget spec needs
 * @param wrapper        optional React provider wrapper for widget-specific context
 */
export function createWidgetHarness({
  componentType,
  handle,
  id,
  defaultProperties = {},
  defaultStyles = {},
  defaultValidation = {},
  defaultExtraComponents = {},
  defaultAlso = [],
  capabilities = {},
  widgetHeight = 40,
  widgetWidth = 200,
  wrapper: Wrapper,
}) {
  const scenario = defineAppBuilderScenario({
    id: `${componentType.toLowerCase()}-widget`,
    name: `${componentType} widget behaviour`,
    primarySeam: 'rtl',
    surface: 'app-editor',
    edition: 'ce',
    environment: 'development',
    layout: 'desktop',
    version: 'draft',
    transferPath: 'not-applicable',
    access: 'authenticated',
    capabilities: { observers: true, media: { matches: false }, ...capabilities },
  });

  let session;

  /**
   * Seeds the widget (`properties`/`styles`/`validation` merged over the
   * harness defaults, plus any `extraComponents` siblings) and mounts it.
   * `events`, if given, are registered on the store before render.
   */
  function render({
    properties = {},
    styles = {},
    validation = {},
    events = [],
    extraComponents = {},
    componentId = id,
    darkMode = false,
    afterSeed,
    also = defaultAlso,
  } = {}) {
    const definition = componentDefinition(componentId, handle, componentType, {
      ...defaultProperties,
      ...properties,
    });
    definition.component.definition.styles = { ...defaultStyles, ...styles };
    definition.component.definition.validation = { ...defaultValidation, ...validation };

    seedApp({ [componentId]: definition, ...defaultExtraComponents, ...extraComponents }, { moduleId: MODULE_ID });
    // Escape hatch for store mutations that must land between seeding and
    // mount, e.g. properties (like `validation.mandatory`) with no seed-time
    // argument — see componentDefinition() in test/app-builder/seed.js.
    afterSeed?.();
    store().setEditorLoading(false, MODULE_ID);
    store().setCurrentMode('edit', MODULE_ID);
    if (events.length) store().eventsSlice.setEvents(events, MODULE_ID);

    // AppBuilderTestSession.render() re-renders its single root rather than
    // mounting alongside what's already there, so every widget sharing a
    // page for this test — the one under test plus any `also` siblings —
    // must go up in ONE render() call as a fragment.
    const tree = (
      <>
        <RenderWidget {...widgetProps(componentId, componentType, { darkMode, widgetHeight, widgetWidth })} />
        {also.map(({ id: siblingId, componentType: siblingType, ...rest }) => (
          <RenderWidget key={siblingId} {...widgetProps(siblingId, siblingType, rest)} />
        ))}
      </>
    );

    return session.render(Wrapper ? <Wrapper>{tree}</Wrapper> : tree);
  }

  return {
    scenario,
    get session() {
      return session;
    },
    setup() {
      session = new AppBuilderTestSession({ scenario });
    },
    // A failed assertion skips a test's own inline cleanup, and a leaked
    // exposed-value bracket silently buffers the NEXT test's writes (see
    // test/app-builder/seed.js) — draining it is not optional per spec file,
    // so every harness does it rather than relying on each file to remember.
    teardown: () => drainExposedValueBatch(),
    render,
    setEvents: (events) => store().eventsSlice.setEvents(events, MODULE_ID),
    setExposedValue: (componentId, key, value) => store().setExposedValue(componentId, key, value, MODULE_ID),
    // Named, not a `(...args)` forwarder: componentsSlice's real signature is
    // (componentId, property, value, paramType, attr, skipResolve, moduleId,
    // options) — a positional passthrough silently swallowed a caller's extra
    // arg into `moduleId` once already (componentsSlice.js:2180).
    setComponentProperty: (componentId, property, value, paramType, attr = 'value', skipResolve = false) =>
      store().setComponentProperty(componentId, property, value, paramType, attr, skipResolve, MODULE_ID),
    variables: () => store().resolvedStore.modules[MODULE_ID].exposedValues.variables,
    exposed: (componentId = id) => store().getExposedValueOfComponent(componentId, MODULE_ID),
  };
}

/** An event handler row wiring `eventId` to a `set-custom-variable` action writing `key`/`value`. */
export function setVariableOn(sourceId, eventId, { key = 'seen', value = 'YES' } = {}) {
  return [
    {
      id: `evt-${eventId}`,
      index: 0,
      sourceId,
      name: `evt-${eventId}`,
      target: 'component',
      event: { eventId, actionId: 'set-custom-variable', key, value },
    },
  ];
}
