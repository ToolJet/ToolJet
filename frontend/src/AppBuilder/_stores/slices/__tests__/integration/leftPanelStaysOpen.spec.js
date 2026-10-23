/**
 * A left panel (Pages, Components, Queries, …) closes only from its own close button or by clicking
 * its own rail icon again. The AI chat is a separate right-side drawer with its own open state, so
 * opening or closing it — like toggling the right panel or the bottom runtime panel, or selecting
 * on the canvas — must leave the left panel exactly as it was.
 */
import useStore from '@/AppBuilder/_stores/store';
import { seedApp, componentDefinition } from '@/test/app-builder';

const state = () => useStore.getState();
const leftPanel = () => ({ item: state().selectedSidebarItem, open: state().isSidebarOpen });

beforeEach(() => {
  seedApp({ c1: componentDefinition('c1', 'button1', 'Button') });
  state().setAiChatOpen(false);
  state().setSelectedSidebarItem('queries');
  state().toggleLeftSidebar(true);
});

describe('left panel stays open', () => {
  it('should stay open while the AI chat opens and closes', () => {
    state().setAiChatOpen(true);
    expect(state().isAiChatOpen).toBe(true);
    expect(leftPanel()).toEqual({ item: 'queries', open: true });

    state().setAiChatOpen(false);
    expect(leftPanel()).toEqual({ item: 'queries', open: true });
  });

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

describe('AI chat open state', () => {
  it('should not change when the left panel closes', () => {
    state().setAiChatOpen(true);
    state().toggleLeftSidebar(false);

    expect(state().isAiChatOpen).toBe(true);
  });
});
