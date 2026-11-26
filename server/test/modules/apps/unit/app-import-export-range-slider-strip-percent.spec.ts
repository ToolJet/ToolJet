/**
 * Importing an app must keep its range sliders' mark labels as they looked when it was exported.
 *
 * RangeSliderV2 used to strip the first `%` from every mark label. Since 4.0.5-beta it strips only on sliders marked
 * with `stripPercent`, which BackfillStripPercentRangeSliderV2 writes onto sliders that existed at the upgrade. An
 * export from an earlier release carries no key on any slider, so the import has to mark them; an export from
 * 4.0.5-beta on has its old sliders marked already, and a slider without the key there is a new one.
 */

import { Component } from '@entities/component.entity';
import { migrateProperties } from '@modules/apps/services/app-import-export.service';

const STRIP = { value: '{{true}}' };
const MARKS = { value: '{{[{label: "25%", value: 25}]}}' };

/** The imported slider's `stripPercent`; the import adds other keys too, which other specs cover. */
const importedStripPercent = (properties: Record<string, { value: unknown }>, tooljetVersion: string) =>
  migrateProperties('RangeSliderV2', { properties } as unknown as Component, [], tooljetVersion).properties
    .stripPercent;

describe('app import: RangeSlider percent sign in mark labels', () => {
  describe('an export from before 4.0.5-beta', () => {
    it.each(['4.0.4-beta', '3.21.99-lts', '3.21.87'])(
      'should mark a slider from %s to keep stripping the %%',
      (version) => {
        expect(importedStripPercent({ marks: MARKS }, version)).toEqual(STRIP);
      }
    );

    it('should keep a value the export already has', () => {
      expect(importedStripPercent({ stripPercent: { value: '{{false}}' } }, '4.0.4-beta')).toEqual({
        value: '{{false}}',
      });
    });
  });

  describe('an export from 4.0.5-beta on', () => {
    it.each(['4.0.5-beta', '4.1.0'])('should leave a slider from %s without the key, as a new slider', (version) => {
      expect(importedStripPercent({ marks: MARKS }, version)).toBeUndefined();
    });
  });
});
