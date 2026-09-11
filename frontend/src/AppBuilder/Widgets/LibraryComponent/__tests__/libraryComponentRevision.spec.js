import { renderHook, act } from '@testing-library/react';
import useStore from '@/AppBuilder/_stores/store';
import { useEffectiveLibraryRevision } from '../../libraryComponentRevision';

const setPins = (pins) => {
  act(() => {
    useStore.getState().setGlobalSettings({ customComponentLibraries: pins });
  });
};

describe('useEffectiveLibraryRevision', () => {
  it('[LibraryComponent-REV-001] falls back to the instance revisionId when no pin exists for the library', () => {
    // Break this catches: the `pin ?? instanceRevisionId` fallback being dropped
    // or inverted, e.g. always returning the pin (undefined) instead of falling
    // back to the caller's own property.
    const { result, unmount } = renderHook(() =>
      useEffectiveLibraryRevision('11111111-1111-1111-1111-111111111111', 'v1')
    );

    expect(result.current).toBe('v1');
    unmount();
  });

  it('[LibraryComponent-REV-002] resolves the pin via the dashless correlationId key, falling back to the raw correlationId key', () => {
    // Break this catches: looking the pin up by any key other than
    // dashlessId(correlationId) first / raw correlationId second — e.g. reverting
    // to a libraryId-keyed lookup, which would silently stop finding pins that
    // were written under the dashless correlationId.
    const correlationId = '11111111-2222-3333-4444-555555555555';
    const dashless = correlationId.replace(/-/g, '');

    const { result, rerender, unmount } = renderHook(({ id, rev }) => useEffectiveLibraryRevision(id, rev), {
      initialProps: { id: correlationId, rev: 'v1' },
    });
    expect(result.current).toBe('v1'); // no pin yet: falls back to instance property

    setPins({ [dashless]: 'v3' });
    rerender({ id: correlationId, rev: 'v1' });
    expect(result.current).toBe('v3');

    setPins({ [correlationId]: 'v4' }); // only the raw (non-dashless) key present
    rerender({ id: correlationId, rev: 'v1' });
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
    const { result, rerender, unmount } = renderHook(({ id, rev }) => useEffectiveLibraryRevision(id, rev), {
      initialProps: { id: correlationId, rev: 'v1' },
    });
    expect(result.current).toBe('v2');

    setPins({ [dashless]: 'v5' });
    rerender({ id: correlationId, rev: 'v1' });
    expect(result.current).toBe('v5');

    unmount();
  });

  it('[LibraryComponent-REV-004] lets an app-level pin override the instance revisionId property', () => {
    // Break this catches: `pin ?? instanceRevisionId` becoming
    // `instanceRevisionId ?? pin` (or any change that prefers the instance
    // property over an existing pin), which would strand every app on the
    // revision baked into the widget instead of the one the user picked.
    const correlationId = 'dddddddd-eeee-ffff-0000-111111111111';
    const dashless = correlationId.replace(/-/g, '');
    setPins({ [dashless]: 'dev:user-42' });

    const { result, unmount } = renderHook(() => useEffectiveLibraryRevision(correlationId, 'v9'));

    expect(result.current).toBe('dev:user-42');
    unmount();
  });
});
