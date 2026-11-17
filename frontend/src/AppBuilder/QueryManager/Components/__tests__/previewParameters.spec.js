import { emptyParametersNote, emptyPreviewParameters } from '../previewParameters';

// Preview runs a query with its parameters' default values; empty ones are named, so a 0 is not read as lost data.
describe('emptyPreviewParameters', () => {
  const declared = [{ name: 'q' }, { name: 'status' }, { name: 'month' }];

  test('names the declared parameters that ran with no value', () => {
    expect(emptyPreviewParameters(declared, { q: '', status: '%', month: undefined })).toEqual(['q', 'month']);
  });

  test('whitespace and null count as empty; 0 and false are values', () => {
    expect(emptyPreviewParameters([{ name: 'a' }, { name: 'b' }, { name: 'c' }], { a: '  ', b: 0, c: false })).toEqual([
      'a',
    ]);
    expect(emptyPreviewParameters([{ name: 'a' }], { a: null })).toEqual(['a']);
  });

  test('a query without parameters, or with no values at all, is handled', () => {
    expect(emptyPreviewParameters(undefined, undefined)).toEqual([]);
    expect(emptyPreviewParameters([{ name: 'q' }], undefined)).toEqual(['q']);
    expect(emptyPreviewParameters([{ name: '' }, null], {})).toEqual([]);
  });
});

describe('emptyParametersNote', () => {
  test('says nothing when every parameter had a value', () => {
    expect(emptyParametersNote([])).toBeNull();
    expect(emptyParametersNote(undefined)).toBeNull();
  });

  test('names one or several empty parameters', () => {
    expect(emptyParametersNote(['month'])).toBe(
      'Ran with an empty parameter (month). The app passes its own value when it runs this query.'
    );
    expect(emptyParametersNote(['q', 'status'])).toBe(
      'Ran with empty parameters (q, status). The app passes its own values when it runs this query.'
    );
  });
});
