import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { AppBuilderTooltipProvider } from '@/AppBuilder/_contexts/AppBuilderTooltipContext';
import { SidebarItem } from '../SidebarItem';

describe('AB-PANEL-002 selected-anchor rail item', () => {
  // Break this catches: the compact rail loses the visible hover/selected label from the approved prototype.
  it('renders a persistent rail label hook and selected state for the active item', () => {
    render(
      <SidebarItem panel="pages" selectedSidebarItem="pages" className="left-sidebar-item">
        <svg aria-hidden="true" />
      </SidebarItem>
    );

    expect(screen.getByText('Pages')).toHaveClass('left-sidebar-item-label');
    expect(screen.getByRole('button', { name: 'Pages' })).toHaveClass('sidebar-item--active');
  });

  // UC-21: a short label ("Settings") names the panel in full ("App settings") on hover.
  it('shows the panel name as the tooltip when the label is shorter', async () => {
    jest.useFakeTimers();
    render(
      <AppBuilderTooltipProvider>
        <SidebarItem panel="settings" className="left-sidebar-item">
          <svg aria-hidden="true" />
        </SidebarItem>
      </AppBuilderTooltipProvider>
    );

    const item = screen.getByRole('button', { name: 'App settings' });
    expect(item).toHaveAttribute('data-cy', 'left-sidebar-settings-button');
    expect(item).toHaveTextContent('Settings');

    fireEvent.pointerMove(item, { pointerType: 'mouse' });
    act(() => jest.advanceTimersByTime(450));
    expect(await screen.findByRole('tooltip')).toHaveTextContent('App settings');
    jest.useRealTimers();
  });
});
