import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
// Release audit 599 (P1, regex work): patterns the linear engine cannot run (lookaround, backreferences) went to the
// browser's RegExp on text of up to 256 characters, and length does not bound backtracking: ^(?=a)(a+)+$ and
// ^(a+)+\1$ ran past a second on 29 characters. They now run on the pack's backtracking matcher, which stops after
// MAX_STEPS steps with 'too-complex'. The browser's RegExp only ever tests one character at a time.
//
// A native test or exec on more than one character is caught, recorded and answered without running, so a regression
// fails the test instead of hanging jest.
import {
  MAX_FALLBACK_TEXT_LENGTH,
  MAX_TEXT_LENGTH,
  TOO_COMPLEX,
  UNSUPPORTED,
  boundedRegex,
} from '@/AppBuilder/Widgets/Ui2/_shared/boundedRegex';

let native;
const guardNative = () => {
  native = [];
  for (const method of ['test', 'exec']) {
    const own = RegExp.prototype[method];
    jest.spyOn(RegExp.prototype, method).mockImplementation(function guarded(value) {
      if ([...String(value)].length > 1) {
        native.push({ method, source: this.source, length: String(value).length });
        return method === 'test' ? false : null;
      }
      return own.call(this, value);
    });
  }
};
afterEach(() => jest.restoreAllMocks());

// Runs fn and returns what it gave and how long it took.
const timed = (fn) => {
  const start = performance.now();
  const result = fn();
  return { result, ms: performance.now() - start };
};

const A28 = `${'a'.repeat(28)}!`;

describe('patterns that backtrack for seconds in the browser stop at the step budget', () => {
  test.each([
    ['^(?=a)(a+)+$', A28],
    ['^(a+)+\\1$', A28],
    ['(?=a)(a|a)*b', 'a'.repeat(40)],
    ['(?=a)(.*a){20}', 'a'.repeat(19)],
    ['^(?!x)(\\w+\\s?)*$', `${'word '.repeat(10)}!`],
    ['^(\\w+\\s?)*\\1$', `${'word '.repeat(10)}!`],
    ['(?<=x(a+)+)b', `${'a'.repeat(28)}b`],
  ])('/%s/ is too complex, within milliseconds, with no native run', (source, text) => {
    const bounded = boundedRegex(source);
    expect(bounded.linear).toBe(false);
    guardNative();
    const { result, ms } = timed(() => [bounded.match(text), bounded.test(text)]);
    expect(native).toEqual([]);
    expect(result).toEqual([TOO_COMPLEX, false]);
    expect(ms).toBeLessThan(200);
  });

  test('the same patterns answer quickly where the search is short', () => {
    expect(boundedRegex('^(?=a)(a+)+$').match('aaaa')).toBe(true);
    expect(boundedRegex('^(?=a)(a+)+$').match('baaa')).toBe(false);
    expect(boundedRegex('^(a+)+\\1$').match('aaaa')).toBe(true);
    expect(boundedRegex('(?=a)(.*a){3}').match('a'.repeat(5))).toBe(true);
    expect(boundedRegex('(?<=x(a+)+)b').match('xaab')).toBe(true);
  });
});

describe('the linear engine keeps the patterns it runs', () => {
  test.each([
    ['(a|a)*b', `${'a'.repeat(5000)}`],
    ['(.*a){20}', 'a'.repeat(19)],
    ['^(\\w+\\s?)*$', `${'word '.repeat(1000)}!`],
  ])('/%s/ answers false on a long non-matching text, quickly', (source, text) => {
    const bounded = boundedRegex(source);
    expect(bounded.linear).toBe(true);
    guardNative();
    const { result, ms } = timed(() => bounded.match(text));
    expect(native).toEqual([]);
    expect(result).toBe(false);
    expect(ms).toBeLessThan(200);
  });
});

describe('caps', () => {
  test('text past the backtracking cap is too complex, and the cap itself is read', () => {
    const bounded = boundedRegex('^(?=.*\\d).+$');
    expect(bounded.match(`${'a'.repeat(MAX_FALLBACK_TEXT_LENGTH - 1)}1`)).toBe(true);
    expect(bounded.match(`${'a'.repeat(MAX_FALLBACK_TEXT_LENGTH)}1`)).toBe(TOO_COMPLEX);
  });

  test('text past the linear cap is too complex', () => {
    expect(boundedRegex('a').match('a'.repeat(MAX_TEXT_LENGTH))).toBe(true);
    expect(boundedRegex('a').match('a'.repeat(MAX_TEXT_LENGTH + 1))).toBe(TOO_COMPLEX);
  });

  test('a search as deep as the backtracking cap allows still answers; a deeper one stops at the depth cap', () => {
    expect(boundedRegex('^(?=a)(?:(a)|b)*$').match('ab'.repeat(MAX_FALLBACK_TEXT_LENGTH / 2))).toBe(true);
    // A million iterations of an empty group nest a million calls: stopped long before the stack overflows.
    expect(boundedRegex('(?=a)(?:){1000000}b').match('ab')).toBe(TOO_COMPLEX);
  });
});

test.each([
  ['[\\q{abc}x]', 'v'],
  ['\\p{RGI_Emoji}', 'v'],
  ['[\\p{RGI_Emoji}--\\q{x}]', 'v'],
])('/%s/%s (a class of strings) is unsupported, never run natively', (source, flags) => {
  const bounded = boundedRegex(source, flags);
  guardNative();
  expect([bounded.match('abc'), bounded.test('abc')]).toEqual([UNSUPPORTED, false]);
  expect(native).toEqual([]);
});

test('matching never gives the browser more than one character', () => {
  const patterns = [
    ['^(?=.*\\d).+$', ''],
    ['(?<!a)b\\b', 'iu'],
    ['(\\w)\\1', 'i'],
    ['^[α-ρσ-ω]+$', 'i'],
    ['\\p{Lu}', 'u'],
    ['^\\w+$', ''],
  ].map(([s, f]) => boundedRegex(s, f));
  guardNative();
  for (const bounded of patterns)
    for (const text of ['release2', 'cab ab', 'aa', 'λογος', 'Ab', 'word']) bounded.match(text);
  expect(native).toEqual([]);
});
