import useStore from '@/AppBuilder/_stores/store'; // eslint-disable-line no-unused-vars -- marks this a real-store (integration) spec
import { act, fireEvent } from '@testing-library/react';
import { installGuards, mountWidget } from './harness';

// The pack Tabs had no keyboard pattern: every tab was its own Tab stop and the arrow keys did nothing (found in a
// headless browser). Now Left and Right move to the previous or next tab and select it, Home and End jump to the ends,
// and only the selected tab is a Tab stop.
installGuards();

const tabs =
  '{{[{ id: "a", title: "One" }, { id: "b", title: "Two" }, { id: "c", title: "Three", disable: true }, { id: "d", title: "Four" }]}}';

describe.each(['pills', 'underline', 'steps'])('ShadTabs (%s)', (variant) => {
  it('moves and selects with the arrow keys, Home and End, skipping a disabled tab', async () => {
    const m = await mountWidget('ShadTabs', {
      properties: { tabItems: tabs, defaultTab: 'a', variant, linearSteps: '{{false}}' },
    });
    const strip = () => document.querySelector('[role=tablist]');
    const press = async (key) => {
      await act(async () => {
        fireEvent.keyDown(
          document.activeElement && strip().contains(document.activeElement) ? document.activeElement : strip(),
          { key }
        );
        await new Promise((r) => setTimeout(r, 50));
      });
    };
    const stops = () =>
      [...document.querySelectorAll('[role=tab]')].filter((t) => t.tabIndex === 0).map((t) => t.textContent);
    expect(stops()).toEqual([expect.stringContaining('One')]);
    await press('ArrowRight');
    expect(m.exposed().currentTab).toBe('b');
    await press('ArrowRight');
    expect(m.exposed().currentTab).toBe('d');
    await press('Home');
    expect(m.exposed().currentTab).toBe('a');
    await press('End');
    expect(m.exposed().currentTab).toBe('d');
    await press('ArrowLeft');
    expect(m.exposed().currentTab).toBe('b');
    expect(stops()).toEqual([expect.stringContaining('Two')]);
    await m.unmount();
  });
});

// A linear wizard only moves to steps already reached: the arrow keys follow the same rule as a click.
it('ShadTabs (steps, linear) does not skip ahead with the arrow keys', async () => {
  const m = await mountWidget('ShadTabs', { properties: { tabItems: tabs, defaultTab: 'a', variant: 'steps' } });
  await act(async () => {
    fireEvent.keyDown(document.querySelector('[role=tablist]'), { key: 'ArrowRight' });
    await new Promise((r) => setTimeout(r, 50));
  });
  expect(m.exposed().currentTab).toBe('a');
  await m.unmount();
});
