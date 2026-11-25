/**
 * Listview — theme border radius and box shadow (scoped contract ee/test/app-builder/widgets/Listview/TESTING.md, D-02;
 * Button's D-03..D-06 transferred).
 */
import { waitFor } from '@testing-library/react';
import { listviewConfig } from '@tooljet/widget-definitions';
import { buildComponentMetaDefinition } from '@/_helpers/appUtils';
import { componentDefinition } from '@/test/app-builder';
import { createWidgetHarness, binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'lv1';
const NAME = 'listview1';
const widget = createWidgetHarness({ componentType: 'Listview', handle: NAME, id: ID, capabilities: { dnd: true } });

// Theme border radius / box shadow (contract D-02; Button's D-03..D-06 transferred).
describe('Listview: theme border radius and box shadow', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);
  const themedRoot = () => document.getElementById(ID);

  test('[Listview-THEME-001] a newly dropped Listview starts on the theme Large radius and no shadow, with the theme dropdowns', () => {
    // Break this catches: the config losing the new-drop defaults or the inspector's theme dropdowns.
    expect(listviewConfig.definition.styles.borderRadiusStyle).toEqual({ value: 'large' });
    expect(listviewConfig.definition.styles.boxShadowStyle).toEqual({ value: 'none' });
    expect(listviewConfig.styles.borderRadius.themeTokens).toBe('borderRadius');
    expect(listviewConfig.styles.boxShadow.themeTokens).toBe('shadows');
  });

  test('[Listview-THEME-002] a Listview saved before theme styles keeps its own radius and shadow after load', async () => {
    // Break this catches: the load merge stamping the new-drop defaults (Large / None) onto saved widgets.
    const saved = componentDefinition(
      ID,
      NAME,
      'Listview',
      {},
      {
        styles: { borderRadius: binding('{{10}}'), boxShadow: binding('5px 5px 0px 0px #00000040') },
        seedFromRegisteredDefinition: false,
      }
    );
    const { styles, generalStyles } = buildComponentMetaDefinition({ [ID]: saved })[ID].component.definition;
    expect(styles).not.toHaveProperty('borderRadiusStyle');
    expect(styles).not.toHaveProperty('boxShadowStyle');

    widget.render({ styles: { ...styles, borderRadiusStyle: binding('custom'), boxShadowStyle: binding('custom') } });
    await waitFor(() => expect(themedRoot()).toBeInTheDocument());
    expect(themedRoot().style.borderRadius).toBe('10px');
    expect(themedRoot().style.boxShadow).toBe('5px 5px 0px 0px #00000040');
  });

  test('[Listview-THEME-003] a theme item renders its variable with the saved value as fallback; custom renders the saved value', async () => {
    // Break this catches: the widget rendering its raw radius / shadow whatever the theme style.
    widget.render({
      styles: {
        borderRadius: binding('{{6}}'),
        borderRadiusStyle: binding('medium'),
        boxShadow: binding('0px 0px 0px 0px #00000040'),
        boxShadowStyle: binding('300'),
      },
    });
    await waitFor(() => expect(themedRoot()).toBeInTheDocument());
    expect(themedRoot().style.borderRadius).toBe('var(--cc-border-radius-medium, 6px)');
    expect(themedRoot().style.boxShadow).toBe('var(--cc-box-shadow-300, 0px 0px 0px 0px #00000040)');

    widget.setComponentProperty(ID, 'borderRadiusStyle', 'custom', 'styles');
    widget.setComponentProperty(ID, 'borderRadius', '{{10}}', 'styles');
    await waitFor(() => expect(themedRoot().style.borderRadius).toBe('10px'));
  });
});
