/**
 * A left panel (Pages, Components, Queries, …) closes only from its own close button or by clicking
 * its own rail icon again. Toggling the right panel or the bottom runtime panel, or selecting on the
 * canvas, must leave the left panel exactly as it was. The AI chat is itself a left panel; its rules
 * live in aiChatLeftPanel.spec.js.
 */
import useStore from '@/AppBuilder/_stores/store';
import { seedApp, componentDefinition } from '@/test/app-builder';

const state = () => useStore.getState();
const leftPanel = () => ({ item: state().selectedSidebarItem, open: state().isSidebarOpen });

beforeEach(() => {
  seedApp({ c1: componentDefinition('c1', 'button1', 'Button') });
  state().setSelectedSidebarItem('queries');
  state().toggleLeftSidebar(true);
});

describe('left panel stays open', () => {
  it('should stay open when the right panel opens and closes', () => {
    state().setRightSidebarOpen(true);
    state().setActiveRightSideBarTab('components');
    state().setRightSidebarOpen(false);

    expect(leftPanel()).toEqual({ item: 'queries', open: true });
  });

  it('should stay open when the bottom runtime panel opens and closes', () => {
    state().queryPanel.setIsQueryPaneExpanded(true);
    state().queryPanel.setIsQueryPaneExpanded(false);

    expect(leftPanel()).toEqual({ item: 'queries', open: true });
  });

  it('should stay open when a component is selected and deselected on the canvas', () => {
    state().setSelectedComponents(['c1']);
    state().clearSelectedComponents();

    expect(leftPanel()).toEqual({ item: 'queries', open: true });
  });
});
