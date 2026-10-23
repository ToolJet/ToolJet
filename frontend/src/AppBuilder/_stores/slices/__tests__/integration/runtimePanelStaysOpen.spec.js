/**
 * The bottom runtime panel (Inspector / Debugger) closes only from its own close or collapse
 * button. Canvas clicks and opening or closing the left and right panels go through the store
 * actions below; none of them may touch `queryPanel.isQueryPaneExpanded`.
 */
import useStore from '@/AppBuilder/_stores/store';
import { seedApp, componentDefinition } from '@/test/app-builder';

const state = () => useStore.getState();
const isOpen = () => state().queryPanel.isQueryPaneExpanded;

beforeEach(() => {
  seedApp({ c1: componentDefinition('c1', 'button1', 'Button') });
  state().queryPanel.setIsQueryPaneExpanded(true);
});

describe('runtime panel stays open', () => {
  it('should stay open when a component is selected and the canvas is clicked to deselect', () => {
    state().setSelectedComponents(['c1']);
    state().clearSelectedComponents();

    expect(isOpen()).toBe(true);
  });

  it('should stay open when the left panel opens, switches, and closes', () => {
    state().setSelectedSidebarItem('queries');
    state().toggleLeftSidebar(true);
    state().setSelectedSidebarItem('pages');
    state().toggleLeftSidebar(false);

    expect(isOpen()).toBe(true);
  });

  it('should stay open when the right panel opens, switches tabs, and closes', () => {
    state().setRightSidebarOpen(true);
    state().setActiveRightSideBarTab('components');
    state().setActiveRightSideBarTab('query');
    state().setRightSidebarOpen(false);

    expect(isOpen()).toBe(true);
  });
});
