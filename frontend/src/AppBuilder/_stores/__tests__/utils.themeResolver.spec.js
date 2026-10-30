/**
 * Contract tests for `resolveThemeForMode` in `_stores/utils.js`.
 *
 * This walks a theme `definition` tree and collapses every `{ light, dark }` leaf to
 * the single value for the current mode, which is what ends up under `globals.theme`
 * in the inspector and in `{{ }}` bindings. Pure function (no store, no DOM) — zero
 * mocks, only the module under test is imported.
 *
 * The key fact pinned here: released apps, public links, preview-for-version, and the
 * module viewer all run `convertAllKeysToSnakeCase` on the whole app payload before this
 * resolver ever sees it (`useAppData.js`), and only the top level of `global_settings` is
 * converted back to camelCase afterwards — the theme's own nested `definition` subtree
 * stays snake_cased. Without normalizing keys inside the walk, multi-word paths like
 * `globals.theme.systemStatus.colors.error` resolve to `undefined` in every non-editor
 * context while working fine in the editor. That was a real bug caught in PR review
 * (ToolJet/ToolJet#17479) — the camelCase call is what fixes it.
 */
import { resolveThemeForMode, baseTheme } from '@/AppBuilder/_stores/utils';

describe('resolveThemeForMode', () => {
  test('resolves a { light, dark } leaf to the light value in light mode', () => {
    const definition = { brand: { colors: { primary: { light: '#111111', dark: '#eeeeee' } } } };

    expect(resolveThemeForMode(definition, 'light')).toEqual({ brand: { colors: { primary: '#111111' } } });
  });

  test('resolves a { light, dark } leaf to the dark value in dark mode', () => {
    const definition = { brand: { colors: { primary: { light: '#111111', dark: '#eeeeee' } } } };

    expect(resolveThemeForMode(definition, 'dark')).toEqual({ brand: { colors: { primary: '#eeeeee' } } });
  });

  test('leaves mode-independent leaves (numbers, strings without light/dark) untouched', () => {
    const definition = { text: { font: 'IBM Plex Sans' }, border: { radius: { default: 6, small: 0 } } };

    expect(resolveThemeForMode(definition, 'light')).toEqual({
      text: { font: 'IBM Plex Sans' },
      border: { radius: { default: 6, small: 0 } },
    });
  });

  test('camelCases snake_case keys at every depth (the released/public app bug)', () => {
    const definition = {
      system_status: { colors: { error: { light: '#D72D39', dark: '#D03F43' } } },
      surface: { colors: { app_background: { light: '#F6F6F6', dark: '#121518' } } },
    };

    const resolved = resolveThemeForMode(definition, 'light');

    expect(resolved.systemStatus.colors.error).toBe('#D72D39');
    expect(resolved.surface.colors.appBackground).toBe('#F6F6F6');
    // The snake_case paths must not survive alongside the camelCase ones.
    expect(resolved.system_status).toBeUndefined();
    expect(resolved.surface.colors.app_background).toBeUndefined();
  });

  test('is idempotent on already-camelCase input (editor path is unaffected)', () => {
    const definition = { systemStatus: { colors: { error: { light: '#D72D39', dark: '#D03F43' } } } };

    expect(resolveThemeForMode(definition, 'light')).toEqual({ systemStatus: { colors: { error: '#D72D39' } } });
  });

  test('does not mutate the input definition', () => {
    const definition = { brand: { colors: { primary: { light: '#111111', dark: '#eeeeee' } } } };
    const before = JSON.parse(JSON.stringify(definition));

    resolveThemeForMode(definition, 'light');

    expect(definition).toEqual(before);
  });

  test('resolves the real baseTheme for both modes with the expected shape', () => {
    const light = resolveThemeForMode(baseTheme.definition, 'light');
    const dark = resolveThemeForMode(baseTheme.definition, 'dark');

    expect(light).toEqual({
      brand: { colors: { primary: '#4368E3', secondary: '#6A727C', tertiary: '#1E823B' } },
      text: { font: 'IBM Plex Sans', colors: { primary: '#1B1F24', placeholder: '#6A727C' } },
      border: {
        radius: { default: 6, small: 0, large: 0 },
        colors: { default: '#CCD1D5', weak: '#E4E7EB' },
      },
      systemStatus: { colors: { success: '#1E823B', error: '#D72D39', warning: '#BF4F03' } },
      surface: {
        colors: { appBackground: '#F6F6F6', surface1: '#FFFFFF', surface2: '#F6F8FA', surface3: '#E4E7EB' },
      },
    });
    expect(dark.brand.colors.primary).toBe('#4A6DD9');
    expect(dark.surface.colors.appBackground).toBe('#121518');
  });
});
