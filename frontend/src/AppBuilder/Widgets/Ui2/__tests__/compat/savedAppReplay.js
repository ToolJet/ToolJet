// Loads one saved-app fixture (after import and the data migrations rewrote it) into the real store with the widget
// harness, renders it, and drives it the way the saved app would: its events, its control-component actions, its RunJS
// query and its bindings. Returns what a builder would see (exposed values after each step) and every problem found.
import { act, screen, waitFor } from '@testing-library/react';
import { MODULE_ID, store, drain } from '@/AppBuilder/Widgets/widgetHarness';
import { componentTypeDefinitionMap } from '@/AppBuilder/WidgetManager/componentTypes';

const UUID = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi;

/** Exposed values as a builder can read them: no functions, JSON only, generated ids masked. */
export const readable = (value) =>
  JSON.parse(
    JSON.stringify(value ?? {}, (key, v) => (typeof v === 'function' ? undefined : v)).replace(UUID, '<uuid>')
  );

const changes = (before, after) => {
  const changed = {};
  for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) changed[key] = after[key] ?? null;
  }
  return changed;
};

/** A component in the shape the store holds, from its exported (saved) shape. */
const toStore = (c) => ({
  id: c.id,
  name: c.name,
  component: {
    component: c.type,
    name: c.name,
    displayName: c.type,
    ...(c.parent ? { parent: c.parent } : {}),
    definition: {
      properties: c.properties ?? {},
      styles: c.styles ?? {},
      validation: c.validation ?? {},
      general: c.general ?? {},
      generalStyles: c.generalStyles ?? {},
      others: c.displayPreferences ?? {},
    },
  },
  layouts: c.layouts,
});

// The marker button's control action each event handler runs, and what shows that it ran.
const MARKER_EFFECT = {
  setLoading: ['isLoading', true],
  setDisable: ['isDisabled', true],
  setVisibility: ['isVisible', false],
};
const MARKER_RESET = [
  ['setLoading', false],
  ['setDisable', false],
  ['setVisibility', true],
];

const REF = /components(?:\?\.|\.)([0-9a-fA-F-]{36}|[A-Za-z_$][\w$]*)\??\.([A-Za-z_$][\w$]*)(\s*\()?/g;
const allStrings = (value, out = []) => {
  if (typeof value === 'string') out.push(value);
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => allStrings(v, out));
  return out;
};

/** A harness for one fixture's widget, from the spec's createWidgetHarness. */
export function harnessFor(fixture, createWidgetHarness) {
  const widget = fixture.components[0];
  return createWidgetHarness({
    componentType: widget.type,
    handle: widget.name,
    id: widget.id,
    preload: ['ShadText', 'ShadButton'],
    widgetHeight: widget.layouts.desktop.height,
    widgetWidth: 640,
    seedFromRegisteredDefinition: false,
    // dnd: containers (Tabs, Dialog, List view rows) mount their child canvases as on a real page. The Map's picked
    // location is looked up on OpenStreetMap's geocoder; it is answered here, as nothing leaves a test.
    capabilities: {
      dnd: true,
      network: [{ url: 'https://nominatim.openstreetmap.org/*', json: { display_name: 'Market St, San Francisco' } }],
    },
  });
}

/**
 * Replays `app` (already renamed) through `harness`. `original` is the fixture as it was saved, to name the old name
 * in a problem. Returns { problems, observed }.
 */
export async function replay(harness, app, original) {
  const problems = [];
  const [widget, probe, marker] = app.components;
  const type = widget.type;
  const config = componentTypeDefinitionMap[type];
  const exposed = (id = widget.id) => store().getExposedValueOfComponent(id, MODULE_ID) ?? {};
  const originalEvent = Object.fromEntries(original.events.map((e) => [e.id, e.event]));

  if (!config) {
    problems.push(`${type} is not a registered widget any more: saved apps show "This widget is not available".`);
    return { problems, observed: null };
  }

  harness.render({
    componentId: widget.id,
    currentMode: 'view',
    extraComponents: Object.fromEntries(app.components.map((c) => [c.id, toStore(c)])),
    events: app.events,
    also: app.components.slice(1).map((c) => ({ id: c.id, componentType: c.type, widgetHeight: 40, widgetWidth: 640 })),
  });
  store().dataQuery.setQueries(
    app.dataQueries.map((q) => ({ ...q, data_source_id: null, app_version_id: q.appVersionId })),
    MODULE_ID
  );
  await waitFor(() => expect(Object.keys(exposed()).length).toBeGreaterThan(0));
  await waitFor(() => expect(exposed(marker.id).setLoading).toBeInstanceOf(Function));
  await act(drain);

  if (screen.queryAllByText(/This widget is not available/i).length)
    problems.push(`${type}: a component in the saved app renders "This widget is not available".`);

  // Every exposed value and action the saved app names must still exist: a missing one resolves to undefined, or does
  // nothing, with no error.
  const refsToWidget = new Set([widget.id, widget.name]);
  const sources = [
    ...app.components.map((c) => [`${c.name}'s properties`, [c.properties, c.styles, c.validation]]),
    ...app.events.map((e) => [`a handler on ${e.name}`, e.event]),
    ...app.dataQueries.map((q) => [`query ${q.name}`, q.options]),
  ];
  for (const [where, value] of sources) {
    for (const text of allStrings(value)) {
      for (const [, ref, key, call] of text.matchAll(REF)) {
        if (!refsToWidget.has(ref)) continue;
        const live = exposed();
        const by = ref === widget.id ? 'by id' : 'by name';
        if (call && typeof live[key] !== 'function')
          problems.push(`${where} calls ${widget.name}.${key}() (${by}), which ${type} no longer has.`);
        if (!call && !(key in live))
          problems.push(
            `${where} reads ${widget.name}.${key} (${by}), which ${type} no longer exposes (it resolves to undefined).`
          );
      }
    }
  }

  const observed = { loaded: readable(exposed()), probe: null, steps: [], runJs: null };
  const probeText = store().getResolvedComponent(probe.id, null, MODULE_ID)?.properties?.text;
  observed.probe = typeof probeText === 'string' ? probeText.replace(UUID, '<uuid>') : probeText ?? null;

  // Every saved event handler on the widget still dispatches: the event is one the widget has, and firing it runs the
  // handler's action on the marker.
  for (const handler of app.events.filter((e) => e.sourceId === widget.id)) {
    const { eventId, componentSpecificActionHandle: handle } = handler.event;
    const savedAs = originalEvent[handler.id]?.eventId;
    const label = savedAs === eventId ? `"${eventId}"` : `"${savedAs}" (renamed to "${eventId}")`;
    if (!(eventId in (config.events || {}))) {
      problems.push(`${type}: a saved handler on ${label} is on an event the widget no longer has.`);
      continue;
    }
    await act(async () => {
      for (const [action, value] of MARKER_RESET) await exposed(marker.id)[action]?.(value);
      await drain();
    });
    await act(async () => {
      store().eventsSlice.fireEvent(eventId, widget.id, MODULE_ID);
      await drain();
    });
    const [key, expected] = MARKER_EFFECT[handle] ?? [];
    if (!key)
      problems.push(`${type}: the handler on ${label} calls marker action "${handle}", which ShadButton lacks.`);
    else if (exposed(marker.id)[key] !== expected)
      problems.push(`${type}: firing ${label} did not run its saved action (${handle} on the marker).`);
  }

  // The saved control-component actions, one at a time, as the trigger's click would run them.
  for (const handler of app.events.filter((e) => e.sourceId !== widget.id && e.event.componentId === widget.id)) {
    const handle = handler.event.componentSpecificActionHandle;
    const savedAs = originalEvent[handler.id]?.componentSpecificActionHandle;
    const label = savedAs === handle ? `"${handle}"` : `"${savedAs}" (renamed to "${handle}")`;
    if (typeof exposed()[handle] !== 'function') {
      problems.push(`${type}: a saved control-component action ${label} is not an action the widget has.`);
      continue;
    }
    const before = readable(exposed());
    try {
      await act(async () => {
        await store().eventsSlice.executeAction(handler, 'view', {}, MODULE_ID);
        await drain();
      });
    } catch (error) {
      problems.push(`${type}: the saved action ${label} threw: ${error?.message ?? error}`);
    }
    observed.steps.push({ call: handle, changed: changes(before, readable(exposed())) });
  }

  // The RunJS query: calls the actions and reads the values by component name.
  for (const query of app.dataQueries) {
    const before = readable(exposed());
    let result;
    await act(async () => {
      result = await store().queryPanel.executeMultilineJS(query.options.code, query.id, false, 'view', {}, MODULE_ID);
      await drain();
    });
    if (result?.status !== 'ok') problems.push(`${type}: RunJS query ${query.name} failed: ${result?.data?.message}`);
    observed.runJs = { returned: readable(result?.data), changed: changes(before, readable(exposed())) };
  }

  return { problems, observed };
}
