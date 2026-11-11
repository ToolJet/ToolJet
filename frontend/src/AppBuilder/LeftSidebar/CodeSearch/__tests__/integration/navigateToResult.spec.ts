/**
 * Where a code search result lands: the store state navigateToResult leaves behind for each kind of
 * result — the place it opens, the tabs it asks for, and the focus request the field's editor takes.
 *
 * Real composed store. Only `react-hot-toast` is stubbed: it is the external boundary navigation
 * reports failures through. Fake timers drive switchPage's macrotask hops and the reveal/focus waits.
 */
import useStore from '@/AppBuilder/_stores/store';
import { RIGHT_SIDE_BAR_TAB } from '@/AppBuilder/RightSideBar/rightSidebarConstants';
import { componentDefinition, binding } from '@/test/app-builder';
import { navigateToResult } from '../../navigateToResult';
import type { RevealStep, SearchRecord } from '../../buildSearchRecords';
import type { FocusRequest, RevealRequest } from '@/AppBuilder/_stores/slices/codeSearchSlice';

jest.mock('react-hot-toast', () => {
  const toast = Object.assign(jest.fn(), {} as Record<string, jest.Mock>);
  toast.success = jest.fn();
  toast.error = jest.fn();
  toast.loading = jest.fn();
  toast.dismiss = jest.fn();
  toast.custom = jest.fn();
  return { __esModule: true, default: toast, toast };
});
import toast from 'react-hot-toast';

const state = () => useStore.getState();

// Fixture helpers take the untyped component definitions @/test/app-builder builds.
const insideModal = (definition: any, modalId: string) => ({
  ...definition,
  component: { ...definition.component, parent: modalId },
});

const PAGES = () => [
  {
    id: 'page-a',
    handle: 'a',
    name: 'A',
    components: {
      m1: componentDefinition('m1', 'modal1', 'ModalV2'),
      t1: componentDefinition('t1', 'table1', 'Table'),
      c3: insideModal(componentDefinition('c3', 'text3', 'Text', { text: binding('inside') }), 'm1'),
    },
  },
  {
    id: 'page-b',
    handle: 'b',
    name: 'B',
    components: { c2: componentDefinition('c2', 'text2', 'Text', { text: binding('hello') }) },
  },
];

// Same order useAppData leaves the store in after an app load (see pageSwitch.spec.js).
function seedApp() {
  const s = state();
  s.initializeDependencySlice('canvas');
  s.setPages(PAGES(), 'canvas');
  s.setCurrentPageId('page-a', 'canvas');
  s.setComponentNameIdMapping('canvas');
  s.initDependencyGraph('canvas');
  s.setApp({ appId: 'app-1', appName: 'Test app', homePageId: 'page-a', slug: 'test-app' }, 'canvas');
  s.dataQuery.setQueries([{ id: 'q1', name: 'query1', kind: 'restapi', options: {} }], 'canvas');
}

// Lets navigateToResult run to completion, including any page switch it starts and any reveal or
// focus request nobody takes. Fixtures carry only the fields navigation reads.
async function go(record: Partial<SearchRecord>, { hops = 5, start = 0, end = 1 } = {}) {
  let settled = false;
  const done = navigateToResult({ record: record as SearchRecord, start, end, occurrence: 0 }).finally(() => {
    settled = true;
  });
  // 16ms per hop: page switches yield on setTimeout(0), modal reveal waits on animation frames.
  for (let i = 0; i < hops || (!settled && i < 500); i++) await jest.advanceTimersByTimeAsync(16);
  await done;
}

// Stands in for the editors that open reveal steps (useCodeSearchReveal): records every request and
// opens the ones whose kind is in `opens`.
function revealSpy(opens: RevealStep['kind'][] = []) {
  const requested: RevealRequest[] = [];
  const unsubscribe = useStore.subscribe((s: any) => {
    const request: RevealRequest | null = s.codeSearch.revealRequest;
    if (!request || requested[requested.length - 1]?.nonce === request.nonce) return;
    requested.push(request);
    if (opens.includes(request.kind)) s.consumeCodeSearchReveal(request.nonce);
  });
  return { steps: () => requested.map(({ kind, ownerId, itemId }) => ({ kind, ownerId, itemId })), unsubscribe };
}

// Stands in for the code editor that holds the field (codeSearchHighlight): records every focus
// request and takes it.
function focusSpy() {
  const requested: FocusRequest[] = [];
  const unsubscribe = useStore.subscribe((s: any) => {
    const request: FocusRequest | null = s.codeSearch.focusRequest;
    if (!request || requested[requested.length - 1]?.nonce === request.nonce) return;
    requested.push(request);
    s.consumeCodeSearchFocus(request.nonce);
  });
  return { requests: () => requested.map(({ nonce: _nonce, ...target }) => target), unsubscribe };
}

const inspectorTab = (ownerId: string, itemId: string): RevealStep => ({ kind: 'inspectorTab', ownerId, itemId });

beforeEach(() => {
  jest.useFakeTimers();
  seedApp();
});

afterEach(() => {
  while (state().isExposedValueBatching()) state().flushExposedValueBatch();
  jest.clearAllTimers();
  jest.useRealTimers();
});

describe('navigateToResult', () => {
  test('a component on another page switches to that page and selects it', async () => {
    await go({ entityType: 'component', entityId: 'c2', pageId: 'page-b', fieldPath: ['properties', 'text'] });

    expect(state().getCurrentPageId('canvas')).toBe('page-b');
    expect(state().selectedComponents).toEqual(['c2']);
    expect(toast.error).not.toHaveBeenCalled();
  });

  test('a component inside a modal opens the modal, then selects the component', async () => {
    const open = jest.fn();
    state().setExposedValue('m1', 'open', open);
    state().flushImplicitBatchEntries();

    await go({ entityType: 'component', entityId: 'c3', pageId: 'page-a', fieldPath: ['properties', 'text'] });

    expect(open).toHaveBeenCalledTimes(1);
    expect(state().selectedComponents).toEqual(['c3']);
  });

  test('does not open a column popover or an event handler', async () => {
    const spy = revealSpy(['listItem', 'event']);
    const column: RevealStep = { kind: 'listItem', ownerId: 't1', itemId: 'col-email' };
    const handler: RevealStep = { kind: 'event', ownerId: 't1', itemId: 'ev-1' };

    await go({
      entityType: 'event',
      ownerType: 'component',
      ownerId: 't1',
      entityId: 't1',
      pageId: 'page-a',
      fieldPath: ['event', 'message'],
      reveal: [column, handler],
    });
    spy.unsubscribe();

    expect(state().selectedComponents).toEqual(['t1']);
    expect(spy.steps()).toEqual([inspectorTab('t1', 'properties')]);
    expect(state().codeSearch.revealRequest).toBeNull();
  });

  test('an event match flashes the handler card, not an opened popover', async () => {
    const card = document.createElement('div');
    card.dataset.eventId = 'ev-1';
    document.body.appendChild(card);
    jest.spyOn(Element.prototype, 'getClientRects').mockImplementation(() => [{}] as unknown as DOMRectList);
    const tabs = revealSpy(['inspectorTab']);

    await go(
      {
        entityType: 'event',
        ownerType: 'component',
        ownerId: 't1',
        entityId: 't1',
        eventId: 'ev-1',
        pageId: 'page-a',
        fieldPath: ['event', 'message'],
        text: 'Saved',
        reveal: [{ kind: 'event', ownerId: 't1', itemId: 'ev-1' }],
      },
      { hops: 80 }
    );

    tabs.unsubscribe();
    expect(card.classList.contains('tj-code-search-flash')).toBe(true);
    jest.restoreAllMocks();
    card.remove();
  });

  test('a column field does not ask any popover to open', async () => {
    const spy = revealSpy(['inspectorTab']);

    await go({
      entityType: 'component',
      entityId: 't1',
      pageId: 'page-a',
      fieldPath: ['properties', 'columns', 'value', '0', 'name'],
      reveal: [
        { kind: 'listItem', ownerId: 't1', itemId: 'col-email' },
        { kind: 'popoverTab', ownerId: 'col-email', itemId: 'styles' },
      ],
    });
    spy.unsubscribe();

    expect(spy.steps()).toEqual([inspectorTab('t1', 'properties')]);
    expect(state().codeSearch.revealRequest).toBeNull();
    expect(state().codeSearch.focusRequest).toBeNull();
  });

  test("a component field opens its Inspector tab, then asks the field's editor to select the match", async () => {
    const tabs = revealSpy(['inspectorTab']);
    const focus = focusSpy();

    await go(
      {
        entityType: 'component',
        entityId: 't1',
        pageId: 'page-a',
        fieldPath: ['styles', 'textColor'],
        text: 'var(--text)',
      },
      { start: 4, end: 8 }
    );
    tabs.unsubscribe();
    focus.unsubscribe();

    expect(tabs.steps()).toEqual([inspectorTab('t1', 'styles')]);
    expect(focus.requests()).toEqual([
      {
        scope: '.editor-sidebar .inspector',
        keys: ['textColor'],
        inOpenedTab: false,
        text: 'var(--text)',
        start: 4,
        end: 8,
      },
    ]);
  });

  test('a field no editor takes lands on its own tagged row', async () => {
    document.body.innerHTML = `
      <div class="editor-sidebar"><div class="inspector">
        <div data-param="name"><input type="text" value="table1" /></div>
      </div></div>`;
    jest.spyOn(Element.prototype, 'getClientRects').mockImplementation(() => [{}] as unknown as DOMRectList);
    Element.prototype.scrollIntoView = jest.fn();
    const tabs = revealSpy(['inspectorTab']);

    await go({ entityType: 'component', entityId: 't1', pageId: 'page-a', fieldPath: ['name'], text: 'table1' });
    tabs.unsubscribe();

    expect(document.querySelector('[data-param="name"]')?.classList.contains('tj-code-search-flash')).toBe(true);
    expect(state().codeSearch.focusRequest).toBeNull();
    jest.restoreAllMocks();
    document.body.innerHTML = '';
  });

  test('a request-tab field is looked for inside that opened tab only', async () => {
    const tabs = revealSpy(['queryTab', 'restTab']);
    const focus = focusSpy();

    await go({
      entityType: 'query',
      entityId: 'q1',
      pageId: null,
      fieldPath: ['options', 'headers', '0', 'value'],
      text: 'Bearer x',
      reveal: [
        { kind: 'queryTab', ownerId: 'q1', itemId: 'setup' },
        { kind: 'restTab', ownerId: 'q1', itemId: 'headers' },
      ],
    });
    tabs.unsubscribe();
    focus.unsubscribe();

    expect(focus.requests()).toMatchObject([
      {
        scope: '[data-reveal-root="restTab:headers"]',
        keys: ['options', 'headers', '0', 'value'],
        inOpenedTab: true,
      },
    ]);
  });

  test('a query result selects the query', async () => {
    await go({ entityType: 'query', entityId: 'q1', pageId: null, fieldPath: ['options', 'url'] });

    expect(state().queryPanel.selectedQuery?.id).toBe('q1');
  });

  test('a query tab is still opened so the field can be flashed', async () => {
    const done = navigateToResult({
      record: {
        entityType: 'query',
        entityId: 'q1',
        pageId: null,
        fieldPath: ['options', 'url'],
        text: 'a',
        reveal: [{ kind: 'queryTab', ownerId: 'q1', itemId: 'setup' }],
      } as SearchRecord,
      start: 0,
      end: 1,
      occurrence: 0,
    });
    await Promise.resolve();
    await Promise.resolve();
    expect(state().codeSearch.revealRequest).toBeNull();

    await jest.advanceTimersByTimeAsync(0);
    expect(state().codeSearch.revealRequest).toMatchObject({
      kind: 'queryTab',
      itemId: 'setup',
    });
    await jest.advanceTimersByTimeAsync(3000);
    await done;
  });

  test('a page property opens the Pages panel and does not open the page details popover', async () => {
    const spy = revealSpy(['page']);
    const page: RevealStep = { kind: 'page', ownerId: null, itemId: 'page-a' };

    await go({ entityType: 'page', entityId: 'page-a', pageId: 'page-a', fieldPath: ['hidden'], reveal: [page] });
    spy.unsubscribe();

    expect(state().activeRightSideBarTab).toBe(RIGHT_SIDE_BAR_TAB.PAGES);
    expect(state().isRightSidebarOpen).toBe(true);
    expect(spy.steps()).toEqual([]);
  });

  test('an app setting opens Global settings with a way back to search', async () => {
    await go({ entityType: 'app', entityId: 'app', pageId: null, fieldPath: ['canvasBackgroundColor'] });

    expect(state().selectedSidebarItem).toBe('settings');
    expect(state().codeSearch.returnToSearch).toBe(true);
  });

  // License is an edition boundary; set it the way widgetHarness.setLicenseFeatures does.
  const licenseLibraries = (enabled: boolean) =>
    useStore.setState((s: any) => ({ license: { ...s.license, featureAccess: { appJsLibraries: enabled } } }));
  const preloadedScript: Partial<SearchRecord> = {
    entityType: 'app',
    entityId: 'app',
    pageId: null,
    fieldPath: ['preloadedScript', 'javascript'],
    reveal: [{ kind: 'preloadedScript', ownerId: null, itemId: 'javascript' }],
  };

  test('preloaded scripts open the Libraries panel and do not open the editor modal', async () => {
    licenseLibraries(true);
    const spy = revealSpy(['preloadedScript']);

    await go(preloadedScript);
    spy.unsubscribe();

    expect(state().selectedSidebarItem).toBe('libraries');
    expect(spy.steps()).toEqual([]);
  });

  test('without the libraries license they fall back to Global settings, never a hidden panel', async () => {
    licenseLibraries(false);

    await go(preloadedScript, { hops: 120 });

    expect(state().selectedSidebarItem).toBe('settings');
    expect(state().codeSearch.returnToSearch).toBe(true);
    expect(state().codeSearch.revealRequest).toBeNull();
  });
});
