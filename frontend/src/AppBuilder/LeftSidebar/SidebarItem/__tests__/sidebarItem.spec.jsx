import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';

import { SidebarItem } from '../SidebarItem';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (_key, fallback) => fallback }) }));

const RichTip = () => (
  <>
    <h5>AI chat</h5>
    <p>Describe what to build or change, and ToolJet makes it.</p>
  </>
);

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
