/**
 * Timer: theme scenarios of the widget's scoped contract
 * (frontend/ee/test/app-builder/widgets/Timer/TESTING.md). The rest of the
 * widget is deferred to its backfill (Timer-BACKFILL-001).
 *
 * Real store, real RenderWidget, real Timer. Nothing about the widget is mocked.
 */
import { waitFor } from '@testing-library/react';
import { createWidgetHarness, binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { componentDefinition } from '@/test/app-builder';
import { timerConfig } from '@tooljet/widget-definitions';
import { buildComponentMetaDefinition } from '@/_helpers/appUtils';

const widget = createWidgetHarness({ componentType: 'Timer', handle: 'timer1', id: 'timer1' });

// Theme box shadow (scoped contract D-02; Button's D-03..D-06 transferred).
describe('Timer: theme box shadow', () => {
  beforeEach(() => widget.setup());
  afterEach(() => widget.teardown());
  const shadowBox = () => document.querySelector('[data-cy="timer1"]');

  test('[Timer-THEME-001] a newly dropped Timer starts with no theme shadow, with the theme dropdown', () => {
    // Break this catches: the config losing the new-drop defaults or the inspector's theme dropdowns.
    expect(timerConfig.definition.generalStyles.boxShadowStyle).toEqual({ value: 'none' });
    expect(timerConfig.generalStyles.boxShadow.themeTokens).toBe('shadows');
  });

  test('[Timer-THEME-002] a Timer saved before theme styles keeps its own shadow after load', async () => {
    // Break this catches: the load merge stamping the new-drop defaults onto saved widgets.
    const saved = componentDefinition(
      'timer1',
      'timer1',
      'Timer',
      {},
      {
        styles: {},
        seedFromRegisteredDefinition: false,
      }
    );
    saved.component.definition.generalStyles = { boxShadow: binding('5px 5px 0px 0px #00000040') };
    const { styles, generalStyles } = buildComponentMetaDefinition({ timer1: saved })['timer1'].component.definition;
    expect(styles).not.toHaveProperty('boxShadowStyle');
    expect(generalStyles ?? {}).not.toHaveProperty('boxShadowStyle');

    widget.render({ styles: { ...generalStyles, ...styles, boxShadowStyle: binding('custom') } });
    await waitFor(() => expect(shadowBox()).toBeTruthy());
    expect(getComputedStyle(shadowBox()).boxShadow).toBe('5px 5px 0px 0px #00000040');
  });

  test('[Timer-THEME-003] a theme item renders its variable with the saved value as fallback; custom renders the saved value', async () => {
    // Break this catches: the widget rendering its raw value whatever the theme style.
    widget.render({
      styles: {
        boxShadow: binding('0px 0px 0px 0px #00000040'),
        boxShadowStyle: binding('300'),
      },
    });
    await waitFor(() => expect(shadowBox()).toBeTruthy());
    expect(getComputedStyle(shadowBox()).boxShadow).toBe('var(--cc-box-shadow-300, 0px 0px 0px 0px #00000040)');

    widget.setComponentProperty('timer1', 'boxShadowStyle', 'custom', 'styles');
    await waitFor(() => expect(getComputedStyle(shadowBox()).boxShadow).toBe('0px 0px 0px 0px #00000040'));
  });
});
