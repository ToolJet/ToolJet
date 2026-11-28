import React from 'react';
import { render, screen } from '@/test/test-utils';
import { Button } from '../Button';

describe('Button | ghost icon colour', () => {
  it('draws the icon of an icon-only ghost button in icon/strong', () => {
    render(
      <Button variant="ghost" iconOnly aria-label="More">
        <svg />
      </Button>
    );

    expect(screen.getByRole('button', { name: 'More' })).toHaveClass('tw-text-icon-strong');
  });

  it('shows a disabled icon-only ghost button in icon/disabled at full opacity', () => {
    render(
      <Button variant="ghost" iconOnly disabled aria-label="More">
        <svg />
      </Button>
    );

    expect(screen.getByRole('button', { name: 'More' })).toHaveClass(
      'disabled:tw-text-icon-disabled',
      'disabled:tw-opacity-100'
    );
  });

  it('keeps the text colour on a ghost button that has a label', () => {
    render(<Button variant="ghost">Cancel</Button>);

    const button = screen.getByRole('button', { name: 'Cancel' });
    expect(button).toHaveClass('tw-text-text-default');
    expect(button).not.toHaveClass('tw-text-icon-strong');
  });

  it('leaves other variants alone', () => {
    render(
      <Button variant="primary" iconOnly aria-label="Add">
        <svg />
      </Button>
    );

    expect(screen.getByRole('button', { name: 'Add' })).not.toHaveClass('tw-text-icon-strong');
  });
});
