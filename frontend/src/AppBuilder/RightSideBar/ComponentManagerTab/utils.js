import { normalizePin, dashlessId } from '@/AppBuilder/Widgets/libraryComponentRevision';

// Up to two uppercase initials for a component/library's avatar fallback,
// e.g. "DataGrid" -> "DG"; falls back to the name's first two letters if it has none.
export const initials = (name = '') =>
  (name.match(/[A-Z]/g) || []).slice(0, 2).join('') || name.slice(0, 2).toUpperCase();

// Whether a library has anything to show at all: a published revision, or a dev-only
// `component dev` push that hasn't been released yet.
export const hasLibraryContent = (library) => library.revisions.length > 0 || library.devBundles?.length > 0;

// Search match for one library against the manifest actually resolved/displayed for it
// (see useResolvedManifest) — NOT the library's latest-revision manifest, since an
// older-pinned library's real components live in a different manifest.
export const getLibrarySearchMatch = (library, manifestComponents, searchQuery) => {
  const query = searchQuery.trim().toLowerCase();
  const matchesLibraryName = library.name.toLowerCase().includes(query);
  const components = Object.entries(manifestComponents ?? {}).filter(
    ([exportName]) => !query || matchesLibraryName || exportName.toLowerCase().includes(query)
  );
  const isVisible = hasLibraryContent(library) && (!query || matchesLibraryName || components.length > 0);
  return { components, isVisible };
};

// Re-keys every stored pin to the dashless form, tolerating rows written before that
// migration (dashed keys, or the older `{ revisionId }` object shape) — see pinKey's
// own comment in libraryComponentRevision.js for why dashless keys are required.
export const normalizedPinsMap = (pins) =>
  Object.fromEntries(Object.entries(pins ?? {}).map(([libId, value]) => [dashlessId(libId), normalizePin(value)]));

// Immutable set toggle that's a no-op (returns the same reference) when nothing
// changes, so a React state setter built on this never triggers an unnecessary re-render.
export const withId = (set, id, shouldHave) => {
  if (set.has(id) === shouldHave) return set;
  const next = new Set(set);
  if (shouldHave) next.add(id);
  else next.delete(id);
  return next;
};
