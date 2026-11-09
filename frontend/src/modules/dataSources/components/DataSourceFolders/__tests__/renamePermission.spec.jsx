import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { DataSourceFolders } from '..';
import { GlobalDataSourcesContext } from '../../../pages/GlobalDataSourcesPage';

jest.mock('../../../pages/GlobalDataSourcesPage', () => ({
  GlobalDataSourcesContext: require('react').createContext({}),
}));
// Collapsed folders never reach these, but the module graph still loads them.
jest.mock('../dnd', () => ({ DraggableDataSource: ({ children }) => children }));
jest.mock('../../LIstItem', () => ({ ListItem: () => null }));
jest.mock('@dnd-kit/core', () => ({ useDroppable: () => ({ setNodeRef: jest.fn(), isOver: false }) }));
jest.mock('lucide-react/dynamic.mjs', () => ({ DynamicIcon: () => null }));
jest.mock('lucide-react', () => ({ EllipsisVerticalIcon: () => null }));
jest.mock('@/components/ui/Button/Button', () => {
  const mockReact = require('react');
  return {
    Button: mockReact.forwardRef(({ children, iconOnly: _iconOnly, ...props }, ref) =>
      mockReact.createElement('button', { ref, ...props }, children)
    ),
  };
});
// The real Overlay anchors to a ref that is null on first render; render the menu inline instead.
jest.mock('react-bootstrap', () => ({
  Overlay: ({ show, children }) => (show ? children({}) : null),
  Popover: ({ children }) => <div>{children}</div>,
}));

const FOLDER_A = { id: 'folder-a', name: 'Folder A', created_by: 'someone-else' };
const FOLDER_B = { id: 'folder-b', name: 'Folder B', created_by: 'someone-else' };

// A builder whose ONLY data-source-folder permission is a granular "Edit folder" grant scoped to
// Folder A: both coarse flags are off, so nothing workspace-wide can stand in for the grant.
const scopedEditorSession = {
  super_admin: false,
  admin: false,
  current_user: { id: 'builder-1' },
  user_permissions: { data_source_folder_create: false, data_source_folder_delete: false },
  data_source_folder_group_permissions: { is_all_editable: false, editable_folders_id: ['folder-a'] },
};

// Deliberately NOT the production helper: this spec pins the wiring (does each folder's own
// identity reach the gate?), so the rule it checks is kept trivial and local. The rule itself is
// covered by helpers/__tests__/dataSourceFolderPermissions.spec.js.
const canRenameScopedToFolderA = (folder) =>
  !!folder && scopedEditorSession.data_source_folder_group_permissions.editable_folders_id.includes(folder.id);

function mount({ folders, canUpdateDataSourceFolder, canDeleteDataSourceFolder = () => false }) {
  return render(
    <GlobalDataSourcesContext.Provider
      value={{
        folders,
        expandedFolderIds: [],
        toggleFolderExpanded: jest.fn(),
        canUpdateDataSourceFolder,
        canDeleteDataSourceFolder,
        selectedDataSource: null,
      }}
    >
      <DataSourceFolders visibleDataSources={[]} onRenameFolder={jest.fn()} onDeleteFolder={jest.fn()} />
    </GlobalDataSourcesContext.Provider>
  );
}

// The folder menu is addressed by data-cy, not data-testid.
const byCy = (container, value) => container.querySelector(`[data-cy="${value}"]`);

describe('DataSourceFolders | Rename affordance under a scoped "Edit folder" grant', () => {
  it('should offer Rename on the granted folder when the user holds only a per-folder Edit folder grant', () => {
    const { container } = mount({ folders: [FOLDER_A], canUpdateDataSourceFolder: canRenameScopedToFolderA });

    fireEvent.click(byCy(container, 'datasource-folder-menu-btn-folder-a'));

    expect(byCy(document.body, 'datasource-folder-rename-btn-folder-a')).not.toBeNull();
  });

  it('should not offer Rename on a folder outside the grant', () => {
    const { container } = mount({ folders: [FOLDER_B], canUpdateDataSourceFolder: canRenameScopedToFolderA });

    expect(byCy(container, 'datasource-folder-menu-btn-folder-b')).toBeNull();
  });

  it('should decide per folder, not once for the whole list', () => {
    const { container } = mount({
      folders: [FOLDER_A, FOLDER_B],
      canUpdateDataSourceFolder: canRenameScopedToFolderA,
    });

    expect(byCy(container, 'datasource-folder-menu-btn-folder-a')).not.toBeNull();
    expect(byCy(container, 'datasource-folder-menu-btn-folder-b')).toBeNull();
  });
});
