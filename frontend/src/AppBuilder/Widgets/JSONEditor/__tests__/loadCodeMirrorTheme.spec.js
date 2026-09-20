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
    const [monokai, solarized, tomorrow, bespin] = await Promise.all([
      loadCodeMirrorTheme('monokai'),
      loadCodeMirrorTheme('solarized'),
      loadCodeMirrorTheme('tomorrow'),
      loadCodeMirrorTheme('bespin'),
    ]);

    for (const theme of [monokai, solarized, tomorrow, bespin]) {
      expect(theme).toBeDefined();
    }
    // Four documented options must be four DISTINCT extensions, not the same one aliased.
    expect(new Set([monokai, solarized, tomorrow, bespin]).size).toBe(4);

    // An unrecognised value takes the `default:` branch. Pinned, not blessed: registration and the
    // documentation both call `solarized` the default, so this fallback disagrees with them. It is
    // reachable only when a saved app carries a theme outside the four registered select options.
    await expect(loadCodeMirrorTheme('not-a-theme')).resolves.toBe(monokai);
    await expect(loadCodeMirrorTheme(undefined)).resolves.toBe(monokai);
  });
});
