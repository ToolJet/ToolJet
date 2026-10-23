/**
 * Case-insensitive "contains" for search and filters, with exactly the answer of
 * `String(value || '').toLowerCase().includes(term.toLowerCase())` — without making a lower-cased copy of every cell
 * (a 5M-row search made 100M strings and spent most of its time collecting them).
 *
 * Lower-casing maps each character on its own (only Σ looks at its neighbours), so a match among ASCII characters is a
 * match in the lower-cased text. Text with no match among its ASCII characters but holding others (İ → i̇, K → k) is
 * answered by the original expression.
 */

// ASCII code → its lower-case code.
const LOWER = new Uint8Array(128);
for (let code = 0; code < 128; code++) LOWER[code] = code >= 65 && code <= 90 ? code + 32 : code;

/** A search term prepared once per search: its lower-case form, and whether that is all ASCII. */
export const prepareTerm = (term) => {
  const lower = String(term).toLowerCase();
  let ascii = true;
  for (let i = 0; i < lower.length; i++) {
    if (lower.charCodeAt(i) > 127) {
      ascii = false;
      break;
    }
  }
  const codes = new Uint16Array(lower.length);
  for (let i = 0; i < lower.length; i++) codes[i] = lower.charCodeAt(i);
  return { lower, ascii, codes };
};

const exact = (text, term) => text.toLowerCase().includes(term.lower);

/** Whether `value`, lower-cased, contains the prepared `term`. */
export const lowerContains = (value, term) => {
  const text = String(value || '');
  const { codes, ascii } = term;
  const length = codes.length;
  if (!length) return true;
  if (!ascii) {
    // ASCII text lower-cases to ASCII: it can't hold a non-ASCII term.
    for (let i = 0; i < text.length; i++) if (text.charCodeAt(i) > 127) return exact(text, term);
    return false;
  }
  const first = codes[0];
  const last = text.length - length;
  let other = false;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code > 127) {
      other = true;
      continue;
    }
    if (i > last || LOWER[code] !== first) continue;
    let j = 1;
    for (; j < length; j++) {
      const next = text.charCodeAt(i + j);
      if (next > 127 || LOWER[next] !== codes[j]) break;
    }
    if (j === length) return true;
  }
  return other ? exact(text, term) : false;
};
