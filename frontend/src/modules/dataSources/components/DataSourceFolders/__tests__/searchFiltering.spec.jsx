import React from 'react';
import { render } from '@testing-library/react';
import { DataSourceFolders } from '..';
import { GlobalDataSourcesContext } from '../../../pages/GlobalDataSourcesPage';

jest.mock('../../../pages/GlobalDataSourcesPage', () => ({
  GlobalDataSourcesContext: require('react').createContext({}),
}));
jest.mock('../dnd', () => ({ DraggableDataSource: ({ children }) => children }));
jest.mock('../../LIstItem', () => ({
  ListItem: ({ dataSource }) => <div data-cy={`ds-row-${dataSource.id}`}>{dataSource.name}</div>,
}));
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
jest.mock('react-bootstrap', () => ({
  Overlay: ({ show, children }) => (show ? children({}) : null),
  Popover: ({ children }) => <div>{children}</div>,
}));

const PG = { id: 'ds-pg', name: 'Postgres prod' };
const REST = { id: 'ds-rest', name: 'Rest api' };
const MONGO = { id: 'ds-mongo', name: 'Mongo analytics' };
const ALL_DATA_SOURCES = [PG, REST, MONGO];

// "Reporting" holds the two sources whose names do not contain "postgres"; "Billing" holds the one
// that does; "Archive" holds nothing at all.
const REPORTING = {
  id: 'folder-reporting',
  name: 'Reporting',
  folder_data_sources: [{ data_source_id: REST.id }, { data_source_id: MONGO.id }],
};
const BILLING = { id: 'folder-billing', name: 'Billing', folder_data_sources: [{ data_source_id: PG.id }] };
const ARCHIVE = { id: 'folder-archive', name: 'Archive', folder_data_sources: [] };

function mount({ searchValue = '', visibleDataSources = ALL_DATA_SOURCES } = {}) {
  return render(
    <GlobalDataSourcesContext.Provider
      value={{
        folders: [REPORTING, BILLING, ARCHIVE],
        expandedFolderIds: [],
        toggleFolderExpanded: jest.fn(),
        canUpdateDataSourceFolder: () => false,
        canDeleteDataSourceFolder: () => false,
        selectedDataSource: null,
      }}
    >
      <DataSourceFolders
        dataSources={ALL_DATA_SOURCES}
        visibleDataSources={visibleDataSources}
        searchValue={searchValue}
        onRenameFolder={jest.fn()}
        onDeleteFolder={jest.fn()}
      />
    </GlobalDataSourcesContext.Provider>
  );
}

const byCy = (container, value) => container.querySelector(`[data-cy="${value}"]`);
const folderRow = (container, name) => byCy(container, `datasource-folder-${name}`);

describe('DataSourceFolders | folder visibility while searching', () => {
  it('should show every folder, empty ones included, when nothing is being searched', () => {
    const { container } = mount();

    expect(folderRow(container, 'reporting')).not.toBeNull();
    expect(folderRow(container, 'billing')).not.toBeNull();
    expect(folderRow(container, 'archive')).not.toBeNull();
  });

  it('should hide folders that contain no match for the search term', () => {
    const { container } = mount({ searchValue: 'postgres', visibleDataSources: [PG] });

    expect(folderRow(container, 'billing')).not.toBeNull();
    expect(folderRow(container, 'reporting')).toBeNull();
    expect(folderRow(container, 'archive')).toBeNull();
  });

  it('should match folder names too, keeping a name-matched folder with all of its data sources', () => {
    // "report" matches no data-source name, so the folder survives only on its own name.
    const { container } = mount({ searchValue: 'report', visibleDataSources: [] });

    expect(folderRow(container, 'reporting')).not.toBeNull();
    expect(byCy(container, `ds-row-${REST.id}`)).not.toBeNull();
    expect(byCy(container, `ds-row-${MONGO.id}`)).not.toBeNull();
    expect(folderRow(container, 'billing')).toBeNull();
  });

  it('should keep an empty folder whose own name matches the search term', () => {
    const { container } = mount({ searchValue: 'archive', visibleDataSources: [] });

    expect(folderRow(container, 'archive')).not.toBeNull();
    expect(folderRow(container, 'reporting')).toBeNull();
  });

  it('should render no folders at all when neither a folder name nor any data source matches', () => {
    const { container } = mount({ searchValue: 'nothing-matches-this', visibleDataSources: [] });

    expect(container.querySelector('.datasource-folders-list')).toBeNull();
  });
});
