import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { AppBuilderTooltipProvider } from '@/AppBuilder/_contexts/AppBuilderTooltipContext';
import PanelIconButton from '../PanelIconButton';
import PanelCloseButton from '../PanelCloseButton';

const hover = async (button) => {
  fireEvent.pointerMove(button, { pointerType: 'mouse' });
  act(() => jest.advanceTimersByTime(450));
  return screen.findByRole('tooltip');
};

describe('PanelIconButton', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  // Break this catches: an icon-only button screen readers announce as just "button" (UB-04), or
  // one that shows no tooltip on hover (UB-11).
  it('should name the button and show the same name in the editor tooltip on hover', async () => {
    const onClick = jest.fn();
    render(
      <AppBuilderTooltipProvider>
        <PanelIconButton label="Clear logs" leadingIcon="trash" isLucid onClick={onClick} data-cy="clear" />
      </AppBuilderTooltipProvider>
    );

    const button = screen.getByRole('button', { name: 'Clear logs' });
    expect(button).toHaveAttribute('data-cy', 'clear');

    const tooltip = await hover(button);
    expect(tooltip).toHaveTextContent('Clear logs');
    expect(document.querySelector('.app-builder-tooltip')).toBeInTheDocument();

    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  // A popover's OverlayTrigger positions itself on the button through its ref.
  it('should forward its ref to the button', () => {
    const ref = React.createRef();
    render(
      <AppBuilderTooltipProvider>
        <PanelIconButton ref={ref} label="Component options" leadingIcon="ellipsis-vertical" isLucid />
      </AppBuilderTooltipProvider>
    );

    expect(ref.current).toBe(screen.getByRole('button', { name: 'Component options' }));
  });

  it('should keep the close button named and tooltipped through it', async () => {
    const onClose = jest.fn();
    render(
      <AppBuilderTooltipProvider>
        <PanelCloseButton label="Close inspector" onClose={onClose} dataCy="inspector-close-button" />
      </AppBuilderTooltipProvider>
    );

    const close = screen.getByRole('button', { name: 'Close inspector' });
    expect(close).toHaveAttribute('data-cy', 'inspector-close-button');
    expect(await hover(close)).toHaveTextContent('Close inspector');

    fireEvent.click(close);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
