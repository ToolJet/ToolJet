/**
 * How a component update's definition is merged into the stored one.
 *
 * Updates deep-merge, and arrays merge by position. A pack component (PackComponent, LibraryComponent) sending its
 * tabs or steps without one kept the stored tail: [info] over [details, activity] saved [info, activity], so a tab
 * could not be removed through the API. Pack arrays are sent whole, as the native Tabs and Steps arrays are, so an
 * incoming array replaces the stored one. Everything else merges as before.
 */
import { mergeComponentDefinitionColumn } from '@modules/apps/services/component.service';

/** @group platform */
describe('mergeComponentDefinitionColumn', () => {
  // mergeWith writes into the stored value, so each case gets its own.
  const stored = () => ({
    tabs: {
      value: [
        { id: 'details', label: 'Details', icon: 'x' },
        { id: 'activity', label: 'Activity' },
      ],
    },
  });

  describe('a pack component', () => {
    it.each(['PackComponent', 'LibraryComponent'])('should save a %s array exactly as sent', (type) => {
      const merged = mergeComponentDefinitionColumn(type, stored(), {
        tabs: { value: [{ id: 'info', label: 'Info' }] },
      });

      expect(merged).toEqual({ tabs: { value: [{ id: 'info', label: 'Info' }] } });
    });

    it('should keep stored keys the update does not send', () => {
      const merged = mergeComponentDefinitionColumn(
        'PackComponent',
        { ...stored(), pack: { value: 'shadcn' } },
        {
          tabs: { value: [{ id: 'info' }] },
        }
      );

      expect(merged).toMatchObject({ pack: { value: 'shadcn' }, tabs: { value: [{ id: 'info' }] } });
    });

    it('should still merge an object sent where an array is stored, as before', () => {
      const merged = mergeComponentDefinitionColumn('PackComponent', stored(), {
        tabs: { value: { 0: { id: 'info' } } },
      });

      expect(merged.tabs.value[0]).toMatchObject({ id: 'info', label: 'Details' });
    });
  });

  describe('other components, unchanged', () => {
    it('should merge a Text array by position', () => {
      const merged = mergeComponentDefinitionColumn('Text', stored(), { tabs: { value: [{ id: 'info' }] } });

      expect(merged.tabs.value).toEqual([
        { id: 'info', label: 'Details', icon: 'x' },
        { id: 'activity', label: 'Activity' },
      ]);
    });

    it('should replace a native Tabs array', () => {
      const merged = mergeComponentDefinitionColumn('Tabs', stored(), { tabs: { value: [{ id: 'info' }] } });

      expect(merged.tabs.value).toEqual([{ id: 'info' }]);
    });

    it('should turn an object sent for a native Tabs array into an array', () => {
      const merged = mergeComponentDefinitionColumn('Tabs', stored(), { tabs: { value: { 0: { id: 'info' } } } });

      expect(merged.tabs.value).toEqual([{ id: 'info' }]);
    });

    it('should replace a Form object value', () => {
      const merged = mergeComponentDefinitionColumn(
        'Form',
        { JSONSchema: { value: { a: 1 } } },
        { JSONSchema: { value: { b: 2 } } }
      );

      expect(merged).toEqual({ JSONSchema: { value: { b: 2 } } });
    });
  });
});
