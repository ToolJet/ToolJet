/**
 * TagsInput: theme scenarios of the widget's scoped contract
 * (frontend/ee/test/app-builder/widgets/TagsInput/TESTING.md). The rest of the
 * widget is deferred to its backfill (TagsInput-BACKFILL-001).
 *
 * Real store, real RenderWidget, real TagsInput. Nothing about the widget is mocked.
 */
import { waitFor } from '@testing-library/react';
import { createWidgetHarness, binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { componentDefinition } from '@/test/app-builder';
import { tagsInputConfig } from '@tooljet/widget-definitions';
import { buildComponentMetaDefinition } from '@/_helpers/appUtils';

const widget = createWidgetHarness({ componentType: 'TagsInput', handle: 'tagsinput1', id: 'tags1' });

// Theme border radius / box shadow (scoped contract D-02; Button's D-03..D-06 transferred).
describe('TagsInput: theme border radius and box shadow', () => {
  beforeEach(() => widget.setup());
  afterEach(() => widget.teardown());
  const themedBox = () => document.querySelector('[class$="-control"]');
  // Computed, not inline: some fields are styled through react-select's emotion classes.
  const css = (prop) => getComputedStyle(themedBox())[prop];

  test('[TagsInput-THEME-001] a newly dropped TagsInput starts on the theme Large radius and no shadow, with the theme dropdowns', () => {
    // Break this catches: the config losing the new-drop defaults or the inspector's theme dropdowns.
    expect(tagsInputConfig.definition.styles.fieldBorderRadiusStyle).toEqual({ value: 'large' });
    expect(tagsInputConfig.definition.styles.boxShadowStyle).toEqual({ value: 'none' });
    expect(tagsInputConfig.styles.fieldBorderRadius.themeTokens).toBe('borderRadius');
    expect(tagsInputConfig.styles.boxShadow.themeTokens).toBe('shadows');
  });

  test('[TagsInput-THEME-002] a TagsInput saved before theme styles keeps its own radius and shadow after load', async () => {
    // Break this catches: the load merge stamping the new-drop defaults onto saved widgets.
    const saved = componentDefinition(
      'tags1',
      'tags1',
      'TagsInput',
      {},
      {
        styles: { fieldBorderRadius: binding('{{10}}'), boxShadow: binding('5px 5px 0px 0px #00000040') },
        seedFromRegisteredDefinition: false,
      }
    );
    const { styles } = buildComponentMetaDefinition({ tags1: saved })['tags1'].component.definition;
    expect(styles).not.toHaveProperty('fieldBorderRadiusStyle');
    expect(styles).not.toHaveProperty('boxShadowStyle');

    widget.render({
      styles: { ...styles, fieldBorderRadiusStyle: binding('custom'), boxShadowStyle: binding('custom') },
    });
    await waitFor(() => expect(themedBox()).toBeTruthy());
    expect(css('borderRadius')).toBe('10px');
    expect(css('boxShadow')).toBe('5px 5px 0px 0px #00000040');
  });

  test('[TagsInput-THEME-003] a theme item renders its variable with the saved value as fallback; custom renders the saved value', async () => {
    // Break this catches: the widget rendering its raw radius / shadow whatever the theme style.
    widget.render({
      styles: {
        fieldBorderRadius: binding('{{6}}'),
        fieldBorderRadiusStyle: binding('medium'),
        boxShadow: binding('0px 0px 0px 0px #00000040'),
        boxShadowStyle: binding('300'),
      },
    });
    await waitFor(() => expect(themedBox()).toBeTruthy());
    expect(css('borderRadius')).toBe('var(--cc-border-radius-medium, 6px)');
    expect(css('boxShadow')).toBe('var(--cc-box-shadow-300, 0px 0px 0px 0px #00000040)');

    widget.setComponentProperty('tags1', 'fieldBorderRadiusStyle', 'custom', 'styles');
    widget.setComponentProperty('tags1', 'fieldBorderRadius', '{{10}}', 'styles');
    await waitFor(() => expect(css('borderRadius')).toBe('10px'));
  });
});
