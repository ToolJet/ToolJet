import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';

import { AppBuilderTooltipProvider } from '@/AppBuilder/_contexts/AppBuilderTooltipContext';
import { ToolTip } from '../ToolTip';

describe('ToolTip in App Builder', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('APPBUILDER-TOOLTIP-001 waits for clear hover intent and uses the compact treatment', async () => {
    render(
      <AppBuilderTooltipProvider>
        <ToolTip message="Desktop layout" placement="bottom">
          <button type="button">Desktop</button>
        </ToolTip>
      </AppBuilderTooltipProvider>
    );

    const trigger = screen.getByRole('button', { name: 'Desktop' });
    fireEvent.pointerMove(trigger, { pointerType: 'mouse' });
    act(() => jest.advanceTimersByTime(449));
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    act(() => jest.advanceTimersByTime(1));
    const tooltip = await screen.findByRole('tooltip');
    expect(tooltip).toHaveTextContent('Desktop layout');
    expect(document.querySelector('.app-builder-tooltip')).toBeInTheDocument();
  });

  // The tooltip is portalled to <body>; the editor's fixed right sidebar sits at z-index 1041, so the
  // tooltip has to stack above it or buttons inside the query panel show nothing.
  it('APPBUILDER-TOOLTIP-002 stacks above the editor sidebar', async () => {
    render(
      <AppBuilderTooltipProvider>
        <ToolTip message="Open code editor in a new tab">
          <button type="button">Open</button>
        </ToolTip>
      </AppBuilderTooltipProvider>
    );

    fireEvent.pointerMove(screen.getByRole('button', { name: 'Open' }), { pointerType: 'mouse' });
    act(() => jest.advanceTimersByTime(450));
    await screen.findByRole('tooltip');

    expect(document.querySelector('.app-builder-tooltip')).toHaveClass('!tw-z-[1070]');
  });
});
