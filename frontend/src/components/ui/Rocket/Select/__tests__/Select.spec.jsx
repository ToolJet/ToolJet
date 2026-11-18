import React from 'react';
import { render, screen, userEvent } from '@/test/test-utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../Select';

// jsdom lacks the pointer and scroll APIs Radix Select calls when it opens.
beforeAll(() => {
  Element.prototype.hasPointerCapture = Element.prototype.hasPointerCapture || (() => false);
  Element.prototype.setPointerCapture = Element.prototype.setPointerCapture || (() => {});
  Element.prototype.releasePointerCapture = Element.prototype.releasePointerCapture || (() => {});
  Element.prototype.scrollIntoView = Element.prototype.scrollIntoView || (() => {});
});

describe('Rocket Select | dropdown', () => {
  it('draws the 1px border and 8px padding of the design', async () => {
    render(
      <Select defaultValue="a">
        <SelectTrigger aria-label="pick">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">A</SelectItem>
        </SelectContent>
      </Select>
    );

    await userEvent.click(screen.getByRole('combobox', { name: 'pick' }));
    const menu = screen.getByRole('listbox');

    // Preflight is off: a border width alone draws nothing, it needs a style too.
    expect(menu).toHaveClass('tw-border', 'tw-border-solid', 'tw-border-border-weak');
    // The viewport inside adds 4px, so 4px here makes 8px.
    expect(menu).toHaveClass('tw-p-1');
  });
});
