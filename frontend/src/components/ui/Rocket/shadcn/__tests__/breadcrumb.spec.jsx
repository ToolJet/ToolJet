/**
 * Regression: BreadcrumbLink with `asChild` used `Slot.Root`, which is undefined in
 * @radix-ui/react-slot 1.2.x (`Root` is a separate named export, `Slot` is a plain function).
 * React threw "Element type is invalid" and the app error boundary replaced the page.
 * First hit by the template gallery's details view (TemplateBreadcrumb).
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BreadcrumbLink } from '../breadcrumb';

describe('BreadcrumbLink', () => {
  it('renders an anchor by default', () => {
    render(<BreadcrumbLink href="/apps">Apps</BreadcrumbLink>);
    expect(screen.getByRole('link', { name: 'Apps' })).toHaveAttribute('href', '/apps');
  });

  it('with asChild, renders the child element and forwards props and click handlers to it', async () => {
    const onClick = jest.fn();
    render(
      <BreadcrumbLink asChild className="extra">
        <button type="button" onClick={onClick}>
          All templates
        </button>
      </BreadcrumbLink>
    );

    const button = screen.getByRole('button', { name: 'All templates' });
    expect(button).toHaveAttribute('data-slot', 'breadcrumb-link');
    expect(button).toHaveClass('extra');

    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
