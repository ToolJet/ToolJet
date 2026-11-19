import React from 'react';
import { render, screen } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { DrawerShell } from '../DrawerShell';

const renderShell = (props: Partial<React.ComponentProps<typeof DrawerShell>> = {}) => {
  const onSubmit = jest.fn();
  render(
    <DrawerShell title="Add column" onClose={jest.fn()} submitLabel="Add column" onSubmit={onSubmit} {...props}>
      <input aria-label="name" />
      <textarea aria-label="notes" />
    </DrawerShell>
  );
  return onSubmit;
};

describe('DrawerShell | Enter submits', () => {
  it('submits on Enter in a text field', async () => {
    const onSubmit = renderShell();
    await userEvent.type(screen.getByLabelText('name'), 'a{Enter}');
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('does nothing on Enter while the submit button is disabled', async () => {
    const onSubmit = renderShell({ submitDisabled: true });
    await userEvent.type(screen.getByLabelText('name'), 'a{Enter}');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('does nothing on Enter while a submit is running', async () => {
    const onSubmit = renderShell({ isSubmitting: true });
    await userEvent.type(screen.getByLabelText('name'), 'a{Enter}');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('leaves Enter alone in a multi-line field', async () => {
    const onSubmit = renderShell();
    await userEvent.type(screen.getByLabelText('notes'), 'a{Enter}');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('does not submit twice when Enter presses the Cancel button', async () => {
    const onClose = jest.fn();
    const onSubmit = renderShell({ onClose });
    screen.getByRole('button', { name: 'Cancel' }).focus();
    await userEvent.keyboard('{Enter}');
    expect(onSubmit).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
