import React from 'react';
import { render, screen } from '@testing-library/react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../DropdownMenu';

const renderOpenMenu = () =>
  render(
    <DropdownMenu open>
      <DropdownMenuTrigger>open</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>Edit table</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

describe('DropdownMenuItem hover', () => {
  // jsdom has no stylesheet, so this checks the classes that make the CSS behave.
  it('keeps the hover fill and drops the keyboard ring while the pointer is over the item', () => {
    renderOpenMenu();
    const item = screen.getByRole('menuitem', { name: 'Edit table' });
    expect(item).toHaveClass('hover:!tw-bg-interactive-default', 'hover:!tw-shadow-none');
  });

  it('still shows the focus ring for keyboard focus', () => {
    renderOpenMenu();
    const item = screen.getByRole('menuitem', { name: 'Edit table' });
    expect(item).toHaveClass('focus-visible:tw-shadow-interactive-focus-outline');
  });
});
