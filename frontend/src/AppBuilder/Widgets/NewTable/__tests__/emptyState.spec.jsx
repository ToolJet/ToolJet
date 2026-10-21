import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
/**
 * A Table with no rows draws its header row, then the empty state as the body under it. The empty state was placed
 * absolutely and took no room, so the shadcn look (a table as tall as its rows) drew a table as tall as its header,
 * the icon squeezed into the header row and the "No data" message cut off.
 */
import fs from 'fs';
import path from 'path';
import React from 'react';
import { render } from '@testing-library/react';
import useTableStore from '../_stores/tableStore';
import { TableData } from '../_components/TableData/TableData';

jest.mock('../_components/TableData/_components/TableHeader', () => ({
  TableHeader: () => (
    <thead>
      <tr>
        {['ORDER', 'CUSTOMER', 'PLACED', 'DELIVERY', 'ITEMS', 'VALUE', 'STATUS'].map((name) => (
          <th key={name}>{name}</th>
        ))}
      </tr>
    </thead>
  ),
}));

const emptyTable = { getRowModel: () => ({ rows: [] }), getColumn: () => undefined };

const renderEmpty = () => {
  useTableStore.getState().initializeComponent('orders');
  return render(
    <TableData
      id="orders"
      data={[]}
      tableBodyRef={{ current: null }}
      darkMode={false}
      table={emptyTable}
      columnOrder={[]}
      setColumnOrder={() => {}}
      setExposedVariables={() => {}}
      fireEvent={() => {}}
      lastClickedRowRef={{ current: {} }}
      componentName="ordersTable"
      loadingState={false}
    />
  );
};

const scss = (file) => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

describe('Table with no rows', () => {
  it('draws the empty state as the body under the header, not inside it', () => {
    const { container, getByText } = renderEmpty();
    const message = getByText('No data');
    const head = container.querySelector('thead');
    const body = container.querySelector('.tj-ntable-empty-body');

    expect(head).not.toBeNull();
    expect(head.textContent).toContain('DELIVERY');
    expect(head.contains(message)).toBe(false);
    expect(head.querySelector('.warning-no-data')).toBeNull();

    // The body comes after the header, in the same box, and holds the icon above the message.
    expect(body).not.toBeNull();
    expect(body.contains(message)).toBe(true);
    expect(head.compareDocumentPosition(body) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // It is the body's one row, in the same table as the header.
    expect(body.closest('tbody')).not.toBeNull();
    expect(body.closest('table')).toBe(head.closest('table'));
    const icon = body.querySelector('.warning-no-data');
    expect(icon.compareDocumentPosition(message) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('keeps the empty state in the flow, so it takes room under the header', () => {
    const { container } = renderEmpty();
    const box = container.querySelector('.jet-data-table');
    expect(box.classList.contains('tj-ntable-empty')).toBe(true);
    // Not the ToolJet database's tj-table-empty, whose global rule drew near-black header borders.
    expect(container.querySelector('.tj-table-empty')).toBeNull();
    // The same table classes as with rows, so the header is drawn the same.
    expect(box.querySelector('table')).toHaveClass('table');
    for (const el of [box, ...box.querySelectorAll('*')]) {
      expect(el.style.position).not.toBe('absolute');
    }
  });

  it('gives the body the height under the header, in both looks', () => {
    const table = scss('table.scss');
    // The body fills what is under the header and is never sized to nothing.
    expect(table).toMatch(/\.tj-ntable-empty-body \{[^}]*flex: 1 1 auto;/);
    expect(table).toMatch(/\.tj-ntable-empty-body \{[^}]*contain-intrinsic-height: \d+px;/);
    // A short table drops the icon and keeps the message.
    expect(table).toMatch(
      /@container tj-ntable-empty \(max-height: \d+px\) \{\s*\.tj-ntable-empty-body \.warning-no-data/
    );

    // The shadcn look sizes the table to its rows; an empty one keeps its box and lets the body grow.
    const look = scss('shadcnLook.scss');
    expect(look).toMatch(/&:has\(> \.table-responsive\.tj-ntable-empty\) \{\s*height: 100% !important;/);
    expect(look).toMatch(/> \.table-responsive\.tj-ntable-empty \{\s*flex: 1 1 auto !important;/);
  });
});
