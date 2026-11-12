import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { installBrowserStubs, makeHost } from './fuzz/packTestEnv';
import { hostValidation } from './fuzz/hostValidation';

installBrowserStubs();

// AD-08: the Ant Calendar wrote Value for the header dropdowns and the Year-mode cells but fired On select only for a
// day click. Mounts the real pack Calendar on the real inline SDK (only module and CSS loading is replaced).
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const pack = require('../../../../../../packs/antd/src/index.ts');

const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 30)));
// Every element matching `sel` in the document and its open shadow roots (the header dropdown portals into the popup layer).
const deepAll = (sel, from = document) => {
  const found = [...from.querySelectorAll(sel)];
  for (const el of from.querySelectorAll('*')) if (el.shadowRoot) found.push(...deepAll(sel, el.shadowRoot));
  return found;
};

const mountCalendar = async (props) => {
  loadLibraryModule.mockResolvedValue(pack);
  const exposed = {};
  const events = [];
  // The exposed Value at the moment each event fired: a handler must already see the new date.
  const seen = [];
  const host = {
    ...makeHost('Calendar', {}),
    useValidation: hostValidation((key, value) => {
      exposed[key] = value;
    }),
  };
  const rendered = render(
    <InlineLibraryComponent
      bundleUrl="pack.js"
      cssUrl="pack.css"
      cacheKey="ant-calendar-select"
      componentName="Calendar"
      componentProps={{ events: [], ...props }}
      componentStyles={{}}
      renderSlot={() => null}
      setExposedVariable={(key, value) => {
        exposed[key] = value;
      }}
      fireEvent={(event) => {
        events.push(event);
        seen.push({ event, value: exposed.value });
      }}
      actions={new Map()}
      host={host}
      dataCy="ant-calendar"
    />
  );
  const root = () => rendered.container.querySelector('[data-cy="ant-calendar"]').shadowRoot;
  await waitFor(() => expect(root()?.querySelector('.ant-picker-calendar')).toBeTruthy());
  await settle();
  const count = (name) => events.filter((e) => e === name).length;
  const pickMonth = async (title) => {
    const selects = root().querySelectorAll('.ant-picker-calendar-header .ant-select');
    fireEvent.mouseDown(selects[1].querySelector('.ant-select-selector'));
    await settle();
    fireEvent.click(deepAll('.ant-select-item-option').find((o) => o.getAttribute('title') === title));
    await settle();
  };
  return { exposed, events, seen, root, count, pickMonth };
};

describe('Ant Calendar fires On select whenever it writes Value (AD-08)', () => {
  it('a day click writes Value and fires On select once', async () => {
    const v = await mountCalendar({ value: '2026-11-02' });
    fireEvent.click(v.root().querySelector('td[title="2026-11-10"]'));
    await settle();
    expect(v.exposed.value).toBe('2026-11-10');
    expect(v.count('onSelect')).toBe(1);
    expect(v.seen.find((s) => s.event === 'onSelect').value).toBe('2026-11-10');
  });

  it('changing the month in the header dropdown fires On select, and the handler sees the new Value', async () => {
    const v = await mountCalendar({ value: '2026-11-02' });
    await v.pickMonth('Jan');
    expect(v.exposed.value).toBe('2026-01-02');
    expect(v.count('onSelect')).toBe(1);
    expect(v.seen.find((s) => s.event === 'onSelect').value).toBe('2026-01-02');
    expect(v.count('onPanelChange')).toBeGreaterThan(0);
  });

  it('picking a month in Year mode fires On select, and the handler sees the new Value', async () => {
    const v = await mountCalendar({ value: '2026-11-02' });
    const year = [...v.root().querySelectorAll('.ant-radio-button-wrapper')].find((l) => /year/i.test(l.textContent));
    fireEvent.click(year.querySelector('input'));
    await settle();
    fireEvent.click(v.root().querySelector('td[title="2026-05"]'));
    await settle();
    expect(v.exposed.value).toBe('2026-05-02');
    expect(v.count('onSelect')).toBe(1);
    expect(v.seen.find((s) => s.event === 'onSelect').value).toBe('2026-05-02');
    expect(v.count('onPanelChange')).toBeGreaterThan(0);
  });

  it('each change in a row fires its own On select', async () => {
    const v = await mountCalendar({ value: '2026-11-02' });
    await v.pickMonth('Jan');
    fireEvent.click(v.root().querySelector('td[title="2026-01-15"]'));
    await settle();
    expect(v.exposed.value).toBe('2026-01-15');
    expect(v.count('onSelect')).toBe(2);
  });
});
