/**
 * Table's "Row background" style is evaluated per row, so its code editor needs the table
 * context that supplies `rowData` autocomplete hints and preview. Other Table styles must not get it.
 *
 * `Code` is replaced with a probe reading the table context: the real editor pulls in the
 * ee AiBuilder -> @mdxeditor/editor chain, which Jest cannot transform.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('../Elements/Code', () => {
  const { useContext: useCtx } = require('react');
  const { TableColumnContext: Ctx } = require('../Components/Table/ColumnManager/TableColumnContext');
  return {
    Code: ({ param }) => {
      const ctx = useCtx(Ctx);
      return <div data-testid="code" data-param={param.name} data-table-id={ctx?.tableId ?? ''} />;
    },
  };
});
jest.mock('../Components/Form/_components', () => ({ LabeledDivider: () => null }));

import { renderCustomStyles } from '../Utils';

const TABLE = {
  id: 'tbl1',
  component: { name: 'table1', component: 'Table', definition: { styles: {} }, properties: {} },
};
const META = {
  styles: {
    Container: {
      containerBackgroundColor: { type: 'colorSwatches' },
      rowBackgroundColor: { type: 'colorSwatches' },
    },
  },
};

const renderStyle = (param) =>
  render(<>{renderCustomStyles(TABLE, META, jest.fn(), [], param, 'styles', {}, {}, 'Container')}</>);

describe('renderCustomStyles - Table styles', () => {
  test('[Table-ROWBG-008] the Row background field is rendered inside the table context so rowData hints and preview resolve', () => {
    renderStyle('rowBackgroundColor');
    expect(screen.getByTestId('code')).toHaveAttribute('data-table-id', 'tbl1');
  });

  test('[Table-ROWBG-009] other Table style fields are not given the table context', () => {
    renderStyle('containerBackgroundColor');
    expect(screen.getByTestId('code')).toHaveAttribute('data-table-id', '');
  });
});
