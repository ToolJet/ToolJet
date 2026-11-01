/**
 * The registered Accordion config, checked against itself.
 *
 * Two independent places describe what a style starts as:
 *
 *   definition.styles[key].value        what a freshly dropped Accordion renders with
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
import { accordionConfig } from '@tooljet/widget-definitions';

describe('Accordion registered config', () => {
  // Break this catches: the defect this scenario was written for — boxShadow
  // carrying no registered default at all, so the inspector's reset produced `undefined`
  // instead of the shipped `0px 0px 0px 0px #00000040`. Accordion's headerDividerColor was
  // already in step; Container's was not, which is why both configs are checked the same way.
  test('[Accordion-STYLE-010] every style default matches the value a new Accordion ships with', () => {
    const shipped = accordionConfig.definition.styles;

    const drift = Object.entries(shipped)
      .map(([key, { value }]) => ({
        key,
        shipped: value,
        registered: accordionConfig.styles?.[key]?.validation?.defaultValue,
      }))
      // A style with no inspector control has nothing to reset, so nothing to agree with.
      .filter(({ key }) => accordionConfig.styles?.[key])
      .filter(({ shipped: a, registered: b }) => String(a) !== String(b));

    expect(drift).toEqual([]);
  });

  // Break this catches: a shipped style losing its inspector control, which would strand the
  // saved value with no way to edit or reset it.
  test('[Accordion-STYLE-010] every shipped style has an inspector control', () => {
    const missing = Object.keys(accordionConfig.definition.styles).filter((key) => !accordionConfig.styles?.[key]);

    expect(missing).toEqual([]);
  });
});
