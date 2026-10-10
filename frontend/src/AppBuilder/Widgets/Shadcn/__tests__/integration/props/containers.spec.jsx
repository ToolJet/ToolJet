import { act } from '@testing-library/react';
import useStore from '@/AppBuilder/_stores/store';
import { componentDefinition } from '@/test/app-builder';
import { createWidgetHarness } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { CONFIGS, crashed, installGuards, takeErrors } from './harness';

// Pack containers with real child widgets, through the real store: the class the fuzz (which stubs sub-canvases)
// missed, and that crashed a whole app (a Kanban with custom card content whose data loaded after first render).
installGuards();

// jsdom has no layout. The board and the list mount a card's or row's canvas once they have measured a width, and
// ModalV2 portals into the page's canvas area, which the app builder page always provides.
let restoreWidth;
beforeAll(() => {
  const descriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'clientWidth');
  Object.defineProperty(Element.prototype, 'clientWidth', { configurable: true, get: () => 600 });
  restoreWidth = () => Object.defineProperty(Element.prototype, 'clientWidth', descriptor);
});
afterAll(() => restoreWidth?.());
beforeEach(() => {
  const host = document.createElement('div');
  host.className = 'canvas-content';
  host.innerHTML = '<div class="tj-canvas-area real-canvas"></div>';
  document.body.appendChild(host);
});
afterEach(() => document.querySelectorAll('.canvas-content').forEach((n) => n.remove()));

const ROWS = [
  { id: 1, title: 'Alpha task', status: 'todo', name: 'Alpha' },
  { id: 2, title: 'Beta task', status: 'done', name: 'Beta' },
  { id: 3, title: 'Gamma task', status: 'todo', name: 'Gamma' },
];
const fx = (v) => `{{${JSON.stringify(v)}}}`;
const settle = (ms = 40) =>
  act(async () => {
    await new Promise((r) => setTimeout(r, ms));
  });

const childOf = (parent, id, text) => {
  const child = componentDefinition(id, id, 'ShadText', { text: { value: text } });
  child.component.parent = parent;
  child.component.definition.others = { showOnDesktop: { value: '{{true}}' }, showOnMobile: { value: '{{false}}' } };
  child.layouts = { desktop: { top: 0, left: 0, width: 20, height: 30 } };
  return child;
};

const mount = async (type, properties, extraComponents) => {
  const harness = createWidgetHarness({
    componentType: type,
    handle: 'w1',
    id: 'w1',
    capabilities: { dnd: true },
    widgetHeight: 500,
    widgetWidth: 900,
  });
  harness.setup();
  const def = CONFIGS[type].definition;
  const wrap = (entries) => Object.fromEntries(Object.entries(entries).map(([k, v]) => [k, { value: v }]));
  let view;
  await act(async () => {
    view = harness.render({
      properties: { ...def.properties, ...wrap(properties) },
      styles: { ...def.styles },
      extraComponents,
      currentMode: 'view',
    });
  });
  await settle();
  const change = async (key, value) => {
    await act(async () => harness.setComponentProperty('w1', key, value, 'properties', 'value'));
    await settle();
  };
  const action = async (name, ...args) => {
    await act(async () => {
      await useStore
        .getState()
        .getExposedValueOfComponent('w1', 'canvas')
        ?.[name]?.(...args);
    });
    await settle();
  };
  return {
    harness,
    change,
    action,
    text: () => document.body.textContent,
    async unmount() {
      await act(async () => view?.unmount?.());
      harness.teardown();
    },
  };
};
const healthy = () => {
  expect(crashed()).toBe(false);
  expect(takeErrors()).toEqual([]);
};

describe('Kanban with custom card content', () => {
  const props = { cardLayout: 'custom', columns: fx(['todo', 'done']), cardHeight: '{{60}}' };
  const kids = () => ({ cardText: childOf('w1', 'cardText', '{{cardData.title}}') });

  it('renders each card from data present at mount', async () => {
    const k = await mount('ShadKanban', { ...props, data: fx(ROWS) }, kids());
    healthy();
    expect(k.text()).toContain('Alpha task');
    expect(k.text()).toContain('Gamma task');
    await k.unmount();
  });

  it('renders cards whose data arrives after the first render, then follows changes and actions', async () => {
    const k = await mount('ShadKanban', { ...props, data: fx([]) }, kids());
    healthy();
    await k.change('data', fx(ROWS));
    healthy();
    expect(k.text()).toContain('Beta task');
    await k.change('data', fx([...ROWS, { id: 4, title: 'Delta task', status: 'done' }]));
    expect(k.text()).toContain('Delta task');
    await k.action('moveCard', 1, 'done');
    await k.action('addCard', { title: 'Added task', status: 'todo' });
    await k.action('updateCard', 2, { title: 'Renamed task' });
    await k.action('deleteCard', 3);
    healthy();
    expect(k.text()).toContain('Added task');
    expect(k.text()).toContain('Renamed task');
    expect(k.text()).not.toContain('Gamma task');
    await k.change('data', fx([]));
    await k.change('data', fx(ROWS));
    healthy();
    expect(k.text()).toContain('Alpha task');
    await k.unmount();
  });

  it('survives switching between fields and custom content, and loading while it has cards', async () => {
    const k = await mount('ShadKanban', { ...props, data: fx(ROWS) }, kids());
    await k.change('cardLayout', 'fields');
    await k.change('cardLayout', 'custom');
    await k.change('loadingState', '{{true}}');
    await k.change('loadingState', '{{false}}');
    healthy();
    expect(k.text()).toContain('Alpha task');
    await k.unmount();
  });
});

describe('List view with a row component', () => {
  const kids = () => ({ rowText: childOf('w1', 'rowText', '{{listItem.name}}') });

  it('renders rows from data that arrives after the first render, then pages and changes', async () => {
    const l = await mount('ShadListView', { data: fx([]) }, kids());
    healthy();
    await l.change('data', fx(ROWS));
    healthy();
    expect(l.text()).toContain('Alpha');
    expect(l.text()).toContain('Gamma');
    await l.change('enablePagination', '{{true}}');
    await l.change('rowsPerPage', '{{1}}');
    await l.action('setPage', 2);
    healthy();
    expect(l.text()).toContain('Beta');
    await l.change('data', fx([{ id: 9, name: 'Zeta' }]));
    healthy();
    expect(l.text()).toContain('Zeta');
    await l.action('selectItem', 9);
    await l.action('clearSelection');
    await l.change('loadingState', '{{true}}');
    await l.change('loadingState', '{{false}}');
    healthy();
    await l.unmount();
  });
});

describe('Tabs with a component in each tab', () => {
  it('switches tabs and keeps their components, through actions and property changes', async () => {
    const tabItems = [
      { id: 't0', title: 'Profile' },
      { id: 't1', title: 'Billing' },
    ];
    const t = await mount(
      'ShadTabs',
      { tabItems: fx(tabItems), defaultTab: 't0' },
      {
        inTab0: childOf('w1-t0', 'inTab0', 'Profile content'),
        inTab1: childOf('w1-t1', 'inTab1', 'Billing content'),
      }
    );
    healthy();
    expect(t.text()).toContain('Profile content');
    await t.action('setTab', 't1');
    healthy();
    expect(t.text()).toContain('Billing content');
    await t.change('tabItems', fx([...tabItems, { id: 't2', title: 'Team' }]));
    await t.action('setTab', 't2');
    await t.change('tabItems', fx(tabItems.slice(0, 1)));
    healthy();
    await t.unmount();
  });
});

describe('Tabs scroll to top on tab switch', () => {
  it('scrolls the new tab canvas to its top when on, and leaves it when off', async () => {
    const tabItems = [
      { id: 't0', title: 'Profile' },
      { id: 't1', title: 'Billing' },
    ];
    for (const on of [true, false]) {
      const t = await mount(
        'ShadTabs',
        { tabItems: fx(tabItems), defaultTab: 't0', scrollToTopOnTabSwitch: `{{${on}}}` },
        {
          inTab0: childOf('w1-t0', 'inTab0', 'Profile content'),
          inTab1: childOf('w1-t1', 'inTab1', 'Billing content'),
        }
      );
      const canvas = document.getElementById('canvas-w1-t1');
      expect(canvas).toBeTruthy();
      const writes = [];
      Object.defineProperty(canvas, 'scrollTop', {
        configurable: true,
        get: () => 80,
        set: (v) => {
          writes.push(v);
        },
      });
      await t.action('setTab', 't1');
      await settle(60);
      expect(writes).toEqual(on ? [0] : []);
      healthy();
      await t.unmount();
    }
  });
});

describe('Dialog with a body component', () => {
  it('opens, closes and reopens through its actions with its body component', async () => {
    const d = await mount(
      'ShadDialog',
      { useDefaultButton: '{{false}}' },
      { inBody: childOf('w1', 'inBody', 'Dialog body text') }
    );
    healthy();
    await d.action('open');
    healthy();
    expect(d.text()).toContain('Dialog body text');
    await d.action('close');
    await d.action('open');
    healthy();
    await d.unmount();
  });
});
