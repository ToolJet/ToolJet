import React from 'react';
import { cleanup, render, screen, userEvent } from '@/test/test-utils';
import { FooterView } from '../FooterView';

// jsdom has no pointer capture or scrolling, which Radix Select calls when it opens. External adapter, not product logic.
beforeAll(() => {
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.releasePointerCapture = () => undefined;
  Element.prototype.scrollIntoView = () => undefined;
});

const setup = (props: Partial<React.ComponentProps<typeof FooterView>> = {}) => {
  const onPageChange = jest.fn();
  const onPageSizeChange = jest.fn();
  render(
    <FooterView
      page={1}
      pageSize={50}
      total={414}
      loading={false}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      {...props}
    />
  );
  return { onPageChange, onPageSizeChange };
};

describe('Table footer view', () => {
  afterEach(cleanup);

  it('shows the range of the first page', () => {
    setup();
    expect(screen.getByText('Showing 1–50 of 414 records')).toBeInTheDocument();
  });

  it('shows the range of a later page and cuts the last page at the total', () => {
    setup({ page: 3 });
    expect(screen.getByText('Showing 101–150 of 414 records')).toBeInTheDocument();
    cleanup();
    setup({ page: 9 });
    expect(screen.getByText('Showing 401–414 of 414 records')).toBeInTheDocument();
  });

  it('shows only "Showing 0 records" with no controls when there are no records', () => {
    setup({ total: 0 });
    expect(screen.getByText('Showing 0 records')).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('shows no count while the first load runs', () => {
    setup({ total: 0, loading: true });
    expect(screen.queryByText(/Showing/)).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('disables Previous on the first page and Next on the last', () => {
    setup({ page: 1 });
    expect(screen.getByLabelText('Go to previous page')).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByLabelText('Go to next page')).not.toHaveAttribute('aria-disabled');
    cleanup();
    setup({ page: 9 });
    expect(screen.getByLabelText('Go to next page')).toHaveAttribute('aria-disabled', 'true');
  });

  it('marks the current page and goes to a page, Next and Previous', async () => {
    const { onPageChange } = setup({ page: 2 });
    expect(screen.getByRole('link', { name: '2' })).toHaveAttribute('aria-current', 'page');
    await userEvent.click(screen.getByRole('link', { name: '4' }));
    expect(onPageChange).toHaveBeenLastCalledWith(4);
    await userEvent.click(screen.getByLabelText('Go to next page'));
    expect(onPageChange).toHaveBeenLastCalledWith(3);
    await userEvent.click(screen.getByLabelText('Go to previous page'));
    expect(onPageChange).toHaveBeenLastCalledWith(1);
  });

  it('does not change the page from a disabled button or the current page', async () => {
    const { onPageChange } = setup({ page: 1 });
    await userEvent.click(screen.getByLabelText('Go to previous page'));
    await userEvent.click(screen.getByRole('link', { name: '1' }));
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it('disables the page size and Previous/Next while a page loads, and keeps the count', () => {
    setup({ page: 2, loading: true });
    expect(screen.getByText('Showing 51–100 of 414 records')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeDisabled();
    expect(screen.getByLabelText('Go to previous page')).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByLabelText('Go to next page')).toHaveAttribute('aria-disabled', 'true');
  });

  it('reports a new page size as a number', async () => {
    const { onPageSizeChange } = setup();
    expect(screen.getByRole('combobox')).toHaveTextContent('50 records');
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByRole('option', { name: '200 records' }));
    expect(onPageSizeChange).toHaveBeenCalledWith(200);
  });
});
