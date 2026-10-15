import { toOptions } from '../../packHooks';

describe('toOptions', () => {
  it('accepts plain values and option objects', () => {
    expect(toOptions(['A', 2])).toEqual([
      { label: 'A', value: 'A' },
      { label: '2', value: 2 },
    ]);
    expect(toOptions([{ label: 'Paid', value: 'paid', disabled: true }])).toEqual([
      { label: 'Paid', value: 'paid', disabled: true },
    ]);
  });

  it('drops entries that cannot be an option: null, empty objects and arrays, object values', () => {
    expect(toOptions([null, undefined, {}, [], { label: null, value: {} }, 'ok']).map((o) => o.value)).toEqual(['ok']);
  });

  it('keeps the first of options with the same value', () => {
    expect(toOptions(['a', { label: 'A again', value: 'a' }, 'b']).map((o) => o.label)).toEqual(['a', 'b']);
  });

  it('labels an option by its value when the label is missing or not text', () => {
    expect(toOptions([{ value: 3 }, { label: { x: 1 }, value: 'v' }]).map((o) => o.label)).toEqual(['3', 'v']);
  });

  it('keeps an option whose value is the empty string (an "All" choice)', () => {
    expect(toOptions([{ label: 'All', value: '' }])).toEqual([{ label: 'All', value: '' }]);
  });

  it('treats a non-list as no options', () => {
    expect(toOptions('a,b')).toEqual([]);
    expect(toOptions(null)).toEqual([]);
  });
});
