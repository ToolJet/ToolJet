import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
// The bounded matcher against the browser's RegExp (release audit 599): every pattern here is one the browser runs
// quickly on these short texts, so both can be asked and must agree. They cover what the backtracking matcher took over
// from the native fallback (lookaround, backreferences, captures cleared per iteration, the empty check, lazy repeats
// inside atomic lookaround, lookbehind read right to left, large repeats), web-compatibility syntax, and the Unicode
// semantics the audit found wrong (P2): case equivalence under i (ς, σ and Σ), word characters under i and u (ſ, the
// Kelvin sign), negated classes, and Unicode properties.
import { boundedRegex } from '@/AppBuilder/Widgets/Ui2/_shared/boundedRegex';
import { compileBacktracking } from '@/AppBuilder/Widgets/Ui2/_shared/regex/backtrack';
import { compileLinear, runLinear } from '@/AppBuilder/Widgets/Ui2/_shared/regex/linear';
import { parse } from '@/AppBuilder/Widgets/Ui2/_shared/regex/parse';

const TEXTS = [
  '',
  'a',
  'ab',
  'aab',
  'abab',
  'abc',
  'ABC',
  'aaab',
  'ba',
  'cab',
  'xaab',
  'foobar',
  'foobaz',
  'admin',
  'user1',
  'release2',
  'Passw0rdX',
  'the cat sat',
  '$42 and 7',
  'a\nb',
  'abba',
  'hello hello',
  'k',
  'K',
  '\u212a',
  's',
  '\u017f',
  'σ',
  'ς',
  'Σ',
  '😀',
  'x😀y',
  'zaacbbbcac',
  '1,22,333',
];

const CASES = [
  // Lookahead and lookbehind, negative or not.
  ['^(?=.*\\d).+$', ''],
  ['^(?!admin).*$', ''],
  ['foo(?=bar)', ''],
  ['foo(?!bar)', ''],
  ['(?<=a)b', ''],
  ['(?<!a)b', ''],
  ['(?<=\\$)\\d+', ''],
  ['(?<![\\w$])\\d+', ''],
  ['(?<=^|,)\\d{2}(?=,|$)', ''],
  ['^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d).{8,}$', ''],
  ['(?<=a(?=b)b)c', ''],
  ['(?<=(?<!b)a)b', ''],
  ['(?<=ab|b)c', ''],
  ['(?<=a+)b', ''],
  ['(?<=a*?)b', ''],
  ['(?<=\\b)\\w', ''],
  ['(?<!^)\\w$', ''],
  ['(?<=^)b', 'm'],
  ['(?<=\\n)^b', 'm'],
  ['(?<=.)\\n', 's'],
  ['(?<=😀)y', 'u'],
  ['(?<=\\uD83D)\\uDE00', ''],
  ['(?<=^..)y', ''],
  ['(?<=^.)y', 'u'],
  ['(?=a)*b', ''],
  ['(?!a)+b', ''],
  ['(?=a){2}a', ''],
  ['(?=(a))?\\1b', ''],
  ['^(?:(?=a)a|b)+$', ''],
  ['(?!.*(.).*\\1)^\\w+$', ''],
  // Captures in lookaround: kept from a positive one, discarded from a negative one, chosen once (atomic).
  ['^(?=(a+))\\1b', ''],
  ['^(?=(a+?))\\1b', ''],
  ['(?=(\\w+))\\1:', ''],
  ['(?!(a))\\1b', ''],
  ['(?=(a))a\\1', ''],
  ['(?<=(\\d+)(\\d+))$', ''],
  ['(?<=(\\d+)(\\d+))\\1,', ''],
  ['(?<=\\1(a))b', ''],
  ['(?<=(a)\\1)b', ''],
  ['(?<=(a)(?:\\1|x))b', ''],
  ['(?<=([ab])\\1)\\1', ''],
  // Backreferences.
  ['(a)\\1', ''],
  ['(\\w)\\1', ''],
  ['(a|b)\\1', ''],
  ['(a*)b\\1', ''],
  ['(a)?b\\1', ''],
  ['(?:(a)|b)\\1c', ''],
  ['(a)|\\1b', ''],
  ['\\1(a)', ''],
  ['(a)\\2(b)', ''],
  ['(\\w+)\\s+\\1', ''],
  ['([a-z])\\1', 'i'],
  ['(?<x>a)\\k<x>', ''],
  ['(?<first>\\w)(?<second>\\w)\\k<second>\\k<first>', ''],
  ['\\k<x>(?<x>b)', ''],
  ['(?<\\u0061>b)\\k<a>', ''],
  ['^(a)(?:b\\1)*$', ''],
  ['^(b)(?:a\\1)+$', 'i'],
  ['(σ)\\1', 'i'],
  ['(k)\\1', 'iu'],
  ['(\\w)\\1', 'iu'],
  // Captures cleared at each iteration, and the empty check.
  ['^((a)|b)+\\2c$', ''],
  ['^(?:(a)|\\1b)*$', ''],
  ['^(z)((a+)?(b+)?(c))*\\3$', ''],
  ['^(z)((a+)?(b+)?(c))*\\4$', ''],
  ['(a*)*b', ''],
  ['(a*)+b', ''],
  ['(?:a?)*?b', ''],
  ['^(a*?)*\\1$', ''],
  ['^(?:a|)*$', ''],
  ['(?:(a)|b)*?\\1', ''],
  ['(a?)*?b\\1', ''],
  ['^(a*)*\\1b$', ''],
  ['^(a*)+\\1b$', ''],
  ['^(?:()|a)*\\1b', ''],
  ['^(?:(a)|())+\\1\\2$', ''],
  ['(?:(?=a)|b)*a', ''],
  // Greedy and lazy.
  ['a+?b', ''],
  ['^(a+?)\\1$', ''],
  ['^(a+)(a+?)\\2$', ''],
  ['^(a{1,2}?)(a*)\\1$', ''],
  ['(a|ab)(c|bcd)(d*)\\3', ''],
  // Large repeats (past what the linear engine writes out).
  ['a{2001}', ''],
  ['^a{2,2500}$', ''],
  ['x{0,3000}y', ''],
  ['(?:ab){1000,}', ''],
  ['^(?:a{1000}){0,3}$', ''],
  ['(?=a)a{0,5000}b', ''],
  // Web-compatibility syntax (no u flag).
  ['\\8', ''],
  ['\\08', ''],
  ['\\12', ''],
  ['(a)\\10', ''],
  ['(a)\\18', ''],
  ['[\\1]', ''],
  ['\\377\\400', ''],
  ['\\c', ''],
  ['\\c*', ''],
  ['[\\c_]', ''],
  ['[\\c1]', ''],
  ['a{', ''],
  ['a{1', ''],
  ['a{,2}', ''],
  ['}', ''],
  [']', ''],
  ['\\k', ''],
  ['\\x4', ''],
  ['\\u12', ''],
  ['\\u{2}', ''],
  ['\\p{L}', ''],
  ['[\\d-z]+', ''],
  ['\\0', ''],
  ['^.$', ''],
  ['^..$', ''],
  ['^\\uD83D', ''],
  ['[😀]', ''],
  // The u and v flags.
  ['\\u{1F600}', 'u'],
  ['\\uD83D\\uDE00', 'u'],
  ['^.$', 'u'],
  ['^[^a]$', 'u'],
  ['[😀-😂]', 'u'],
  ['\\p{L}+', 'u'],
  ['^\\P{L}$', 'u'],
  ['\\p{Script=Greek}', 'u'],
  ['\\p{Lu}', 'iu'],
  ['\\P{Lu}', 'iu'],
  ['[^\\P{Lu}]', 'iu'],
  ['\\p{Lu}', 'iv'],
  ['\\P{Lu}', 'iv'],
  ['[^\\P{Lu}]', 'iv'],
  ['\\p{Emoji_Presentation}', 'u'],
  ['[\\p{L}&&\\p{Script=Greek}]', 'v'],
  ['[\\p{L}--[a-z]]', 'v'],
  ['^[[a-z]--[aeiou]]+$', 'v'],
  ['[[a-c][x-z]]', 'v'],
  ['(?<=[\\p{L}--[a]])b', 'v'],
  ['(\\p{L})\\1', 'iv'],
  // Flags m, s and i on structure.
  ['^b', 'm'],
  ['a$', 'm'],
  ['^b$', ''],
  ['a.b', ''],
  ['a.b', 's'],
  ['\\bcat\\b', ''],
  ['\\Bat', ''],
  ['^\\w+$', ''],
  ['\\W', 'iu'],
  ['[\\w]', 'iu'],
  ['[^\\W]', 'iu'],
  ['[^\\W]', 'iv'],
  ['\\S\\s\\S', ''],
  ['\\d+\\D', ''],
  ['STRASSE', 'i'],
  ['[A-Z]', 'i'],
  ['[^a-z]', 'i'],
  ['[^a-z]', 'iu'],
  ['^[a-z]+$', 'i'],
];

describe('answers as the browser does', () => {
  test.each(CASES)('/%s/%s', (source, flags) => {
    const bounded = boundedRegex(source, flags);
    const native = new RegExp(source, flags);
    for (const text of TEXTS) expect([text, bounded.match(text)]).toEqual([text, native.test(text)]);
  });
});

// The audit's twelve semantics cases (regex-semantics-5996735.json).
test.each([
  ['σ', 'i', 'ς'],
  ['ς', 'i', 'σ'],
  ['[σ]', 'i', 'ς'],
  ['[^σ]', 'i', 'ς'],
  ['^ς$', 'i', 'Σ'],
  ['^Σ$', 'i', 'ς'],
  ['\\bK\\b', 'iu', 'K'],
  ['\\bſ\\b', 'iu', 'ſ'],
  ['\\w', 'iu', 'K'],
  ['[a-z]', 'iu', 'K'],
  ['^[a-z]+$', 'i', 'ABC'],
  ['^a$', '', 'a\n'],
])('audit 599: /%s/%s on %j', (source, flags, text) => {
  expect(boundedRegex(source, flags).match(text)).toBe(new RegExp(source, flags).test(text));
});

// Characters JavaScript treats as case equivalents under some flags and not others.
const CASE_SETS = [
  ['σ', 'ς', 'Σ'],
  ['s', 'S', 'ſ'],
  ['k', 'K', 'K'],
  ['µ', 'μ', 'Μ'],
  ['ß', 'ẞ'],
  ['ω', 'Ω', 'Ω'],
  ['å', 'Å', 'Å'],
  ['i', 'I', 'İ', 'ı'],
  ['ǆ', 'ǅ', 'Ǆ'],
  ['θ', 'ϑ', 'Θ', 'ϴ'],
  ['в', 'В', 'ᲀ'],
  ['ꭰ', 'Ꭰ'],
  ['é', 'É'],
  ['ﬀ', 'f'],
];
const FLAGS = ['', 'i', 'iu', 'iv'];
const escapeChar = (ch) => `\\u{${ch.codePointAt(0).toString(16)}}`;

describe('Unicode case equivalence, classes and word boundaries agree with the browser', () => {
  test.each(CASE_SETS.map((set) => [set.join(' '), set]))('%s', (_, set) => {
    for (const flags of FLAGS) {
      const unicode = flags.includes('u') || flags.includes('v');
      for (const a of set) {
        const atom = unicode ? escapeChar(a) : a;
        const forms = [atom, `[${atom}]`, `[^${atom}]`, `^${atom}$`, `\\b${atom}\\b`, `\\B${atom}`, `(${atom})\\1`];
        for (const source of forms) {
          const bounded = boundedRegex(source, flags);
          const native = new RegExp(source, flags);
          for (const b of [...set, `${a}${a}`, `${a}${set[set.length - 1]}`]) {
            expect([source, flags, b, bounded.match(b)]).toEqual([source, flags, b, native.test(b)]);
          }
        }
      }
    }
  });

  test.each(FLAGS)('word characters and \\b with flags %j', (flags) => {
    const chars = [...new Set(CASE_SETS.flat()), 'a', '_', '0', ' ', '-'];
    for (const source of ['\\w', '\\W', '[\\w]', '[^\\w]', '[^\\W]', '\\b', '\\B', '^\\b.', '.\\b$', 'a\\b']) {
      const bounded = boundedRegex(source, flags);
      const native = new RegExp(source, flags);
      for (const ch of chars)
        for (const text of [ch, `a${ch}`, `${ch} `]) {
          expect([source, flags, text, bounded.match(text)]).toEqual([source, flags, text, native.test(text)]);
        }
    }
  });
});

// Modifier groups and duplicate group names are newer than this Node's RegExp, so the matchers are run directly here
// (boundedRegex asks the browser to accept the pattern first; in a browser that has them, it takes this path).
describe('syntax newer than this Node', () => {
  const both = (source, flags, text) => {
    const parsed = parse(source, flags);
    const codes = Array.from(text, (c) => c.charCodeAt(0));
    const backtracked = compileBacktracking(parsed, 100_000, 1500)(codes);
    const prog = compileLinear(parsed.root, 2000);
    return prog ? [backtracked, runLinear(prog, codes)] : [backtracked, backtracked];
  };

  test.each([
    ['(?i:a)b', '', 'Ab', true],
    ['(?i:a)b', '', 'AB', false],
    ['(?-i:a)b', 'i', 'aB', true],
    ['(?-i:a)b', 'i', 'AB', false],
    ['(?i:σ)', '', 'ς', true],
    ['(?m:^b)', '', 'a\nb', true],
    ['^b', '', 'a\nb', false],
    ['(?s:.)', '', '\n', true],
    ['(?s-i:a.)B', 'i', 'a\nb', true],
    ['(?i:(a))\\1', '', 'AA', true],
    ['(?i:(a))\\1', '', 'aA', false],
    ['(a)(?i:\\1)', '', 'aA', true],
    ['(a)\\1', '', 'aA', false],
    ['(?:(?<y>a)|(?<y>b))\\k<y>', '', 'bb', true],
    ['(?:(?<y>a)|(?<y>b))\\k<y>', '', 'ba', false],
    ['(?:(?<y>a)|(?<y>b))\\k<y>', '', 'aa', true],
  ])('/%s/%s on %j is %s', (source, flags, text, expected) => {
    expect(both(source, flags, text)).toEqual([expected, expected]);
  });
});
