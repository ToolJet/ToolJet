import toast from 'react-hot-toast';
import useStore from '@/AppBuilder/_stores/store';
import { RIGHT_SIDE_BAR_TAB } from '@/AppBuilder/RightSideBar/rightSidebarConstants';
import { highlightMatch } from './highlightMatch';
import type { RevealStep } from './buildSearchRecords';
import type { SearchMatch } from './searchRecords';

// The App Builder store is untyped JS.
type StoreState = any;

const WAIT_TIMEOUT_MS = 5000;
// How long a reveal step may wait for the editor to open it (its list may still be mounting).
const REVEAL_STEP_TIMEOUT_MS = 1500;
// Edited in the left sidebar's Libraries panel, not Global settings.
const LIBRARY_FIELDS = new Set(['preloadedScript', 'libraries']);

// Resolves true once `isReady(state)` holds, or false after the timeout.
const waitForStore = (isReady: (state: StoreState) => boolean, timeoutMs = WAIT_TIMEOUT_MS) =>
  new Promise<boolean>((resolve) => {
    if (isReady(useStore.getState())) return resolve(true);
    const timer = setTimeout(() => {
      unsubscribe();
      resolve(false);
    }, timeoutMs);
    const unsubscribe = useStore.subscribe((state: StoreState) => {
      if (!isReady(state)) return;
      clearTimeout(timer);
      unsubscribe();
      resolve(true);
    });
  });

// switchPage starts an async switch and returns nothing. Wait for the page id to change, not for
// `pageSwitchInProgress`: that flag clears only after the new page's exposed-value batch flushes,
// which on-load queries can push past any sensible wait, and selection does not need it.
const waitForPage = (pageId: string, moduleId: string) =>
  waitForStore((state) => state.modules[moduleId]?.currentPageId === pageId);

const openRightSidebar = (tab: string) => {
  const { setRightSidebarOpen, setActiveRightSideBarTab } = useStore.getState();
  setRightSidebarOpen(true);
  setActiveRightSideBarTab(tab);
};

const MODAL_TYPES = new Set(['Modal', 'ModalV2']);
const nextFrame = () =>
  new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
// Resolves after the event that started navigation has finished dispatching.
const afterCurrentEvent = () => new Promise<void>((resolve) => setTimeout(resolve));

// Makes a component visible on the canvas: opens every modal it sits in and switches every Tabs
// ancestor to the tab holding it, outermost first. A child's `parent` is the container id, or
// `<tabsId>-<tabId>` inside Tabs.
const revealOnCanvas = async (componentId: string, moduleId: string) => {
  const { getCurrentPageComponents, getAllExposedValues } = useStore.getState();
  const components = getCurrentPageComponents(moduleId);
  const steps: { containerId: string; action: 'open' | 'setTab'; tabId?: string }[] = [];
  const visited = new Set<string>();
  let parent = components?.[componentId]?.component?.parent;
  while (parent && !visited.has(parent)) {
    visited.add(parent);
    const containerId = parent.substring(0, 36);
    const type = components?.[containerId]?.component?.component;
    if (MODAL_TYPES.has(type)) steps.push({ containerId, action: 'open' });
    if (type === 'Tabs') steps.push({ containerId, action: 'setTab', tabId: parent.substring(37) });
    parent = components?.[containerId]?.component?.parent;
  }
  for (const { containerId, action, tabId } of steps.reverse()) {
    // Containers register open() / setTab() when they mount, which on a fresh page is a beat later.
    await waitForStore(() => typeof getAllExposedValues(moduleId)?.components?.[containerId]?.[action] === 'function');
    const exposed = getAllExposedValues(moduleId)?.components?.[containerId];
    if (action === 'open' && !exposed?.show) await exposed?.open?.();
    if (action === 'setTab' && exposed?.currentTab !== tabId) await exposed?.setTab?.(tabId);
    await nextFrame();
  }
};

// Asks the editor to open each step of the record's reveal chain (a list item's popover, a tab, an
// event handler), outermost first, waiting for each to be opened by its useCodeSearchReveal. A step
// nobody opens (its list isn't mounted, or isn't openable) ends the chain and is withdrawn so it
// can't fire later. Returns the opened steps, or `superseded` when a newer search took over.
const runReveal = async (steps: RevealStep[] = []): Promise<{ opened?: RevealStep[]; superseded?: boolean }> => {
  // A result click is an outside click for any popover already open, and its close handler runs on
  // the document after this one: opening the next popover before it would have it closed (and its
  // shared state, such as the page being edited, cleared) right away.
  await afterCurrentEvent();
  const opened: RevealStep[] = [];
  for (const step of steps) {
    const nonce = useStore.getState().requestCodeSearchReveal(step);
    await waitForStore((state) => state.codeSearch.revealRequest?.nonce !== nonce, REVEAL_STEP_TIMEOUT_MS);
    const current = useStore.getState().codeSearch.revealRequest;
    if (current?.nonce === nonce) {
      useStore.getState().consumeCodeSearchReveal(nonce);
      break;
    }
    if (current) return { superseded: true };
    opened.push(step);
  }
  return { opened };
};

// Opens the place a search match came from, then selects the match inside it.
export const navigateToResult = async (match: SearchMatch, moduleId = 'canvas'): Promise<unknown> => {
  const { record } = match;
  const state = useStore.getState();

  if (record.pageId && record.pageId !== state.getCurrentPageId(moduleId)) {
    const page = state.modules[moduleId].pages.find((p: { id: string }) => p.id === record.pageId);
    if (!page) return toast.error('That page no longer exists');
    state.switchPage(page.id, page.handle, [], moduleId);
    if (!(await waitForPage(page.id, moduleId))) return toast.error(`Couldn't open page ${page.name}`);
  }

  const ownerType = record.ownerType || record.entityType;
  const ownerId = record.ownerId || record.entityId;
  const { setSelectedComponents, queryPanel, setSelectedSidebarItem, setCodeSearchReturnToSearch } =
    useStore.getState();

  if (ownerType === 'component') {
    // Opening a modal selects the modal itself, so select the component after revealing it.
    await revealOnCanvas(ownerId, moduleId);
    setSelectedComponents([ownerId]);
    openRightSidebar(RIGHT_SIDE_BAR_TAB.CONFIGURATION);
    document.getElementById(ownerId)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } else if (ownerType === 'query') {
    queryPanel.setSelectedQuery(ownerId, moduleId);
    queryPanel.expandQueryPaneIfNeeded();
  } else if (ownerId === 'pageSettings') {
    // App-wide navigation settings are edited in the right sidebar's Pages panel.
    openRightSidebar(RIGHT_SIDE_BAR_TAB.PAGES);
  } else if (ownerType === 'page') {
    // A page's own fields (hidden, disabled, icon, …) are edited in its details popover, which the
    // reveal chain opens.
    openRightSidebar(RIGHT_SIDE_BAR_TAB.PAGES);
  } else if (
    ownerType === 'app' &&
    LIBRARY_FIELDS.has(record.fieldPath[0]) &&
    useStore.getState().license?.featureAccess?.appJsLibraries
  ) {
    // The preloaded script's editor is a modal the reveal chain opens. Unlicensed, the Libraries
    // panel isn't offered, so these fall through to Global settings below.
    setSelectedSidebarItem('libraries');
  } else if (ownerType === 'app') {
    // Global settings replace this panel in the left sidebar; its header offers the way back, and
    // the search term survives in the store.
    setCodeSearchReturnToSearch(true);
    setSelectedSidebarItem('settings');
  }

  // Tabs put the field on screen. Popovers are flashed, not opened: the result already names the path.
  const TAB_KINDS = new Set<RevealStep['kind']>(['queryTab', 'restTab']);
  const steps = (record.reveal || []).filter((step) => TAB_KINDS.has(step.kind));
  const { opened, superseded } = steps.length ? await runReveal(steps) : { opened: [] };
  if (!superseded) highlightMatch(match, opened);
};
