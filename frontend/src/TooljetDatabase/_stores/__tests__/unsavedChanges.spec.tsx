// The registry of unsaved input, the browser's reload warning and the discard dialog.
import React from 'react';
import { act, cleanup, render, screen, userEvent } from '@/test/test-utils';
import { UnsavedChangesGuard } from '../../_components/UnsavedChangesGuard';
import { confirmDiscard, runUnlessDirty, setUnsaved, useReportUnsaved, type UnsavedSourceId } from '../unsavedChanges';

function Source({ id, dirty }: { id: UnsavedSourceId; dirty: boolean }) {
  useReportUnsaved(id, dirty);
  return null;
}

const unload = () => {
  const event = new Event('beforeunload', { cancelable: true });
  window.dispatchEvent(event);
  return event;
};

describe('unsaved changes | beforeunload', () => {
  afterEach(cleanup);

  it('warns the browser only while a source is dirty', () => {
    const { rerender } = render(
      <>
        <UnsavedChangesGuard />
        <Source id="inlineAddRow" dirty={false} />
      </>
    );
    expect(unload().defaultPrevented).toBe(false);

    rerender(
      <>
        <UnsavedChangesGuard />
        <Source id="inlineAddRow" dirty />
      </>
    );
    expect(unload().defaultPrevented).toBe(true);

    rerender(
      <>
        <UnsavedChangesGuard />
        <Source id="inlineAddRow" dirty={false} />
      </>
    );
    expect(unload().defaultPrevented).toBe(false);
  });

  it('stops warning when the dirty source unmounts, and when the page does', () => {
    const { rerender, unmount } = render(
      <>
        <UnsavedChangesGuard />
        <Source id="editRow" dirty />
      </>
    );
    expect(unload().defaultPrevented).toBe(true);

    rerender(<UnsavedChangesGuard />);
    expect(unload().defaultPrevented).toBe(false);

    act(() => setUnsaved('editRow', true));
    expect(unload().defaultPrevented).toBe(true);
    unmount();
    expect(unload().defaultPrevented).toBe(false);
  });

  it('keeps warning while another source is still dirty', () => {
    render(
      <>
        <UnsavedChangesGuard />
        <Source id="inlineAddRow" dirty />
        <Source id="cellEditor" dirty />
      </>
    );
    act(() => setUnsaved('cellEditor', false));

    expect(unload().defaultPrevented).toBe(true);
  });
});

describe('unsaved changes | discard dialog', () => {
  afterEach(cleanup);

  it('resolves true without a dialog when nothing is dirty', async () => {
    render(<UnsavedChangesGuard />);

    await expect(confirmDiscard()).resolves.toBe(true);
    expect(screen.queryByText('Discard unsaved changes?')).not.toBeInTheDocument();
  });

  it('names what will be lost and keeps it on Keep editing', async () => {
    render(
      <>
        <UnsavedChangesGuard />
        <Source id="inlineAddRow" dirty />
        <Source id="cellEditor" dirty />
      </>
    );
    const answer = jest.fn();
    act(() => {
      confirmDiscard().then(answer);
    });

    expect(await screen.findByText('Discard unsaved changes?')).toBeInTheDocument();
    expect(screen.getByText('Unsaved input in the new row and the cell edit will be lost.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Keep editing' }));

    await act(async () => {});
    expect(answer).toHaveBeenCalledWith(false);
    expect(screen.queryByText('Discard unsaved changes?')).not.toBeInTheDocument();
  });

  it('resolves true on Discard', async () => {
    render(
      <>
        <UnsavedChangesGuard />
        <Source id="inlineAddRow" dirty />
      </>
    );
    const answer = jest.fn();
    act(() => {
      confirmDiscard().then(answer);
    });

    await userEvent.click(await screen.findByRole('button', { name: 'Discard' }));

    await act(async () => {});
    expect(answer).toHaveBeenCalledWith(true);
  });

  it('only counts the source it is asked about', async () => {
    render(
      <>
        <UnsavedChangesGuard />
        <Source id="inlineAddRow" dirty />
      </>
    );

    await expect(confirmDiscard('editRow')).resolves.toBe(true);
    expect(screen.queryByText('Discard unsaved changes?')).not.toBeInTheDocument();
  });

  it('gives a second ask the same answer while the dialog is open', async () => {
    render(
      <>
        <UnsavedChangesGuard />
        <Source id="editRow" dirty />
      </>
    );
    const first = jest.fn();
    const second = jest.fn();
    act(() => {
      confirmDiscard('editRow').then(first);
      confirmDiscard('editRow').then(second);
    });

    await userEvent.click(await screen.findByRole('button', { name: 'Keep editing' }));

    await act(async () => {});
    expect(first).toHaveBeenCalledWith(false);
    expect(second).toHaveBeenCalledWith(false);
  });

  it('runs the action at once when clean, and only after Discard when dirty', async () => {
    render(
      <>
        <UnsavedChangesGuard />
        <Source id="editRow" dirty={false} />
      </>
    );
    const action = jest.fn();
    runUnlessDirty(action);
    expect(action).toHaveBeenCalledTimes(1);

    act(() => setUnsaved('editRow', true));
    action.mockClear();
    act(() => runUnlessDirty(action));
    expect(action).not.toHaveBeenCalled();

    await userEvent.click(await screen.findByRole('button', { name: 'Discard' }));
    await act(async () => {});
    expect(action).toHaveBeenCalledTimes(1);
  });
});
