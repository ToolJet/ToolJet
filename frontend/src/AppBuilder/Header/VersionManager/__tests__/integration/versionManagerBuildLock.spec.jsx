import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import useStore from '@/AppBuilder/_stores/store';
import { useVersionManagerStore } from '@/_stores/versionManagerStore';
import VersionManagerDropdown from '../../VersionManagerDropdown';

jest.mock('@/AppBuilder/_stores/store', () => {
  const { createWithEqualityFn } = require('zustand/traditional');
  return { __esModule: true, default: createWithEqualityFn(() => ({})) };
});
jest.mock('@/_stores/versionManagerStore', () => {
  const { create } = require('zustand');
  return {
    useVersionManagerStore: create((set) => ({
      versions: [],
      filteredVersions: [],
      isDropdownOpen: false,
      searchQuery: '',
      selectedEnvironmentFilter: null,
      loading: false,
      draftVersion: null,
      setDropdownOpen: (open) => set({ isDropdownOpen: open }),
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      setSelectedEnvironmentFilter: (selectedEnvironmentFilter) => set({ selectedEnvironmentFilter }),
      fetchVersionsForEnvironment: jest.fn(),
      refreshVersions: jest.fn(),
    })),
  };
});
jest.mock('@/AppBuilder/_contexts/ModuleContext', () => ({ useModuleContext: () => ({ moduleId: 'canvas' }) }));
jest.mock('@/modules/Appbuilder/components', () => ({ EnvironmentSwitcher: () => null }));
jest.mock('@/_components', () => ({
  ConfirmDialog: ({ show, title }) => (show ? <div role="dialog">{title}</div> : null),
}));
jest.mock('../../VersionSwitcherButton', () => ({ onClick }) => (
  <button type="button" data-cy="version-switcher-button" onClick={onClick}>
    v1
  </button>
));
jest.mock('../../VersionDropdownItem', () => ({ version, onDelete, onEdit }) => (
  <div>
    <button type="button" onClick={() => onDelete(version)}>{`Delete ${version.name}`}</button>
    <button type="button" onClick={() => onEdit(version)}>{`Rename ${version.name}`}</button>
  </div>
));
jest.mock('../../CreateDraftButton', () => ({ onClick }) => (
  <button type="button" onClick={onClick}>
    Create draft
  </button>
));
jest.mock('../../VersionSearchField', () => () => null);
jest.mock('../../VersionItemSkeleton', () => () => null);
jest.mock('../..', () => {
  const dialog =
    (label, showProp) =>
    // eslint-disable-next-line react/display-name
    (props) => (props[showProp] ? <div role="dialog">{label}</div> : null);
  return {
    CreateDraftVersionModal: dialog('Create draft dialog', 'showCreateAppVersion'),
    CreateVersionModal: dialog('Save version dialog', 'showCreateAppVersion'),
    EditVersionModal: dialog('Rename version dialog', 'showEditAppVersion'),
  };
});

const versions = [
  { id: 'v-1', name: 'v1', status: 'DRAFT' },
  { id: 'v-2', name: 'v2', status: 'PUBLISHED' },
];

const setBuilding = (isLoading) => act(() => useStore.setState({ ai: { isLoading } }));

const openMenu = async () => {
  fireEvent.click(screen.getByText('v1'));
  await waitFor(() => expect(useVersionManagerStore.getState().isDropdownOpen).toBe(true));
  return screen.findByText('Delete v2');
};

// The version pill is disabled while an AI build runs, but its menu, or a dialog opened from it, may already
// be open when the build starts. Left open, it would let the user create, rename or delete versions under
// the agent, which writes to the version it started on.
describe('the version menu when an AI build starts', () => {
  beforeEach(() => {
    useStore.setState(
      {
        appStore: { modules: { canvas: { app: { appId: 'app-1' } } } },
        currentVersionId: 'v-1',
        selectedEnvironment: { id: 'env-dev', name: 'development', priority: 1 },
        environments: [],
        selectedVersion: versions[0],
        developmentVersions: versions,
        releasedVersionId: null,
        fetchDevelopmentVersions: jest.fn(),
        changeEditorVersionAction: jest.fn(),
        setCurrentVersionId: jest.fn(),
        setSelectedVersion: jest.fn(),
        deleteVersionAction: jest.fn(),
        environmentChangedAction: jest.fn(),
        ai: { isLoading: false },
      },
      true
    );
    useVersionManagerStore.setState({ versions, filteredVersions: versions, isDropdownOpen: false });
  });

  it('closes an open menu', async () => {
    render(<VersionManagerDropdown />);
    await openMenu();

    setBuilding(true);
    expect(useVersionManagerStore.getState().isDropdownOpen).toBe(false);
    await waitFor(() => expect(screen.queryByText('Delete v2')).toBeNull());
  });

  it('closes a delete confirmation opened from the menu', async () => {
    render(<VersionManagerDropdown />);
    fireEvent.click(await openMenu());
    expect(screen.getByText('Delete version')).toBeInTheDocument();

    setBuilding(true);
    expect(screen.queryByText('Delete version')).toBeNull();
  });

  it('closes the create draft and rename dialogs', async () => {
    render(<VersionManagerDropdown />);
    await openMenu();
    fireEvent.click(screen.getByText('Create draft'));
    expect(screen.getByText('Create draft dialog')).toBeInTheDocument();
    setBuilding(true);
    expect(screen.queryByText('Create draft dialog')).toBeNull();

    setBuilding(false);
    await openMenu();
    fireEvent.click(screen.getByText('Rename v2'));
    expect(screen.getByText('Rename version dialog')).toBeInTheDocument();
    setBuilding(true);
    expect(screen.queryByText('Rename version dialog')).toBeNull();
  });

  it('leaves a menu alone while no build runs', async () => {
    render(<VersionManagerDropdown />);
    await openMenu();
    setBuilding(false);
    expect(useVersionManagerStore.getState().isDropdownOpen).toBe(true);
  });
});
