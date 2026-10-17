// The hue of a person's avatar in a table ("Show avatar"): the same name always gets the same colour, spread over seven
// hues 51 degrees apart so neighbouring rows differ. The look tints from it in light and dark mode (shadcnLook.scss).
export const avatarHue = (name) => {
  const text = typeof name === 'string' ? name : String(name ?? '');
  // FNV-1a: a plain 31-multiplier hash put five sample names on two hues.
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 0x01000193);
  return ((hash >>> 0) % 7) * 51 + 12;
};

// A placeholder for no person ("Unassigned", "TBD", "—"): drawn as plain text, never as an avatar.
export const isNobody = (value) =>
  /^\s*(unassigned|not assigned|none|nobody|n\/a|tbd|tba|[-–—]+)\s*$/i.test(String(value ?? ''));

// Two initials: of the first and the last word, so "Yusuf & Leyla Demir" reads YD. Words without a letter or a
// digit ("&", "-") are skipped (they gave "Y&"); the initial is the word's first letter or digit.
export const initials = (name) => {
  const tokens = String(name || '').split(/\s+/);
  // A rank or code before the name ("01 Nina Park") is not part of it: initials come from the words with letters when
  // there are any (2026-10-14: every leaderboard avatar read "0P", "1H").
  const lettered = tokens.filter((w) => /\p{L}/u.test(w));
  const words = (lettered.length ? lettered : tokens).map((w) => w.match(/[\p{L}\p{N}]/u)?.[0]).filter(Boolean);
  const picked = words.length > 1 ? [words[0], words[words.length - 1]] : words;
  return picked.join('').toUpperCase();
};
