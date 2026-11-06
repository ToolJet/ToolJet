import React from 'react';
import { render, screen } from '@testing-library/react';
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
});
