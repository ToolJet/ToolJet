// monokai, tomorrow and bespin are palettes made for a dark background; on the widget's default light surface they
// are unreadable. With the default Background they keep their own; a custom Background color still wins.
const DARK_BACKGROUND_THEMES = ['monokai', 'tomorrow', 'bespin'];
const DEFAULT_BACKGROUND = 'var(--cc-surface1-surface)';

export const usesThemeBackground = (theme, backgroundColor) =>
  DARK_BACKGROUND_THEMES.includes(theme) && (!backgroundColor || backgroundColor === DEFAULT_BACKGROUND);
