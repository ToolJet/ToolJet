import { formatPathForCopy } from '../utils';

describe('formatPathForCopy', () => {
  it('drops a trailing segment separator so the copied path is a valid expression', () => {
    expect(formatPathForCopy('constants.null_value.')).toBe('constants.null_value');
    expect(formatPathForCopy('list.1.')).toBe('list[1]');
  });

  it('keeps converting numeric segments to bracket notation', () => {
    expect(formatPathForCopy('list.0.name')).toBe('list[0].name');
  });

  it('leaves well-formed paths untouched', () => {
    expect(formatPathForCopy('components.widget1')).toBe('components.widget1');
    expect(formatPathForCopy('constants')).toBe('constants');
  });
});
