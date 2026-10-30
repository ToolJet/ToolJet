/**
 * The AI chat is a left panel like Pages or Queries: it shares the single left slot (opening it
 * replaces the panel that's showing, and the reverse), and it closes only from its own close button
 * or rail icon. It no longer shares the right side, so the right panel stays exactly as it was.
 */
import useStore from '@/AppBuilder/_stores/store';
import { seedApp, componentDefinition } from '@/test/app-builder';

const state = () => useStore.getState();
const leftPanel = () => ({ item: state().selectedSidebarItem, open: state().isSidebarOpen });

beforeEach(() => {
  seedApp({ c1: componentDefinition('c1', 'button1', 'Button') });
  state().toggleLeftSidebar(false);
  state().setRightSidebarOpen(false);
});

describe('AI chat as a left panel', () => {
  it('should open in the left slot', () => {
    state().setAiChatOpen(true);

    expect(leftPanel()).toEqual({ item: 'tooljetai', open: true });
  });

  it('should replace the left panel that is showing', () => {
    state().setSelectedSidebarItem('queries');
    state().toggleLeftSidebar(true);

    state().setAiChatOpen(true);

    expect(leftPanel()).toEqual({ item: 'tooljetai', open: true });
  });

  it('should be replaced when another left panel opens', () => {
    state().setAiChatOpen(true);

    state().setSelectedSidebarItem('pages');

    expect(leftPanel()).toEqual({ item: 'pages', open: true });
  });

  it('should close from its own close button', () => {
    state().setAiChatOpen(true);

    state().setAiChatOpen(false);

    expect(leftPanel()).toEqual({ item: null, open: false });
  });

  it('should leave another left panel open when the chat is told to close', () => {
    state().setSelectedSidebarItem('queries');
    state().toggleLeftSidebar(true);

    state().setAiChatOpen(false);

    expect(leftPanel()).toEqual({ item: 'queries', open: true });
  });
});

describe('AI chat and the right panel', () => {
  it('should keep the right panel open when the chat opens', () => {
    state().setActiveRightSideBarTab('configuration');
    state().setRightSidebarOpen(true);

    state().setAiChatOpen(true);

    expect(state().isRightSidebarOpen).toBe(true);
  });

  it('should keep the chat open when the right panel opens', () => {
    state().setAiChatOpen(true);

    state().setActiveRightSideBarTab('configuration');
    state().setRightSidebarOpen(true);
    state().setCanvasHeaderSelected(true);
    state().setSelectedComponents(['c1']);

    expect(leftPanel()).toEqual({ item: 'tooljetai', open: true });
  });
});
