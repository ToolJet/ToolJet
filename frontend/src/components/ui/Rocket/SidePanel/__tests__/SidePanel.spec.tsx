import React from 'react';
import { render, screen } from '@testing-library/react';
import { SidePanel, SidePanelHeader, SidePanelSection, SidePanelBody } from '../SidePanel';

describe('SidePanel', () => {
  it('is a named complementary landmark', () => {
    render(<SidePanel aria-label="Tables" />);
    expect(screen.getByRole('complementary', { name: 'Tables' })).toBeInTheDocument();
  });

  it('is 232px wide and does not shrink inside a flex row', () => {
    render(<SidePanel aria-label="Tables" />);
    const panel = screen.getByRole('complementary');
    expect(panel).toHaveClass('tw-w-[232px]');
    expect(panel).toHaveClass('tw-shrink-0');
  });

  // Preflight is off: a solid border style alone gives the sides without a width the browser's 3px default.
  it('zeroes the sides that have no border, for the panel and its header', () => {
    render(
      <SidePanel aria-label="Tables">
        <SidePanelHeader title="Database" />
      </SidePanel>
    );
    expect(screen.getByRole('complementary')).toHaveClass('tw-border-0', 'tw-border-r');
    expect(screen.getByRole('heading', { name: 'Database' }).parentElement).toHaveClass('tw-border-0', 'tw-border-b');
  });

  it('merges a caller className', () => {
    render(<SidePanel aria-label="Tables" className="extra" />);
    expect(screen.getByRole('complementary')).toHaveClass('extra');
  });
});

describe('SidePanelHeader', () => {
  it('shows the title as a heading', () => {
    render(<SidePanelHeader title="Database" />);
    expect(screen.getByRole('heading', { name: 'Database' })).toBeInTheDocument();
  });

  it('renders the actions after the title', () => {
    render(<SidePanelHeader title="Database" actions={<button type="button">Create</button>} />);
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
  });

  it('renders no actions group when there are none', () => {
    const { container } = render(<SidePanelHeader title="Database" />);
    expect(container.querySelector('[data-slot="side-panel-actions"]')).toBeNull();
  });
});

describe('SidePanelSection', () => {
  it('shows the label and the count', () => {
    render(<SidePanelSection label="All tables" count={21} />);
    expect(screen.getByText('All tables')).toBeInTheDocument();
    expect(screen.getByText('21')).toBeInTheDocument();
  });

  it('shows a count of zero', () => {
    const { container } = render(<SidePanelSection label="All tables" count={0} />);
    expect(container.querySelector('[data-slot="side-panel-count"]')).toHaveTextContent('0');
  });

  it('omits the count when none is given', () => {
    const { container } = render(<SidePanelSection label="All tables" />);
    expect(container.querySelector('[data-slot="side-panel-count"]')).toBeNull();
  });
});

describe('SidePanelBody', () => {
  it('renders its children in a scrollable region', () => {
    render(
      <SidePanelBody data-testid="body">
        <span>row</span>
      </SidePanelBody>
    );
    expect(screen.getByText('row')).toBeInTheDocument();
    expect(screen.getByTestId('body')).toHaveClass('tw-overflow-y-auto');
  });
});
