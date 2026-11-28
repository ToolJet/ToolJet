import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { AppBuilderTooltipProvider } from '@/AppBuilder/_contexts/AppBuilderTooltipContext';
import { DarkModeToggle } from '../DarkModeToggle';

describe('DarkModeToggle', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  // The Viewer's page navigation renders it outside the editor provider: it keeps the Bootstrap
  // tooltip there, and gains a name.
  it('should be named and show the Bootstrap tooltip outside the editor', async () => {
    render(<DarkModeToggle darkMode={false} switchDarkMode={() => {}} />);

    const toggle = screen.getByRole('button', { name: 'Activate dark mode' });
    fireEvent.mouseOver(toggle);
    act(() => jest.advanceTimersByTime(250));

    const tooltip = await screen.findByRole('tooltip');
    expect(tooltip).toHaveTextContent('Activate dark mode');
    expect(tooltip).toHaveClass('tooltip');
    expect(document.querySelector('.app-builder-tooltip')).not.toBeInTheDocument();
  });

  // UB-10: on the editor rail it showed the Bootstrap tooltip instead of the editor's.
  it('should show the editor tooltip inside the App Builder', async () => {
    render(
      <AppBuilderTooltipProvider>
        <DarkModeToggle darkMode switchDarkMode={() => {}} />
      </AppBuilderTooltipProvider>
    );

    const toggle = screen.getByRole('button', { name: 'Activate light mode' });
    fireEvent.pointerMove(toggle, { pointerType: 'mouse' });
    act(() => jest.advanceTimersByTime(450));

    expect(await screen.findByRole('tooltip')).toHaveTextContent('Activate light mode');
    expect(document.querySelector('.app-builder-tooltip')).toBeInTheDocument();
  });
});
