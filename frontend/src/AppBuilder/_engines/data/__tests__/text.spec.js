import { prepareTerm, lowerContains } from '../text';

// What search and the contains filters did before: the answer lowerContains must give, always.
const legacy = (value, term) =>
  String(value || '')
    .toLowerCase()
    .includes(String(term).toLowerCase());

const TERMS = ['', 'a', 'A', 'ab', 'Ab ', 'k', 'i', 'ss', 'σ', 'i̇', 'é', '1', 'ǆ', 'ﬀ', 'İ', 'ς'];

describe('lowerContains', () => {
  test('every BMP code unit, alone and between ASCII letters, against every term', () => {
    const terms = TERMS.map((term) => [term, prepareTerm(term)]);
    for (let code = 0; code < 0x10000; code++) {
      const char = String.fromCharCode(code);
      for (const value of [char, `ab${char}cd`, `${char}${char}`, `K${char}`]) {
        for (const [term, prepared] of terms) {
          if (lowerContains(value, prepared) !== legacy(value, term)) {
            throw new Error(`differs for ${JSON.stringify(value)} / ${JSON.stringify(term)}`);
          }
        }
      }
    }
  });

  test('non-string values, as String(v || "") gives them', () => {
    const values = [0, 1, 10, -1, NaN, null, undefined, true, false, [1, 2], { a: 1 }, 12.5];
    for (const value of values) {
      for (const term of ['0', '1', 'true', 'nan', '1,2', 'object', '', '.']) {
        expect([value, term, lowerContains(value, prepareTerm(term))]).toEqual([value, term, legacy(value, term)]);
      }
    }
  });

  test('a seeded corpus of tricky strings', () => {
    const alphabet = ['a', 'B', 'k', 'K', 'İ', 'ı', 'Σ', 'σ', 'ς', 'ẞ', 'ß', 'K', 'Å', 'ǅ', 'ﬀ', '́', '😀', ' ', '1'];
    let seed = 42;
    const random = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
    const pick = () => alphabet[Math.floor(random() * alphabet.length)];
    const word = (max) => Array.from({ length: 1 + Math.floor(random() * max) }, pick).join('');
    for (let n = 0; n < 200000; n++) {
      const value = word(12);
      const term = random() < 0.5 ? word(3) : value.slice(Math.floor(random() * value.length)).slice(0, 3);
      if (lowerContains(value, prepareTerm(term)) !== legacy(value, term)) {
        throw new Error(`differs for ${JSON.stringify(value)} / ${JSON.stringify(term)}`);
      }
    }
  });
});
