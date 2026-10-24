/**
 * The Footer's plan read through the table store, as the real Table feeds it (Table.jsx calls setTableProperties and
 * setTableStyles; the Footer reads both back).
 *
 * setTableStyles copies a fixed list of style keys into the store and tableLook was not among them, so the Footer
 * always read `undefined` and every shadcn-look table kept its pager and record count: the one-page plan never ran in
 * an app, though footerPlan.spec.js passed (it calls the pure function).
 */
import React from 'react';
import { render } from '@testing-library/react';
import useTableStore from '../_stores/tableStore';
import { Footer } from '../_components/Footer/Footer';

jest.mock('../_components/Footer/_components/Pagination/Pagination', () => ({
  Pagination: () => <div data-testid="pager" />,
}));
jest.mock('../_components/Footer/_components/RowCount', () => ({ RowCount: () => <div data-testid="count" /> }));
jest.mock('../_components/Footer/_components/ControlButtons', () => ({
  ControlButtons: () => <div data-testid="buttons" />,
}));

const NO_BUTTONS = {
  showAddNewRowButton: false,
  showDownloadButton: false,
  showRefreshButton: false,
  hideColumnSelectorButton: true,
};

const seed = (id, look, properties) => {
  const store = useTableStore.getState();
  store.initializeComponent(id);
  store.setTableProperties(id, { enablePagination: true, rowsPerPage: 10, ...properties });
  store.setTableStyles(id, { tableLook: look }, false);
};

const renderFooter = (id, pageCount = 1) =>
  render(
    <Footer
      id={id}
      darkMode={false}
      height={300}
      width={600}
      allColumns={[]}
      table={{ getState: () => ({ pagination: { pageIndex: 0 } }) }}
      pageIndex={1}
      componentName="table1"
      fireEvent={() => {}}
      setExposedVariables={() => {}}
      pageCount={pageCount}
      dataLength={3}
    />
  );

describe('Table footer plan through the store', () => {
  it('keeps the shadcn look in the store', () => {
    seed('look', 'shadcn', NO_BUTTONS);
    expect(useTableStore.getState().getTableStyles('look').tableLook).toBe('shadcn');
  });

  it('a one-page shadcn table with no footer buttons draws no footer', () => {
    seed('bare', 'shadcn', NO_BUTTONS);
    const { container } = renderFooter('bare');
    expect(container.querySelector('.jet-table-footer')).toBeNull();
  });

  it('a one-page shadcn table with buttons keeps them and drops the pager and count', () => {
    seed('buttons', 'shadcn', { showAddNewRowButton: true, showDownloadButton: true });
    const { queryByTestId } = renderFooter('buttons');
    expect(queryByTestId('buttons')).not.toBeNull();
    expect(queryByTestId('pager')).toBeNull();
    expect(queryByTestId('count')).toBeNull();
  });

  it('the ToolJet look keeps its pager and count on one page', () => {
    seed('tooljet', 'default', NO_BUTTONS);
    const { queryByTestId } = renderFooter('tooljet');
    expect(queryByTestId('pager')).not.toBeNull();
    expect(queryByTestId('count')).not.toBeNull();
  });

  it('a shadcn table with more pages keeps its pager', () => {
    seed('paged', 'shadcn', NO_BUTTONS);
    const { queryByTestId } = renderFooter('paged', 5);
    expect(queryByTestId('pager')).not.toBeNull();
  });
});
