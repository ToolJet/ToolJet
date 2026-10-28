// Platform readers check properties.visibility first, so an unmoved saved hidden/disabled widget would reappear.
import { moveSpinnerKeysToProperties } from '../../../../data-migrations/1792300000000-MoveSpinnerKeysToProperties';
import { moveBoundedBoxKeysToProperties } from '../../../../data-migrations/1792300000001-MoveBoundedBoxKeysToProperties';

describe('Spinner keys migration', () => {
  it('[Spinner-VIS-002] moves a saved hidden Spinner and its tooltip into properties', () => {
    // Break this catches: dropping the saved `{{false}}`, so a hidden Spinner shows after upgrade.
    const moved = moveSpinnerKeysToProperties({
      properties: {},
      styles: { visibility: { value: '{{false}}' }, size: { value: 'lg' }, colour: { value: '#ff0000' } },
      general_properties: { tooltip: { value: 'Loading **rows**' } },
    });

    expect(moved).toEqual({
      properties: {
        visibility: { value: '{{false}}' },
        tooltip: { value: 'Loading **rows**' },
        tooltipFormat: { value: 'plainText' },
      },
      styles: { size: { value: 'lg' }, colour: { value: '#ff0000' } },
      general_properties: {},
    });
  });

  it('[Spinner-VIS-002] keeps values already in properties and tolerates null buckets', () => {
    // Break this catches: an old styles value overwriting a newer properties value, or a crash on null JSON.
    expect(
      moveSpinnerKeysToProperties({
        properties: { visibility: { value: '{{true}}' }, tooltipFormat: { value: 'html' } },
        styles: { visibility: { value: '{{false}}' } },
        general_properties: null,
      })
    ).toEqual({
      properties: { visibility: { value: '{{true}}' }, tooltipFormat: { value: 'html' } },
      styles: {},
      general_properties: null,
    });
  });
});

describe('BoundedBox keys migration', () => {
  it('[BoundedBox-VIS-002] moves saved hidden, disabled and tooltip values into properties', () => {
    // Break this catches: leaving disabledState in styles, so a saved disabled BoundedBox becomes editable.
    const moved = moveBoundedBoxKeysToProperties({
      properties: { selector: { value: 'POINT' } },
      styles: { visibility: { value: '{{false}}' }, disabledState: { value: '{{true}}' } },
      general_properties: { tooltip: { value: 'Draw <b>cars</b>' } },
    });

    expect(moved).toEqual({
      properties: {
        selector: { value: 'POINT' },
        visibility: { value: '{{false}}' },
        disabledState: { value: '{{true}}' },
        tooltip: { value: 'Draw <b>cars</b>' },
        tooltipFormat: { value: 'plainText' },
      },
      styles: {},
      general_properties: {},
    });
  });

  it('[BoundedBox-VIS-002] existing properties win over the old buckets', () => {
    // Break this catches: a re-run or partially migrated row losing the newer properties values.
    const moved = moveBoundedBoxKeysToProperties({
      properties: { disabledState: { value: '{{false}}' }, tooltip: { value: 'new' } },
      styles: { disabledState: { value: '{{true}}' } },
      general_properties: { tooltip: { value: 'old' } },
    });

    expect(moved.properties).toEqual({
      disabledState: { value: '{{false}}' },
      tooltip: { value: 'new' },
      tooltipFormat: { value: 'plainText' },
    });
    expect(moved.styles).toEqual({});
    expect(moved.general_properties).toEqual({});
  });
});
