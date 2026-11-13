import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConstantsTableFooter from '../ConstantsTableFooter';

const meta = (overrides = {}) => ({ page: 1, page_size: 50, total: 12, ...overrides });

describe('ConstantsTableFooter', () => {
  it('shows the range and total once the list has loaded', () => {
    render(<ConstantsTableFooter status="success" meta={meta()} itemCount={12} />);
    expect(screen.getByText('Showing 1-12 of 12 items')).toBeInTheDocument();
  });

  it('offsets the range by the page', () => {
    render(<ConstantsTableFooter status="success" meta={meta({ page: 2, total: 73 })} itemCount={23} />);
    expect(screen.getByText('Showing 51-73 of 73 items')).toBeInTheDocument();
  });

  it('says 0 items when nothing matches', () => {
    render(<ConstantsTableFooter status="success" meta={meta({ total: 0 })} itemCount={0} />);
    expect(screen.getByText('Showing 0 items')).toBeInTheDocument();
  });

  it.each(['idle', 'loading', 'error'])('keeps the bar but hides the summary while status is %s', (status) => {
    render(<ConstantsTableFooter status={status} meta={meta()} itemCount={12} />);
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    expect(screen.queryByText(/Showing/)).not.toBeInTheDocument();
  });

  describe('pagination', () => {
    const paged = (page, total = 230, props = {}) =>
      render(
        <ConstantsTableFooter
          status="success"
          meta={meta({ page, total })}
          itemCount={50}
          onPageChange={jest.fn()}
          {...props}
        />
      );

    it('is hidden when everything fits on one page', () => {
      paged(1, 50);
      expect(screen.queryByRole('navigation', { name: 'pagination' })).not.toBeInTheDocument();
    });

    it.each(['idle', 'loading', 'error'])('is hidden while status is %s', (status) => {
      paged(1, 230, { status });
      expect(screen.queryByRole('navigation', { name: 'pagination' })).not.toBeInTheDocument();
    });

    it('marks the current page and shows the window around it', () => {
      paged(3);
      expect(screen.getByRole('link', { name: '3' })).toHaveAttribute('aria-current', 'page');
      expect(screen.getAllByRole('link').map((link) => link.textContent)).toEqual([
        'Previous',
        '1',
        '2',
        '3',
        '4',
        '5',
        'Next',
      ]);
    });

    it('goes to the clicked page', async () => {
      const onPageChange = jest.fn();
      paged(3, 230, { onPageChange });
      await userEvent.click(screen.getByRole('link', { name: '5' }));
      expect(onPageChange).toHaveBeenCalledWith(5);
    });

    it('goes to the next and previous page', async () => {
      const onPageChange = jest.fn();
      paged(3, 230, { onPageChange });
      await userEvent.click(screen.getByRole('link', { name: 'Go to next page' }));
      await userEvent.click(screen.getByRole('link', { name: 'Go to previous page' }));
      expect(onPageChange.mock.calls).toEqual([[4], [2]]);
    });

    it('disables Previous on the first page', async () => {
      const onPageChange = jest.fn();
      paged(1, 230, { onPageChange });
      const previous = screen.getByRole('link', { name: 'Go to previous page' });
      expect(previous).toHaveAttribute('aria-disabled', 'true');
      await userEvent.click(previous);
      expect(onPageChange).not.toHaveBeenCalled();
    });

    it('disables Next on the last page', async () => {
      const onPageChange = jest.fn();
      paged(5, 230, { onPageChange });
      const next = screen.getByRole('link', { name: 'Go to next page' });
      expect(next).toHaveAttribute('aria-disabled', 'true');
      await userEvent.click(next);
      expect(onPageChange).not.toHaveBeenCalled();
    });

    it('does not reload the page that is already open', async () => {
      const onPageChange = jest.fn();
      paged(3, 230, { onPageChange });
      await userEvent.click(screen.getByRole('link', { name: '3' }));
      expect(onPageChange).not.toHaveBeenCalled();
    });
  });
});
