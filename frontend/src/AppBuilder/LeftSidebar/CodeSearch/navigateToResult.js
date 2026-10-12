import toast from 'react-hot-toast';
import useStore from '@/AppBuilder/_stores/store';
import { RIGHT_SIDE_BAR_TAB } from '@/AppBuilder/RightSideBar/rightSidebarConstants';
import { highlightMatch } from './highlightMatch';

const WAIT_TIMEOUT_MS = 5000;

// Resolves true once `isReady(state)` holds, or false after the timeout.
const waitForStore = (isReady) =>
  new Promise((resolve) => {
    if (isReady(useStore.getState())) return resolve(true);
    const timer = setTimeout(() => {
      unsubscribe();
      resolve(false);
    }, WAIT_TIMEOUT_MS);
    const unsubscribe = useStore.subscribe((state) => {
      if (!isReady(state)) return;
      clearTimeout(timer);
      unsubscribe();
      resolve(true);
    });
  });

// switchPage starts an async switch and returns nothing. Wait for the page id to change, not for
// `pageSwitchInProgress`: that flag clears only after the new page's exposed-value batch flushes,
// which on-load queries can push past any sensible wait, and selection does not need it.
const waitForPage = (pageId, moduleId) => waitForStore((state) => state.modules[moduleId]?.currentPageId === pageId);

const openRightSidebar = (tab) => {
  const { setRightSidebarOpen, setActiveRightSideBarTab } = useStore.getState();
  setRightSidebarOpen(true);
  setActiveRightSideBarTab(tab);
};

const MODAL_TYPES = new Set(['Modal', 'ModalV2']);
const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

// Makes a component visible on the canvas: opens every modal it sits in and switches every Tabs
// ancestor to the tab holding it, outermost first. A child's `parent` is the container id, or
// `<tabsId>-<tabId>` inside Tabs.
const revealOnCanvas = async (componentId, moduleId) => {
  const { getCurrentPageComponents, getAllExposedValues } = useStore.getState();
  const components = getCurrentPageComponents(moduleId);
  const steps = [];
  const visited = new Set();
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

// Opens the place a search match came from, then selects the match inside it.
export const navigateToResult = async (match, moduleId = 'canvas') => {
  const { record } = match;
  const state = useStore.getState();

  if (record.pageId && record.pageId !== state.getCurrentPageId(moduleId)) {
    const page = state.modules[moduleId].pages.find((p) => p.id === record.pageId);
    if (!page) return toast.error('That page no longer exists');
    state.switchPage(page.id, page.handle, [], moduleId);
    if (!(await waitForPage(page.id, moduleId))) return toast.error(`Couldn't open page ${page.name}`);
  }

  const ownerType = record.ownerType || record.entityType;
  const ownerId = record.ownerId || record.entityId;
  const { setSelectedComponents, queryPanel, setSelectedSidebarItem } = useStore.getState();

  if (ownerType === 'component') {
    // Opening a modal selects the modal itself, so select the component after revealing it.
    await revealOnCanvas(ownerId, moduleId);
    setSelectedComponents([ownerId]);
    openRightSidebar(RIGHT_SIDE_BAR_TAB.CONFIGURATION);
    document.getElementById(ownerId)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } else if (ownerType === 'query') {
    queryPanel.setSelectedQuery(ownerId, moduleId);
    queryPanel.expandQueryPaneIfNeeded();
  } else if (ownerType === 'page' || ownerId === 'pageSettings') {
    // Pages and app-wide navigation settings are both edited in the right sidebar's Pages panel.
    openRightSidebar(RIGHT_SIDE_BAR_TAB.PAGES);
  } else if (ownerType === 'app') {
    // Global settings live in the left sidebar; the search term survives in the store.
    setSelectedSidebarItem('settings');
    return;
  }

  highlightMatch(match);
};
