/**
 * Form — theme border radius and box shadow (scoped contract ee/test/app-builder/widgets/Form/TESTING.md, D-02;
 * Button's D-03..D-06 transferred).
 */
import { waitFor } from '@testing-library/react';
import { formConfig } from '@tooljet/widget-definitions';
import { buildComponentMetaDefinition } from '@/_helpers/appUtils';
import { componentDefinition } from '@/test/app-builder';
import { createWidgetHarness, binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'fm1';
const NAME = 'form1';
const widget = createWidgetHarness({ componentType: 'Form', handle: NAME, id: ID, capabilities: { dnd: true } });

// Theme border radius / box shadow (contract D-02; Button's D-03..D-06 transferred).
describe('Form: theme border radius and box shadow', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);
  const themedRoot = () => document.getElementById(ID);

  test('[Form-THEME-001] a newly dropped Form starts on the theme Large radius and no shadow, with the theme dropdowns', () => {
    // Break this catches: the config losing the new-drop defaults or the inspector's theme dropdowns.
    expect(formConfig.definition.styles.borderRadiusStyle).toEqual({ value: 'large' });
    expect(formConfig.definition.styles.boxShadowStyle).toEqual({ value: 'none' });
    expect(formConfig.styles.borderRadius.themeTokens).toBe('borderRadius');
    expect(formConfig.styles.boxShadow.themeTokens).toBe('shadows');
    // Form had no shadow: the new control defaults to none, so saved forms look the same.
    expect(formConfig.definition.styles.boxShadow).toEqual({ value: '0px 0px 0px 0px #00000040' });
  });

  test('[Form-THEME-002] a Form saved before theme styles keeps its own radius and shadow after load', async () => {
    // Break this catches: the load merge stamping the new-drop defaults (Large / None) onto saved widgets.
    const saved = componentDefinition(
      ID,
      NAME,
      'Form',
      {},
      {
        styles: { borderRadius: binding('10') },
        seedFromRegisteredDefinition: false,
      }
    );
    const { styles, generalStyles } = buildComponentMetaDefinition({ [ID]: saved })[ID].component.definition;
    expect(styles).not.toHaveProperty('borderRadiusStyle');
    expect(styles).not.toHaveProperty('boxShadowStyle');

    widget.render({ styles: { ...styles, borderRadiusStyle: binding('custom'), boxShadowStyle: binding('custom') } });
    await waitFor(() => expect(themedRoot()).toBeInTheDocument());
    expect(themedRoot().style.borderRadius).toBe('10px');
    expect(themedRoot().style.boxShadow).toBe('0px 0px 0px 0px #00000040');
  });

  test('[Form-THEME-003] a theme item renders its variable with the saved value as fallback, its shadow unclipped; custom renders the saved value', async () => {
    // Break this catches: the widget rendering its raw radius / shadow whatever the theme style.
    widget.render({
      styles: {
        borderRadius: binding('6'),
        borderRadiusStyle: binding('medium'),
        boxShadow: binding('0px 0px 0px 0px #00000040'),
        boxShadowStyle: binding('300'),
      },
    });
    await waitFor(() => expect(themedRoot()).toBeInTheDocument());
    expect(themedRoot().style.borderRadius).toBe('var(--cc-border-radius-medium, 6px)');
    expect(themedRoot().style.boxShadow).toBe('var(--cc-box-shadow-300, 0px 0px 0px 0px #00000040)');
    // The rounded corners clip with overflow, not clip-path: a clip-path would cut the shadow off.
    expect(themedRoot().style.clipPath).toBe('');
    expect(themedRoot().style.overflow).toBe('hidden');

    widget.setComponentProperty(ID, 'borderRadiusStyle', 'custom', 'styles');
    widget.setComponentProperty(ID, 'borderRadius', '10', 'styles');
    await waitFor(() => expect(themedRoot().style.borderRadius).toBe('10px'));
  });
});
