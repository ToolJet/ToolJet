/**
 * Once open, the right panel (component, query, page configuration, …) closes only from its own
 * close button — canvas clicks, left-panel changes (the AI chat included), and the bottom runtime
 * panel never close it.
 */
import useStore from '@/AppBuilder/_stores/store';
import { seedApp, componentDefinition } from '@/test/app-builder';

const state = () => useStore.getState();

beforeEach(() => {
  seedApp({ c1: componentDefinition('c1', 'button1', 'Button') });
  state().setRightSidebarOpen(false);
});

describe('right panel stays open', () => {
  beforeEach(() => {
    state().setActiveRightSideBarTab('configuration');
    state().setRightSidebarOpen(true);
  });

  it('should stay open when the canvas is clicked to clear the selection', () => {
    state().setSelectedComponents(['c1']);
    state().clearSelectedComponents();

    expect(state().isRightSidebarOpen).toBe(true);
  });

  it('should stay open when left panels open, switch, and close', () => {
    state().setSelectedSidebarItem('pages');
    state().toggleLeftSidebar(true);
    state().setSelectedSidebarItem('dependencies');
    state().toggleLeftSidebar(false);

    expect(state().isRightSidebarOpen).toBe(true);
  });

  it('should stay open when the AI chat opens and closes', () => {
    state().setAiChatOpen(true);
    state().setAiChatOpen(false);

    expect(state().isRightSidebarOpen).toBe(true);
  });

  it('should stay open when the bottom runtime panel opens and closes', () => {
    state().queryPanel.setIsQueryPaneExpanded(true);
    state().queryPanel.setIsQueryPaneExpanded(false);

    expect(state().isRightSidebarOpen).toBe(true);
  });
});
