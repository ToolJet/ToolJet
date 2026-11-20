// App Builder code fields sit on the panel surface. Dark mode keeps okaidia's syntax colours but not
// its #272822 background, which reads as a dark slab on the dark panel (UB-20, UA-19). The Viewer's
// CodeEditor widget keeps plain okaidia, so a customer's app looks the same as before.
import { okaidia } from '@uiw/codemirror-theme-okaidia';
import { githubLight } from '@uiw/codemirror-theme-github';
import { CODE_SURFACE_THEME, getCodeTheme } from '../codeTheme';

// Break this catches: light code fields lose the GitHub theme the editor has always used.
test('light code fields keep the GitHub light theme', () => {
  expect(getCodeTheme(false)).toBe(githubLight);
});

// Break this catches: dark code fields fall back to okaidia's Monokai background.
test('dark code fields keep okaidia syntax colours on the panel surface', () => {
  const theme = getCodeTheme(true);
  expect(theme).toContain(okaidia);
  expect(theme).toHaveLength(2);
  ['&', '.cm-gutters'].forEach((selector) =>
    expect(CODE_SURFACE_THEME[selector].backgroundColor).toBe('var(--background-surface-layer-01)')
  );
});
