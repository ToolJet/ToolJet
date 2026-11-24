/** The key of a record with no id: its content, so a removal or a reorder leaves a selection on the same record (or
 *  clears it), where a position key moved it to whatever record took that place (team testing, 2026-10-29). An edited
 *  record without an id cannot be told from a new one, so its selection clears. Identical records share a key; callers
 *  tell them apart by occurrence. */
export const contentKey = (item: unknown): string => {
  let text = '';
  try {
    text = JSON.stringify(item) ?? '';
  } catch {
    text = String(item);
  }
  // FNV-1a: a short stable key, not the whole record.
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193);
  return `#${(h >>> 0).toString(36)}`;
};
