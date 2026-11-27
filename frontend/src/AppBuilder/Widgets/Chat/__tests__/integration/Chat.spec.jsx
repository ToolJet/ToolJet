/**
 * Chat: theme scenarios of the widget's scoped contract
 * (frontend/ee/test/app-builder/widgets/Chat/TESTING.md). The rest of the
 * widget is deferred to its backfill (Chat-BACKFILL-001).
 *
 * Real store, real RenderWidget, real Chat. Nothing about the widget is mocked.
 */
import { waitFor } from '@testing-library/react';
import { createWidgetHarness, binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { componentDefinition } from '@/test/app-builder';
import { chatConfig } from '@tooljet/widget-definitions';
import { buildComponentMetaDefinition } from '@/_helpers/appUtils';

// jsdom has no layout, so no Element#scrollTo; Chat scrolls its message list on mount.
beforeAll(() => {
  if (!Element.prototype.scrollTo) Element.prototype.scrollTo = () => {};
});

const ID = 'chat1';
const widget = createWidgetHarness({ componentType: 'Chat', handle: 'chat1', id: ID });

// Chat's Box shadow control is a colour (`boxShadowContainer`): Custom draws a shadow in that colour.
const colourShadow = (colour) => `0px 8px 16px 0px ${colour}, 0px 0px 1px 0px ${colour}`;

// Theme border radius and box shadow (scoped contract D-02; Button's D-03..D-06 transferred).
describe('Chat: theme border radius and box shadow', () => {
  beforeEach(() => widget.setup());
  afterEach(() => widget.teardown());
  const box = () => document.querySelector('.chat-widget');
  const css = (prop) => getComputedStyle(box())[prop];

  test('[Chat-THEME-001] a newly dropped Chat starts on the theme Large radius and no shadow, with the theme dropdowns', () => {
    // Break this catches: the config losing the new-drop defaults or the inspector's theme dropdowns.
    expect(chatConfig.definition.styles.borderRadiusStyle).toEqual({ value: 'large' });
    expect(chatConfig.definition.styles.boxShadowContainerStyle).toEqual({ value: 'none' });
    expect(chatConfig.styles.borderRadius.themeTokens).toBe('borderRadius');
    expect(chatConfig.styles.boxShadowContainer.themeTokens).toBe('shadows');
  });

  test('[Chat-THEME-002] a Chat saved before theme styles keeps its own radius and colour shadow after load', async () => {
    // Break this catches: the load merge stamping the new-drop defaults onto saved widgets.
    const saved = componentDefinition(
      ID,
      ID,
      'Chat',
      {},
      {
        styles: { borderRadius: binding('{{10}}'), boxShadowContainer: binding('#ff0000') },
        seedFromRegisteredDefinition: false,
      }
    );
    const { styles } = buildComponentMetaDefinition({ [ID]: saved })[ID].component.definition;
    expect(styles).not.toHaveProperty('borderRadiusStyle');
    expect(styles).not.toHaveProperty('boxShadowContainerStyle');

    widget.render({
      styles: { ...styles, borderRadiusStyle: binding('custom'), boxShadowContainerStyle: binding('custom') },
    });
    await waitFor(() => expect(box()).toBeTruthy());
    expect(css('borderRadius')).toBe('10px');
    expect(css('boxShadow')).toBe(colourShadow('#ff0000'));
  });

  test('[Chat-THEME-003] a theme item renders its variable with the Custom value as fallback; custom renders the Custom value', async () => {
    // Break this catches: useComputedStyles rendering the raw radius / colour shadow whatever the theme style.
    widget.render({
      styles: {
        borderRadius: binding('{{6}}'),
        borderRadiusStyle: binding('medium'),
        boxShadowContainer: binding('#ff0000'),
        boxShadowContainerStyle: binding('300'),
      },
    });
    await waitFor(() => expect(box()).toBeTruthy());
    expect(css('borderRadius')).toBe('var(--cc-border-radius-medium, 6px)');
    expect(css('boxShadow')).toBe(`var(--cc-box-shadow-300, ${colourShadow('#ff0000')})`);

    widget.setComponentProperty(ID, 'boxShadowContainerStyle', 'custom', 'styles');
    widget.setComponentProperty(ID, 'borderRadiusStyle', 'custom', 'styles');
    await waitFor(() => expect(css('boxShadow')).toBe(colourShadow('#ff0000')));
    expect(css('borderRadius')).toBe('6px');
  });
});
