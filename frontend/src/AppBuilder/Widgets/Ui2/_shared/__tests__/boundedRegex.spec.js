import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
// The pack's bounded matcher (release audit 016, regex work): it answers as the browser's RegExp does for the
// patterns authors write, and its work stays bounded for patterns that make the browser's backtrack for seconds.
import {
  MAX_PATTERN_LENGTH,
  MAX_PROGRAM,
  MAX_FALLBACK_TEXT_LENGTH,
  MAX_TEXT_LENGTH,
  MAX_WORK,
  boundedRegex,
} from '@/AppBuilder/Widgets/Ui2/_shared/boundedRegex';

// Patterns the browser runs quickly on these texts, so both engines can be asked.
const PATTERNS = [
  ['^[a-z]+$', ''],
  ['^[a-z]+$', 'i'],
  ['^\\d{3}-\\d{4}$', ''],
  ['^[\\w.+-]+@([\\w-]+\\.)+[\\w-]{2,}$', ''],
  ['colou?r', 'i'],
  ['^(foo|bar|baz)+$', ''],
  ['a.c', ''],
  ['a.c', 's'],
  ['^b', 'm'],
  ['x$', 'm'],
  ['\\bcat\\b', ''],
  ['\\Bat', ''],
  ['[^aeiou\\s]{2}', ''],
  ['[\\d-z]', ''],
  ['[-a]|[a-]', ''],
  ['[]', ''],
  ['[^]', ''],
  ['a{2,3}', ''],
  ['^a{2}$', ''],
  ['^a{2,}$', ''],
  ['a{,2}', ''],
  ['x{', ''],
  ['\\x41\\u0042\\t', ''],
  ['\\u{1F600}', 'u'],
  ['^.$', 'u'],
  ['^.$', ''],
  ['(?:ab)*c', ''],
  ['(?<word>[a-z]+)-\\d', ''],
  ['^$', ''],
  ['', ''],
  ['STRASSE', 'i'],
  ['[A-Z]', 'i'],
  ['\\cJ', ''],
  ['a*?b+?c??', ''],
  ['^(a|ab)(c|bcd)(d*)$', ''],
  ['^\\s*\\S+\\s*$', ''],
  ['\\W+', ''],
  ['\\D', ''],
];
const TEXTS = [
  '',
  'abc',
  'ABC',
  'a b',
  '555-1234',
  'name.last+tag@mail.example.com',
  'bad@domain',
  'color',
  'Colour',
  'foobarbaz',
  'foobax',
  'abc\nbcx',
  'a\nc',
  'the cat sat',
  'concatenate',
  'aa',
  'aaa',
  'aaaa',
  'x{',
  'AB\t',
  '\u{1F600}',
  'ab-1',
  'abcd',
  '  word  ',
  'Straße STRASSE strasse',
  '\n',
  'k',
  'K',
  'K',
];

describe('answers as the browser does', () => {
  test.each(PATTERNS)('/%s/%s', (source, flags) => {
    const bounded = boundedRegex(source, flags);
    expect(bounded).not.toBeNull();
    expect(bounded.linear).toBe(true);
    const native = new RegExp(source, flags);
    for (const text of TEXTS) {
      expect([text, bounded.test(text)]).toEqual([text, native.test(text)]);
    }
  });
});

test('a pattern the browser rejects is null', () => {
  expect(boundedRegex('(')).toBeNull();
  expect(boundedRegex('a', 'gg')).toBeNull();
  expect(boundedRegex('x'.repeat(MAX_PATTERN_LENGTH + 1))).toBeNull();
});

test.each([
  ['lookahead', '^(?=.*\\d).+$', 'tag1', 'tag'],
  ['negative lookahead', '^(?!admin).*$', 'user', 'admin'],
  ['lookbehind', '(?<=a)b', 'ab', 'cb'],
  ['backreference', '(a)\\1', 'xaax', 'xa'],
  ['named backreference', '(?<x>a)\\k<x>', 'aa', 'ab'],
  ['a repeat past the program size', `a{${MAX_PROGRAM + 1}}`, 'a'.repeat(MAX_PROGRAM + 1), 'a'],
])('a valid pattern with %s is run by the browser on short text', (_, source, matching, other) => {
  const bounded = boundedRegex(source);
  expect(bounded.linear).toBe(false);
  // The program-size case needs more text than the fallback reads, so it never matches.
  expect(bounded.test(matching)).toBe(matching.length <= MAX_FALLBACK_TEXT_LENGTH);
  expect(bounded.test(other)).toBe(false);
});

test('text past the fallback cap does not match, and is not given to the browser', () => {
  const bounded = boundedRegex('^(?=.*\\d).+$');
  const tests = jest.spyOn(RegExp.prototype, 'test');
  expect(bounded.test(`${'a'.repeat(MAX_FALLBACK_TEXT_LENGTH - 1)}1`)).toBe(true);
  expect(bounded.test(`${'a'.repeat(MAX_FALLBACK_TEXT_LENGTH)}1`)).toBe(false);
  expect(tests.mock.calls.map(([text]) => text.length)).toEqual([MAX_FALLBACK_TEXT_LENGTH]);
  tests.mockRestore();
});

test('text past the cap does not match', () => {
  const bounded = boundedRegex('a');
  expect(bounded.test('a'.repeat(MAX_TEXT_LENGTH))).toBe(true);
  expect(bounded.test('a'.repeat(MAX_TEXT_LENGTH + 1))).toBe(false);
});

test('g and y keep no state between tests', () => {
  const bounded = boundedRegex('a', 'gy');
  expect([bounded.test('a'), bounded.test('a'), bounded.test('ba')]).toEqual([true, true, true]);
});

// Patterns that backtrack for seconds or longer in the browser on these texts; never run them natively.
test.each([
  ['^(a+)+$', `${'a'.repeat(MAX_TEXT_LENGTH - 1)}!`, false],
  ['^(a|a)*$', `${'a'.repeat(5000)}!`, false],
  ['^(a|aa)+$', 'a'.repeat(5000), true],
  ['(.*a){20}', 'a'.repeat(5000), true],
  ['^(\\w+\\s?)*$', `${'word '.repeat(1000)}!`, false],
  ['(x+x+)+y', 'x'.repeat(MAX_TEXT_LENGTH), false],
])('/%s/ on a long text finishes in bounded time', (source, text, expected) => {
  const start = performance.now();
  expect(boundedRegex(source).test(text)).toBe(expected);
  expect(performance.now() - start).toBeLessThan(2000);
});

// 990 optional letters in a loop: close to MAX_PROGRAM steps, nearly all of them live at every character.
const LARGEST = '(?:(?:[a-z]?){990})*!';

test.each(['', 'i'])(
  'the largest pattern on the longest text its work allows finishes in bounded time (flags %s)',
  (f) => {
    const bounded = boundedRegex(LARGEST, f);
    expect(bounded.linear).toBe(true);
    const start = performance.now();
    expect(bounded.test(`${'a'.repeat(Math.floor(MAX_WORK / MAX_PROGRAM) - 1)}!`)).toBe(true);
    expect(bounded.test('a'.repeat(Math.floor(MAX_WORK / MAX_PROGRAM)))).toBe(false);
    expect(performance.now() - start).toBeLessThan(1000);
  }
);

test('text past the work cap for its pattern does not match', () => {
  expect(boundedRegex(LARGEST).test(`${'a'.repeat(MAX_TEXT_LENGTH - 1)}!`)).toBe(false);
});
