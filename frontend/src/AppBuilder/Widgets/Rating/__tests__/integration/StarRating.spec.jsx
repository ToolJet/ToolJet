/**
 * StarRating: theme box shadow scenarios of the widget's scoped contract
 * (frontend/ee/test/app-builder/widgets/StarRating/TESTING.md). The rest of the
 * widget is deferred to its backfill (StarRating-BACKFILL-001).
 *
 * Real store, real RenderWidget, real Rating. Nothing about the widget is mocked.
 */
import { waitFor } from '@testing-library/react';
import { createWidgetHarness, binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { componentDefinition } from '@/test/app-builder';
import { starratingConfig } from '@tooljet/widget-definitions';
import { buildComponentMetaDefinition } from '@/_helpers/appUtils';

const widget = createWidgetHarness({ componentType: 'StarRating', handle: 'starrating1', id: 'sr1' });

// Theme border radius / box shadow (scoped contract D-02; Button's D-03..D-06 transferred).
describe('StarRating: theme box shadow', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);
  const themedBox = () => document.querySelector('[data-cy="starrating1"]');

  test('[StarRating-THEME-001] a newly dropped StarRating starts with no theme shadow, with the theme dropdown', () => {
    // Break this catches: the config losing the new-drop defaults or the inspector's theme dropdowns.
    expect(starratingConfig.definition.styles.boxShadowStyle).toEqual({ value: 'none' });
    expect(starratingConfig.styles.boxShadow.themeTokens).toBe('shadows');
  });

  test('[StarRating-THEME-002] a StarRating saved before theme styles keeps its own shadow after load', async () => {
    // Break this catches: the load merge stamping the new-drop defaults onto saved widgets.
    const saved = componentDefinition(
      'sr1',
      'sr1',
      'StarRating',
      {},
      {
        styles: { boxShadow: binding('5px 5px 0px 0px #00000040') },
        seedFromRegisteredDefinition: false,
      }
    );
    const { styles, generalStyles } = buildComponentMetaDefinition({ sr1: saved })['sr1'].component.definition;
    expect(styles).not.toHaveProperty('borderRadiusStyle');
    expect(styles).not.toHaveProperty('boxShadowStyle');
    expect(generalStyles ?? {}).not.toHaveProperty('boxShadowStyle');

    widget.render({
      styles: { ...styles, ...generalStyles, borderRadiusStyle: binding('custom'), boxShadowStyle: binding('custom') },
    });
    await waitFor(() => expect(themedBox()).toBeTruthy());
    expect(themedBox().style.boxShadow).toBe('5px 5px 0px 0px #00000040');
  });

  test('[StarRating-THEME-003] a theme item renders its variable with the saved value as fallback; custom renders the saved value', async () => {
    // Break this catches: the widget rendering its raw shadow whatever the theme style.
    widget.render({
      styles: {
        boxShadow: binding('0px 0px 0px 0px #00000040'),
        boxShadowStyle: binding('300'),
      },
    });
    await waitFor(() => expect(themedBox()).toBeTruthy());
    expect(themedBox().style.boxShadow).toBe('var(--cc-box-shadow-300, 0px 0px 0px 0px #00000040)');

    widget.setComponentProperty('sr1', 'boxShadowStyle', 'custom', 'styles');
    await waitFor(() => expect(themedBox().style.boxShadow).toBe('0px 0px 0px 0px #00000040'));
  });
});
