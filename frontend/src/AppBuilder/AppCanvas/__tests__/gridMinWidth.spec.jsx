import { getMinWidthPx } from '../Grid/gridUtils';
import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import { AppBuilderTestSession, defineAppBuilderScenario, seedApp, componentDefinition } from '@/test/app-builder';
import Grid from '../Grid/Grid';

describe('minWidth', () => {
  describe('getMinWidthPx', () => {
    test('[Listview-SIZE-003] a ListView minimum is 140px rounded up to whole columns of its parent canvas', () => {
      // Break this catches: a minimum that is not a whole number of columns, which snaps back below 140px on drop.
      expect(getMinWidthPx('Listview', 1000 / 43, 1000 / 43)).toBeCloseTo((1000 / 43) * 7);
      expect(getMinWidthPx('Listview', 10, 23)).toBe(140);
      expect(getMinWidthPx('Listview', 12.5, 23)).toBe(150);
    });

    test('[Listview-SIZE-004] every other widget keeps the default minimum', () => {
      // Break this catches: the ListView minimum applied to every widget.
      expect(getMinWidthPx('Button', 10, 23)).toBe(23);
      expect(getMinWidthPx(undefined, 10, 23)).toBe(23);
    });
  });
});

describe('gridMinWidth', () => {
  /**
   * Dragging a ListView's edge never makes it narrower than 140px (the width at which its pager still fits as
   * `‹ 1 ›`); other widgets keep the one-grid-column minimum. Contract:
   * frontend/ee/test/app-builder/widgets/Listview/TESTING.md (Listview-SIZE-001..).
   */

  const scenario = defineAppBuilderScenario({
    id: 'grid-listview-min-width',
    name: 'Grid resize minimum width',
    primarySeam: 'rtl',
    surface: 'app-editor',
    edition: 'ce',
    environment: 'development',
    layout: 'desktop',
    version: 'draft',
    transferPath: 'not-applicable',
    access: 'authenticated',
    // The resize saves the new layout; the answer is irrelevant here.
    capabilities: {
      observers: true,
      network: ['put', 'post', 'patch'].map((method) => ({ method, url: '*', json: {} })),
    },
  });

  const GRID_WIDTH = 1000 / 43;
  const RECT = { left: 100, top: 100, width: 300, height: 200 };

  const rectOf = ({ left, top, width, height }) => ({
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    x: left,
    y: top,
    toJSON() {},
  });

  function widgetDefinition(id, type) {
    const definition = componentDefinition(id, id, type);
    definition.component.definition.others = { showOnDesktop: { value: '{{true}}' } };
    definition.layouts = { desktop: { top: 100, left: 4, width: 13, height: 200 } };
    return definition;
  }

  describe('Grid resize minimum width', () => {
    let session;
    let restore;

    async function mountSelectedAll(entries) {
      const original = Element.prototype.getBoundingClientRect;
      Element.prototype.getBoundingClientRect = function () {
        const key = this.getAttribute?.('data-rect');
        if (key === 'canvas') return rectOf({ left: 0, top: 0, width: 1000, height: 1000 });
        if (key === 'box') return rectOf(RECT);
        return original.call(this);
      };
      const widthSpy = jest.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function () {
        return this.getAttribute?.('data-rect') === 'box' ? parseFloat(this.style.width) || RECT.width : 0;
      });
      const heightSpy = jest.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function () {
        return this.getAttribute?.('data-rect') === 'box' ? RECT.height : 0;
      });
      // The group resize reads the canvas size to keep the group inside it.
      const clientWidthSpy = jest.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function () {
        return this.getAttribute?.('data-rect') === 'canvas' ? 1000 : 0;
      });
      const scrollHeightSpy = jest.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(function () {
        return this.getAttribute?.('data-rect') === 'canvas' ? 1000 : 0;
      });
      // jsdom has no hit-testing; Moveable asks what is under the pointer when the drag ends.
      document.elementFromPoint = () => document.body;
      restore = () => {
        delete document.elementFromPoint;
        Element.prototype.getBoundingClientRect = original;
        widthSpy.mockRestore();
        heightSpy.mockRestore();
        clientWidthSpy.mockRestore();
        scrollHeightSpy.mockRestore();
      };
      session = new AppBuilderTestSession({ scenario });
      const store = seedApp(Object.fromEntries(entries.map(([id, type]) => [id, widgetDefinition(id, type)])));
      store().setEditorLoading(false, 'canvas');
      store().setCurrentMode('edit', 'canvas');
      await session.store.act(
        'setSelectedComponents',
        entries.map(([id]) => id)
      );
      session.render(
        <>
          <div id="real-canvas" className="real-canvas" data-rect="canvas" style={{ width: 1000, height: 1000 }}>
            {entries.map(([id]) => (
              <div
                key={id}
                id={id}
                widgetid={id}
                className={`moveable-box target ele-${id}`}
                data-rect="box"
                style={{ width: `${RECT.width}px`, height: `${RECT.height}px`, transform: 'translate(100px, 100px)' }}
              />
            ))}
          </div>
          <Grid gridWidth={GRID_WIDTH} currentLayout="desktop" mainCanvasWidth={1000} />
        </>
      );
      await waitFor(() => expect(document.querySelector('.moveable-control.moveable-e')).not.toBeNull());
      return entries.map(([id]) => document.getElementById(id));
    }
    const mountSelected = async (id, type) => (await mountSelectedAll([[id, type]]))[0];

    afterEach(() => restore?.());

    // Drag the east edge `distance` px to the left, in two moves so Moveable sees a gesture.
    function dragEastEdge(distance) {
      const handle = document.querySelector('.moveable-control.moveable-e');
      fireEvent.mouseDown(handle, { clientX: 400, clientY: 200, button: 0, buttons: 1 });
      fireEvent.mouseMove(window, { clientX: 400 - distance / 2, clientY: 200, buttons: 1 });
      fireEvent.mouseMove(window, { clientX: 400 - distance, clientY: 200, buttons: 1 });
      fireEvent.mouseUp(window, { clientX: 400 - distance, clientY: 200 });
    }

    test('[Listview-SIZE-001] a ListView cannot be dragged narrower than 140px', async () => {
      // Break this catches: a ListView squeezed to a sliver where even `‹ 1 ›` does not fit.
      const box = await mountSelected('lv1', 'Listview');

      dragEastEdge(280);

      await waitFor(() => expect(parseFloat(box.style.width)).toBeGreaterThanOrEqual(140));
      expect(parseFloat(box.style.width)).toBeLessThan(140 + GRID_WIDTH);
      // Stored in grid columns: 140px is 6.02 columns, so at least 7.
      await waitFor(() =>
        expect(
          session.store.read((state) => state.getCurrentPageComponents('canvas').lv1.layouts.desktop.width)
        ).toBeGreaterThanOrEqual(7)
      );
    });

    test('[Listview-SIZE-002] other widgets still shrink to one grid column', async () => {
      // Break this catches: the minimum leaking to every widget.
      const box = await mountSelected('btn1', 'Button');

      dragEastEdge(280);

      await waitFor(() => expect(parseFloat(box.style.width)).toBeLessThan(140));
    });

    test('[Listview-SIZE-005] a ListView cannot be shrunk below 140px by a group resize', async () => {
      // Break this catches: the group resize path, which only floors a width at one column.
      const [box] = await mountSelectedAll([
        ['lv1', 'Listview'],
        ['btn1', 'Button'],
      ]);

      dragEastEdge(280);
      await waitFor(() =>
        expect(
          session.store.read((state) => state.getCurrentPageComponents('canvas').lv1.layouts.desktop.width)
        ).toBeGreaterThanOrEqual(7)
      );
      expect(parseFloat(box.style.width)).toBeGreaterThanOrEqual(140);
    }, 20000);
  });
});
