// Release audit (Codex fixture auditRepeatedTabsChildOwnershipBoundary, trimmed to its two failing families): a Tabs in
// a List view row built its tab and panel ids from the component id alone, which every row shares, so the second
// row's tab controlled the first row's panel (and its panel was named by the first row's tab). Its scroll to top on a
// tab switch looked the canvas up document-wide by id, and reset the first row's canvas whichever row switched. Each
// rendered instance now has its own ids and resets only its own canvas.
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { componentDefinition } from '@/test/app-builder';
import useStore from '@/AppBuilder/_stores/store';
import { act, screen, waitFor } from '@testing-library/react';

const LIST = '11111111-1111-4111-8111-111111111111';
const TABS = '22222222-2222-4222-8222-222222222222';
const RECORDS = [
  { id: 'a', name: 'Alpha' },
  { id: 'b', name: 'Beta' },
];
const json = (value) => `{{${JSON.stringify(value)}}}`;

let descriptor;
beforeAll(() => {
  descriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'clientWidth');
  Object.defineProperty(Element.prototype, 'clientWidth', { configurable: true, get: () => 650 });
});
afterAll(() => {
  if (descriptor) Object.defineProperty(Element.prototype, 'clientWidth', descriptor);
  else delete Element.prototype.clientWidth;
});

const w = createWidgetHarness({
  componentType: 'ShadListView',
  id: LIST,
  handle: 'list1',
  widgetWidth: 850,
  widgetHeight: 700,
  capabilities: { dnd: true },
  preload: ['ShadTabs'],
});
beforeEach(() => w.setup());
afterEach(w.teardown);

const tabsOfRow = (row) => useStore.getState().getExposedValueOfComponent(TABS, 'canvas', row);

/** A List view of `count` records, each row holding the same Tabs (Overview t0, Activity t1). */
const mount = async (count) => {
  const tabs = componentDefinition(TABS, 'tabs1', 'ShadTabs', {
    useDynamicOptions: binding('{{true}}'),
    tabs: binding('{{[{id:"t0",title:listItem.name + " overview"},{id:"t1",title:listItem.name + " activity"}]}}'),
  });
  tabs.component.parent = LIST;
  tabs.component.definition.others = { showOnDesktop: binding('{{true}}'), showOnMobile: binding('{{false}}') };
  tabs.layouts = { desktop: { top: 0, left: 0, width: 30, height: 180 } };
  w.render({
    currentMode: 'view',
    extraComponents: { [TABS]: tabs },
    properties: {
      data: binding(json(RECORDS.slice(0, count))),
      idField: binding('id'),
      enablePagination: binding('{{false}}'),
    },
  });
  await waitFor(() => expect(screen.getAllByRole('tablist')).toHaveLength(count));
};
const setTab = (row, tabId) =>
  act(async () => {
    await tabsOfRow(row).setTab(tabId);
  });

test.each([1, 2])('with %i row(s), the last row tab and panel point at each other', async (count) => {
  await mount(count);
  await setTab(count - 1, 't1');
  const strip = screen.getAllByRole('tablist')[count - 1];
  const tab = strip.querySelector('[aria-selected="true"]');
  const panel = strip.closest('.tj-shadcn').querySelector('[role="tabpanel"][activetab="t1"]');
  expect(tab).toHaveTextContent(count === 1 ? 'Alpha activity' : 'Beta activity');
  expect(panel).toBeVisible();
  expect({
    sameTabIds: screen.getAllByRole('tab').filter((other) => other.id === tab.id).length,
    samePanelIds: screen.getAllByRole('tabpanel', { hidden: true }).filter((other) => other.id === panel.id).length,
    controlsOwnPanel: document.getElementById(tab.getAttribute('aria-controls')) === panel,
    namedByOwnTab: document.getElementById(panel.getAttribute('aria-labelledby')) === tab,
  }).toEqual({ sameTabIds: 1, samePanelIds: 1, controlsOwnPanel: true, namedByOwnTab: true });
});

describe('scroll to top on a tab switch', () => {
  // The Tabs' own animation frames are held and run on deliver(); every other frame runs as usual.
  let pending;
  let raf;
  let cancel;
  beforeEach(() => {
    pending = new Map();
    let next = 1e9;
    const realRaf = window.requestAnimationFrame;
    const realCancel = window.cancelAnimationFrame;
    raf = jest.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      if (!/Tabs\/Tabs\.tsx/.test(new Error().stack || '')) return realRaf(callback);
      pending.set(++next, callback);
      return next;
    });
    cancel = jest.spyOn(window, 'cancelAnimationFrame').mockImplementation((frame) => {
      if (!pending.delete(frame)) realCancel(frame);
    });
  });
  afterEach(() => {
    raf.mockRestore();
    cancel.mockRestore();
  });
  const deliver = () =>
    act(async () => {
      for (const [frame, callback] of [...pending]) {
        pending.delete(frame);
        callback(0);
      }
    });

  test.each([
    [1, false],
    [1, true],
    [2, false],
    [2, true],
  ])('with %i row(s) and the setting %s, only the switched row canvas is reset', async (count, enabled) => {
    await mount(count);
    await act(async () => w.setComponentProperty(TABS, 'scrollToTopOnTabSwitch', `{{${enabled}}}`, 'properties'));
    await deliver();
    // Each row's Activity canvas reports a scrolled position and records what is written to it.
    const writes = screen.getAllByRole('tablist').map((strip) => {
      const canvas = strip.closest('.tj-shadcn').querySelector(`[id="canvas-${TABS}-t1"]`);
      const written = [];
      Object.defineProperty(canvas, 'scrollTop', {
        configurable: true,
        get: () => 80,
        set: (value) => {
          written.push(value);
        },
      });
      return written;
    });
    await setTab(count - 1, 't1');
    await deliver();
    expect(Array.from({ length: count }, (_, row) => tabsOfRow(row).currentTab)).toEqual(
      count === 1 ? ['t1'] : ['t0', 't1']
    );
    expect(writes).toEqual(Array.from({ length: count }, (_, row) => (enabled && row === count - 1 ? [0] : [])));
  });
});
