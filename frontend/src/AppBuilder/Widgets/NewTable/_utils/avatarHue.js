// The hue of a person's avatar in a table ("Show avatar"): the same name always gets the same colour, spread over seven
// hues 51 degrees apart so neighbouring rows differ. The look tints from it in light and dark mode (shadcnLook.scss).
export const avatarHue = (name) => {
  const text = typeof name === 'string' ? name : String(name ?? '');
  // FNV-1a: a plain 31-multiplier hash put five sample names on two hues.
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 0x01000193);
  return ((hash >>> 0) % 7) * 51 + 12;
};
