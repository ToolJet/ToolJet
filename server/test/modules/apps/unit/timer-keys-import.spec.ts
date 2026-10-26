/**
 * Timer moved `visibility`/`disabledState` from styles and `tooltip` from general into properties
 * (MoveTimerVisibilityDisabledTooltipToProperties migration). An app exported before that change
 * and imported afterwards never passes through the migration, so the import path must make the
 * same move or the imported Timer loses its saved values.
 */
import { migrateProperties } from 'src/modules/apps/services/app-import-export.service';

const importTimer = (component: Record<string, unknown>, tooljetVersion: string | null = '3.16.0') =>
  migrateProperties('Timer' as never, { type: 'Timer', ...component } as never, [] as never, tooljetVersion);

const legacyTimer = {
  properties: { value: { value: '00:05:00:000' } },
  styles: { visibility: { value: '{{false}}' }, disabledState: { value: '{{true}}' } },
  general: { tooltip: { value: '**Bold** and _italic_' } },
};

describe('Timer keys on import', () => {
  it('moves visibility, disabledState and tooltip into properties with their values', () => {
    // Break this catches: importing an old export as-is, so the Timer reads empty properties and its
    // hidden/disabled state and tooltip silently reset.
    const { properties, styles, general } = importTimer(legacyTimer);

    expect(properties).toMatchObject({
      value: { value: '00:05:00:000' },
      visibility: { value: '{{false}}' },
      disabledState: { value: '{{true}}' },
      tooltip: { value: '**Bold** and _italic_' },
      tooltipFormat: { value: 'plainText' },
    });
    expect(styles.visibility).toBeUndefined();
    expect(styles.disabledState).toBeUndefined();
    expect(general.tooltip).toBeUndefined();
  });

  it('makes the same move for an export with no ToolJet version', () => {
    // Break this catches: placing the move after the unversioned early return.
    const { properties, styles } = importTimer(legacyTimer, null);

    expect(properties).toMatchObject({
      visibility: { value: '{{false}}' },
      disabledState: { value: '{{true}}' },
      tooltip: { value: '**Bold** and _italic_' },
    });
    expect(styles.visibility).toBeUndefined();
  });

  it('keeps a Timer already in the new shape unchanged', () => {
    // Break this catches: overwriting the new keys, e.g. resetting a chosen Markdown format.
    const { properties } = importTimer({
      properties: {
        visibility: { value: '{{true}}' },
        disabledState: { value: '{{false}}' },
        tooltip: { value: 'hi' },
        tooltipFormat: { value: 'markdown' },
      },
      styles: {},
      general: {},
    });

    expect(properties).toMatchObject({
      visibility: { value: '{{true}}' },
      disabledState: { value: '{{false}}' },
      tooltip: { value: 'hi' },
      tooltipFormat: { value: 'markdown' },
    });
  });
});
