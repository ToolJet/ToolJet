// Release audit round 3 (Codex fixture reviewTextareaMeasurementLifetime, trimmed): after a loading cycle, or when the
// Textarea first rendered loading, the label's ResizeObserver stayed on the label the loading look had replaced, so a
// label or help text that wrapped later pushed the text area past the box. The measuring effect did not rerun when
// loading ended.
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { act, screen } from '@testing-library/react';

const w = createWidgetHarness({ componentType: 'ShadTextarea', id: 'area1', handle: 'area1', widgetHeight: 200 });
let original;
let observers;
beforeEach(() => {
  w.setup();
  original = global.ResizeObserver;
  observers = [];
  global.ResizeObserver = class {
    constructor(callback) {
      this.callback = callback;
      this.targets = new Set();
      observers.push(this);
    }
    observe(t) {
      this.targets.add(t);
    }
    unobserve(t) {
      this.targets.delete(t);
    }
    disconnect() {
      this.targets.clear();
    }
  };
});
afterEach(() => {
  w.teardown();
  global.ResizeObserver = original;
});

test.each(['normal', 'initial-loading', 'loading-cycle'])('the current label is measured: %s', async (mode) => {
  w.render({
    properties: {
      label: binding('Notes'),
      description: binding('Long help text'),
      loadingState: binding(mode === 'initial-loading' ? '{{true}}' : '{{false}}'),
    },
  });
  if (mode === 'loading-cycle') await w.act('setLoading', true);
  if (mode !== 'normal') await w.act('setLoading', false);
  const area = screen.getByRole('textbox', { name: 'Notes' });
  const label = screen.getByText('Notes');
  const subscribers = observers.filter((o) => o.targets.has(label));
  expect(subscribers).toHaveLength(1);
  // The label and help text wrap to take 100px: the text area gives that up.
  const before = Number.parseFloat(area.style.height);
  const field = area.closest('.tj-shadcn').firstElementChild;
  Object.defineProperty(field, 'scrollHeight', { configurable: true, value: 200 });
  Object.defineProperty(area, 'offsetHeight', { configurable: true, value: 100 });
  await act(async () => subscribers.forEach((o) => o.callback([{ target: label }])));
  expect(area.style.height).toBe(`${Math.max(60, before - 100)}px`);
});
