/**
 * useDynamicHeight, the hook every dynamic height widget calls: a widget the engine measures is watched by the app's
 * height registry (its canvas box, which follows its content in the viewer), and a container or a List view row asks
 * the scheduler for a pass. The engine then writes where everything is drawn (`temporaryLayouts`).
 *
 * Runs on the real store and engine. The browser is faked: a ResizeObserver whose reports each spec delivers, and the
 * canvas box WidgetWrapper would draw (matched by layoutKeys.getDynamicElementSelector).
 */
import { act, renderHook, waitFor } from '@testing-library/react';
import { useDynamicHeight } from '@/_hooks/useDynamicHeight';
import useStore from '@/AppBuilder/_stores/store';
import { seedApp, binding } from '@/test/app-builder';
import { uuid, widget } from '@/AppBuilder/_stores/dynamicHeight/__tests__/integration/dynamicHeightPage';

const s = () => useStore.getState();
const temps = () => s().temporaryLayouts;
// Seeding a page changes its saved layout, so the store places it whole on the next frame (watchSavedLayouts). Each
// spec runs that pass at once, so what it checks afterwards can only come from the hook.
const settle = () => s().getDynamicHeightScheduler().flush();
const DH = { dynamicHeight: binding('{{true}}') };

// The browser's ResizeObserver: the app's registry makes one when it first watches a widget (and lets it go when it
// watches none), so each spec gets its own.
class FakeResizeObserver {
  static current = null;

  constructor(callback) {
    this.callback = callback;
    this.observed = new Set();
    FakeResizeObserver.current = this;
  }

  observe(element) {
    this.observed.add(element);
  }

  unobserve(element) {
    this.observed.delete(element);
  }

  disconnect() {
    this.observed.clear();
  }
}
const reportSize = (element, blockSize) =>
  act(() => FakeResizeObserver.current.callback([{ target: element, borderBoxSize: [{ blockSize }] }]));
const isWatched = (element) => !!FakeResizeObserver.current?.observed.has(element);

// The canvas box WidgetWrapper draws for a widget.
const drawBox = (id, { context = 'root', moduleId = 'canvas' } = {}) => {
  const box = document.createElement('div');
  box.className = `ele-${id}`;
  box.dataset.layoutContext = context;
  box.dataset.moduleId = moduleId;
  document.body.appendChild(box);
  return box;
};

const leaf = (props) =>
  renderHook((current) => useDynamicHeight(current), {
    initialProps: { id: 'a', height: 40, currentLayout: 'desktop', visibility: true, ...props },
  });

describe('useDynamicHeight', () => {
  let originalResizeObserver;

  beforeEach(() => {
    originalResizeObserver = globalThis.ResizeObserver;
    globalThis.ResizeObserver = FakeResizeObserver;
    FakeResizeObserver.current = null;
  });

  afterEach(() => {
    globalThis.ResizeObserver = originalResizeObserver;
    document.body.innerHTML = '';
  });

  // `a` grows; `b` sits 20 under it.
  const page = (aProperties = DH) => {
    seedApp({
      a: widget('a', 'Text', { top: 0, properties: aProperties }),
      b: widget('b', 'Text', { top: 60 }),
    });
    settle();
  };

  describe('a widget the engine measures', () => {
    it('[DynamicHeight-HOOK-001] is watched, and placed at the height its box is drawn at', async () => {
      page();
      const box = drawBox('a');
      const { unmount } = leaf({ isDynamicHeightEnabled: true });
      expect(isWatched(box)).toBe(true);

      reportSize(box, 300);
      await waitFor(() => expect(temps().b).toEqual({ top: 320, height: 40 }));
      expect(temps().a).toEqual({ top: 0, height: 300 });
      unmount();
    });

    it('[DynamicHeight-HOOK-002] is no longer watched once it is removed or its Dynamic height is off', async () => {
      page();
      const box = drawBox('a');
      const { rerender, unmount } = leaf({ isDynamicHeightEnabled: true });
      expect(isWatched(box)).toBe(true);
      rerender({ id: 'a', height: 40, currentLayout: 'desktop', visibility: true, isDynamicHeightEnabled: false });
      expect(isWatched(box)).toBe(false);

      rerender({ id: 'a', height: 40, currentLayout: 'desktop', visibility: true, isDynamicHeightEnabled: true });
      expect(isWatched(box)).toBe(true);
      unmount();
      expect(isWatched(box)).toBe(false);
    });

    it('[DynamicHeight-HOOK-003] keeps its height while it asks to (a Table loading its data), and follows it after', async () => {
      page();
      const box = drawBox('a');
      const props = { id: 'a', height: 40, currentLayout: 'desktop', visibility: true, isDynamicHeightEnabled: true };
      const { rerender, unmount } = leaf(props);
      reportSize(box, 300);
      await waitFor(() => expect(temps().a).toEqual({ top: 0, height: 300 }));

      rerender({ ...props, skipAdjustment: true });
      // The box keeps the height it is placed at, so the widgets under it stay put instead of a gap opening.
      expect(box.style.height).toBe('300px');
      reportSize(box, 80); // the loading state
      await act(() => new Promise((resolve) => requestAnimationFrame(resolve)));
      expect(temps().a).toEqual({ top: 0, height: 300 });
      rerender({ ...props, skipAdjustment: false });
      expect(box.style.height).toBe('');
      reportSize(box, 200);
      await waitFor(() => expect(temps().a).toEqual({ top: 0, height: 200 }));
      unmount();
    });

    it('[DynamicHeight-HOOK-004] asks for a pass when it is shown or hidden', async () => {
      // A widget that collapses when hidden gives up its room, and the one under it moves up. Hidden at runtime (a
      // setVisibility action): nothing in the saved layout changes, so only the hook's request places it.
      page({ ...DH, collapseWhenHidden: binding('{{true}}') });
      drawBox('a');
      const props = { id: 'a', height: 40, currentLayout: 'desktop', visibility: true, isDynamicHeightEnabled: true };
      const { rerender, unmount } = leaf(props);
      settle(); // the pass it asked for when it was first drawn
      act(() => s().setExposedValue('a', 'isVisible', false));
      rerender({ ...props, visibility: false });
      await waitFor(() => expect(temps().b).toEqual({ top: 0, height: 40 }));
      unmount();
    });
  });

  describe('a container, and a List view row', () => {
    const BOX = uuid(1);
    const LIST = uuid(2);

    it('[DynamicHeight-HOOK-005] a container asks for a pass and is drawn at its content’s height', async () => {
      // A Container drawn 100 high, without header, holding a widget at 200.
      seedApp({
        [BOX]: widget(BOX, 'Container', {
          top: 0,
          height: 100,
          properties: { ...DH, showHeader: binding('{{false}}') },
        }),
        inBox: widget('inBox', 'Text', { parent: BOX, top: 200 }),
      });
      settle();
      // Drawn back at its saved height (as before anything sized it): only a pass asked for by the hook fixes it.
      s().setTemporaryLayouts({ [BOX]: { top: 0, height: 100 } });
      const { unmount } = renderHook(() =>
        useDynamicHeight({
          isDynamicHeightEnabled: true,
          id: BOX,
          height: 100,
          currentLayout: 'desktop',
          visibility: true,
          isContainer: true,
        })
      );
      await waitFor(() => expect(temps()[BOX]?.height).toBeGreaterThan(240));
      unmount();
    });

    it('[DynamicHeight-HOOK-006] a List view row asks for a pass of its own row', async () => {
      seedApp({
        [LIST]: widget(LIST, 'Listview', {
          top: 0,
          height: 218,
          properties: {
            ...DH,
            dataSourceSelector: binding('rawJson'),
            data: binding('{{[{ "n": 0 }, { "n": 1 }]}}'),
            rowHeight: binding('{{100}}'),
          },
        }),
        rowText: widget('rowText', 'Text', { parent: LIST, top: 0 }),
      });
      settle();
      // Both rows drawn at a height nothing measured: the hook asks for row 1 only.
      s().setTemporaryLayouts({ [`${LIST}-0`]: { height: 999 }, [`${LIST}-1`]: { height: 999 } });
      const { unmount } = renderHook(() =>
        useDynamicHeight({
          isDynamicHeightEnabled: true,
          id: LIST,
          height: 218,
          currentLayout: 'desktop',
          visibility: true,
          isContainer: true,
          isRowSubcontainer: true,
          subContainerIndex: 1,
        })
      );
      // With Dynamic height on, a row fits its components: one Text, 40 high.
      await waitFor(() => expect(temps()[`${LIST}-1`]).toEqual({ height: 40 }));
      expect(temps()[`${LIST}-0`]).toEqual({ height: 999 });
      unmount();
    });
  });
});
