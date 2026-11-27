/**
 * Chart — theme border radius and box shadow (contract ee/test/app-builder/widgets/Chart/TESTING.md, D-02; Button's
 * D-03..D-06 transferred). Chart's Border radius (styles) and its General Box Shadow (generalStyles) become a dropdown
 * of the app theme's items plus Custom; new drops start on Large / None; saved charts keep their own values.
 */
import { waitFor } from '@testing-library/react';
import { chartConfig } from '@tooljet/widget-definitions';
import { componentDefinition } from '@/test/app-builder';
import { buildComponentMetaDefinition } from '@/_helpers/appUtils';
import { createWidgetHarness, binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'ch1';
const NAME = 'chart1';
const widget = createWidgetHarness({ componentType: 'Chart', handle: NAME, id: ID });
const chart = () => document.querySelector('.widget-chart');

describe('Chart: theme border radius and box shadow', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Chart-THEME-001] a newly dropped Chart starts on the theme Large radius and no shadow, with the theme dropdowns', () => {
    // Break this catches: chart.js losing the new-drop defaults or the inspector's theme dropdowns.
    expect(chartConfig.definition.styles.borderRadiusStyle).toEqual({ value: 'large' });
    expect(chartConfig.definition.generalStyles.boxShadowStyle).toEqual({ value: 'none' });
    expect(chartConfig.styles.borderRadius.themeTokens).toBe('borderRadius');
    expect(chartConfig.generalStyles.boxShadow.themeTokens).toBe('shadows');
  });

  test('[Chart-THEME-002] a Chart saved before theme styles keeps its own radius and shadow after load', async () => {
    // Break this catches: the load merge stamping the new-drop defaults (Large / None) onto saved charts, in styles or
    // in generalStyles.
    const saved = componentDefinition(
      ID,
      NAME,
      'Chart',
      {},
      { styles: { borderRadius: binding('{{10}}') }, seedFromRegisteredDefinition: false }
    );
    saved.component.definition.generalStyles = { boxShadow: binding('5px 5px 0px 0px #00000040') };
    const { styles, generalStyles } = buildComponentMetaDefinition({ [ID]: saved })[ID].component.definition;
    expect(styles).not.toHaveProperty('borderRadiusStyle');
    expect(generalStyles).not.toHaveProperty('boxShadowStyle');
    expect(generalStyles.boxShadow).toEqual(binding('5px 5px 0px 0px #00000040'));

    widget.render({
      styles: { ...generalStyles, ...styles, borderRadiusStyle: binding('custom'), boxShadowStyle: binding('custom') },
    });
    await waitFor(() => expect(chart()).toBeInTheDocument());
    expect(chart().style.borderRadius).toBe('10px');
    expect(chart().style.boxShadow).toBe('5px 5px 0px 0px #00000040');
  });

  test('[Chart-THEME-003] a theme item renders its variable with the saved value as fallback; custom renders the saved value', async () => {
    // Break this catches: Chart.jsx rendering the raw number / boxShadow whatever the theme style.
    widget.render({
      styles: {
        borderRadius: binding('{{6}}'),
        borderRadiusStyle: binding('medium'),
        boxShadow: binding('0px 0px 0px 0px #00000040'),
        boxShadowStyle: binding('300'),
      },
    });
    await waitFor(() => expect(chart()).toBeInTheDocument());
    expect(chart().style.borderRadius).toBe('var(--cc-border-radius-medium, 6px)');
    expect(chart().style.boxShadow).toBe('var(--cc-box-shadow-300, 0px 0px 0px 0px #00000040)');

    widget.setComponentProperty(ID, 'borderRadiusStyle', 'custom', 'styles');
    widget.setComponentProperty(ID, 'borderRadius', '{{10}}', 'styles');
    await waitFor(() => expect(chart().style.borderRadius).toBe('10px'));
  });
});
