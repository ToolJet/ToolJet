const NUMBERED = /^v(\d+)$/i;

/**
 * The name of a draft made from a saved version. When the app numbers its versions (v1, v2, ...) the draft takes the
 * next number, "v2" rather than "v1_1"; otherwise it is the parent's name with a counter, as before. A name already
 * taken in the app falls back to the counter.
 */
export const draftVersionName = (parentName: string, childCount: number, existingNames: string[]): string => {
  const counter = `${parentName}_${childCount + 1}`;
  if (!NUMBERED.test(parentName ?? '')) return counter;
  const highest = Math.max(0, ...existingNames.map((name) => Number(NUMBERED.exec(name ?? '')?.[1] ?? 0)));
  const next = `v${highest + 1}`;
  return existingNames.some((name) => (name ?? '').toLowerCase() === next.toLowerCase()) ? counter : next;
};
