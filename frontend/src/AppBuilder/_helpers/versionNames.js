const NUMBERED = /^v(\d+)$/i;

/**
 * The name Save version suggests for a draft. A draft made from a saved version gets an automatic name, the parent's
 * plus a counter ("v1_1"); when the app numbers its versions (v1, v2, ...) the next number reads better: "v2". Any
 * other name, one the user chose, is kept.
 */
export const suggestVersionName = (draftName, versions = []) => {
  const name = String(draftName ?? '');
  const auto = /^(.+)_\d+$/.exec(name);
  if (!auto || !NUMBERED.test(auto[1])) return name;
  const names = versions.map((v) => String(v?.name ?? ''));
  if (!names.includes(auto[1])) return name;
  const highest = Math.max(...names.map((n) => Number(NUMBERED.exec(n)?.[1] ?? 0)));
  const next = `v${highest + 1}`;
  return names.some((n) => n.toLowerCase() === next.toLowerCase()) ? name : next;
};
