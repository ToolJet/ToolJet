// The code editor is the real CodeMirror one; the layout checks here never reach it.
jest.mock('@/AppBuilder/CodeEditor', () => ({ __esModule: true, default: () => null }));

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DefaultFiltersConfig } from '../DefaultFiltersConfig';
import { getPanelPlacement, getPanelRect } from '../filterConfigUtils';

const columns = [
  { id: 'c-name', name: 'Name', columnType: 'string' },
  { id: 'c-age', name: 'Age', columnType: 'number' },
];
const filter = { id: 'f1', column: 'c-name', condition: 'contains', value: 'a' };

const PANEL = { left: 1000, right: 1300, top: 100, bottom: 900, width: 300, height: 800, x: 1000, y: 100 };
const COG = { left: 1230, right: 1246, top: 400, bottom: 416, width: 16, height: 16, x: 1230, y: 400 };

const withRect = (rect) => (element) => {
  if (element) element.getBoundingClientRect = () => rect;
};

async function openInsidePanel() {
  const user = userEvent.setup();
  render(
    <div className="inspector" ref={withRect(PANEL)}>
      <DefaultFiltersConfig columns={columns} defaultFilters={[filter]} serverSideFilter={false} onChange={jest.fn()} />
    </div>
  );
  const cog = screen.getByRole('button', { name: 'Configure filters' });
  cog.getBoundingClientRect = () => COG;
  await user.click(cog);
  return user;
}

describe('Table-FILTERUI-034 the popup opens beside the properties panel', () => {
  test('Table-FILTERUI-034 the position is taken from the panel the cog sits in', () => {
    // Break this catches: the popup anchored to the cog, so it opens on top of the panel it is configured from.
    const panel = document.createElement('div');
    panel.className = 'inspector';
    panel.getBoundingClientRect = () => PANEL;
    const cog = document.createElement('button');
    cog.getBoundingClientRect = () => COG;
    panel.appendChild(cog);

    expect(getPanelRect(cog)).toEqual(PANEL);
  });

  test('Table-FILTERUI-034 a cog outside any panel falls back to its own position', () => {
    // Break this catches: a crash, or a popup at the corner of the screen, when there is no panel around.
    const cog = document.createElement('button');
    cog.getBoundingClientRect = () => COG;

    expect(getPanelRect(cog)).toEqual(COG);
  });

  test('Table-FILTERUI-034 the offsets end the popup 8px before the panel and start it level with the cog', () => {
    // Break this catches: a popup that covers the panel, or is not level with the cog it belongs to.
    const panel = document.createElement('div');
    panel.className = 'inspector';
    panel.getBoundingClientRect = () => PANEL;
    const cog = document.createElement('button');
    cog.getBoundingClientRect = () => COG;
    panel.appendChild(cog);

    // sideOffset is measured from the cog, so it spans the cog's distance to the panel edge plus the gap
    expect(getPanelPlacement(cog, 8, 1400)).toEqual({
      sideOffset: COG.left - PANEL.left + 8,
      alignOffset: -8,
    });
  });

  test('Table-FILTERUI-034 the open popup ends at the left edge of the panel', async () => {
    // Break this catches: the popup covering the panel instead of sitting next to it.
    // Only the horizontal position is checked: jsdom has no viewport, so collision handling pins the vertical one.
    await openInsidePanel();

    const wrapper = await waitFor(() => {
      const element = document.querySelector('[data-radix-popper-content-wrapper]');
      expect(element.style.transform).not.toBe('translate(0, -200%)');
      return element;
    });
    // jsdom has no layout, so the popup is 0 wide: it ends where the 8px gap before the panel starts
    expect(wrapper.style.transform).toMatch(new RegExp(`^translate\\(${PANEL.left - 8}px, `));
  });
});

describe('Table-FILTERUI-035 the dropdown lists fit their options', () => {
  test('Table-FILTERUI-035 a list is as wide as its longest option, and never narrower than the design (196px)', async () => {
    // Break this catches: lists as narrow as the picker that opens them, which cut "greater than or equals".
    const user = await openInsidePanel();

    await user.click(screen.getByRole('button', { name: 'Operator' }));

    const list = screen.getByRole('listbox').closest('[data-slot="popover-content"]');
    expect(list).toHaveClass('tw-w-max');
    expect(list).toHaveClass('tw-min-w-[max(196px,var(--radix-popover-trigger-width))]');
  });

  test('Table-FILTERUI-035 a very long option is cut at 280px instead of stretching the list', async () => {
    // Break this catches: one long column name making a list wider than the screen.
    const user = await openInsidePanel();

    await user.click(screen.getByRole('button', { name: 'Column' }));

    expect(screen.getByRole('listbox').closest('[data-slot="popover-content"]')).toHaveClass('tw-max-w-[280px]');
  });
});

describe('Table-FILTERUI-036 dropdown text matches the field it belongs to', () => {
  test('Table-FILTERUI-036 the options and the picker use the same 12px body text', async () => {
    // Break this catches: options in another size than the field that opened them.
    const user = await openInsidePanel();
    const picker = screen.getByRole('button', { name: 'Operator' });

    await user.click(picker);

    expect(picker).toHaveClass('tw-font-body-default');
    screen.getAllByRole('option').forEach((option) => {
      expect(option).toHaveClass('tw-font-body-default');
      expect(option.className).not.toMatch(/tw-text-(xs|sm|base|lg|xl)/);
    });
  });
});
