import React from 'react';
import { render, screen, userEvent } from '@/test/test-utils';
import { LinkButton } from '../LinkButton';

describe('LinkButton', () => {
  it('is a button that calls onClick', async () => {
    const onClick = jest.fn();
    render(<LinkButton onClick={onClick}>Clear all filters</LinkButton>);

    await userEvent.click(screen.getByRole('button', { name: 'Clear all filters' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('never submits a surrounding form', () => {
    render(<LinkButton>Clear</LinkButton>);

    expect(screen.getByRole('button', { name: 'Clear' })).toHaveAttribute('type', 'button');
  });

  it('does nothing while disabled', async () => {
    const onClick = jest.fn();
    render(
      <LinkButton disabled onClick={onClick}>
        Clear
      </LinkButton>
    );

    await userEvent.click(screen.getByRole('button', { name: 'Clear' }));

    expect(onClick).not.toHaveBeenCalled();
  });
});
