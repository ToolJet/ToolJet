import React from 'react';
import { render, screen } from '@testing-library/react';
import Popover from '../index';

describe('AB-PANEL-003 popover exit lifecycle', () => {
  // Break this catches: the left panel is removed immediately, so its closing animation flashes or never runs.
  it('keeps forced content mounted in the closed state for an exit animation', () => {
    render(<Popover open={false} forceMount popoverContent={<div>Animated panel</div>} />);

    expect(screen.getByText('Animated panel').closest('.PopoverContent')).toHaveAttribute('data-state', 'closed');
  });
});
