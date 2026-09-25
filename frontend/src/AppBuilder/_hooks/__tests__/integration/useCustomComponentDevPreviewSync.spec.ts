import { renderHook, act } from '@testing-library/react';
import useStore from '@/AppBuilder/_stores/store';
import { useCustomComponentLibrariesStore } from '@/_stores/customComponentLibrariesStore';

let mockEdition = 'ee';
jest.mock('@/modules/common/helpers/utils', () => ({
  ...jest.requireActual('@/modules/common/helpers/utils'),
  fetchEdition: () => mockEdition,
}));

// eslint-disable-next-line import/first
import useCustomComponentDevPreviewSync from '../../useCustomComponentDevPreviewSync';

const DASHLESS = 'aaaaaaaabbbbccccddddeeeeeeeeeeee';

const setLicenseAccess = (hasAccess: boolean) =>
  act(() => useStore.setState({ license: { featureAccess: { customComponentLibraries: hasAccess } } } as any));

const setPins = (pins: Record<string, string>) =>
  act(() => useStore.getState().setGlobalSettings({ customComponentLibraries: pins }));

// syncDevPinStreams now reads the cached list from state instead of fetching it itself
// (fetchLibraries is mocked below, so it never actually populates the store) — tests that
// expect a sync to fire must seed this directly, same as the real fetchLibraries() would.
const setLibraries = (libraries: unknown[] | null) => act(() => useCustomComponentLibrariesStore.setState({ libraries } as any));

describe('useCustomComponentDevPreviewSync', () => {
  let syncDevPinStreams: jest.SpyInstance;
  let fetchLibraries: jest.SpyInstance;

  beforeEach(() => {
    mockEdition = 'ee';
    syncDevPinStreams = jest
      .spyOn(useCustomComponentLibrariesStore.getState(), 'syncDevPinStreams')
      .mockReturnValue(undefined);
    fetchLibraries = jest.spyOn(useCustomComponentLibrariesStore.getState(), 'fetchLibraries').mockResolvedValue([]);
    setLibraries([]);
  });

  afterEach(() => {
    syncDevPinStreams.mockRestore();
    fetchLibraries.mockRestore();
  });

  it('[DevPreviewSync-001] does not sync dev pin streams when the workspace lacks CCL license access', () => {
    // Break this catches: dropping the hasCustomComponentLibrariesAccess gate, which would
    // open a live-reload SSE stream for a workspace that isn't licensed for CCL at all.
    setLicenseAccess(false);
    setPins({ [DASHLESS]: 'dev:user-1' });

    renderHook(() => useCustomComponentDevPreviewSync('app-1'));

    expect(syncDevPinStreams).not.toHaveBeenCalled();
  });

  it('[DevPreviewSync-002] syncs dev pin streams once the workspace has CCL license access', () => {
    setLicenseAccess(true);
    setPins({ [DASHLESS]: 'dev:user-1' });

    renderHook(() => useCustomComponentDevPreviewSync('app-1'));

    expect(syncDevPinStreams).toHaveBeenCalledWith({ [DASHLESS]: 'dev:user-1' });
  });

  it('[DevPreviewSync-003] starts syncing once access is granted after mounting without it', () => {
    setLicenseAccess(false);
    setPins({ [DASHLESS]: 'dev:user-1' });

    const { rerender } = renderHook(() => useCustomComponentDevPreviewSync('app-1'));
    expect(syncDevPinStreams).not.toHaveBeenCalled();

    setLicenseAccess(true);
    rerender();

    expect(syncDevPinStreams).toHaveBeenCalledWith({ [DASHLESS]: 'dev:user-1' });
  });

  it('[DevPreviewSync-004] fetches the library list even without CCL license access', () => {
    // Break this catches: folding fetchLibraries back under the license gate, which would
    // leave components with no manifest/name data to render for an unlicensed workspace.
    setLicenseAccess(false);
    setPins({});

    renderHook(() => useCustomComponentDevPreviewSync('app-1'));

    expect(fetchLibraries).toHaveBeenCalled();
    expect(syncDevPinStreams).not.toHaveBeenCalled();
  });

  it('[DevPreviewSync-005] fetches the library list when access is granted too', () => {
    setLicenseAccess(true);
    setPins({});

    renderHook(() => useCustomComponentDevPreviewSync('app-1'));

    expect(fetchLibraries).toHaveBeenCalled();
  });

  it('[DevPreviewSync-006] does not sync until the library list has actually loaded', () => {
    // Break this catches: reading get().libraries without waiting for it to populate,
    // which would silently skip reconciling a dev pin that's already set on first mount
    // (libraries starts out null — see fetchLibraries's own null-until-fetched contract).
    setLicenseAccess(true);
    setPins({ [DASHLESS]: 'dev:user-1' });
    setLibraries(null);

    const { rerender } = renderHook(() => useCustomComponentDevPreviewSync('app-1'));
    expect(syncDevPinStreams).not.toHaveBeenCalled();

    setLibraries([]);
    rerender();

    expect(syncDevPinStreams).toHaveBeenCalledWith({ [DASHLESS]: 'dev:user-1' });
  });

  it('[DevPreviewSync-007] does not fetch the library list on CE — the endpoint is an unimplemented stub there', () => {
    // Break this catches: calling fetchLibraries() on CE, which hits
    // server/src/modules/custom-component-libraries/controller.ts's stub (every route
    // throws "Method not implemented") — a doomed request on every single app load.
    mockEdition = 'ce';
    setLicenseAccess(true);
    setPins({ [DASHLESS]: 'dev:user-1' });

    renderHook(() => useCustomComponentDevPreviewSync('app-1'));

    expect(fetchLibraries).not.toHaveBeenCalled();
  });

  it.each(['ee', 'cloud'])('[DevPreviewSync-008] fetches the library list on %s edition', (edition) => {
    mockEdition = edition;
    setLicenseAccess(true);
    setPins({});

    renderHook(() => useCustomComponentDevPreviewSync('app-1'));

    expect(fetchLibraries).toHaveBeenCalled();
  });
});
