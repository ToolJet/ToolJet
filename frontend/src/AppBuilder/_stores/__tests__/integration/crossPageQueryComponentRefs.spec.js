/**
 * Queries are app-scoped; component ids are page-scoped. Query options persist
 * component references as page-absolute ids (`{{components.<uuid>.value}}`, written by
 * `replaceQueryOptionsEntityReferencesWithIds`), while `componentNameIdMapping` and
 * `exposedValues.components` are wiped and rebuilt for the current page on every switch.
 *
 * So the reported bug: copy a component from page A to page B (paste mints a fresh uuid and
 * rewrites nothing), then run the same query on page B. The option still names page A's id,
 * page B's resolved store has never heard of it, and the reference resolves to `undefined`.
 * With `runOnDependencyChange` on it is worse than undefined — the dependency edge is
 * registered against an id nothing on page B ever writes to, so the query never re-runs at
 * all and the toggle looks broken rather than wrong.
 *
 * The fix rebinds a foreign component id onto the current page's component of the same NAME
 * AND TYPE (`getComponentResolutionMapping`), at the two places that matter: resolution and
 * dependency registration. Name alone is deliberately not enough — an unrelated same-named
 * widget on another page must not capture the reference.
 *
 * NO MOCKS of App Builder code; only `react-hot-toast`, which `switchPage`'s re-entrancy
 * guard reports through. Ids are real uuids on purpose: `preprocessExpression` only takes the
 * `__UUID_PLACEHOLDER_` path for uuid-shaped ids, and that is the path production hits.
 *
 * PAGE SWITCHING — read before editing: most tests below drive the switch with
 * `switchToPage()`, the synchronous body of `doSwitch` (appSlice.js:299-303), because the real
 * `switchPage` is fire-and-forget across two macrotask hops and does not compose with the fake
 * timers the debounce test needs. One test at the bottom drives the real `switchPage` to prove
 * the synchronous stand-in has not drifted from it.
 */
import useStore from '@/AppBuilder/_stores/store';
import { componentDefinition } from '@/test/app-builder';

jest.mock('react-hot-toast', () => {
  const toast = jest.fn();
  toast.success = jest.fn();
  toast.error = jest.fn();
  toast.loading = jest.fn();
  toast.dismiss = jest.fn();
  toast.custom = jest.fn();
  return { __esModule: true, default: toast, toast };
});

const state = () => useStore.getState();

// Page A's textinput1, and the page B copy a paste would produce: same name, same type,
// different id. The third is the trap — same name, different type.
const A_INPUT = '11111111-1111-1111-1111-111111111111';
const B_INPUT = '22222222-2222-2222-2222-222222222222';
const B_WRONG_TYPE = '33333333-3333-3333-3333-333333333333';

/** What `updateDataQuery` persists after name->id conversion on page A. */
const QUERY = (overrides = {}) => ({
  id: 'q1',
  name: 'query1',
  kind: 'restapi',
  options: { url: `{{components.${A_INPUT}.value}}`, runOnDependencyChange: true, ...overrides },
});

const PAGES = (pageBComponents) => [
  {
    id: 'page-a',
    handle: 'a',
    name: 'A',
    components: { [A_INPUT]: componentDefinition(A_INPUT, 'textinput1', 'TextInput') },
  },
  { id: 'page-b', handle: 'b', name: 'B', components: pageBComponents },
];

const PASTED_COPY = { [B_INPUT]: componentDefinition(B_INPUT, 'textinput1', 'TextInput') };

/** Store state as useAppData leaves it after a load: two pages, page-a current, query registered. */
function seedTwoPages(pageBComponents = PASTED_COPY, query = QUERY()) {
  const s = useStore.getState();
  s.initializeDependencySlice('canvas');
  s.setPages(PAGES(pageBComponents), 'canvas');
  s.setCurrentPageId('page-a', 'canvas');
  s.setComponentNameIdMapping('canvas');
  s.dataQuery.setQueries([query], 'canvas');
  s.setQueryMapping('canvas');
  s.initDependencyGraph('canvas');
  s.setApp({ appId: 'app-1', appName: 'Test app', homePageId: 'page-a', slug: 'slug-1' }, 'canvas');
  return query;
}

/** The synchronous core of doSwitch — see the header for why not `switchPage`. */
function switchToPage(pageId) {
  const s = useStore.getState();
  s.cleanUpStore(true);
  s.setCurrentPageId(pageId, 'canvas');
  s.setComponentNameIdMapping('canvas');
  s.setQueryMapping('canvas');
  s.initDependencyGraph('canvas');
}

const optionsDependents = () =>
  state().dependencyGraph.modules.canvas.graph.getDirectDependents('queries.q1.__options__') || [];

/** True once runQuery has actually entered execution (queryPanelSlice writes this synchronously). */
const didRun = (queryId = 'q1') =>
  state().resolvedStore.modules.canvas.exposedValues.queries?.[queryId]?.isLoading === true;

afterEach(() => {
  // switchPage opens an exposed-value bracket nothing on the happy path closes, and `_depth`
  // is closure state the zustand reset cannot reach.
  while (state().isExposedValueBatching()) state().flushExposedValueBatch();
});

describe('an app-scoped query referencing a component copied to another page', () => {
  test('resolves against the page it is run from, not the page it was authored on', () => {
    seedTwoPages();

    state().setExposedValue(A_INPUT, 'value', 'typed on page A');
    expect(state().getResolvedValue(QUERY().options.url)).toBe('typed on page A');

    switchToPage('page-b');
    state().setExposedValue(B_INPUT, 'value', 'typed on page B');

    // The stored option still names page A's id. Before the fix this was `undefined`.
    expect(state().getResolvedValue(QUERY().options.url)).toBe('typed on page B');
  });

  test('registers its dependency edge against the current page component', () => {
    seedTwoPages();
    expect(optionsDependents()).toContain(`components.${A_INPUT}.value`);

    switchToPage('page-b');

    // The edge must MOVE. An edge left on page A's id is one nothing on page B ever writes
    // to, which is the silent half of this bug.
    expect(optionsDependents()).toContain(`components.${B_INPUT}.value`);
    expect(optionsDependents()).not.toContain(`components.${A_INPUT}.value`);
  });

  test('re-runs on dependency change on the page it was copied to', () => {
    jest.useFakeTimers();
    try {
      seedTwoPages();
      switchToPage('page-b');

      state().setExposedValue(B_INPUT, 'value', 'typed on page B');
      state().flushImplicitBatchEntries();
      expect(didRun()).toBe(false); // still inside the 500ms debounce

      jest.advanceTimersByTime(500);
      expect(didRun()).toBe(true);
    } finally {
      jest.useRealTimers();
    }
  });

  test('still resolves on its original page', () => {
    seedTwoPages();
    switchToPage('page-b');
    switchToPage('page-a');

    state().setExposedValue(A_INPUT, 'value', 'back on page A');

    // The rebind is read-side only, so going back must be lossless — the whole point of not
    // rewriting the stored option.
    expect(state().getResolvedValue(QUERY().options.url)).toBe('back on page A');
    expect(optionsDependents()).toContain(`components.${A_INPUT}.value`);
  });
});

describe('what the rebind deliberately refuses to do', () => {
  // An unresolvable reference resolves to '' rather than undefined — that is the resolver's
  // existing convention (`resolveDynamicValues`), and it is exactly the pre-fix symptom. These
  // tests assert the reference stays unresolved AND that no rebind entry was minted, which is
  // sharper than the empty string alone.
  test('does not capture a same-named component of a different type', () => {
    seedTwoPages({ [B_WRONG_TYPE]: componentDefinition(B_WRONG_TYPE, 'textinput1', 'Text') });

    switchToPage('page-b');
    state().setExposedValue(B_WRONG_TYPE, 'text', 'unrelated widget');

    expect(state().getComponentResolutionMapping('canvas')).not.toHaveProperty(A_INPUT);
    expect(state().getResolvedValue(QUERY().options.url)).toBe('');
    expect(optionsDependents()).not.toContain(`components.${B_WRONG_TYPE}.value`);
  });

  test('does nothing when the target page has no component by that name', () => {
    seedTwoPages({});

    switchToPage('page-b');

    expect(state().getComponentResolutionMapping('canvas')).not.toHaveProperty(A_INPUT);
    expect(state().getResolvedValue(QUERY().options.url)).toBe('');
  });

  test('leaves the raw name->id mapping clean, so saving from page B cannot rewrite the query', () => {
    seedTwoPages();
    switchToPage('page-b');

    // `updateDataQuery` writes through `getComponentNameIdMapping`. If a foreign id leaked in
    // there, re-saving the query from page B would persist page B's id and break page A.
    expect(state().getComponentNameIdMapping('canvas')).not.toHaveProperty(A_INPUT);
    expect(state().getComponentResolutionMapping('canvas')).toHaveProperty(A_INPUT, B_INPUT);
  });
});

describe('the real switchPage', () => {
  test('produces the same rebind as the synchronous stand-in these tests use', async () => {
    seedTwoPages();

    state().switchPage('page-b', 'b');
    for (let i = 0; i < 3; i++) await new Promise((resolve) => setTimeout(resolve, 0));

    expect(state().getCurrentPageId('canvas')).toBe('page-b');
    expect(optionsDependents()).toContain(`components.${B_INPUT}.value`);

    // switchPage ends by OPENING an exposed-value bracket (appSlice.js:353) that nothing on the
    // happy path closes, so this write is buffered until the bracket is drained.
    state().setExposedValue(B_INPUT, 'value', 'typed on page B');
    while (state().isExposedValueBatching()) state().flushExposedValueBatch();

    expect(state().getResolvedValue(QUERY().options.url)).toBe('typed on page B');
  });
});
