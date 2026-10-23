/**
 * The right side holds one surface at a time: either the right panel (component, query, page
 * configuration, …) or the AI chat. Opening either one replaces the other. Once open, the right
 * panel closes only from its own close button — canvas clicks, left-panel changes, and the bottom
 * runtime panel never close it.
 */
import useStore from '@/AppBuilder/_stores/store';
import { seedApp, componentDefinition } from '@/test/app-builder';

const state = () => useStore.getState();
const surfaces = () => ({ rightPanel: state().isRightSidebarOpen, chat: state().isAiChatOpen });

beforeEach(() => {
  seedApp({ c1: componentDefinition('c1', 'button1', 'Button') });
  state().setRightSidebarOpen(false);
  state().setAiChatOpen(false);
});

describe('right panel and AI chat are mutually exclusive', () => {
  it('should close the right panel when the AI chat opens', () => {
    state().setActiveRightSideBarTab('query');
    state().setRightSidebarOpen(true);

    state().setAiChatOpen(true);

    expect(surfaces()).toEqual({ rightPanel: false, chat: true });
  });

  it('should close the AI chat when the right panel opens', () => {
    state().setAiChatOpen(true);

    state().setActiveRightSideBarTab('configuration');
    state().setRightSidebarOpen(true);

    expect(surfaces()).toEqual({ rightPanel: true, chat: false });
  });

  it('should close the AI chat when the canvas header opens its configuration', () => {
    state().setAiChatOpen(true);

    state().setCanvasHeaderSelected(true);

    expect(surfaces()).toEqual({ rightPanel: true, chat: false });
  });

  it('should leave the other surface alone when one of them closes', () => {
    state().setAiChatOpen(true);
    state().setRightSidebarOpen(false);
    expect(surfaces()).toEqual({ rightPanel: false, chat: true });

    state().setAiChatOpen(false);
    state().setRightSidebarOpen(true);
    state().setAiChatOpen(false);
    expect(surfaces()).toEqual({ rightPanel: true, chat: false });
  });
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

  it('should stay open when the bottom runtime panel opens and closes', () => {
    state().queryPanel.setIsQueryPaneExpanded(true);
    state().queryPanel.setIsQueryPaneExpanded(false);

    expect(state().isRightSidebarOpen).toBe(true);
  });
});
