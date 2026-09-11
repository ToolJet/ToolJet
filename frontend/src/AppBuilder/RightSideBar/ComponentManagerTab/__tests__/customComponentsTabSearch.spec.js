import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import useStore from '@/AppBuilder/_stores/store';
import { useCustomComponentLibrariesStore } from '@/_stores/customComponentLibrariesStore';
import { CustomComponentsTab } from '../CustomComponentsTab';

const CORRELATION_ID = '11111111-1111-1111-1111-111111111111';
const DASHLESS = CORRELATION_ID.replace(/-/g, '');

// revisions[0] is "latest" (v2); its manifest is already in hand (no component named
// after "legacy"). The pinned-to v1 manifest — fetched on demand — has LegacyWidget.
const alphaLibrary = {
  id: 'lib-alpha',
  correlationId: CORRELATION_ID,
  name: 'Alpha',
  revisions: [
    { id: 'r2', version: 'v2', createdAt: '2024-02-01T00:00:00.000Z' },
    { id: 'r1', version: 'v1', createdAt: '2024-01-01T00:00:00.000Z' },
  ],
  devBundles: [],
  manifest: { components: { NewWidget: { displayName: 'New Widget' } } },
};

// No pin: current === latest, so its manifest is used directly (no fetch) — matches
// against it resolve SYNCHRONOUSLY, in the same render as the query change.
const betaLibrary = {
  id: 'lib-beta',
  correlationId: '22222222-2222-2222-2222-222222222222',
  name: 'Beta',
  revisions: [{ id: 'rb1', version: 'v1', createdAt: '2024-01-01T00:00:00.000Z' }],
  devBundles: [],
  manifest: { components: { Button: { displayName: 'Button' } } },
};

const setPins = (pins) => act(() => useStore.getState().setGlobalSettings({ customComponentLibraries: pins }));

const withDnd = (searchQuery) => (
  <DndProvider backend={HTML5Backend}>
    <CustomComponentsTab searchQuery={searchQuery} />
  </DndProvider>
);

const renderTab = (searchQuery) => render(withDnd(searchQuery));

// Exposes `rerender(nextQuery)` so a test can simulate typing — the initial mount and
// each subsequent query change land in separate `act()`-wrapped commits, same as real
// keystrokes would.
const renderTabWithRerender = (searchQuery) => {
  const { rerender, ...rest } = render(withDnd(searchQuery));
  return { ...rest, rerender: (nextQuery) => rerender(withDnd(nextQuery)) };
};

describe('CustomComponentsTab search vs. pinned revisions', () => {
  beforeEach(() => {
    useCustomComponentLibrariesStore.setState({ libraries: [alphaLibrary], loadFailed: false });
    setPins({ [DASHLESS]: 'v1' }); // pinned to the OLDER revision, not latest (v2)
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ components: { LegacyWidget: { displayName: 'Legacy Widget' } } }),
    });
  });

  afterEach(() => {
    global.fetch.mockRestore();
    act(() => useCustomComponentLibrariesStore.setState({ libraries: null, loadFailed: false }));
    setPins({});
  });

  it('[CustomComponentsTab-SEARCH-001] finds a component that only exists in the pinned (non-latest) revision manifest', async () => {
    // Break this catches: pre-filtering libraries against the latest-revision manifest
    // before a section gets to fetch/search the pinned revision's actual manifest —
    // that would drop Alpha before "Legacy Widget" is ever found, even though the
    // revision the app is actually pinned to (and displaying) has it.
    renderTab('legacy');

    expect(await screen.findByText('Legacy Widget')).toBeInTheDocument();
    expect(screen.queryByText('No results found')).not.toBeInTheDocument();
  });

  it('[CustomComponentsTab-SEARCH-002] shows "No results found" once the pinned manifest resolves and truly has no match', async () => {
    renderTab('doesnotexist');

    expect(await screen.findByText('No results found')).toBeInTheDocument();
    expect(screen.queryByText('Legacy Widget')).not.toBeInTheDocument();
  });

  it('[CustomComponentsTab-SEARCH-003] a library-name match short-circuits the component search entirely', async () => {
    renderTab('alpha');

    expect(await screen.findByText('Legacy Widget')).toBeInTheDocument();
  });

  it('[CustomComponentsTab-SEARCH-004] does not get stuck on "No results found" when a match resolves synchronously with the query change', () => {
    // Break this catches: a parent-level effect that blindly resets visibility on every
    // searchQuery change — since parent effects run AFTER child effects in the same
    // commit, that reset would clobber a match that resolved synchronously (no manifest
    // fetch needed, e.g. an already-cached component), permanently masking a real
    // result behind "No results found" even though it's rendered right below it.
    act(() => useCustomComponentLibrariesStore.setState({ libraries: [betaLibrary], loadFailed: false }));

    const { rerender } = renderTabWithRerender('');
    rerender('but');

    expect(screen.getByText('Button')).toBeInTheDocument();
    expect(screen.queryByText('No results found')).not.toBeInTheDocument();
  });
});
