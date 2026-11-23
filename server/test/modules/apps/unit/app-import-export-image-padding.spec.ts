/**
 * Importing an app must not rewrite an Image's padding.
 *
 * The import migration assumed `styles.padding` always held the legacy bare number and moved it to
 * `customPadding`. Exports from current builds already hold the switch value ('default' | 'custom')
 * in `padding` and the number in `customPadding`, so every imported Image got "Custom" padding with
 * a junk value, and a real custom padding was overwritten (renders as NaN, i.e. lost).
 */

import { Component } from '@entities/component.entity';
import { migrateProperties } from '@modules/apps/services/app-import-export.service';

const TOOLJET_VERSION = '3.16.0';

const migrateImageStyles = (styles: Record<string, { value: unknown }>) =>
  migrateProperties('Image', { styles } as unknown as Component, ['Image'], TOOLJET_VERSION).styles;

describe('app import: Image padding', () => {
  describe('styles exported by a current build', () => {
    it('should keep Default padding as Default', () => {
      const styles = migrateImageStyles({
        imageFit: { value: 'contain' },
        padding: { value: 'default' },
        customPadding: { value: '{{0}}' },
      });

      expect(styles).toEqual({
        imageFit: { value: 'contain' },
        padding: { value: 'default' },
        customPadding: { value: '{{0}}' },
      });
    });

    it('should keep a Custom padding and its number', () => {
      const styles = migrateImageStyles({
        imageFit: { value: 'contain' },
        padding: { value: 'custom' },
        customPadding: { value: '{{12}}' },
      });

      expect(styles).toEqual({
        imageFit: { value: 'contain' },
        padding: { value: 'custom' },
        customPadding: { value: '{{12}}' },
      });
    });

    it('should not invent a customPadding when the export has none', () => {
      const styles = migrateImageStyles({ padding: { value: 'default' } });

      expect(styles).toEqual({ padding: { value: 'default' } });
    });
  });

  describe('styles exported before the padding switch existed', () => {
    it('should move the numeric padding to customPadding and switch to Custom', () => {
      const styles = migrateImageStyles({ imageFit: { value: 'contain' }, padding: { value: '{{16}}' } });

      expect(styles).toEqual({
        imageFit: { value: 'contain' },
        padding: { value: 'custom' },
        customPadding: { value: '{{16}}' },
      });
    });

    it('should also migrate a padding stored as a plain number', () => {
      const styles = migrateImageStyles({ padding: { value: 16 } });

      expect(styles).toEqual({ padding: { value: 'custom' }, customPadding: { value: 16 } });
    });
  });

  it('should leave styles without a padding untouched', () => {
    const styles = migrateImageStyles({ imageFit: { value: 'contain' } });

    expect(styles).toEqual({ imageFit: { value: 'contain' } });
  });
});
