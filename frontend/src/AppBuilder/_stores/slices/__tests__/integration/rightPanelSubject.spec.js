/**
 * Clicking empty canvas clears the canvas selection but must not change anything on the right side:
 * the open tab and what it is configuring (a component, the canvas header, or the footer) stay as
 * they were. The right panel never switches to the Add component picker.
 */
import useStore from '@/AppBuilder/_stores/store';
import { seedApp, componentDefinition } from '@/test/app-builder';

const state = () => useStore.getState();
const rightSide = () => ({
  open: state().isRightSidebarOpen,
  tab: state().activeRightSideBarTab,
  subject: state().rightPanelSubject,
});

beforeEach(() => {
  seedApp({
    c1: componentDefinition('c1', 'button1', 'Button'),
    c2: componentDefinition('c2', 'text1', 'Text'),
  });
  state().clearSelectedComponents();
  state().setActiveRightSideBarTab('configuration');
  state().setRightSidebarOpen(true);
});

describe('right panel subject', () => {
  it('should follow the component selected on the canvas', () => {
    state().setSelectedComponents(['c1']);
    expect(state().rightPanelSubject).toEqual({ type: 'component', id: 'c1' });

    state().setSelectedComponents(['c2']);
    expect(state().rightPanelSubject).toEqual({ type: 'component', id: 'c2' });
  });

  it('should follow the canvas header and footer', () => {
    state().setCanvasHeaderSelected(true);
    expect(state().rightPanelSubject).toEqual({ type: 'header' });

    state().setCanvasFooterSelected(true);
    expect(state().rightPanelSubject).toEqual({ type: 'footer' });
  });
});

describe('clicking empty canvas', () => {
  it('should keep the component properties open', () => {
    state().setSelectedComponents(['c1']);
    const before = rightSide();

    state().clearSelectedComponents();

    expect(state().selectedComponents).toEqual([]);
    expect(rightSide()).toEqual(before);
    expect(rightSide()).toMatchObject({ open: true, tab: 'configuration', subject: { type: 'component', id: 'c1' } });
  });

  it('should keep the header styles open', () => {
    state().setCanvasHeaderSelected(true);
    const before = rightSide();

    state().clearSelectedComponents();

    expect(state().isCanvasHeaderSelected).toBe(false);
    expect(rightSide()).toEqual(before);
  });

  it.each(['configuration', 'query', 'page-configuration', 'pages'])(
    'should never switch the %s tab to the Add component picker',
    (tab) => {
      state().setSelectedComponents(['c1']);
      state().setActiveRightSideBarTab(tab);

      state().clearSelectedComponents();

      expect(state().activeRightSideBarTab).toBe(tab);
    }
  );
});
