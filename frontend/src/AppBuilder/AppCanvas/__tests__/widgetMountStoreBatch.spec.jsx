/**
 * A page's widgets publish their exposed values as they mount (each widget's own effects, and RenderWidget's `id`).
 * Every store update re-runs every mounted widget's store selectors, so one update per write made a page of N widgets
 * cost N x N selector runs as it mounted; the page switch's own batch is already flushed by then. RenderWidget now
 * holds the exposed-value batch across its mount commit, so one commit's mount writes go out as one store update.
 */
import { waitFor } from '@testing-library/react';
import useStore from '@/AppBuilder/_stores/store';
import { componentDefinition } from '@/test/app-builder';
import {
  createWidgetHarness,
  binding,
  store,
  MODULE_ID,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const textDefinition = (id, handle) =>
  componentDefinition(id, handle, 'Text', { text: binding(`hello ${handle}`), visibility: binding('{{true}}') });

const widget = createWidgetHarness({
  componentType: 'Text',
  handle: 'text0',
  id: 't0',
  defaultProperties: { text: binding('hello'), visibility: binding('{{true}}') },
});

beforeEach(() => widget.setup());
afterEach(() => widget.teardown());

const SIBLINGS = Array.from({ length: 9 }, (_, i) => ({ id: `t${i + 1}`, handle: `text${i + 1}` }));

describe('widget mount store writes', () => {
  test('the mount writes of a page of widgets go out as one store update', async () => {
    const componentsUpdates = [];
    const unsubscribe = useStore.subscribe((next, prev) => {
      const now = next.resolvedStore.modules[MODULE_ID]?.exposedValues?.components;
      const before = prev.resolvedStore.modules[MODULE_ID]?.exposedValues?.components;
      if (now !== before) componentsUpdates.push(Object.keys(now || {}).length);
    });
    try {
      widget.render({
        extraComponents: Object.fromEntries(SIBLINGS.map(({ id, handle }) => [id, textDefinition(id, handle)])),
        also: SIBLINGS.map(({ id }) => ({ id, componentType: 'Text' })),
      });
      await waitFor(() => ['t0', ...SIBLINGS.map((s) => s.id)].forEach((id) => expect(widget.exposed(id).id).toBe(id)));
    } finally {
      unsubscribe();
    }
    // Ten widgets each wrote their id (and the Text widget its own values) one store update at a time.
    expect(componentsUpdates.length).toBeLessThanOrEqual(2);
    expect(store().isExposedValueBatching()).toBe(false);
  });

  test('holds nest in an open batch and release once', async () => {
    widget.render();
    await waitFor(() => expect(widget.exposed().id).toBe('t0'));
    const { startExposedValueBatch, flushExposedValueBatch, isExposedValueBatching, holdExposedValueWrites } = store();
    startExposedValueBatch();
    const release = holdExposedValueWrites();
    store().setExposedValue('t0', 'probe', 1, MODULE_ID);
    release();
    release();
    expect(isExposedValueBatching()).toBe(true);
    expect(store().getExposedValueOfComponent('t0', MODULE_ID)?.probe).toBeUndefined();
    flushExposedValueBatch();
    expect(isExposedValueBatching()).toBe(false);
    expect(store().getExposedValueOfComponent('t0', MODULE_ID).probe).toBe(1);
  });

  test('a write after mount is applied straight away', async () => {
    widget.render();
    await waitFor(() => expect(widget.exposed().id).toBe('t0'));
    widget.setExposedValue('t0', 'later', 'now');
    expect(widget.exposed().later).toBe('now');
  });
});
