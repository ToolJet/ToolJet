import React from 'react';
import { render, screen } from '@testing-library/react';
import { SidebarItem } from '../SidebarItem';

describe('AB-PANEL-002 selected-anchor rail item', () => {
  // Break this catches: the compact rail loses the visible hover/selected label from the approved prototype.
  it('renders a persistent rail label hook and selected state for the active item', () => {
    render(
      <SidebarItem icon="pages" tip="" railLabel="Pages" selectedSidebarItem="pages" className="left-sidebar-item">
        <svg aria-hidden="true" />
      </SidebarItem>
    );

    expect(screen.getByText('Pages')).toHaveClass('left-sidebar-item-label');
    expect(screen.getByRole('button')).toHaveClass('sidebar-item--active');
  });

  it('supports an accessible label without requiring a visual tooltip', () => {
    render(
      <SidebarItem icon="tooljetai" tip="" accessibleLabel="AI agent" className="left-sidebar-item">
        <svg aria-hidden="true" />
      </SidebarItem>
    );

    expect(screen.getByRole('button', { name: 'AI agent' })).toBeInTheDocument();
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});
