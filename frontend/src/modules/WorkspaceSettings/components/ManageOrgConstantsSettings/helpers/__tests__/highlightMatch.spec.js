/**
 * @jest-environment node
 */
import { highlightMatch } from '../highlightMatch';

describe('highlightMatch', () => {
  it('splits the text around a case-insensitive match, keeping the original casing', () => {
    expect(highlightMatch('API_URL', 'api')).toEqual([
      { text: 'API', match: true },
      { text: '_URL', match: false },
    ]);
  });

  it('marks a match in the middle and at the end', () => {
    expect(highlightMatch('base_url_prod', 'url')).toEqual([
      { text: 'base_', match: false },
      { text: 'url', match: true },
      { text: '_prod', match: false },
    ]);
  });

  it('marks every occurrence', () => {
    expect(highlightMatch('abab', 'ab')).toEqual([
      { text: 'ab', match: true },
      { text: 'ab', match: true },
    ]);
  });

  it('trims the needle, like the server does', () => {
    expect(highlightMatch('API_URL', '  api  ')).toEqual([
      { text: 'API', match: true },
      { text: '_URL', match: false },
    ]);
  });

  it.each([[''], ['   '], [undefined]])('returns the text unmarked for the empty needle %p', (needle) => {
    expect(highlightMatch('API_URL', needle)).toEqual([{ text: 'API_URL', match: false }]);
  });

  it('returns the text unmarked when nothing matches', () => {
    expect(highlightMatch('API_URL', 'zzz')).toEqual([{ text: 'API_URL', match: false }]);
  });

  it('treats regex characters literally', () => {
    expect(highlightMatch('a.b a+b', 'a.b')).toEqual([
      { text: 'a.b', match: true },
      { text: ' a+b', match: false },
    ]);
    expect(highlightMatch('(x)', '(')).toEqual([
      { text: '(', match: true },
      { text: 'x)', match: false },
    ]);
  });

  it('does not count overlapping occurrences twice', () => {
    expect(highlightMatch('aaa', 'aa')).toEqual([
      { text: 'aa', match: true },
      { text: 'a', match: false },
    ]);
  });

  it('returns no parts for empty text', () => {
    expect(highlightMatch('', 'a')).toEqual([]);
  });
});
