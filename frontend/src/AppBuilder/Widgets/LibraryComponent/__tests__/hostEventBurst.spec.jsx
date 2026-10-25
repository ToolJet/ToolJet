import React from 'react';
import { act, render } from '@testing-library/react';

// Codex PERF-01: an onChange handler that clears or resets the field it came from (shadcn Input clear, Ant Input
// resetFields, MUI TextField clear) looped: each action fired onChange again and the host ran the next action as a
// microtask, so the page never got a turn. The host stops a burst from one widget past 200 events before the page
// runs again, warns once, and lets the widget fire again on the next task.
jest.mock('@/AppBuilder/_stores/store', () => {
  const { create: createStore } = jest.requireActual('zustand');
  return { __esModule: true, default: createStore(() => ({})) };
});
jest.mock('@/AppBuilder/Widgets/Listview/ListviewSubcontainer', () => ({ ListviewSubcontainer: () => null }));

const { installBrowserStubs } = require('./fuzz/packTestEnv');
const { usePackHost } = require('@/AppBuilder/Widgets/LibraryComponent/usePackHost');

installBrowserStubs();

let fire;
const Harness = ({ fireEvent }) => {
  const { fireHostEvent } = usePackHost(
    { id: 'input1', width: 200, height: 40, currentLayout: 'desktop', darkMode: false, setExposedVariable: () => {}, fireEvent },
    {}
  );
  fire = fireHostEvent;
  return null;
};
const tick = () => act(() => new Promise((resolve) => setTimeout(resolve, 0)));

describe('pack host event burst guard', () => {
  it('stops a self-feeding burst past 200 events, warns once, and fires again on the next task', async () => {
    const fireEvent = jest.fn(() => Promise.resolve());
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    render(<Harness fireEvent={fireEvent} />);
    // The loop: each event's handler runs the action as a microtask, which fires the event again.
    await act(async () => {
      let left = 1000;
      const step = () => {
        if (left-- <= 0) return Promise.resolve();
        fire('onChange');
        return Promise.resolve().then(step);
      };
      await step();
    });
    expect(fireEvent).toHaveBeenCalledTimes(200);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain('input1');
    await tick();
    fire('onChange');
    expect(fireEvent).toHaveBeenCalledTimes(201);
    warn.mockRestore();
  });

  it('lets a real burst through: 50 events in one frame all fire', async () => {
    const fireEvent = jest.fn(() => Promise.resolve());
    render(<Harness fireEvent={fireEvent} />);
    for (let i = 0; i < 50; i++) fire('onChange');
    expect(fireEvent).toHaveBeenCalledTimes(50);
  });
});
