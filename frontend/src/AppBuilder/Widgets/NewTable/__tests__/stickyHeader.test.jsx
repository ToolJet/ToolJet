import '@testing-library/jest-dom';
import React from 'react';
import { render } from '@testing-library/react';
import { TableData } from '../_components/TableData/TableData';
import { TableHeader } from '../_components/TableData/_components/TableHeader';

// Mock TanStack virtualizer
jest.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: () => ({
    getTotalSize: () => 100,
    getVirtualItems: () => [],
  }),
}));

// Mock the Zustand stores
const mockTableProperties = {
  allowSelection: false,
  highlightSelectedRow: false,
  disableRowDeselection: false,
  stickyHeader: true,
};

const mockTableStyles = {
  isMaxRowHeightAuto: false,
  rowStyle: 'table-classic',
  cellHeight: 'regular',
  maxRowHeightValue: 40,
  contentWrap: false,
  containerBackgroundColor: '#ffffff',
};

jest.mock('../_stores/tableStore', () => {
  return jest.fn((selector) => {
    const state = {
      getTableProperties: () => mockTableProperties,
      getTableStyles: () => mockTableStyles,
      getLoadingState: () => false,
      getIsRefreshing: () => false,
      getExpandedRows: () => ({}),
      getActions: () => [],
      getEnableExpandableRows: () => false,
      collapseAllRows: jest.fn(),
      toggleRowExpansion: jest.fn(),
    };
    if (typeof selector === 'function') {
      return selector(state);
    }
    return state;
  });
});

jest.mock('@/AppBuilder/_stores/store', () => {
  return {
    __esModule: true,
    default: jest.fn((selector) => {
      const state = {
        getResolvedValue: (val) => val,
      };
      return selector(state);
    }),
  };
});

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (str) => str,
  }),
}));

// Mock @/_helpers/utils to prevent importing service files that fail in Jest
jest.mock('@/_helpers/utils', () => ({
  determineJustifyContentValue: (val) => {
    if (val === 'center') return 'center';
    if (val === 'right') return 'flex-end';
    return 'flex-start';
  },
  determineAlignItemsValue: (val) => 'center',
}));

// Mock subcomponents to avoid rendering full tree
jest.mock('../_components/TableData/_components/TableRow', () => ({
  TableRow: () => <tr><td>Row</td></tr>,
}));

jest.mock('../_components/TableData/_components/ExpandedRowContainer', () => ({
  ExpandedRowContainer: () => <tr><td>Expansion</td></tr>,
}));

describe('Table Sticky Header', () => {
  const tableMock = {
    getRowModel: () => ({ rows: [] }),
    getHeaderGroups: () => [],
    getAllLeafColumns: () => [],
    getColumn: () => null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render thead with sticky position by default', () => {
    mockTableProperties.stickyHeader = true;

    const { container } = render(
      <TableData
        id="table-1"
        data={[{ id: '1' }]}
        table={tableMock}
        tableBodyRef={{ current: null }}
      />
    );

    const thead = container.querySelector('thead');
    expect(thead).toBeInTheDocument();
    expect(thead).toHaveStyle('position: sticky');
  });

  it('should render thead with static position when stickyHeader is false', () => {
    mockTableProperties.stickyHeader = false;

    const { container } = render(
      <TableData
        id="table-1"
        data={[{ id: '1' }]}
        table={tableMock}
        tableBodyRef={{ current: null }}
      />
    );

    const thead = container.querySelector('thead');
    expect(thead).toBeInTheDocument();
    expect(thead).toHaveStyle('position: static');
  });

  it('should render TableHeader thead with static position when stickyHeader is false', () => {
    mockTableProperties.stickyHeader = false;

    const { container } = render(
      <TableHeader
        id="table-1"
        table={tableMock}
        columnOrder={[]}
        setColumnOrder={jest.fn()}
        fireEvent={jest.fn()}
        setExposedVariables={jest.fn()}
      />
    );

    const thead = container.querySelector('thead');
    expect(thead).toBeInTheDocument();
    expect(thead).toHaveStyle('position: static');
  });
});
