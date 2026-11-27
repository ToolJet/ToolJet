/**
 * IFrame: theme scenarios of the widget's scoped contract
 * (frontend/ee/test/app-builder/widgets/IFrame/TESTING.md). The rest of the
 * widget is deferred to its backfill (IFrame-BACKFILL-001).
 *
 * Real store, real RenderWidget, real IFrame. Nothing about the widget is mocked.
 */
import { waitFor } from '@testing-library/react';
import { createWidgetHarness, binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { componentDefinition } from '@/test/app-builder';
import { iframeConfig } from '@tooljet/widget-definitions';
import { buildComponentMetaDefinition } from '@/_helpers/appUtils';

const widget = createWidgetHarness({ componentType: 'IFrame', handle: 'iframe1', id: 'iframe1' });

// Theme box shadow (scoped contract D-02; Button's D-03..D-06 transferred).
describe('IFrame: theme box shadow', () => {
  beforeEach(() => widget.setup());
  afterEach(() => widget.teardown());
  const shadowBox = () => document.querySelector('[data-cy="iframe1"]');

  test('[IFrame-THEME-001] a newly dropped IFrame starts with no theme shadow, with the theme dropdown', () => {
    // Break this catches: the config losing the new-drop defaults or the inspector's theme dropdowns.
    expect(iframeConfig.definition.styles.boxShadowStyle).toEqual({ value: 'none' });
    expect(iframeConfig.styles.boxShadow.themeTokens).toBe('shadows');
  });

  test('[IFrame-THEME-002] a IFrame saved before theme styles keeps its own shadow after load', async () => {
    // Break this catches: the load merge stamping the new-drop defaults onto saved widgets.
    const saved = componentDefinition(
      'iframe1',
      'iframe1',
      'IFrame',
      {},
      {
        styles: { boxShadow: binding('5px 5px 0px 0px #00000040') },
        seedFromRegisteredDefinition: false,
      }
    );
    const { styles, generalStyles } = buildComponentMetaDefinition({ iframe1: saved })['iframe1'].component.definition;
    expect(styles).not.toHaveProperty('boxShadowStyle');
    expect(generalStyles ?? {}).not.toHaveProperty('boxShadowStyle');

    widget.render({ styles: { ...generalStyles, ...styles, boxShadowStyle: binding('custom') } });
    await waitFor(() => expect(shadowBox()).toBeTruthy());
    expect(getComputedStyle(shadowBox()).boxShadow).toBe('5px 5px 0px 0px #00000040');
  });

  test('[IFrame-THEME-003] a theme item renders its variable with the saved value as fallback; custom renders the saved value', async () => {
    // Break this catches: the widget rendering its raw value whatever the theme style.
    widget.render({
      styles: {
        boxShadow: binding('0px 0px 0px 0px #00000040'),
        boxShadowStyle: binding('300'),
      },
    });
    await waitFor(() => expect(shadowBox()).toBeTruthy());
    expect(getComputedStyle(shadowBox()).boxShadow).toBe('var(--cc-box-shadow-300, 0px 0px 0px 0px #00000040)');

    widget.setComponentProperty('iframe1', 'boxShadowStyle', 'custom', 'styles');
    await waitFor(() => expect(getComputedStyle(shadowBox()).boxShadow).toBe('0px 0px 0px 0px #00000040'));
  });
});
