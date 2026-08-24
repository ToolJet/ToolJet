import { readValuesUrl } from '../lib/operations';

describe('readValuesUrl', () => {
  it('names only the sheet when the range is blank, reading the entire used range', () => {
    expect(readValuesUrl('sid', 'Sheet1', '')).toBe(
      'https://sheets.googleapis.com/v4/spreadsheets/sid/values/Sheet1'
    );
    expect(readValuesUrl('sid', 'Sheet1', undefined as unknown as string)).toBe(
      'https://sheets.googleapis.com/v4/spreadsheets/sid/values/Sheet1'
    );
  });

  it('appends the range segment when one is given', () => {
    expect(readValuesUrl('sid', 'Sheet1', 'A1:Z500')).toBe(
      'https://sheets.googleapis.com/v4/spreadsheets/sid/values/Sheet1!A1:Z500'
    );
    expect(readValuesUrl('sid', 'Sheet1', 'A2:B10')).toBe(
      'https://sheets.googleapis.com/v4/spreadsheets/sid/values/Sheet1!A2:B10'
    );
  });
});
