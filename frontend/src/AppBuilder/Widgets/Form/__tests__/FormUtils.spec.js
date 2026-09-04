import { resolveFormDataExposedVarValue } from '../FormUtils';

/**
 * Picks the value a Form child contributes to `formData`: the first of
 * `value`/`values`/`file`/`selectedDateRange` it has, or its whole output
 * object if it's a Module Viewer (no wrapper key), or null if none apply.
 */
describe('resolveFormDataExposedVarValue', () => {
  test('a Module Viewer child returns its output object, stripped of Form bookkeeping keys', () => {
    const childData = {
      name: 'moduleviewer1',
      formKey: undefined,
      type: 'ModuleViewer',
      id: 'mv1',
      total: 42,
      email: 'x@example.com',
    };

    expect(resolveFormDataExposedVarValue(childData)).toEqual({ total: 42, email: 'x@example.com' });
  });

  test('a Module Viewer child with no declared outputs returns an empty object, not null', () => {
    const childData = { name: 'moduleviewer1', type: 'ModuleViewer', id: 'mv1' };

    expect(resolveFormDataExposedVarValue(childData)).toEqual({});
  });

  test('the Module Viewer branch is checked first, even if a coincidental `value` key is present', () => {
    const childData = { name: 'moduleviewer1', type: 'ModuleViewer', id: 'mv1', value: 'should not win', total: 1 };

    expect(resolveFormDataExposedVarValue(childData)).toEqual({ value: 'should not win', total: 1 });
  });

  test('a widget exposing `value` (e.g. TextInput) returns that value', () => {
    expect(resolveFormDataExposedVarValue({ name: 'textinput1', value: 'hello' })).toBe('hello');
  });

  test('a widget exposing `values` (e.g. Multiselect) returns that array', () => {
    expect(resolveFormDataExposedVarValue({ name: 'multiselect1', values: ['a', 'b'] })).toEqual(['a', 'b']);
  });

  test('a widget exposing `file` (e.g. FilePicker) returns that file payload', () => {
    const file = [
      {
        name: 'abc.svg',
        type: 'image/svg+xml',
        content:
          '<svg width="175" height="121" viewBox="0 0 175 121" fill="none" xmlns="http://www.w3.org/2000/svg"></svg>',
        dataURL: 'PHN2ZyB3aWR0aD0iMTc1',
        base64Data: 'PHN2ZyB3aWR0aD0iMTc1',
        parsedData: null,
        filePath: './abc.svg',
      },
    ];
    expect(resolveFormDataExposedVarValue({ name: 'filepicker1', file })).toBe(file);
  });

  test('a widget exposing `selectedDateRange` (e.g. DaterangePicker) returns that range', () => {
    const range = '01/04/2022 - 10/04/2022';
    expect(resolveFormDataExposedVarValue({ name: 'daterange1', selectedDateRange: range })).toBe(range);
  });

  test('a widget with none of the recognized keys is skipped (returns null)', () => {
    expect(resolveFormDataExposedVarValue({ name: 'container1', isValid: true })).toBeNull();
  });

  test('missing childData returns null', () => {
    expect(resolveFormDataExposedVarValue(null)).toBeNull();
    expect(resolveFormDataExposedVarValue(undefined)).toBeNull();
  });
});
