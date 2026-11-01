/**
 * The registered Container config, checked against itself.
 *
 * Two independent places describe what a style starts as:
 *
 *   definition.styles[key].value        what a freshly dropped Container renders with
 *   styles[key].validation.defaultValue what the inspector's reset-to-default restores,
 *                                       and what validateProperty coerces an invalid value to
 *                                       (component-properties-validation.js:161,172)
 *
 * They are maintained by hand and nothing keeps them in step, so they drift silently — the
 * drift only shows up when a user presses reset and gets a value the widget never ships with.
 * Asserted across the whole style set rather than key by key, so a style added later cannot
 * reintroduce it.
 *
 * Pure Jest: the config is a plain exported object with no store or DOM involved.
 */
import { containerConfig } from '@tooljet/widget-definitions';

describe('Container registered config', () => {
  // Break this catches: the two defects this scenario was written for —
  // headerDividerColor resetting to `var(--cc-default-border)` against a shipped
  // `var(--cc-weak-border)`, and boxShadow carrying no registered default at all so reset
  // produced `undefined`.
  test('[Container-STYLE-008] every style default matches the value a new Container ships with', () => {
    const shipped = containerConfig.definition.styles;

    const drift = Object.entries(shipped)
      .map(([key, { value }]) => ({
        key,
        shipped: value,
        registered: containerConfig.styles?.[key]?.validation?.defaultValue,
      }))
      // A style with no inspector control has nothing to reset, so nothing to agree with.
      .filter(({ key }) => containerConfig.styles?.[key])
      .filter(({ shipped: a, registered: b }) => String(a) !== String(b));

    expect(drift).toEqual([]);
  });

  // Break this catches: a shipped style losing its inspector control, which would strand the
  // saved value with no way to edit or reset it.
  test('[Container-STYLE-008] every shipped style has an inspector control', () => {
    const missing = Object.keys(containerConfig.definition.styles).filter((key) => !containerConfig.styles?.[key]);

    expect(missing).toEqual([]);
  });
});
