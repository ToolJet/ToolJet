import React, { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '../Dialog';

// Opened from state, with no DialogTrigger: Radix does not know the opener, so the dialog has to remember it.
function StateOpened() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Open</button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
          <DialogDescription>Body</DialogDescription>
        </DialogContent>
      </Dialog>
    </>
  );
}

describe('Dialog focus return', () => {
  it('returns focus to the element that opened it when it has no DialogTrigger', async () => {
    render(<StateOpened />);
    await userEvent.click(screen.getByRole('button', { name: 'Open' }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();

    await userEvent.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Open' })).toHaveFocus();
  });

  it('still returns focus to its DialogTrigger', async () => {
    render(
      <Dialog>
        <DialogTrigger asChild>
          <button>Trigger</button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
          <DialogDescription>Body</DialogDescription>
        </DialogContent>
      </Dialog>
    );
    await userEvent.click(screen.getByRole('button', { name: 'Trigger' }));
    await screen.findByRole('dialog');

    await userEvent.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Trigger' })).toHaveFocus();
  });
});
