import React from 'react';
import { render, screen } from '@testing-library/react';

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

  test('shows each full name on hover when it is cut off', () => {
    // Break this catches: a long library or component name ellipsised with no way to read it. The library's title
    // also feeds the CSS that sizes it (attr(title)), so it must be the library name exactly.
    renderStrip();
    expect(screen.getByTitle('Material UI').textContent).toBe('Material UI');
    expect(screen.getByTitle('Checkbox').textContent).toBe('Checkbox');
  });
});
