import { columnOptionList } from '../_utils/columnOptions';

const resolve = (value) => (value === '{{opts}}' ? [{ label: 'Ana', value: 1 }] : value === '{{bad}}' ? 'oops' : value);

describe('columnOptionList', () => {
  it('maps a literal list of options', () => {
    expect(columnOptionList([{ label: 'A', value: 'a', extra: 1 }], resolve)).toEqual([
      { label: 'A', value: 'a', optionColor: undefined, labelColor: undefined },
    ]);
  });

  it('resolves options written as a binding instead of crashing the table (options.map is not a function)', () => {
    expect(columnOptionList('{{opts}}', resolve)).toEqual([
      { label: 'Ana', value: 1, optionColor: undefined, labelColor: undefined },
    ]);
  });

  it('gives no options for anything that is not a list, and skips junk entries', () => {
    expect(columnOptionList('{{bad}}', resolve)).toEqual([]);
    expect(columnOptionList({ a: 1 }, resolve)).toEqual([]);
    expect(columnOptionList(undefined, resolve)).toEqual([]);
    expect(columnOptionList([null, 'x', { label: 'B', value: 'b' }], resolve)).toEqual([
      { label: 'B', value: 'b', optionColor: undefined, labelColor: undefined },
    ]);
  });
});
