/**
 * Unit tests for migrateProperties (app import) — relocation of keys that moved between
 * properties and styles in Navigation and Steps.
 *
 * Apps exported before those widget refactors still carry the old keys, which the widget's
 * hardcoded defaults would silently shadow. migrateProperties relocates them at import time,
 * mirroring the one-off data migrations.
 */

import { migrateProperties, NewRevampedComponents } from '@modules/apps/services/app-import-export.service';

const TOOLJET_VERSION = '3.5.0';
const NAV_LAYOUT_KEYS = ['orientation', 'displayStyle', 'navItemSize', 'horizontalAlignment', 'verticalAlignment'];

// Production passes NewRevampedComponents, which has 'Steps' but not 'Navigation': the Navigation
// relocation must keep working outside the revamped-components gate, so use the real list here.
type MigrateArgs = Parameters<typeof migrateProperties>;
type StyleMap = Record<string, { value: unknown }>;

const migrate = (type: string, component: { properties?: StyleMap; styles?: StyleMap }) =>
  migrateProperties(
    type as MigrateArgs[0],
    component as unknown as MigrateArgs[1],
    NewRevampedComponents,
    TOOLJET_VERSION
  );

describe('migrateProperties', () => {
  describe('Navigation', () => {
    it('moves layout keys from properties to styles', () => {
      const properties = Object.fromEntries(NAV_LAYOUT_KEYS.map((key) => [key, { value: `${key}-legacy` }]));

      const result = migrate('Navigation', { properties, styles: {} });

      for (const key of NAV_LAYOUT_KEYS) {
        expect(result.styles[key]).toEqual({ value: `${key}-legacy` });
        expect(result.properties[key]).toBeUndefined();
      }
    });

    it('keeps the style value and drops the property when both exist', () => {
      const result = migrate('Navigation', {
        properties: { orientation: { value: 'horizontal' } },
        styles: { orientation: { value: 'vertical' } },
      });

      expect(result.styles.orientation).toEqual({ value: 'vertical' });
      expect(result.properties.orientation).toBeUndefined();
    });

    it('leaves unrelated properties and styles untouched', () => {
      const result = migrate('Navigation', {
        properties: { menuItems: { value: '[]' }, orientation: { value: 'horizontal' } },
        styles: { textColor: { value: '#000' } },
      });

      expect(result.properties.menuItems).toEqual({ value: '[]' });
      expect(result.styles.textColor).toEqual({ value: '#000' });
    });

    it('does not add layout keys to styles when properties has none', () => {
      const result = migrate('Navigation', { properties: {}, styles: {} });

      for (const key of NAV_LAYOUT_KEYS) {
        expect(result.styles[key]).toBeUndefined();
      }
    });

    it('does not relocate these keys for other component types', () => {
      const result = migrate('Button', { properties: { orientation: { value: 'horizontal' } }, styles: {} });

      expect(result.properties.orientation).toEqual({ value: 'horizontal' });
      expect(result.styles.orientation).toBeUndefined();
    });
  });

  describe('Steps', () => {
    it('moves styles.theme to properties.variant', () => {
      const result = migrate('Steps', { properties: {}, styles: { theme: { value: 'numbers' } } });

      expect(result.properties.variant).toEqual({ value: 'numbers' });
      expect(result.styles.theme).toBeUndefined();
    });

    it('moves styles.color to styles.completedAccent', () => {
      const result = migrate('Steps', { properties: {}, styles: { color: { value: '#ff0000' } } });

      expect(result.styles.completedAccent).toEqual({ value: '#ff0000' });
      expect(result.styles.color).toBeUndefined();
    });

    it('copies styles.textColor to the completed, incompleted and current step label styles', () => {
      const result = migrate('Steps', { properties: {}, styles: { textColor: { value: '#00ff00' } } });

      expect(result.styles.completedLabel).toEqual({ value: '#00ff00' });
      expect(result.styles.incompletedLabel).toEqual({ value: '#00ff00' });
      expect(result.styles.currentStepLabel).toEqual({ value: '#00ff00' });
      expect(result.styles.textColor).toBeUndefined();
    });

    it('does not overwrite values already present at the new location', () => {
      const result = migrate('Steps', {
        properties: { variant: { value: 'titles' } },
        styles: {
          theme: { value: 'numbers' },
          color: { value: '#ff0000' },
          completedAccent: { value: '#111111' },
          textColor: { value: '#00ff00' },
          completedLabel: { value: '#222222' },
        },
      });

      expect(result.properties.variant).toEqual({ value: 'titles' });
      expect(result.styles.completedAccent).toEqual({ value: '#111111' });
      expect(result.styles.completedLabel).toEqual({ value: '#222222' });
      // Only the label styles that were missing get the legacy textColor.
      expect(result.styles.incompletedLabel).toEqual({ value: '#00ff00' });
      expect(result.styles.currentStepLabel).toEqual({ value: '#00ff00' });
      expect(result.styles.theme).toBeUndefined();
      expect(result.styles.color).toBeUndefined();
      expect(result.styles.textColor).toBeUndefined();
    });

    it('still migrates the legacy steps property to schema', () => {
      const steps = { value: '[{"name":"Step 1"}]' };

      const result = migrate('Steps', { properties: { steps }, styles: { theme: { value: 'numbers' } } });

      expect(result.properties.schema).toEqual(steps);
      expect(result.properties.steps).toBeUndefined();
      expect(result.properties.variant).toEqual({ value: 'numbers' });
    });

    it('does not mutate the component passed in', () => {
      const component = { properties: {}, styles: { theme: { value: 'numbers' } } };

      migrate('Steps', component);

      expect(component.styles.theme).toEqual({ value: 'numbers' });
    });
  });
});
