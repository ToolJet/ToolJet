// Release audit round 3 (Codex fixture reviewTagsLoadingObserver, trimmed): single-row Tags that had shown a loading
// state stopped fitting their row: the row mounts again when loading ends, but the fit measured and observed only the
// row there was when its tags last changed, so every tag showed (clipped), with no +N, and a resize changed nothing.
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { act, screen } from '@testing-library/react';

const w = createWidgetHarness({ componentType: 'ShadTags', id: 'tags1', handle: 'tags1' });
let original;
let observers;
let width;
const descriptors = {};
beforeEach(async () => {
  await w.setup();
  original = global.ResizeObserver;
  observers = [];
  global.ResizeObserver = class {
    constructor(callback) {
      this.callback = callback;
      this.targets = new Set();
      observers.push(this);
    }
    observe(target) {
      this.targets.add(target);
    }
    unobserve(target) {
      this.targets.delete(target);
    }
    disconnect() {
      this.targets.clear();
    }
  };
  // The row is `width` wide; every chip (and the +N chip) is 60px.
  width = 400;
  descriptors.client = Object.getOwnPropertyDescriptor(Element.prototype, 'clientWidth');
  descriptors.offset = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth');
  Object.defineProperty(Element.prototype, 'clientWidth', { configurable: true, get: () => width });
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, get: () => 60 });
});
afterEach(() => {
  w.teardown();
  global.ResizeObserver = original;
  Object.defineProperty(Element.prototype, 'clientWidth', descriptors.client);
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', descriptors.offset);
});

test.each(['never loading', 'loading at first', 'loading and back'])(
  'single-row Tags fit their current row after a resize: %s',
  async (mode) => {
    w.render({
      currentMode: 'view',
      properties: {
        tags: binding('{{["A","B","C","D","E"]}}'),
        overflow: binding('single'),
        loadingState: binding(mode === 'loading at first' ? '{{true}}' : '{{false}}'),
      },
    });
    if (mode === 'loading and back') {
      await screen.findByRole('list', { name: 'Tags' });
      await w.act('setLoading', true);
      expect(screen.queryByRole('list', { name: 'Tags' })).not.toBeInTheDocument();
    }
    if (mode !== 'never loading') await w.act('setLoading', false);
    const row = await screen.findByRole('list', { name: 'Tags' });
    expect(screen.getAllByRole('listitem')).toHaveLength(5);
    expect(observers.filter((o) => o.targets.has(row))).toHaveLength(1);
    width = 200;
    await act(async () => {
      observers.filter((o) => o.targets.has(row)).forEach((o) => o.callback([{ target: row }]));
    });
    expect(screen.getAllByRole('listitem').map((e) => e.textContent)).toEqual(['A', 'B']);
    expect(screen.getByTitle('C, D, E')).toHaveTextContent('+3');
  }
);
