import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Blocks } from 'lucide-react';

import { PackIdentityStrip } from '../PackIdentityStrip';

// The Properties tab opens with one line naming the library and the component (design option D):
// [library icon] Material UI · Checkbox
describe('PackIdentityStrip', () => {
  const renderStrip = () => render(<PackIdentityStrip library="Material UI" component="Checkbox" />);

  test('reads as one line: the library, a separator, then the component', () => {
    // Break this catches: the two names rendered in the wrong order, or the separator dropped.
    const strip = renderStrip().container.firstChild;
    expect(strip.textContent).toBe('Material UI·Checkbox');
  });

  test('is announced as one phrase, without the separator or the icon', () => {
    // Break this catches: a screen reader reading "Material UI dot Checkbox" or an unlabeled image.
    renderStrip();
    expect(screen.getByLabelText('Checkbox from Material UI')).toBeTruthy();
    const strip = screen.getByLabelText('Checkbox from Material UI');
    expect(strip.querySelector('svg').getAttribute('aria-hidden')).toBe('true');
    expect(screen.getByText('·').getAttribute('aria-hidden')).toBe('true');
  });

  test('uses the library icon unless given another, such as the module icon', () => {
    // Break this catches: modules drawn with the library icon, or the default icon lost.
    const { container, rerender } = render(<PackIdentityStrip library="Material UI" component="Checkbox" />);
    expect(container.querySelector('svg').getAttribute('class')).toContain('lucide-library');
    rerender(<PackIdentityStrip library="Modules" component="Sales dashboard" icon={Blocks} />);
    expect(container.querySelector('svg').getAttribute('class')).toContain('lucide-blocks');
  });

  test('carries the library name for the CSS that sizes it, and no native title', () => {
    // Break this catches: the size guides (attr(data-name)) reading the wrong text, or the browser's own slow,
    // unstyled tooltip showing beside the Inspector tooltip.
    const { container } = renderStrip();
    expect(container.querySelector('[data-name]').getAttribute('data-name')).toBe('Material UI');
    expect(container.querySelector('[title]')).toBeNull();
  });

  describe('hover tooltip', () => {
    // jsdom lays nothing out, so a cut-off name is faked through the widths the strip reads.
    const fakeWidths = (scrollWidth, clientWidth) => {
      const spies = [
        jest.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(scrollWidth),
        jest.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(clientWidth),
      ];
      return () => spies.forEach((spy) => spy.mockRestore());
    };

    test('shows the full name in the Inspector tooltip when the name is cut off', async () => {
      // Break this catches: a cut-off library or component name with no way to read it in full.
      const restore = fakeWidths(200, 80);
      try {
        renderStrip();
        const libraryName = screen.getByText('Material UI');
        const componentName = screen.getByText('Checkbox');
        fireEvent.mouseOver(libraryName);
        expect((await screen.findByRole('tooltip')).textContent).toBe('Material UI');
        fireEvent.mouseOut(libraryName);
        fireEvent.mouseOver(componentName);
        await waitFor(() =>
          expect(screen.getAllByRole('tooltip').some((tip) => tip.textContent === 'Checkbox')).toBe(true)
        );
      } finally {
        restore();
      }
    });

    test('shows no tooltip for a name that fits', async () => {
      // Break this catches: a tooltip repeating text that is already fully visible.
      const restore = fakeWidths(80, 80);
      try {
        renderStrip();
        fireEvent.mouseOver(screen.getByText('Material UI'));
        fireEvent.mouseOver(screen.getByText('Checkbox'));
        await new Promise((resolve) => setTimeout(resolve, 400));
        expect(screen.queryByRole('tooltip')).toBeNull();
      } finally {
        restore();
      }
    });
  });
});
