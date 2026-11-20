/**
 * Checkbox ships `dynamicHeight` on. The BackfillCheckboxDynamicHeightOff migration pins it off on
 * components already in this database, but an app exported before the property existed and imported
 * afterwards never passes through that migration — it is written fresh from the export JSON. Without
 * a pin on the import path too, such an app picks up the new default and resizes.
 */
import { migrateProperties } from 'src/modules/apps/services/app-import-export.service';

const importCheckbox = (properties: Record<string, unknown>) =>
  migrateProperties('Checkbox' as never, { type: 'Checkbox', properties } as never, [] as never, '3.16.0').properties;

describe('Checkbox dynamicHeight on import', () => {
  it('pins dynamicHeight off when the export predates the property', () => {
    // Break this catches: leaving the key absent, so buildComponentMetaDefinition fills it from the
    // config default and every checkbox in the imported app starts growing.
    expect(importCheckbox({ label: { value: 'Accept' } }).dynamicHeight).toEqual({ value: '{{false}}' });
  });

  it('keeps an explicit value the export already carried', () => {
    // Break this catches: overwriting unconditionally, which would silently disable the property for
    // anyone who had deliberately turned it on before exporting.
    expect(importCheckbox({ dynamicHeight: { value: '{{true}}' } }).dynamicHeight).toEqual({ value: '{{true}}' });
  });

  it('leaves other component types alone', () => {
    const properties = migrateProperties(
      'RadioButtonV2' as never,
      { type: 'RadioButtonV2', properties: {} } as never,
      [] as never,
      '3.16.0'
    ).properties;

    expect(properties.dynamicHeight).toBeUndefined();
  });
});
