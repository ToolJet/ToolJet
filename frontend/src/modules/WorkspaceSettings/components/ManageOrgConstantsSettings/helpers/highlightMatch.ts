export interface HighlightPart {
  text: string;
  match: boolean;
}

// Splits `text` into parts, marking each occurrence of `needle`. Matches the server's name search
// (buildConstantsPage): trimmed, case-insensitive substring. No regex, so special characters are literal.
export function highlightMatch(text: string | null | undefined, needle: string | null | undefined): HighlightPart[] {
  const term = (needle ?? '').trim().toLowerCase();
  if (!text) return [];
  if (!term) return [{ text, match: false }];

  const haystack = text.toLowerCase();
  const parts: HighlightPart[] = [];
  let cursor = 0;
  for (let at = haystack.indexOf(term); at !== -1; at = haystack.indexOf(term, cursor)) {
    if (at > cursor) parts.push({ text: text.slice(cursor, at), match: false });
    parts.push({ text: text.slice(at, at + term.length), match: true });
    cursor = at + term.length;
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor), match: false });
  return parts.length ? parts : [{ text, match: false }];
}
