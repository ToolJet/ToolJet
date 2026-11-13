import React from 'react';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { copyToClipboard } from '@/_helpers/appUtils';
import { SECRET_MASK } from '../../helpers/constants';
import ConstantsTable from '../ConstantsTable';

jest.mock('@/_helpers/appUtils', () => ({ copyToClipboard: jest.fn() }));

const COLUMNS = ['Name', 'Value', 'Last modified', 'Modified by', 'Owner', 'Source'];

const globalItem = {
  kind: 'constant',
  id: 'c1',
  name: 'API_URL',
  type: 'Global',
  source: 'workspace',
  value: 'https://api.example.com',
  last_modified_at: '2026-11-04T10:00:00.000Z',
  owner: { id: 'u1', name: 'Asha Rao' },
  modified_by: { id: 'u2', name: 'Dev Patel' },
};
const secretItem = { ...globalItem, id: 'c2', name: 'STRIPE_KEY', type: 'Secret', value: null, source: 'env' };
const named = (id, name, extra = {}) => ({ ...globalItem, id, name, ...extra });

const renderTable = (props) =>
  render(<ConstantsTable items={[]} status="success" variant="Global" searchKey="" {...props} />);

describe('ConstantsTable', () => {
  describe('search highlight', () => {
    it('marks the matching part of the name, whatever its case', () => {
      renderTable({ items: [globalItem], searchKey: 'api' });
      const mark = screen.getByText('API', { selector: 'mark' });
      expect(mark).toBeInTheDocument();
      expect(screen.getByRole('table')).toHaveTextContent('API_URL');
    });

    it('marks nothing without a search', () => {
      renderTable({ items: [globalItem] });
      expect(document.querySelector('mark')).toBeNull();
    });

    it('marks nothing in the other columns', () => {
      renderTable({ items: [globalItem], searchKey: 'asha' });
      expect(document.querySelector('mark')).toBeNull();
    });
  });

  describe('loading', () => {
    it.each(['idle', 'loading'])('shows the column headers and 8 skeleton rows while status is %s', (status) => {
      renderTable({ status });
      COLUMNS.forEach((name) => expect(screen.getByRole('columnheader', { name })).toBeInTheDocument());
      expect(screen.getAllByTestId('constants-skeleton-row')).toHaveLength(8);
      expect(screen.getByRole('table')).toHaveAttribute('aria-busy', 'true');
    });

    it('hides stale rows while the next list loads', () => {
      renderTable({ status: 'loading', items: [globalItem] });
      expect(screen.queryByText('API_URL')).not.toBeInTheDocument();
    });

    it('does not show an empty state while loading', () => {
      renderTable({ status: 'loading' });
      expect(screen.queryByText(/No .* yet/)).not.toBeInTheDocument();
    });
  });

  describe('rows', () => {
    it('renders a Global constant with people and source, and its value masked until revealed', () => {
      renderTable({ items: [globalItem] });
      const row = screen.getByRole('row', { name: /API_URL/ });
      expect(within(row).getByText(SECRET_MASK)).toBeInTheDocument();
      expect(within(row).queryByText('https://api.example.com')).toBeNull();
      expect(within(row).getByText('Asha Rao')).toBeInTheDocument();
      expect(within(row).getByText('Dev Patel')).toBeInTheDocument();
      expect(within(row).getByText('Workspace')).toBeInTheDocument();
      expect(screen.getByRole('table')).toHaveAttribute('aria-busy', 'false');
      expect(screen.queryAllByTestId('constants-skeleton-row')).toHaveLength(0);
    });

    it('shows the last modified time relative to now, with the exact date as its tooltip', () => {
      const now = jest.spyOn(Date, 'now').mockReturnValue(new Date('2026-11-06T10:00:00.000Z').getTime());
      renderTable({ items: [globalItem] });
      const cell = within(screen.getByRole('row', { name: /API_URL/ })).getByText('2 days ago');
      expect(cell).toHaveAttribute('title', expect.stringMatching(/2026/));
      now.mockRestore();
    });

    it('masks the value of a workspace Secret', () => {
      renderTable({ items: [{ ...secretItem, source: 'workspace' }], variant: 'Secret' });
      const row = screen.getByRole('row', { name: /STRIPE_KEY/ });
      expect(within(row).getByText(SECRET_MASK)).toBeInTheDocument();
      expect(within(row).queryByText('Not stored in ToolJet')).not.toBeInTheDocument();
    });

    it('tags an .env Secret as not stored in ToolJet instead of masking it', () => {
      renderTable({ items: [secretItem], variant: 'Secret' });
      const row = screen.getByRole('row', { name: /STRIPE_KEY/ });
      expect(within(row).getByText('Not stored in ToolJet')).toBeInTheDocument();
      expect(within(row).queryByText(SECRET_MASK)).not.toBeInTheDocument();
      expect(within(row).getByText('.env')).toBeInTheDocument();
    });

    it('explains the masked value of a workspace Secret on hover', async () => {
      renderTable({ items: [{ ...secretItem, source: 'workspace' }], variant: 'Secret' });
      await userEvent.hover(screen.getByText(SECRET_MASK));
      expect((await screen.findAllByText('Fetched at runtime', {}, { timeout: 3000 })).length).toBeGreaterThan(0);
    });

    it('explains the not-stored tag of an .env Secret on hover', async () => {
      renderTable({ items: [secretItem], variant: 'Secret' });
      await userEvent.hover(screen.getByText('Not stored in ToolJet'));
      expect((await screen.findAllByText('Fetched at runtime', {}, { timeout: 3000 })).length).toBeGreaterThan(0);
    });

    it('shows a dash for a missing owner, modifier or date', () => {
      renderTable({ items: [{ ...globalItem, owner: null, modified_by: null, last_modified_at: null }] });
      const row = screen.getByRole('row', { name: /API_URL/ });
      expect(within(row).getAllByText('-')).toHaveLength(3);
    });
  });

  describe('empty', () => {
    it('explains the Secrets tab and offers to create a secret', async () => {
      const onCreate = jest.fn();
      renderTable({ variant: 'Secret', onCreate });
      expect(screen.getByText('No secrets yet')).toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: 'Create secret' }));
      expect(onCreate).toHaveBeenCalledTimes(1);
    });

    it('explains the Globals tab', () => {
      renderTable({ variant: 'Global', onCreate: jest.fn() });
      expect(screen.getByText('No global constants yet')).toBeInTheDocument();
    });

    it('shows the search empty state, without a create button, when a search matches nothing', () => {
      renderTable({ searchKey: 'stripe', onCreate: jest.fn() });
      expect(screen.getByText('No constants found')).toBeInTheDocument();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('drops the column headers when there is nothing to list', () => {
      renderTable();
      expect(screen.queryByRole('columnheader')).not.toBeInTheDocument();
    });

    it('omits the create button when the user cannot create', () => {
      renderTable({ variant: 'Secret' });
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('error', () => {
    it('says the list failed to load and retries on request', async () => {
      const onRetry = jest.fn();
      renderTable({ status: 'error', onRetry });
      expect(screen.getByText("Couldn't load constants")).toBeInTheDocument();
      expect(screen.queryByText(/No .* yet/)).not.toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
      expect(onRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe('value column', () => {
    const valueOf = () => screen.queryByText('https://api.example.com');
    const toggle = (name = 'API_URL') =>
      screen.queryByRole('button', { name: new RegExp(`(Show|Hide) value of ${name}`) });

    it('masks a Global value by default and the eye reveals and hides it again', async () => {
      renderTable({ items: [globalItem] });
      expect(valueOf()).toBeNull();
      expect(toggle()).toHaveAttribute('aria-label', 'Show value of API_URL');
      expect(toggle()).toHaveAttribute('aria-pressed', 'false');

      await userEvent.click(toggle());
      expect(valueOf()).toBeInTheDocument();
      expect(toggle()).toHaveAttribute('aria-label', 'Hide value of API_URL');
      expect(toggle()).toHaveAttribute('aria-pressed', 'true');
      expect(screen.queryByText(SECRET_MASK)).toBeNull();

      await userEvent.click(toggle());
      expect(valueOf()).toBeNull();
    });

    it('reveals one row at a time', async () => {
      renderTable({ items: [globalItem, named('c9', 'OTHER', { value: 'other-value' })] });
      await userEvent.click(toggle('API_URL'));
      expect(valueOf()).toBeInTheDocument();
      expect(screen.queryByText('other-value')).toBeNull();
    });

    it('gives an .env Global the same eye', async () => {
      renderTable({ items: [named('env:Global:E', 'E', { source: 'env', value: 'from-env' })] });
      await userEvent.click(toggle('E'));
      expect(screen.getByText('from-env')).toBeInTheDocument();
    });

    it('never offers an eye on a Secret, and shows only the mask', () => {
      renderTable({
        variant: 'Secret',
        items: [named('s1', 'STRIPE', { type: 'Secret', value: 'leaked-if-shown' })],
      });
      expect(toggle('STRIPE')).toBeNull();
      expect(screen.getByText(SECRET_MASK)).toBeInTheDocument();
      expect(screen.queryByText('leaked-if-shown')).toBeNull();
    });

    it('does not expose the plain value in a tooltip title while masked', () => {
      renderTable({ items: [globalItem] });
      expect(document.querySelector('[title="https://api.example.com"]')).toBeNull();
    });
  });

  describe('row actions', () => {
    const nameCell = (name) => Array.from(screen.getByRole('row', { name: new RegExp(name) }).children)[1];

    it('orders Edit, Copy and the menu after the name, and the pin button', () => {
      renderTable({ items: [globalItem], pinnedIds: ['c1'] });
      const cell = within(nameCell('API_URL'));
      const sequence = [
        cell.getByRole('button', { name: 'Unpin API_URL' }),
        cell.getByRole('button', { name: 'Edit API_URL' }),
        cell.getByRole('button', { name: 'Copy reference to API_URL' }),
        cell.getByRole('button', { name: 'More actions for API_URL' }),
      ];
      sequence.slice(1).forEach((node, i) => {
        expect(sequence[i].compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      });
      expect(cell.getByRole('button', { name: 'Edit API_URL' })).toHaveTextContent('Edit');
    });

    it('calls onEdit with the row and disables Edit while the request is pending', async () => {
      let finish;
      const onEdit = jest.fn(() => new Promise((resolve) => (finish = resolve)));
      renderTable({ items: [globalItem], onEdit });

      await userEvent.click(screen.getByRole('button', { name: 'Edit API_URL' }));
      expect(onEdit).toHaveBeenCalledWith(globalItem);
      expect(screen.getByRole('button', { name: 'Edit API_URL' })).toBeDisabled();

      await act(async () => finish());
      expect(screen.getByRole('button', { name: 'Edit API_URL' })).toBeEnabled();
    });

    it('disables Edit on an .env constant and explains why', async () => {
      const onEdit = jest.fn();
      renderTable({ items: [named('env:Global:E', 'E', { source: 'env' })], onEdit });
      const edit = screen.getByRole('button', { name: 'Edit E' });
      expect(edit).toBeDisabled();
      await userEvent.click(edit);
      expect(onEdit).not.toHaveBeenCalled();

      await userEvent.hover(edit.parentElement);
      expect(
        (
          await screen.findAllByText(
            'Constants created from environment variables cannot be edited or deleted',
            {},
            { timeout: 3000 }
          )
        ).length
      ).toBeGreaterThan(0);
    });

    it.each([
      ['Global', 'Global', '{{constants.API_URL}}'],
      ['Secret', 'Secret', '{{secrets.API_URL}}'],
    ])('copies the %s reference', async (variant, type, reference) => {
      copyToClipboard.mockClear();
      renderTable({ variant, items: [{ ...globalItem, type }] });
      await userEvent.click(screen.getByRole('button', { name: 'Copy reference to API_URL' }));
      expect(copyToClipboard).toHaveBeenCalledWith(reference);
    });

    it('lets an .env constant be copied', async () => {
      copyToClipboard.mockClear();
      renderTable({ items: [named('env:Global:E', 'E', { source: 'env' })] });
      const copy = screen.getByRole('button', { name: 'Copy reference to E' });
      expect(copy).toBeEnabled();
      await userEvent.click(copy);
      expect(copyToClipboard).toHaveBeenCalledWith('{{constants.E}}');
    });
  });

  describe('a constant with no value in the viewed environment', () => {
    const missing = { ...globalItem, value: null, has_value: false };

    it('says so, in place of the mask and the eye', () => {
      renderTable({ items: [missing], environmentName: 'production' });
      const row = screen.getByRole('row', { name: /API_URL/ });
      expect(within(row).getByText('No value in production')).toBeInTheDocument();
      expect(within(row).queryByText(SECRET_MASK)).toBeNull();
      expect(within(row).queryByRole('button', { name: /value of API_URL/ })).toBeNull();
    });

    it('says so for a Secret too, and still offers Edit', () => {
      renderTable({
        items: [{ ...missing, id: 'c3', name: 'STRIPE', type: 'Secret' }],
        variant: 'Secret',
        environmentName: 'staging',
      });
      const row = screen.getByRole('row', { name: /STRIPE/ });
      expect(within(row).getByText('No value in staging')).toBeInTheDocument();
      expect(within(row).getByRole('button', { name: 'Edit STRIPE' })).toBeEnabled();
    });

    it('still shows a Global that has a value as usual', () => {
      renderTable({ items: [{ ...globalItem, has_value: true }], environmentName: 'production' });
      expect(screen.queryByText(/No value in/)).toBeNull();
      expect(screen.getByRole('button', { name: 'Show value of API_URL' })).toBeInTheDocument();
    });
  });

  describe('row menu placement', () => {
    it('sits in the Name cell after the name and pin button, not in the Source cell', () => {
      renderTable({ items: [globalItem], pinnedIds: ['c1'] });
      const row = screen.getByRole('row', { name: /API_URL/ });
      const [nameCell, , , , , sourceCell] = Array.from(row.children).slice(1);
      const content = within(nameCell);
      const name = content.getByText('API_URL');
      const pin = content.getByRole('button', { name: 'Unpin API_URL' });
      const menu = content.getByRole('button', { name: 'More actions for API_URL' });
      expect(name.compareDocumentPosition(pin) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(pin.compareDocumentPosition(menu) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(within(sourceCell).queryByRole('button')).toBeNull();
      expect(sourceCell).toHaveTextContent('Workspace');
    });
  });

  describe('pinned rows', () => {
    const rows = [named('a', 'ALPHA'), named('b', 'BRAVO'), named('c', 'CHARLIE')];
    const rowNames = () =>
      within(screen.getAllByRole('rowgroup')[1])
        .getAllByRole('row')
        .map((row) => row.getAttribute('data-row-id'));

    it('lists pinned rows first, in pin order, then the rest in server order', () => {
      renderTable({ items: rows, pinnedIds: ['c', 'a'] });
      expect(rowNames()).toEqual(['c', 'a', 'b']);
    });

    it('gives a pinned row an Unpin button and every other row a Pin button', () => {
      renderTable({ items: rows, pinnedIds: ['b'] });
      expect(
        within(screen.getByRole('row', { name: /BRAVO/ })).getByRole('button', { name: 'Unpin BRAVO' })
      ).toBeInTheDocument();
      expect(
        within(screen.getByRole('row', { name: /ALPHA/ })).getByRole('button', { name: 'Pin ALPHA' })
      ).toBeInTheDocument();
      expect(
        within(screen.getByRole('row', { name: /ALPHA/ })).queryByRole('button', { name: 'Unpin ALPHA' })
      ).toBeNull();
    });

    it('keeps the pin visible on a pinned row and reveals it on hover for the others', () => {
      renderTable({ items: rows, pinnedIds: ['b'] });
      expect(screen.getByRole('button', { name: 'Unpin BRAVO' })).not.toHaveClass('tw-opacity-0');
      expect(screen.getByRole('button', { name: 'Pin ALPHA' })).toHaveClass(
        'tw-opacity-0',
        'group-hover:tw-opacity-100'
      );
    });

    it('pins and unpins from the same icon button', async () => {
      const onPin = jest.fn();
      const onUnpin = jest.fn();
      renderTable({ items: rows, pinnedIds: ['b'], onPin, onUnpin });
      await userEvent.click(screen.getByRole('button', { name: 'Pin ALPHA' }));
      expect(onPin).toHaveBeenCalledWith(['a']);
      await userEvent.click(screen.getByRole('button', { name: 'Unpin BRAVO' }));
      expect(onUnpin).toHaveBeenCalledWith(['b']);
    });

    it('puts a divider row between the pinned rows and the rest, only while unpinned rows follow', () => {
      const { rerender } = renderTable({ items: rows, pinnedIds: ['c', 'a'] });
      const divider = screen.getByTestId('pin-divider');
      expect(screen.getAllByTestId('pin-divider')).toHaveLength(1);
      expect(divider).toHaveAttribute('aria-hidden', 'true');
      expect(screen.getByRole('row', { name: /ALPHA/ }).nextElementSibling).toBe(divider);
      expect(divider.nextElementSibling).toBe(screen.getByRole('row', { name: /BRAVO/ }));

      rerender(
        <ConstantsTable items={rows} status="success" variant="Global" searchKey="" pinnedIds={['a', 'b', 'c']} />
      );
      expect(screen.queryByTestId('pin-divider')).toBeNull();
    });

    describe('drag handle', () => {
      const handle = (name) => screen.queryByRole('button', { name: `Reorder ${name}` });

      it('shows on pinned rows only, when two or more rows are pinned', () => {
        renderTable({ items: rows, pinnedIds: ['a', 'b'] });
        expect(handle('ALPHA')).toBeInTheDocument();
        expect(handle('BRAVO')).toBeInTheDocument();
        expect(handle('CHARLIE')).toBeNull();
      });

      it('is absent with a single pinned row', () => {
        renderTable({ items: rows, pinnedIds: ['a'] });
        expect(handle('ALPHA')).toBeNull();
      });

      it('is absent while a search is active', () => {
        renderTable({ items: rows, pinnedIds: ['a', 'b'], searchKey: 'a' });
        expect(handle('ALPHA')).toBeNull();
      });

      it('is absent while a source filter is active', () => {
        renderTable({ items: rows, pinnedIds: ['a', 'b'], isSourceFiltered: true });
        expect(handle('ALPHA')).toBeNull();
      });

      it('does not count pins that are not on the page', () => {
        renderTable({ items: rows, pinnedIds: ['a', 'elsewhere'] });
        expect(handle('ALPHA')).toBeNull();
      });
    });
  });

  describe('selection', () => {
    const rows = [named('a', 'ALPHA'), named('b', 'BRAVO'), named('env:Global:X', 'XENV', { source: 'env' })];
    const box = (name) => screen.getByRole('checkbox', { name });

    it('reflects the selection in each row checkbox', () => {
      renderTable({ items: rows, rowSelection: { b: true } });
      expect(box('Select ALPHA')).toHaveAttribute('aria-checked', 'false');
      expect(box('Select BRAVO')).toHaveAttribute('aria-checked', 'true');
    });

    it('lets an .env constant be selected, to pin it', () => {
      renderTable({ items: rows });
      expect(box('Select XENV')).toBeEnabled();
      expect(box('Select ALPHA')).toBeEnabled();
    });

    it('selects and deselects a row', async () => {
      const onSelectionChange = jest.fn();
      const { rerender } = renderTable({ items: rows, onSelectionChange });
      await userEvent.click(box('Select ALPHA'));
      expect(onSelectionChange).toHaveBeenLastCalledWith({ a: true });

      rerender(
        <ConstantsTable
          items={rows}
          status="success"
          variant="Global"
          searchKey=""
          rowSelection={{ a: true, b: true }}
          onSelectionChange={onSelectionChange}
        />
      );
      await userEvent.click(box('Select ALPHA'));
      expect(onSelectionChange).toHaveBeenLastCalledWith({ b: true });
    });

    it('header checkbox is unchecked, indeterminate or checked', () => {
      const { rerender } = renderTable({ items: rows });
      expect(box('Select all')).toHaveAttribute('aria-checked', 'false');

      const withSelection = (rowSelection) =>
        rerender(
          <ConstantsTable items={rows} status="success" variant="Global" searchKey="" rowSelection={rowSelection} />
        );
      withSelection({ a: true });
      expect(box('Select all')).toHaveAttribute('aria-checked', 'mixed');
      withSelection({ a: true, b: true });
      expect(box('Select all')).toHaveAttribute('aria-checked', 'mixed');
      withSelection({ a: true, b: true, 'env:Global:X': true });
      expect(box('Select all')).toHaveAttribute('aria-checked', 'true');
    });

    it('header checkbox selects every row, then clears them', async () => {
      const onSelectionChange = jest.fn();
      const { rerender } = renderTable({ items: rows, onSelectionChange });
      await userEvent.click(box('Select all'));
      expect(onSelectionChange).toHaveBeenLastCalledWith({ a: true, b: true, 'env:Global:X': true });

      rerender(
        <ConstantsTable
          items={rows}
          status="success"
          variant="Global"
          searchKey=""
          rowSelection={{ a: true, b: true, 'env:Global:X': true }}
          onSelectionChange={onSelectionChange}
        />
      );
      await userEvent.click(box('Select all'));
      expect(onSelectionChange).toHaveBeenLastCalledWith({});
    });

    it('has no select-all checkbox while loading', () => {
      renderTable({ status: 'loading' });
      expect(screen.queryByRole('checkbox')).toBeNull();
    });
  });

  describe('row delete', () => {
    it('opens the delete dialog from the row menu and deletes that one constant', async () => {
      const onDelete = jest.fn().mockResolvedValue(undefined);
      renderTable({ items: [globalItem], onDelete });

      await userEvent.click(screen.getByRole('button', { name: 'More actions for API_URL' }));
      await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete constant' }));

      expect(await screen.findByRole('dialog', { name: 'Delete workspace constant?' })).toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: 'Delete constant' }));
      expect(onDelete).toHaveBeenCalledWith(['c1']);
    });

    it('returns focus to the row menu button when the dialog is dismissed', async () => {
      renderTable({ items: [globalItem], onDelete: jest.fn() });
      const menuButton = screen.getByRole('button', { name: 'More actions for API_URL' });
      menuButton.focus();
      await userEvent.keyboard('{Enter}');
      await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete constant' }));
      await screen.findByRole('dialog', { name: 'Delete workspace constant?' });

      await userEvent.keyboard('{Escape}');

      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
      expect(menuButton).toHaveFocus();
    });
  });
});
