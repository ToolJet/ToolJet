import { hasLibraryContent, getLibrarySearchMatch, normalizedPinsMap, withId, initials } from '../utils';

describe('hasLibraryContent', () => {
  it('[ComponentManagerTab-UTILS-001] is true for a library with at least one published revision', () => {
    expect(hasLibraryContent({ revisions: [{ id: 'r1' }], devBundles: [] })).toBe(true);
  });

  it('[ComponentManagerTab-UTILS-002] is true for a dev-only library with no revisions yet', () => {
    expect(hasLibraryContent({ revisions: [], devBundles: [{ userId: 'u1' }] })).toBe(true);
  });

  it('[ComponentManagerTab-UTILS-003] is false when there are neither revisions nor dev bundles', () => {
    expect(hasLibraryContent({ revisions: [], devBundles: [] })).toBe(false);
    expect(hasLibraryContent({ revisions: [] })).toBe(false); // devBundles omitted entirely
  });
});

describe('getLibrarySearchMatch', () => {
  const library = { name: 'Alpha', revisions: [{ id: 'r1' }], devBundles: [] };
  const components = { Widget: { displayName: 'Widget' }, Gadget: { displayName: 'Gadget' } };

  it('[ComponentManagerTab-UTILS-004] returns every component and stays visible with no query', () => {
    const result = getLibrarySearchMatch(library, components, '');
    expect(result.isVisible).toBe(true);
    expect(result.components).toHaveLength(2);
  });

  it('[ComponentManagerTab-UTILS-005] keeps every component when the LIBRARY name matches, even if no component name does', () => {
    // Break this catches: dropping the "matchesLibraryName keeps everything" branch,
    // which would hide components whose names don't contain the query even though the
    // user was clearly searching for the library itself.
    const result = getLibrarySearchMatch(library, components, 'alpha');
    expect(result.isVisible).toBe(true);
    expect(result.components).toHaveLength(2);
  });

  it('[ComponentManagerTab-UTILS-006] filters down to only the matching component when the query matches a component name, not the library name', () => {
    const result = getLibrarySearchMatch(library, components, 'gad');
    expect(result.isVisible).toBe(true);
    expect(result.components.map(([name]) => name)).toEqual(['Gadget']);
  });

  it('[ComponentManagerTab-UTILS-007] is not visible when neither the library name nor any component matches', () => {
    const result = getLibrarySearchMatch(library, components, 'zzz');
    expect(result.isVisible).toBe(false);
    expect(result.components).toHaveLength(0);
  });

  it('[ComponentManagerTab-UTILS-008] is never visible for a library with no content, even with no query', () => {
    const empty = { name: 'Alpha', revisions: [], devBundles: [] };
    expect(getLibrarySearchMatch(empty, components, '').isVisible).toBe(false);
  });
});

describe('normalizedPinsMap', () => {
  it('[ComponentManagerTab-UTILS-009] re-keys a dashed correlationId to its dashless form', () => {
    expect(normalizedPinsMap({ 'aaaa-bbbb-cccc': 'v2' })).toEqual({ aaaabbbbcccc: 'v2' });
  });

  it('[ComponentManagerTab-UTILS-010] normalizes a legacy object-shaped pin to its flat string form', () => {
    // Break this catches: dropping normalizePin's object-shape handling, which would
    // turn a pre-migration `{ revisionId }` pin into `undefined` on the next write.
    expect(normalizedPinsMap({ aaaabbbbcccc: { revisionId: 'v3' } })).toEqual({ aaaabbbbcccc: 'v3' });
  });
});

describe('withId', () => {
  it('[ComponentManagerTab-UTILS-011] returns the SAME set reference when membership is already correct', () => {
    // Break this catches: always returning a new Set, which would defeat the no-op
    // guard this exists for and trigger an unnecessary re-render on every report.
    const set = new Set(['lib-1']);
    expect(withId(set, 'lib-1', true)).toBe(set);

    const emptySet = new Set();
    expect(withId(emptySet, 'lib-1', false)).toBe(emptySet);
  });

  it('[ComponentManagerTab-UTILS-012] adds and removes ids without mutating the original set', () => {
    const set = new Set(['lib-1']);
    const added = withId(set, 'lib-2', true);
    expect(added).not.toBe(set);
    expect(added).toEqual(new Set(['lib-1', 'lib-2']));
    expect(set).toEqual(new Set(['lib-1'])); // untouched

    expect(withId(added, 'lib-1', false)).toEqual(new Set(['lib-2']));
  });
});

describe('initials', () => {
  it('[ComponentManagerTab-UTILS-013] takes up to two uppercase letters from the name', () => {
    expect(initials('DataGrid')).toBe('DG');
  });

  it('[ComponentManagerTab-UTILS-014] falls back to the first two letters, uppercased, when the name has no uppercase letters', () => {
    expect(initials('gauge')).toBe('GA');
  });
});
