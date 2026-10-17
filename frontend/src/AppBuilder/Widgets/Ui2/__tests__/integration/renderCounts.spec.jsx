/**
 * Re-renders on a page of every UI 2.0 widget: a change reaches only the widgets that depend on it.
 *
 * Each RenderWidget is wrapped in a React Profiler, which counts the commits its subtree takes part in (the widget, its
 * own children, and any state inside them). Counts, never times. The page is the real store with every widget's
 * registered definition, plus a native TextInput and three widgets bound to two queries.
 */
import { createWidgetHarness, measureChartsAt } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { binding, store, MODULE_ID } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { CONFIGS, TYPES, createPackPage, idOf } from '@/AppBuilder/Widgets/Ui2/__tests__/packPage';

const mockCommits = {};
jest.mock('@/AppBuilder/AppCanvas/RenderWidget', () => {
  const R = jest.requireActual('react');
  const RenderWidget = jest.requireActual('@/AppBuilder/AppCanvas/RenderWidget').default;
  const count = (id) => {
    mockCommits[id] = (mockCommits[id] || 0) + 1;
  };
  // createElement, not JSX: a jest.mock factory cannot reach the file's React import.
  const Counted = (props) =>
    R.createElement(R.Profiler, { id: props.id, onRender: count }, R.createElement(RenderWidget, props));
  return { __esModule: true, default: R.memo(Counted) };
});

measureChartsAt(400, 200);

const NATIVE_INPUT = 'native-input';
// Widgets the first click anywhere on a page re-renders, from code outside this folder. The Dialog is the native
// ModalV2, whose Modal.jsx uses useActiveSlot (AppBuilder/_hooks/useActiveSlot.js): its document click listener sets
// state on every click on the page, in the viewer too, so each ModalV2 re-renders once (later clicks set the same
// value and bail out).
const KNOWN_CLICK = [idOf('ShadDialog')];
const BY_Q1 = ['q1-table', 'q1-select', 'q1-text'];
const BY_Q2 = 'q2-stat';
const ROWS = [
  { id: 1, name: 'Ada' },
  { id: 2, name: 'Grace' },
];

const page = createPackPage(createWidgetHarness, {
  extra: {
    [NATIVE_INPUT]: { componentType: 'TextInput', handle: 'nativeinput1' },
    'q1-table': { componentType: 'ShadTable', handle: 'q1table', properties: { data: binding('{{queries.q1.data}}') } },
    'q1-select': {
      componentType: 'ShadSelect',
      handle: 'q1select',
      properties: { options: binding('{{queries.q1.data.map((r) => r.name)}}') },
    },
    'q1-text': {
      componentType: 'ShadText',
      handle: 'q1text',
      properties: { text: binding('{{queries.q1.data.length}} rows') },
    },
    [BY_Q2]: {
      componentType: 'ShadStat',
      handle: 'q2stat',
      properties: { value: binding('{{queries.q2.data.total}}') },
    },
  },
});

const reset = () => Object.keys(mockCommits).forEach((id) => delete mockCommits[id]);
/** The widgets that committed since the last reset, with their commit counts. */
const rendered = () => Object.fromEntries(Object.entries(mockCommits).filter(([, n]) => n > 0));
const settle = () => act(() => new Promise((r) => setTimeout(r, 50)));
const pause = () => act(() => new Promise((r) => setTimeout(r, 100)));
/** Waits until two 100 ms windows in a row pass with no commit (mount-time effects done). */
const quiet = async () => {
  let still = 0;
  for (let i = 0; i < 100 && still < 2; i += 1) {
    reset();
    await pause();
    still = Object.keys(rendered()).length ? 0 : still + 1;
  }
  if (still < 2) throw new Error(`the page never came to rest: ${JSON.stringify(rendered())}`);
  reset();
};
// Charts draw at once: an entrance animation commits on its own frames, which under load land in a measured window.
const STILL_CHARTS = Object.fromEntries(
  TYPES.filter((type) => 'animate' in (CONFIGS[type].properties || {})).map((type) => [
    idOf(type),
    { animate: binding('{{false}}') },
  ])
);
const inputOf = (id) => page.elementOf(id)?.querySelector('input');

describe('UI 2.0 re-renders on a page of every widget', () => {
  // The first setup loads all 80 widgets' modules (on a cold cache, a transform each: over jest's 5 s hook limit);
  // later setups find them loaded. A test's own setup renders the page and waits for it to come to rest.
  beforeAll(() => page.harness.setup(), 120000);
  beforeEach(async () => {
    await page.harness.setup();
    store().dataQuery.setQueries(
      [
        { id: 'q1', name: 'q1', kind: 'runjs', options: {} },
        { id: 'q2', name: 'q2', kind: 'runjs', options: {} },
      ],
      MODULE_ID
    );
    store().setQueryMapping(MODULE_ID);
    store().setResolvedQuery('q1', { data: ROWS, isLoading: false }, MODULE_ID);
    store().setResolvedQuery('q2', { data: { total: 7 }, isLoading: false }, MODULE_ID);
    page.render(STILL_CHARTS);
    await quiet();
  }, 30000);
  afterEach(page.harness.teardown);

  test('[Ui2Page-RND-001] the page is still at rest: nothing re-renders without input', async () => {
    expect(page.ids.length).toBeGreaterThan(75);
    await settle();
    expect(rendered()).toEqual({});
  });

  test('[Ui2Page-RND-002] typing in one UI 2.0 input re-renders only that input', async () => {
    const target = idOf('ShadInput');
    const user = userEvent.setup({ delay: null });
    await user.click(inputOf(target));
    await quiet();
    await user.keyboard('hello');
    await settle();

    expect(inputOf(target)).toHaveValue('hello');
    expect(store().getExposedValueOfComponent(target, MODULE_ID).value).toBe('hello');
    expect(Object.keys(rendered())).toEqual([target]);
    // One commit per key (the box's own state) and one for each exposed value written back, at most.
    expect(rendered()[target]).toBeLessThanOrEqual(2 * 'hello'.length);
  });

  test('[Ui2Page-RND-003] typing in a native input re-renders no UI 2.0 widget', async () => {
    const user = userEvent.setup({ delay: null });
    await user.click(inputOf(NATIVE_INPUT));
    await quiet();
    await user.keyboard('hello');
    await settle();

    expect(store().getExposedValueOfComponent(NATIVE_INPUT, MODULE_ID).value).toBe('hello');
    expect(Object.keys(rendered())).toEqual([NATIVE_INPUT]);
  });

  test('[Ui2Page-RND-006] a click re-renders only the clicked widget, and the KNOWN native exceptions', async () => {
    const user = userEvent.setup({ delay: null });
    await user.click(inputOf(NATIVE_INPUT));
    await settle();

    const others = Object.keys(rendered()).filter((id) => id !== NATIVE_INPUT);
    expect(others.filter((id) => !KNOWN_CLICK.includes(id))).toEqual([]);
    // Each KNOWN entry still reproduces; delete it once the native code is fixed.
    expect(others.sort()).toEqual([...KNOWN_CLICK].sort());
  });

  test('[Ui2Page-RND-004] new data from one query re-renders only the widgets bound to it', async () => {
    await act(async () => {
      store().setResolvedQuery('q1', { data: [...ROWS, { id: 3, name: 'Linus' }], isLoading: false }, MODULE_ID);
    });
    await settle();
    await waitFor(() => expect(document.body.textContent).toContain('3 rows'));

    expect(Object.keys(rendered()).sort()).toEqual([...BY_Q1].sort());
  });

  test('[Ui2Page-RND-005] the same data again from a query re-renders nothing', async () => {
    await act(async () => {
      store().setResolvedQuery('q2', { data: { total: 7 }, isLoading: false }, MODULE_ID);
    });
    await settle();

    expect(rendered()).toEqual({});
  });
});
