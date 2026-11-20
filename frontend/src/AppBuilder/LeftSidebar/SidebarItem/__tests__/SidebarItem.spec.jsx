import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';

import { SidebarItem } from '../SidebarItem';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key, fallback) => fallback ?? key }) }));

const RichTip = () => (
  <>
    <h5>AI chat</h5>
    <p>Describe what to build or change, and ToolJet makes it.</p>
  </>
);

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

describe('a left rail button', () => {
  afterEach(() => jest.useRealTimers());

  it('is named by its label when its tip is not plain text, never "[object Object]"', () => {
    render(<SidebarItem icon="tooljetai" label="AI chat" tip={<RichTip />} onClick={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'AI chat' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '[object Object]' })).toBeNull();
  });

  it('is named by a plain text tip as before, and by its label with no tip at all', () => {
    const { unmount } = render(<SidebarItem icon="debugger" tip="Debugger" onClick={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'Debugger' })).toBeInTheDocument();
    unmount();
    render(<SidebarItem icon="tooljetai" label="AI chat" tip={null} onClick={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'AI chat' })).toBeInTheDocument();
  });

  it('puts its tooltip away when clicked, so it does not cover the panel it opens', () => {
    jest.useFakeTimers();
    const onClick = jest.fn();
    render(<SidebarItem icon="tooljetai" label="AI chat" tip={<RichTip />} onClick={onClick} />);
    const button = screen.getByRole('button', { name: 'AI chat' });
    fireEvent.mouseOver(button);
    act(() => jest.advanceTimersByTime(400));
    expect(screen.getByText(/Describe what to build or change/)).toBeInTheDocument();

    fireEvent.click(button);
    act(() => jest.advanceTimersByTime(400));
    expect(onClick).toHaveBeenCalled();
    expect(screen.queryByText(/Describe what to build or change/)).toBeNull();
  });
});
