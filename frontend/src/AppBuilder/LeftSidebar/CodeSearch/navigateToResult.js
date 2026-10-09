import toast from 'react-hot-toast';
import useStore from '@/AppBuilder/_stores/store';
import { RIGHT_SIDE_BAR_TAB } from '@/AppBuilder/RightSideBar/rightSidebarConstants';
import { highlightMatch } from './highlightMatch';

const PAGE_SWITCH_TIMEOUT_MS = 5000;

// switchPage starts an async switch and returns nothing; wait for its in-progress flag to clear.
const waitForPageSwitch = () =>
  new Promise((resolve) => {
    if (!useStore.getState().pageSwitchInProgress) return resolve(true);
    const timer = setTimeout(() => {
      unsubscribe();
      resolve(false);
    }, PAGE_SWITCH_TIMEOUT_MS);
    const unsubscribe = useStore.subscribe((state) => {
      if (state.pageSwitchInProgress) return;
      clearTimeout(timer);
      unsubscribe();
      resolve(true);
    });
  });

const openRightSidebar = (tab) => {
  const { setRightSidebarOpen, setActiveRightSideBarTab } = useStore.getState();
  setRightSidebarOpen(true);
  setActiveRightSideBarTab(tab);
};

// Opens the place a search match came from, then selects the match inside it.
export const navigateToResult = async (match, moduleId = 'canvas') => {
  const { record } = match;
  const state = useStore.getState();

  if (record.pageId && record.pageId !== state.getCurrentPageId(moduleId)) {
    const page = state.modules[moduleId].pages.find((p) => p.id === record.pageId);
    if (!page) return toast.error('That page no longer exists');
    state.switchPage(page.id, page.handle, [], moduleId);
    if (!(await waitForPageSwitch())) return toast.error(`Couldn't open page ${page.name}`);
  }

  const ownerType = record.ownerType || record.entityType;
  const ownerId = record.ownerId || record.entityId;
  const { setSelectedComponents, queryPanel, setSelectedSidebarItem } = useStore.getState();

  if (ownerType === 'component') {
    setSelectedComponents([ownerId]);
    openRightSidebar(RIGHT_SIDE_BAR_TAB.CONFIGURATION);
    document.getElementById(ownerId)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } else if (ownerType === 'query') {
    queryPanel.setSelectedQuery(ownerId, moduleId);
    queryPanel.expandQueryPaneIfNeeded();
  } else if (ownerType === 'page') {
    openRightSidebar(RIGHT_SIDE_BAR_TAB.PAGES);
  } else if (ownerType === 'app') {
    // Global settings live in the left sidebar; the search term survives in the store.
    setSelectedSidebarItem('settings');
    return;
  }

  highlightMatch(match);
};
