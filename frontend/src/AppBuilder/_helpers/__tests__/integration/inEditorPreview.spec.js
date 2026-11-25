import useStore from '@/AppBuilder/_stores/store';
import { componentDefinition, seedApp } from '@/test/app-builder';
import {
  enterInEditorPreview,
  exitInEditorPreview,
  isInEditorPreviewEnabled,
  selectInEditorPreview,
} from '@/AppBuilder/_helpers/inEditorPreview';

const state = () => useStore.getState();

describe('preview inside the editor', () => {
  beforeEach(() => {
    seedApp({ c1: componentDefinition('c1', 'textinput1', 'TextInput') });
    state().setCurrentMode('edit');
    state().setSelectedComponents(['c1']);
  });

  afterEach(() => window.localStorage.removeItem('tj-in-editor-preview'));

  it('shows the canvas in view mode with nothing selected', () => {
    enterInEditorPreview();

    expect(state().modeStore.modules.canvas.currentMode).toBe('view');
    expect(selectInEditorPreview(state())).toBe(true);
    expect(state().selectedComponents).toEqual([]);
  });

  it('returns to edit mode on saved layouts, without the positions the preview rendered', () => {
    enterInEditorPreview();
    state().setTemporaryLayouts({ c1: { top: 120, height: 90 } });

    exitInEditorPreview();

    expect(state().modeStore.modules.canvas.currentMode).toBe('edit');
    expect(selectInEditorPreview(state())).toBe(false);
    expect(state().temporaryLayouts).toEqual({});
  });

  it('ends when something else puts the canvas back in edit mode', () => {
    enterInEditorPreview();
    state().setCurrentMode('edit');

    expect(selectInEditorPreview(state())).toBe(false);
  });

  it('is offered by default, but not in the module editor or when turned off for this browser', () => {
    expect(isInEditorPreviewEnabled(false)).toBe(true);
    expect(isInEditorPreviewEnabled(true)).toBe(false);
    window.localStorage.setItem('tj-in-editor-preview', 'off');
    expect(isInEditorPreviewEnabled(false)).toBe(false);
  });
});
