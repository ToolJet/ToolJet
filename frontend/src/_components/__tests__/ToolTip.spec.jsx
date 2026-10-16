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
});
