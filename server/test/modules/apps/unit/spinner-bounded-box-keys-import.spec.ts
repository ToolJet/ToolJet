// Old exports skip the data migrations, so import must move the same Spinner/BoundedBox keys into properties.
import { migrateProperties } from 'src/modules/apps/services/app-import-export.service';

const importAs = (type: string, component: Record<string, unknown>, tooljetVersion: string | null = '3.16.0') =>
  migrateProperties(type as never, { type, ...component } as never, [] as never, tooljetVersion);

const legacySpinner = {
  properties: {},
  styles: { visibility: { value: '{{false}}' }, size: { value: 'lg' } },
  general: { tooltip: { value: '**Loading** data' } },
};

const legacyBoundedBox = {
  properties: { selector: { value: 'POINT' } },
  styles: { visibility: { value: '{{false}}' }, disabledState: { value: '{{true}}' } },
  general: { tooltip: { value: 'Draw <b>cars</b>' } },
};

describe('Spinner and BoundedBox keys on import', () => {
  describe.each([
    ['versioned', '3.16.0'],
    ['unversioned', null],
  ])('%s export', (_label, version) => {
    it('[Spinner-CMP-002] moves Spinner visibility and tooltip into properties with their values', () => {
      // Break this catches: importing an old export as-is (or moving it after the unversioned early return),
      // so the registered visibility default shows a saved hidden Spinner and its tooltip disappears.
      const { properties, styles, general } = importAs('Spinner', legacySpinner, version);

      expect(properties).toEqual({
        visibility: { value: '{{false}}' },
        tooltip: { value: '**Loading** data' },
        tooltipFormat: { value: 'plainText' },
      });
      expect(styles).toEqual({ size: { value: 'lg' } });
      expect(general.tooltip).toBeUndefined();
    });

    it('[BoundedBox-VIS-002] moves BoundedBox visibility, disabledState and tooltip into properties', () => {
      // Break this catches: a saved hidden or disabled BoundedBox becoming visible/editable after import.
      const { properties, styles, general } = importAs('BoundedBox', legacyBoundedBox, version);

      expect(properties).toEqual({
        selector: { value: 'POINT' },
        visibility: { value: '{{false}}' },
        disabledState: { value: '{{true}}' },
        tooltip: { value: 'Draw <b>cars</b>' },
        tooltipFormat: { value: 'plainText' },
      });
      expect(styles).toEqual({});
      expect(general.tooltip).toBeUndefined();
    });
  });

  it.each([
    ['Spinner-CMP-002', 'Spinner'],
    ['BoundedBox-VIS-002', 'BoundedBox'],
  ])('[%s] keeps %s keys already in properties', (_id, type) => {
    // Break this catches: overwriting the new keys, e.g. resetting a chosen Markdown format or visibility.
    const { properties, styles, general } = importAs(type, {
      properties: {
        visibility: { value: '{{true}}' },
        tooltip: { value: 'new' },
        tooltipFormat: { value: 'markdown' },
      },
      styles: { visibility: { value: '{{false}}' } },
      general: { tooltip: { value: 'old' } },
    });

    expect(properties).toMatchObject({
      visibility: { value: '{{true}}' },
      tooltip: { value: 'new' },
      tooltipFormat: { value: 'markdown' },
    });
    expect(styles.visibility).toBeUndefined();
    expect(general.tooltip).toBeUndefined();
  });
});
