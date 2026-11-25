/**
 * Table — theme border radius and box shadow (contract ee/test/app-builder/widgets/Table/TESTING.md, D-02; Button's
 * D-03..D-06 transferred). The Container's Border radius / Box Shadow become a dropdown of the app theme's items plus
 * Custom; new drops start on Large / None; saved tables keep their own values.
 */
import { waitFor } from '@testing-library/react';
import { tableConfig } from '@tooljet/widget-definitions';
import { componentDefinition } from '@/test/app-builder';
import { buildComponentMetaDefinition } from '@/_helpers/appUtils';
import { createWidgetHarness, binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'tb1';
const NAME = 'table1';
const widget = createWidgetHarness({ componentType: 'Table', handle: NAME, id: ID });
const table = () => document.querySelector('.jet-table');

describe('Table: theme border radius and box shadow', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Table-THEME-001] a newly dropped Table starts on the theme Large radius and no shadow, with the theme dropdowns', () => {
    // Break this catches: table.js losing the new-drop defaults or the inspector's theme dropdowns.
    expect(tableConfig.definition.styles.borderRadiusStyle).toEqual({ value: 'large' });
    expect(tableConfig.definition.styles.boxShadowStyle).toEqual({ value: 'none' });
    expect(tableConfig.styles.borderRadius.themeTokens).toBe('borderRadius');
    expect(tableConfig.styles.boxShadow.themeTokens).toBe('shadows');
  });

  test('[Table-THEME-002] a Table saved before theme styles keeps its own radius and shadow after load', async () => {
    // Break this catches: the load merge stamping the new-drop defaults (Large / None) onto saved tables.
    const savedStyles = { borderRadius: binding('10'), boxShadow: binding('5px 5px 0px 0px #00000040') };
    const saved = componentDefinition(
      ID,
      NAME,
      'Table',
      {},
      { styles: savedStyles, seedFromRegisteredDefinition: false }
    );
    const { styles } = buildComponentMetaDefinition({ [ID]: saved })[ID].component.definition;
    expect(styles).not.toHaveProperty('borderRadiusStyle');
    expect(styles).not.toHaveProperty('boxShadowStyle');

    widget.render({ styles: { ...styles, borderRadiusStyle: binding('custom'), boxShadowStyle: binding('custom') } });
    await waitFor(() => expect(table()).toBeInTheDocument());
    expect(table().style.borderRadius).toBe('10px');
    expect(table().style.boxShadow).toBe('5px 5px 0px 0px #00000040');
  });

  test('[Table-THEME-003] a theme item renders its variable with the saved value as fallback; custom renders the saved value', async () => {
    // Break this catches: the table store or Table.jsx dropping the theme style and rendering the raw values.
    widget.render({
      styles: {
        borderRadius: binding('6'),
        borderRadiusStyle: binding('medium'),
        boxShadow: binding('0px 0px 0px 0px #00000040'),
        boxShadowStyle: binding('300'),
      },
    });
    await waitFor(() => expect(table()).toBeInTheDocument());
    expect(table().style.borderRadius).toBe('var(--cc-border-radius-medium, 6px)');
    expect(table().style.boxShadow).toBe('var(--cc-box-shadow-300, 0px 0px 0px 0px #00000040)');

    widget.setComponentProperty(ID, 'borderRadiusStyle', 'custom', 'styles');
    widget.setComponentProperty(ID, 'borderRadius', '10', 'styles');
    await waitFor(() => expect(table().style.borderRadius).toBe('10px'));
  });
});
