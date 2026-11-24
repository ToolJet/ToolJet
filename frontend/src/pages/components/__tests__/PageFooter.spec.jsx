import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import PageFooter from '../PageFooter';

const renderFooter = (props = {}) =>
  render(<PageFooter page={1} pageSize={50} totalCount={120} onPageChange={jest.fn()} {...props} />);

describe('PageFooter', () => {
  test('shows the range and total, with the label pluralised above one item', () => {
    renderFooter({ page: 2, singularItemLabel: 'item' });

    expect(screen.getByText('Showing 51-100 of 120 items')).toBeInTheDocument();
  });

  test('keeps the label singular for a single item', () => {
    renderFooter({ totalCount: 1, singularItemLabel: 'item' });

    expect(screen.getByText('Showing 1-1 of 1 item')).toBeInTheDocument();
  });

  test('clamps the last item of the final page to the total', () => {
    renderFooter({ page: 3, singularItemLabel: 'item' });

    expect(screen.getByText('Showing 101-120 of 120 items')).toBeInTheDocument();
  });

  test('asks for the clicked page without navigating', () => {
    const onPageChange = jest.fn();
    renderFooter({ onPageChange });

    const wasNotPrevented = fireEvent.click(screen.getByRole('link', { name: '2' }));

    expect(onPageChange).toHaveBeenCalledWith(2);
    expect(wasNotPrevented).toBe(false);
  });

  test('disables Previous on the first page and Next on the last', () => {
    const { unmount } = renderFooter({ page: 1 });
    expect(screen.getByRole('link', { name: /previous/i })).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('link', { name: /next/i })).not.toHaveAttribute('aria-disabled');
    unmount();

    renderFooter({ page: 3 });
    expect(screen.getByRole('link', { name: /next/i })).toHaveAttribute('aria-disabled', 'true');
  });

  test('collapses a long page range into an ellipsis around the current page', () => {
    renderFooter({ page: 5, totalCount: 500 });

    const pages = screen.getAllByRole('link').map((link) => link.textContent);
    expect(pages).toEqual(expect.arrayContaining(['1', '4', '5', '6', '10']));
    expect(pages).not.toContain('2');
    expect(pages).not.toContain('8');
  });

  test('shows no text while loading', () => {
    renderFooter({ isLoading: true, singularItemLabel: 'item' });

    expect(screen.queryByText(/Showing/)).not.toBeInTheDocument();
  });

  test('renders an empty footer when there are no items', () => {
    const { container } = renderFooter({ totalCount: 0 });

    expect(container.firstChild).toBeEmptyDOMElement();
  });

  test('lets the page override the default footer styles', () => {
    const { container } = renderFooter({ className: 'custom-footer' });

    expect(container.firstChild).toHaveClass('custom-footer');
  });
});
