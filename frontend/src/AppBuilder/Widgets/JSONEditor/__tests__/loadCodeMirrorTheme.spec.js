/**
 * Contract: frontend/ee/test/app-builder/widgets/JSONEditor/TESTING.md (D-05).
 *
 * The rendered theme has no public oracle — CodeMirror only emits generated
 * atomic class names, which shift as themes register across a session. The
 * painted result belongs to JSONEditor-BRW-003. What IS assertable is the
 * exported mapping itself, which this file owns.
 */
import { loadCodeMirrorTheme } from '@/AppBuilder/Widgets/JSONEditor/JSONEditor';

describe('loadCodeMirrorTheme', () => {
  test('[JSONEditor-THEME-001] each documented theme resolves to its own extension, and anything else falls back to monokai', async () => {
    // Break this catches: a mis-wired case sends every app that picked one theme to a different one,
    // silently and with no error. The documented options are monokai, solarized, tomorrow and bespin.
    // Each option is compared against the package export it is supposed to resolve to. Asserting
    // only that the four results are defined and distinct is not enough: swapping two mappings —
    // `solarized` returning tomorrowNightBlue and `tomorrow` returning solarizedDark — keeps four
    // distinct values and both fallbacks, so the suite would stay green while every app that
    // picked either theme silently rendered the other.
    const mod = await import('@uiw/codemirror-themes-all');
    const expected = {
      monokai: mod.monokai,
      solarized: mod.solarizedDark,
      tomorrow: mod.tomorrowNightBlue,
      bespin: mod.bespin,
    };

    for (const [option, extension] of Object.entries(expected)) {
      expect(extension).toBeDefined();
      await expect(loadCodeMirrorTheme(option)).resolves.toBe(extension);
    }

    // Four documented options must be four DISTINCT extensions, not the same one aliased.
    expect(new Set(Object.values(expected)).size).toBe(4);
    const monokai = expected.monokai;

    // An unrecognised value takes the `default:` branch. Pinned, not blessed: registration and the
    // documentation both call `solarized` the default, so this fallback disagrees with them. It is
    // reachable only when a saved app carries a theme outside the four registered select options.
    await expect(loadCodeMirrorTheme('not-a-theme')).resolves.toBe(monokai);
    await expect(loadCodeMirrorTheme(undefined)).resolves.toBe(monokai);
  });
});
