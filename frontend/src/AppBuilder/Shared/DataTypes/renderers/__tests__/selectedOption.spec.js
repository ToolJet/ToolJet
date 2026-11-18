import { selectedOption } from '../selectedOption';

const opts = [
  { label: 'Unassigned', value: null },
  { label: 'Ana', value: 1 },
  { label: 'Zero', value: 0 },
];

describe('selectedOption', () => {
  it('shows an explicit empty option ("Unassigned", value null) for a missing or empty cell', () => {
    expect(selectedOption(opts, undefined, false)).toEqual(opts[0]);
    expect(selectedOption(opts, null, false)).toEqual(opts[0]);
    expect(selectedOption(opts, '', false)).toEqual(opts[0]);
  });

  it('keeps nothing selected for a missing cell when no option stands for empty', () => {
    expect(selectedOption(opts.slice(1), undefined, false)).toBeNull();
  });

  it('matches 0 like any other value, and an unknown value matches nothing', () => {
    expect(selectedOption(opts, 0, false)).toEqual(opts[2]);
    expect(selectedOption(opts, 1, false)).toEqual(opts[1]);
    expect(selectedOption(opts, 7, false)).toEqual([]);
  });

  it('matches multi values given as values or as options', () => {
    expect(selectedOption(opts, [1, { value: 0 }], true)).toEqual([opts[1], opts[2]]);
    expect(selectedOption(opts, [], true)).toBeNull();
  });
});
