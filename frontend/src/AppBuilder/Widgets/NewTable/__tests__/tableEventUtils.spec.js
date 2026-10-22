import { supportsCellClickEvent } from '../_utils/tableEventUtils';

describe('supportsCellClickEvent', () => {
  test.each(['string', 'text', 'number', 'select', 'newMultiSelect', 'tagsV2', 'boolean', 'image', 'json', 'toggle'])(
    'a %s column with an id supports the Cell clicked event',
    (columnType) => {
      expect(supportsCellClickEvent({ id: 'col-1', columnType })).toBe(true);
    }
  );

  test.each(['button', 'link', 'datepicker'])('a %s column does not', (columnType) => {
    expect(supportsCellClickEvent({ id: 'col-1', columnType })).toBe(false);
  });

  test('a column without an id does not, since its events could not be told apart from other columns', () => {
    expect(supportsCellClickEvent({ columnType: 'string' })).toBe(false);
    expect(supportsCellClickEvent({ id: '', columnType: 'string' })).toBe(false);
  });
});
