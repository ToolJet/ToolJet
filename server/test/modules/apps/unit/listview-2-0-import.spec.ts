/**
 * ListView 2.0 changes the widget in place. An app exported before 2.0 has ListViews without any
 * 2.0 key. Import writes them as they are (no backfill), and every load merges the widget config
 * defaults under them, so those defaults must be the old look.
 */
import { migrateProperties } from 'src/modules/apps/services/app-import-export.service';
import { AppsUtilService } from '@modules/apps/util.service';
import { Component } from 'src/entities/component.entity';

// Only the setting columns import reads; the rest of the entity is irrelevant here.
const preTwoZeroListview = (): Component =>
  ({
    type: 'Listview',
    properties: {
      data: { value: "{{[{ text: 'a' }]}}" },
      rowHeight: { value: '100' },
      showBorder: { value: '{{true}}' },
    },
    styles: { backgroundColor: { value: 'var(--cc-surface1-surface)' } },
    general: {},
    generalStyles: {},
    validation: {},
  }) as unknown as Component;

type SettingValues = Record<string, { value: unknown } | undefined>;
// buildComponentMetaDefinition is untyped ({} in, {} out); this is the part of its output read here.
type LoadedComponents = Record<
  string,
  { component: { definition: { properties: SettingValues; styles: SettingValues } } }
>;

/** Import, then the load-time merge the editor and the released app both go through. */
function importAndLoad(tooljetVersion: string | null) {
  const imported = migrateProperties('Listview', preTwoZeroListview(), [], tooljetVersion);
  // buildComponentMetaDefinition uses none of the injected services.
  const utilService = new (AppsUtilService as unknown as new () => AppsUtilService)();
  const loaded = utilService.buildComponentMetaDefinition({
    lv1: {
      component: { component: 'Listview', name: 'listview1', definition: { ...imported, others: {} } },
      layouts: {},
    },
  }) as unknown as LoadedComponents;
  return loaded.lv1.component.definition;
}

describe('ListView 2.0: an export from before 2.0', () => {
  it.each([
    ['a versioned export', '3.16.0'],
    ['an unversioned export', null],
  ])('[Listview-COMPAT-003] %s imports with the old look', (_label, tooljetVersion) => {
    // Break this catches: a config default for a 2.0 key set to the new look, or an import
    // backfill that writes creation values, either of which restyles every imported ListView.
    const { properties, styles } = importAndLoad(tooljetVersion);

    expect(styles.listStyle).toEqual({ value: 'legacy' });
    expect(styles.gap).toEqual({ value: '{{0}}' });
    expect(properties.showHeader).toEqual({ value: '{{false}}' });
    expect(properties.paginationType).toEqual({ value: 'clientSide' });
    expect(properties.rowHeight).toEqual({ value: '100' });
    expect(properties.gridRecordHeight).toBeUndefined();
    expect(styles.recordBorderColor).toBeUndefined();
    expect(styles.recordBackgroundColor).toBeUndefined();
  });
});
