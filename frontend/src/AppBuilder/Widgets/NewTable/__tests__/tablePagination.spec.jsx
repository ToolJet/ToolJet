/**
 * Table footer pager, characterized before it was split into a shared pager (Listview 2.0 reuses it).
 * The pager is mounted with the real Table store and a real @tanstack/react-table instance; the numbers,
 * disabled states, `data-cy` hooks and the flag that makes the Table fire "Page changed" are today's behaviour.
 */
import React, { useRef, useState } from 'react';
import { render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useReactTable, getCoreRowModel, getPaginationRowModel } from '@tanstack/react-table';
import useTableStore from '@/AppBuilder/Widgets/NewTable/_stores/tableStore';
import { Pagination } from '@/AppBuilder/Widgets/NewTable/_components/Footer/_components/Pagination/Pagination';

const ID = 'tbl1';
const COLUMNS = [{ accessorKey: 'n', header: 'n' }];

let flag;
let lastTable;

function Harness({ rows = 100, pageSize = 10, tableWidth = 800, startPage = 1, serverSide = false }) {
  const [pagination, setPagination] = useState({ pageIndex: startPage - 1, pageSize });
  flag = useRef(false);
  const table = useReactTable({
    data: React.useMemo(() => Array.from({ length: rows }, (_, n) => ({ n })), [rows]),
    columns: COLUMNS,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: serverSide,
    pageCount: serverSide ? 0 : undefined,
  });
  lastTable = table;
  return (
    <div id="pager-host">
      <Pagination
        id={ID}
        pageIndex={pagination.pageIndex + 1}
        tableWidth={tableWidth}
        table={table}
        pageCount={table.getPageCount()}
        paginationBtnClicked={flag}
        darkMode={false}
        height={400}
      />
    </div>
  );
}

function mount(props = {}, tableProperties = {}) {
  useTableStore.getState().initializeComponent(ID);
  useTableStore.getState().setTableProperties(ID, tableProperties);
  return render(<Harness {...props} />);
}

const cy = (name) => document.querySelector(`[data-cy="${name}"]`);
const cyAll = (name) => [...document.querySelectorAll(`[data-cy="${name}"]`)];
const pageLabels = () => cyAll('pagination-button-go-to-page').map((node) => node.textContent.trim());
const selected = () => cyAll('pagination-button-go-to-page').find((node) => node.className.includes('selected'));

// jsdom has no layout: without a size the virtualised page list renders no rows (browser geometry is a genuine boundary).
const SIZE = { width: 110, height: 200, top: 0, left: 0, right: 110, bottom: 200, x: 0, y: 0 };
let rectSpy;
let offsetHeightSpy;
let offsetWidthSpy;
beforeEach(() => {
  rectSpy = jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(SIZE);
  offsetHeightSpy = jest.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(SIZE.height);
  offsetWidthSpy = jest.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(SIZE.width);
});
afterEach(() => {
  rectSpy.mockRestore();
  offsetHeightSpy.mockRestore();
  offsetWidthSpy.mockRestore();
  useTableStore.setState({ components: {} });
});

describe('Table pager (characterization)', () => {
  test('[Table-PAG-001] a wide client table on page 1 shows first, previous, 1 2 3, more, next, last', () => {
    mount();

    expect(pageLabels()).toEqual(['1', '2', '3']);
    expect(selected().textContent.trim()).toBe('1');
    expect(cy('pagination-button-to-first')).toBeDisabled();
    expect(cy('pagination-button-to-previous')).toBeDisabled();
    expect(cy('pagination-button-to-next')).toBeEnabled();
    expect(cy('pagination-button-to-last')).toBeEnabled();
    expect(cy('pagination-button-more-pages')).toBeInTheDocument();
    expect(cy('pagination-section')).toBeInTheDocument();
  });

  test('[Table-PAG-002] the number window follows the current page and stops at both ends', () => {
    mount({ startPage: 5 });
    expect(pageLabels()).toEqual(['4', '5', '6']);
    expect(selected().textContent.trim()).toBe('5');
  });

  test.each([
    [1, ['1', '2', '3']],
    [2, ['1', '2', '3']],
    [3, ['2', '3', '4']],
    [8, ['7', '8', '9']],
    [9, ['8', '9', '10']],
  ])('[Table-PAG-002] page %i of 10 shows %j', (startPage, expected) => {
    mount({ startPage });
    expect(pageLabels()).toEqual(expected);
  });

  test('[Table-PAG-003] on the last page the window is the final three and next and last are disabled', () => {
    mount({ startPage: 10 });
    expect(pageLabels()).toEqual(['8', '9', '10']);
    expect(cy('pagination-button-to-next')).toBeDisabled();
    expect(cy('pagination-button-to-last')).toBeDisabled();
    expect(cy('pagination-button-to-first')).toBeEnabled();
  });

  test('[Table-PAG-004] three pages or fewer list every page with no first, last or more button', () => {
    mount({ rows: 25 });
    expect(pageLabels()).toEqual(['1', '2', '3']);
    expect(cy('pagination-button-to-first')).toBeNull();
    expect(cy('pagination-button-to-last')).toBeNull();
    expect(cy('pagination-button-more-pages')).toBeNull();
  });

  test('[Table-PAG-005] a table 460px wide or less shows only the current page, with first, last and more', () => {
    mount({ tableWidth: 460, startPage: 4 });
    expect(pageLabels()).toEqual(['4']);
    expect(cy('pagination-button-to-first')).toBeInTheDocument();
    expect(cy('pagination-button-to-last')).toBeInTheDocument();
    expect(cy('pagination-button-more-pages')).toBeInTheDocument();
  });

  test('[Table-PAG-006] a narrow table with one page has no first, last or more button', () => {
    mount({ tableWidth: 300, rows: 5 });
    expect(pageLabels()).toEqual(['1']);
    expect(cy('pagination-button-to-first')).toBeNull();
    expect(cy('pagination-button-more-pages')).toBeNull();
    expect(cy('pagination-button-to-next')).toBeDisabled();
  });

  test('[Table-PAG-007] each button moves the table and raises the paginationBtnClicked flag', async () => {
    mount();
    const user = userEvent.setup();

    await user.click(cy('pagination-button-to-next'));
    expect(lastTable.getState().pagination.pageIndex).toBe(1);
    expect(flag.current).toBe(true);
    flag.current = false;

    await user.click(cyAll('pagination-button-go-to-page').find((node) => node.textContent.trim() === '3'));
    expect(lastTable.getState().pagination.pageIndex).toBe(2);
    expect(flag.current).toBe(true);
    flag.current = false;

    await user.click(cy('pagination-button-to-previous'));
    expect(lastTable.getState().pagination.pageIndex).toBe(1);

    await user.click(cy('pagination-button-to-last'));
    expect(lastTable.getState().pagination.pageIndex).toBe(9);

    await user.click(cy('pagination-button-to-first'));
    expect(lastTable.getState().pagination.pageIndex).toBe(0);
    expect(flag.current).toBe(true);
  });

  test('[Table-PAG-008] the more button opens a page list and picking a page goes there', async () => {
    mount({ rows: 40 });
    const user = userEvent.setup();

    await user.click(cy('pagination-button-more-pages'));
    const popover = await waitFor(() => {
      const node = document.querySelector('[data-cy="popover-card"]');
      expect(node).toBeInTheDocument();
      return node;
    });
    expect(popover.className).toContain('pagination-popup');
    const option = await waitFor(() => {
      const node = document.querySelector('[data-cy="page-3-button-option"]');
      expect(node).toBeInTheDocument();
      return node;
    });
    await user.click(option);

    expect(lastTable.getState().pagination.pageIndex).toBe(2);
    expect(flag.current).toBe(true);
  });

  test('[Table-PAG-009] server side with no known total shows only the current page and the Next/Previous toggles decide', () => {
    mount(
      { serverSide: true, startPage: 3 },
      { serverSidePagination: true, enablePrevButton: true, enableNextButton: false }
    );

    expect(pageLabels()).toEqual(['3']);
    expect(cy('pagination-button-to-first')).toBeNull();
    expect(cy('pagination-button-to-last')).toBeNull();
    expect(cy('pagination-button-more-pages')).toBeNull();
    expect(cy('pagination-button-to-previous')).toBeEnabled();
    expect(cy('pagination-button-to-next')).toBeDisabled();
  });

  test('[Table-PAG-010] server side with a known total counts pages from total records and rows per page', () => {
    mount(
      { serverSide: true, startPage: 1 },
      {
        serverSidePagination: true,
        totalRecords: 95,
        serverSideRowsPerPage: 10,
        enablePrevButton: false,
        enableNextButton: true,
      }
    );

    expect(pageLabels()).toEqual(['1', '2', '3']);
    expect(cy('pagination-button-to-first')).toBeDisabled();
    expect(cy('pagination-button-to-last')).toBeEnabled();
    expect(cy('pagination-button-to-previous')).toBeDisabled();
    expect(cy('pagination-button-more-pages')).toBeInTheDocument();
  });

  test('[Table-PAG-011] server side first and last are disabled by the Previous and Next toggles', () => {
    mount(
      { serverSide: true, startPage: 5 },
      {
        serverSidePagination: true,
        totalRecords: 95,
        serverSideRowsPerPage: 10,
        enablePrevButton: false,
        enableNextButton: false,
      }
    );

    expect(cy('pagination-button-to-first')).toBeDisabled();
    expect(cy('pagination-button-to-last')).toBeDisabled();
  });
});
