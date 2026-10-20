// ToolJet UI 2.0: what one character of an author's pattern matches, with JavaScript's exact semantics. Each atom (a
// literal under the i flag, a class, \w, \p{L}, a word boundary's word characters) is asked of the browser's own RegExp,
// built for that atom alone with the pattern's i, u and v flags and tested on one character at a time: one character
// cannot make a RegExp backtrack, and the browser knows every case equivalence (ς, σ and Σ; ſ and s; the Kelvin sign
// and k) and every Unicode property. Answers are remembered per atom, so a long text asks each character once.

/** Whether a character (a code unit, or a code point with the u or v flag) matches. */
export type CharTest = (c: number) => boolean;

export const isLineEnd = (c: number) => c === 10 || c === 13 || c === 0x2028 || c === 0x2029;
export const anyChar: CharTest = () => true;
export const notLineEnd: CharTest = (c) => !isLineEnd(c);

const MEMO_LIMIT = 4096;
const CACHE_LIMIT = 2000;

// An atom's RegExp as a CharTest, its answers kept: ASCII in a table, the rest in a map of at most MEMO_LIMIT.
const remembered = (re: RegExp): CharTest => {
  const ascii = new Uint8Array(128); // 0 not asked yet, 1 no, 2 yes
  const other = new Map<number, boolean>();
  return (c) => {
    if (c < 128) {
      const known = ascii[c];
      if (known) return known === 2;
      const yes = re.test(String.fromCharCode(c));
      ascii[c] = yes ? 2 : 1;
      return yes;
    }
    const known = other.get(c);
    if (known !== undefined) return known;
    const yes = re.test(String.fromCodePoint(c));
    if (other.size < MEMO_LIMIT) other.set(c, yes);
    return yes;
  };
};

const atoms = new Map<string, CharTest>();

/** The atom's source as written in the pattern (a class, an escape) tested on one character with flags (some of i,
 *  u and v). Throws when the browser rejects the atom on its own. */
export const nativeChar = (atom: string, flags: string): CharTest => {
  const key = `${flags}/${atom}`;
  const known = atoms.get(key);
  if (known) return known;
  const test = remembered(new RegExp(`^(?:${atom})$`, flags));
  if (atoms.size >= CACHE_LIMIT) atoms.clear();
  atoms.set(key, test);
  return test;
};

const hex = (c: number, width: number) => c.toString(16).padStart(width, '0');

/** One character, matched as the pattern's flags match it: exactly, or with JavaScript's case equivalence under i. */
export const literalChar = (code: number, flags: string): CharTest => {
  if (!flags.includes('i')) return (c) => c === code;
  const unicode = flags.includes('u') || flags.includes('v');
  return nativeChar(unicode ? `\\u{${hex(code, 1)}}` : `\\u${hex(code, 4)}`, flags);
};

/** The characters \b and \B count as word characters under these flags (with i and u, ſ and the Kelvin sign too). */
export const wordChar = (flags: string): CharTest => nativeChar('\\w', flags);
