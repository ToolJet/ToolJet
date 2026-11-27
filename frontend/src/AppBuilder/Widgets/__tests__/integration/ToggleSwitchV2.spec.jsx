/**
 * ToggleSwitchV2: theme scenarios of the widget's scoped contract
 * (frontend/ee/test/app-builder/widgets/ToggleSwitchV2/TESTING.md). The rest of the
 * widget is deferred to its backfill (ToggleSwitchV2-BACKFILL-001).
 *
 * Real store, real RenderWidget, real ToggleSwitchV2. Nothing about the widget is mocked.
 */
import { waitFor } from '@testing-library/react';
import { createWidgetHarness, binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { componentDefinition } from '@/test/app-builder';
import { toggleSwitchV2Config } from '@tooljet/widget-definitions';
import { buildComponentMetaDefinition } from '@/_helpers/appUtils';

const widget = createWidgetHarness({ componentType: 'ToggleSwitchV2', handle: 'toggleswitch1', id: 'tog1' });

// Theme box shadow (scoped contract D-02; Button's D-03..D-06 transferred).
describe('ToggleSwitchV2: theme box shadow', () => {
  beforeEach(() => widget.setup());
  afterEach(() => widget.teardown());
  const themedBox = () => document.querySelector('input[type="checkbox"]')?.closest('[data-disabled]');
  // Computed, not inline: some fields are styled through react-select's emotion classes.
  const css = (prop) => getComputedStyle(themedBox())[prop];

  test('[ToggleSwitchV2-THEME-001] a newly dropped ToggleSwitchV2 starts with no theme shadow, with the theme dropdown', () => {
    // Break this catches: the config losing the new-drop defaults or the inspector's theme dropdowns.
    expect(toggleSwitchV2Config.definition.styles.boxShadowStyle).toEqual({ value: 'none' });
    expect(toggleSwitchV2Config.styles.boxShadow.themeTokens).toBe('shadows');
  });

  test('[ToggleSwitchV2-THEME-002] a ToggleSwitchV2 saved before theme styles keeps its own shadow after load', async () => {
    // Break this catches: the load merge stamping the new-drop defaults onto saved widgets.
    const saved = componentDefinition(
      'tog1',
      'tog1',
      'ToggleSwitchV2',
      {},
      {
        styles: { boxShadow: binding('5px 5px 0px 0px #00000040') },
        seedFromRegisteredDefinition: false,
      }
    );
    const { styles } = buildComponentMetaDefinition({ tog1: saved })['tog1'].component.definition;
    expect(styles).not.toHaveProperty('boxShadowStyle');

    widget.render({ styles: { ...styles, boxShadowStyle: binding('custom') } });
    await waitFor(() => expect(themedBox()).toBeTruthy());
    expect(css('boxShadow')).toBe('5px 5px 0px 0px #00000040');
  });

  test('[ToggleSwitchV2-THEME-003] a theme item renders its variable with the saved value as fallback; custom renders the saved value', async () => {
    // Break this catches: the widget rendering its raw shadow whatever the theme style.
    widget.render({
      styles: {
        boxShadow: binding('0px 0px 0px 0px #00000040'),
        boxShadowStyle: binding('300'),
      },
    });
    await waitFor(() => expect(themedBox()).toBeTruthy());
    expect(css('boxShadow')).toBe('var(--cc-box-shadow-300, 0px 0px 0px 0px #00000040)');

    widget.setComponentProperty('tog1', 'boxShadowStyle', 'custom', 'styles');
    await waitFor(() => expect(css('boxShadow')).toBe('0px 0px 0px 0px #00000040'));
  });
});
