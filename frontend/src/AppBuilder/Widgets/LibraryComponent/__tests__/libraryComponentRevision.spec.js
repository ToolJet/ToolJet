import { renderHook, act } from '@testing-library/react';
import useStore from '@/AppBuilder/_stores/store';
import { useEffectiveLibraryRevision } from '../../libraryComponentRevision';

const setPins = (pins) => {
  act(() => {
    useStore.getState().setGlobalSettings({ customComponentLibraries: pins });
  });
};

describe('useEffectiveLibraryRevision', () => {
  it('[LibraryComponent-REV-001] resolves to undefined when no pin exists for the library', () => {
    // Break this catches: reintroducing any per-instance fallback (e.g. an
    // `instanceRevisionId` argument) instead of relying solely on the library-level
    // pin — a missing pin must resolve to undefined (unconfigured), never a guess,
    // so divergent instances of the same library can't silently render different
    // revisions.
    const { result, unmount } = renderHook(() => useEffectiveLibraryRevision('11111111-1111-1111-1111-111111111111'));

    expect(result.current).toBeUndefined();
    unmount();
  });

  it('[LibraryComponent-REV-002] resolves the pin via the dashless correlationId key, falling back to the raw correlationId key', () => {
    // Break this catches: looking the pin up by any key other than
    // dashlessId(correlationId) first / raw correlationId second — e.g. reverting
    // to a libraryId-keyed lookup, which would silently stop finding pins that
    // were written under the dashless correlationId.
    const correlationId = '11111111-2222-3333-4444-555555555555';
    const dashless = correlationId.replace(/-/g, '');

    const { result, rerender, unmount } = renderHook(({ id }) => useEffectiveLibraryRevision(id), {
      initialProps: { id: correlationId },
    });
    expect(result.current).toBeUndefined(); // no pin yet

    setPins({ [dashless]: 'v3' });
    rerender({ id: correlationId });
    expect(result.current).toBe('v3');

    setPins({ [correlationId]: 'v4' }); // only the raw (non-dashless) key present
    rerender({ id: correlationId });
    expect(result.current).toBe('v4');

    unmount();
  });

  it('[LibraryComponent-REV-003] tolerates a legacy object-shaped pin alongside a flat-string pin', () => {
    // Break this catches: removing normalizePin's object-shape handling, which
    // would make a legacy `{ revisionId }` pin resolve to `undefined` instead of
    // its revision, silently reverting every component pinned before the
    // flat-string format shipped back to its default.
    const correlationId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
    const dashless = correlationId.replace(/-/g, '');

    setPins({ [dashless]: { revisionId: 'v2' } });
    const { result, rerender, unmount } = renderHook(({ id }) => useEffectiveLibraryRevision(id), {
      initialProps: { id: correlationId },
    });
    expect(result.current).toBe('v2');

    setPins({ [dashless]: 'v5' });
    rerender({ id: correlationId });
    expect(result.current).toBe('v5');

    unmount();
  });

  it('[LibraryComponent-REV-004] two instances of the same library with no pin never diverge', () => {
    // Break this catches: the exact bug this change closes — a per-instance
    // fallback letting two components of the same library (dropped at different
    // times, with different locally-remembered versions) render two different
    // revisions when the shared pin is missing. Both must resolve identically
    // (undefined) regardless of any per-instance state.
    const correlationId = 'dddddddd-eeee-ffff-0000-111111111111';

    const first = renderHook(() => useEffectiveLibraryRevision(correlationId));
    const second = renderHook(() => useEffectiveLibraryRevision(correlationId));

    expect(first.result.current).toBe(second.result.current);
    expect(first.result.current).toBeUndefined();

    first.unmount();
    second.unmount();
  });

  it('[LibraryComponent-REV-005] ignores any second argument entirely — there is no per-instance fallback', () => {
    // Break this catches: reintroducing a per-instance fallback parameter (under
    // any name), which would let two instances of the same library resolve to
    // different revisions whenever the shared pin is missing.
    const { result, unmount } = renderHook(() =>
      useEffectiveLibraryRevision('ffffffff-1111-2222-3333-444444444444', 'v7')
    );

    expect(result.current).toBeUndefined();
    unmount();
  });
});
