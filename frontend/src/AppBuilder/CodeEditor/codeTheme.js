import { EditorView } from '@codemirror/view';
import { Prec } from '@codemirror/state';
import { okaidia } from '@uiw/codemirror-theme-okaidia';
import { githubLight } from '@uiw/codemirror-theme-github';

// App Builder code fields sit on the panel surface: okaidia's syntax colours without its #272822
// background (UB-20, UA-19). Widgets/CodeEditor, SqlEditor and the specs preview keep plain okaidia.
export const CODE_SURFACE_THEME = {
  '&': { backgroundColor: 'var(--background-surface-layer-01)' },
  '.cm-gutters': { backgroundColor: 'var(--background-surface-layer-01)' },
};

const darkCodeTheme = [okaidia, Prec.highest(EditorView.theme(CODE_SURFACE_THEME, { dark: true }))];

export const getCodeTheme = (darkMode) => (darkMode ? darkCodeTheme : githubLight);
