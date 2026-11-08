import { migrateProperties } from 'src/modules/apps/services/app-import-export.service';
import { AppsUtilService } from '@modules/apps/util.service';
import { Component } from 'src/entities/component.entity';
import { remapRecordLayoutIds } from '@helpers/record_layouts.helper';
import { transformComponentData } from 'src/modules/apps/services/app-import-export.service';

describe('listview-2-0-import', () => {
  /**
   * ListView 2.0 changes the widget in place. An app exported before 2.0 has ListViews without any
   * 2.0 key. Import writes them as they are (no backfill), and every load merges the widget config
   * defaults under them, so those defaults must be the old look.
   */

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
      expect(properties.serverSidePagination).toEqual({ value: '{{false}}' });
      expect(properties.rowHeight).toEqual({ value: '100' });
      expect(properties.gridRecordHeight).toBeUndefined();
      expect(styles.recordBorderColor).toBeUndefined();
      expect(styles.recordBackgroundColor).toBeUndefined();
    });
  });
});

describe('record-layouts-remap', () => {
  /**
   * A ListView remembers each Layout's child boxes in `properties.recordLayouts`, keyed by child component id.
   * Components get new ids on a new version, an app import and a page duplicate, so the keys must follow
   * (the same way Form's `buttonToSubmit` does); ids with no mapping are dropped.
   */

  const box = (left: number) => ({ top: 10, left, width: 6, height: 30 });

  describe('remapRecordLayoutIds', () => {
    const properties = {
      mode: { value: 'list' },
      recordLayouts: { value: { list: { a: box(1), b: box(2), gone: box(3) }, grid: { a: box(4) } } },
    };

    it('moves every saved box under the new id of its child, in both Layouts', () => {
      const result = remapRecordLayoutIds(properties, { a: 'A2', b: 'B2' });

      expect(result.recordLayouts.value).toEqual({ list: { A2: box(1), B2: box(2) }, grid: { A2: box(4) } });
      expect(result.mode).toEqual({ value: 'list' });
    });

    it('drops ids that have no mapping', () => {
      const result = remapRecordLayoutIds(properties, { a: 'A2' });

      expect(Object.keys(result.recordLayouts.value.list)).toEqual(['A2']);
    });

    it('does not change the properties it was given', () => {
      const before = JSON.stringify(properties);

      remapRecordLayoutIds(properties, { a: 'A2' });

      expect(JSON.stringify(properties)).toBe(before);
    });

    it('returns properties without the memory, or with a malformed one, as they are', () => {
      const plain = { mode: { value: 'list' } };

      expect(remapRecordLayoutIds(plain, { a: 'A2' })).toBe(plain);
      expect(remapRecordLayoutIds(undefined as any, {})).toBeUndefined();
      const odd = { recordLayouts: { value: 'x' } };
      expect(remapRecordLayoutIds(odd, {})).toBe(odd);
    });

    it('does not map an inherited key such as constructor', () => {
      const result = remapRecordLayoutIds({ recordLayouts: { value: { list: { constructor: box(1) } } } }, {});

      expect(result.recordLayouts.value.list).toEqual({});
    });

    it('[Listview-GRID-016] keeps a Layout entry that is not an object as it is', () => {
      const odd = { recordLayouts: { value: { list: 'abc', grid: { a: box(1) } } } };

      const result = remapRecordLayoutIds(odd, { a: 'A2' });

      expect(result.recordLayouts.value).toEqual({ list: 'abc', grid: { A2: box(1) } });
    });
  });
});

describe('record-layouts-legacy-import', () => {
  /**
   * An old-format export carries components inside the definition, and import gives each a new id while it walks them.
   * A ListView's `properties.recordLayouts` is keyed by child id, so its keys must follow, including children that
   * come after the ListView in the walk.
   */

  const box = (left: number) => ({ top: 10, left, width: 6, height: 30 });
  const LAYOUTS = { desktop: box(1), mobile: box(1) };

  const page = () => ({
    lv: {
      layouts: LAYOUTS,
      component: {
        name: 'listview1',
        component: 'Listview',
        definition: {
          properties: { recordLayouts: { value: { list: { txt: box(2), gone: box(3) }, grid: { txt: box(4) } } } },
          styles: {},
          general: {},
          validation: {},
          generalStyles: {},
          others: {},
          events: [],
        },
      },
    },
    txt: {
      parent: 'lv',
      layouts: LAYOUTS,
      component: {
        name: 'text1',
        component: 'Text',
        definition: {
          properties: {},
          styles: {},
          general: {},
          validation: {},
          generalStyles: {},
          others: {},
          events: [],
        },
      },
    },
  });

  describe('old-format import of a ListView layout memory', () => {
    it('[Listview-GRID-016] re-keys the memory to the new child ids, also for a child later in the walk', () => {
      const mapping: Record<string, string> = {};

      const [listview, text] = transformComponentData(page(), [], mapping, false, '3.0.0');

      expect(text.id).toBe(mapping.txt);
      expect(listview.properties.recordLayouts.value).toEqual({
        list: { [text.id]: box(2) },
        grid: { [text.id]: box(4) },
      });
    });
  });
});
