import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import PanelHeader from '../PanelHeader';

describe('PanelHeader', () => {
  // Break this catches: an icon-only close button with no name — screen readers announce "button".
  it('should give the close button the panel-specific name and close on click', () => {
    const onClose = jest.fn();
    render(<PanelHeader title="Pages" onClose={onClose} closeLabel="Close pages" closeDataCy="pages-close-button" />);

    const close = screen.getByRole('button', { name: 'Close pages' });
    expect(close).toHaveAttribute('data-cy', 'pages-close-button');

    fireEvent.click(close);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should render extra actions before the close button', () => {
    render(
      <PanelHeader title="Queries" onClose={() => {}} closeLabel="Close queries">
        <button type="button">Add</button>
      </PanelHeader>
    );

    const [add, close] = screen.getAllByRole('button');
    expect(add).toHaveTextContent('Add');
    expect(close).toHaveAccessibleName('Close queries');
  });

  it('should render a title-only header when the panel cannot be closed', () => {
    render(<PanelHeader title="Dependencies" titleDataCy="dependency-viewer-title" />);

    expect(screen.getByText('Dependencies')).toHaveAttribute('data-cy', 'dependency-viewer-title');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
