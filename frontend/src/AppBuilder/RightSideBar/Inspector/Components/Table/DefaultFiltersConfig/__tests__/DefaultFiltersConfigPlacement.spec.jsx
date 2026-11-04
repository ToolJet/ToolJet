// The code editor is the real CodeMirror one; the placement checks here never reach it.
jest.mock('@/AppBuilder/CodeEditor', () => ({ __esModule: true, default: () => null }));

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DefaultFiltersConfig } from '../DefaultFiltersConfig';
import { getPanelPlacement } from '../filterConfigUtils';

const PANEL = { left: 1000, right: 1300, top: 100, bottom: 900, width: 300, height: 800, x: 1000, y: 100 };
const COG = { left: 1230, right: 1246, top: 400, bottom: 416, width: 16, height: 16, x: 1230, y: 400 };

const rect = (value) => (element) => {
  if (element) element.getBoundingClientRect = () => value;
};

function inPanel(panel = PANEL) {
  const wrapper = document.createElement('div');
  wrapper.className = 'inspector';
  wrapper.getBoundingClientRect = () => panel;
  const cog = document.createElement('button');
  cog.getBoundingClientRect = () => COG;
  wrapper.appendChild(cog);
  return cog;
}

const setViewportHeight = (height) =>
  Object.defineProperty(window, 'innerHeight', { configurable: true, writable: true, value: height });

describe('Table-FILTERUI-041 the popup is put beside the panel, level with the cog', () => {
  const originalHeight = window.innerHeight;
  afterEach(() => setViewportHeight(originalHeight));

  test('Table-FILTERUI-041 the rendered popup ends 8px before the panel and starts 8px above the cog', async () => {
    // Break this catches: the popup hanging from the cog over the panel, or pinned to the top of the panel.
    setViewportHeight(1400);
    const user = userEvent.setup();
    render(
      <div className="inspector" ref={rect(PANEL)}>
        <DefaultFiltersConfig
          columns={[{ id: 'c1', name: 'Name', columnType: 'string' }]}
          defaultFilters={[]}
          serverSideFilter={false}
          onChange={jest.fn()}
        />
      </div>
    );
    const cog = screen.getByRole('button', { name: 'Configure filters' });
    cog.getBoundingClientRect = () => COG;
    await user.click(cog);

    await waitFor(() => {
      const wrapper = document.querySelector('[data-radix-popper-content-wrapper]');
      // jsdom has no layout, so the popup is 0 wide: its right edge is the x it is placed at
      expect(wrapper.style.transform).toBe(`translate(${PANEL.left - 8}px, ${COG.top - 8}px)`);
    });
  });

  test('Table-FILTERUI-041 the popup never flips to the other side of the panel', async () => {
    // Break this catches: collision handling flipping the popup back over the panel.
    const user = userEvent.setup();
    render(
      <div className="inspector" ref={rect(PANEL)}>
        <DefaultFiltersConfig columns={[]} defaultFilters={[]} serverSideFilter={false} onChange={jest.fn()} />
      </div>
    );
    const cog = screen.getByRole('button', { name: 'Configure filters' });
    cog.getBoundingClientRect = () => COG;
    await user.click(cog);

    const popup = await screen.findByTestId('default-filters-config-popover');
    expect(popup).toHaveAttribute('data-side', 'left');
  });

  test('Table-FILTERUI-041 the offsets move the popup 8px above the cog and 8px before the panel', () => {
    // Break this catches: a popup that is not level with the cog it belongs to.
    expect(getPanelPlacement(inPanel(), 8, 1400)).toEqual({
      sideOffset: COG.left - PANEL.left + 8,
      alignOffset: -8,
    });
  });

  test('Table-FILTERUI-041 near the bottom of the screen it is lifted so its bottom stays 8px inside it', () => {
    // Break this catches: the popup running off the bottom of the window when the cog is low in the panel.
    const viewport = 500;
    const popupHeight = 44 + 0.7 * viewport; // header + body (at most 70% of the viewport)

    expect(getPanelPlacement(inPanel(), 8, viewport).alignOffset).toBeCloseTo(viewport - 8 - popupHeight - COG.top);
  });

  test('Table-FILTERUI-041 a cog above the top of the screen keeps the popup 8px inside it', () => {
    // Break this catches: a popup whose header is scrolled out of view.
    const cog = inPanel();
    cog.getBoundingClientRect = () => ({ ...COG, top: -100 });

    expect(getPanelPlacement(cog, 8, 768).alignOffset).toBe(8 - -100);
  });
});
