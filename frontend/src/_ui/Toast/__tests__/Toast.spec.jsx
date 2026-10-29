import React from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { toast } from 'react-hot-toast';
import Toast from '../index';

describe('editor error notifications', () => {
  beforeEach(() => {
    window.matchMedia = jest.fn(() => ({ matches: false }));
    jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ height: 48, width: 400 });
    jest.useFakeTimers();
    toast.remove();
  });
  afterEach(() => {
    act(() => toast.remove());
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  // Break this catches: a request burst renders one overlay per failure.
  it('shows only the latest error and counts the other active errors, preserving success notifications', () => {
    render(<Toast groupErrors />);
    act(() => {
      toast.error('First failure');
      toast.error('Second failure');
      toast.error('Latest failure');
      toast.success('Saved');
    });
    expect(screen.queryByText('First failure')).not.toBeInTheDocument();
    expect(screen.queryByText('Second failure')).not.toBeInTheDocument();
    expect(screen.getByText('Latest failure')).toBeVisible();
    expect(screen.getByText('+2 more errors')).toBeVisible();
    expect(screen.getByText('Saved')).toBeVisible();
    expect(screen.getAllByRole('button', { name: 'View all' })).toHaveLength(1);
  });

  // Break this catches: expanding creates a separate overlay or resets the latest toast's timer.
  it('expands inside the latest toast and expires on its original deadline', () => {
    render(<Toast groupErrors />);
    act(() => toast.error('First failure', { duration: 10000 }));
    act(() => jest.advanceTimersByTime(100));
    act(() => toast.error('Latest failure', { duration: 2000 }));
    act(() => jest.advanceTimersByTime(1000));
    const originalCard = screen.getByText('Latest failure').closest('.editor-error-toast').parentElement;
    fireEvent.click(screen.getByRole('button', { name: 'View all' }));
    const list = screen.getByRole('list', { name: 'Error messages' });
    expect(originalCard).toContainElement(list);
    expect(within(list).getByText('First failure')).toBeVisible();
    expect(within(list).getByText('Latest failure')).toBeVisible();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    act(() => jest.advanceTimersByTime(1001));
    act(() => jest.advanceTimersByTime(1001));
    expect(screen.queryByText('First failure')).not.toBeInTheDocument();
    expect(screen.queryByText('Latest failure')).not.toBeInTheDocument();
  });

  // Break this catches: incoming errors remount the expanded toast or reorder existing messages.
  it('silently prepends incoming errors to the same expanded toast and updates its count', () => {
    render(<Toast groupErrors />);
    act(() => toast.error('First', { duration: 5000 }));
    act(() => jest.advanceTimersByTime(10));
    act(() => toast.error('Second', { duration: 5000 }));
    fireEvent.click(screen.getByRole('button', { name: 'View all' }));
    const list = screen.getByRole('list', { name: 'Error messages' });
    expect(
      within(list)
        .getAllByRole('listitem')
        .map((item) => item.textContent)
    ).toEqual(['Second', 'First']);
    act(() => toast.error('Third'));
    act(() => toast.error('Fourth'));
    expect(screen.getByRole('list', { name: 'Error messages' })).toBe(list);
    expect(
      within(list)
        .getAllByRole('listitem')
        .map((item) => item.textContent)
    ).toEqual(['Fourth', 'Third', 'Second', 'First']);
    expect(screen.getByText('Errors (4)')).toBeVisible();
    expect(screen.getAllByRole('button', { name: 'Dismiss errors' })).toHaveLength(1);
    expect(screen.queryByText('Latest error')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss errors' }));
    act(() => jest.advanceTimersByTime(1001));
    expect(screen.queryByRole('list', { name: 'Error messages' })).not.toBeInTheDocument();
    expect(screen.queryByText('Third')).not.toBeInTheDocument();
  });

  it('scrolls new errors to the top without scrolling for unrelated notifications', () => {
    render(<Toast groupErrors />);
    act(() => {
      toast.error('First');
      toast.error('Second');
    });
    fireEvent.click(screen.getByRole('button', { name: 'View all' }));
    const list = screen.getByRole('list', { name: 'Error messages' });
    list.scrollTo = jest.fn();
    Object.defineProperty(list, 'scrollHeight', { value: 600 });
    act(() => toast.error('Third'));
    expect(list.scrollTo).toHaveBeenLastCalledWith({ top: 0, behavior: 'smooth' });
    list.scrollTo.mockClear();
    act(() => toast.success('Saved'));
    expect(list.scrollTo).not.toHaveBeenCalled();
    window.matchMedia.mockReturnValue({ matches: true });
    act(() => toast.error('Fourth'));
    expect(list.scrollTo).toHaveBeenLastCalledWith({ top: 0, behavior: 'instant' });
  });

  // Break this catches: durations accumulate, shorter errors shorten the deadline, or other types extend it.
  it('uses the later error deadline without accumulating durations', () => {
    render(<Toast groupErrors />);
    act(() => {
      toast.error('First', { duration: 2000 });
      toast.error('Latest', { duration: 2000 });
    });
    fireEvent.click(screen.getByRole('button', { name: 'View all' }));
    act(() => jest.advanceTimersByTime(500));
    act(() => toast.error('Appended', { duration: 3000 }));
    act(() => jest.advanceTimersByTime(500));
    act(() => {
      toast.error('Another', { duration: 1000 });
      toast.success('Saved', { duration: 20000 });
      toast('Information', { duration: 20000 });
      toast.loading('Loading', { duration: 20000 });
    });
    // Later deadline is 500 + 3000 = 3500 ms; the shorter arrival must not shorten it.
    act(() => jest.advanceTimersByTime(2499));
    expect(screen.getByRole('list', { name: 'Error messages' })).toBeVisible();
    act(() => jest.advanceTimersByTime(2));
    act(() => jest.advanceTimersByTime(1001));
    expect(screen.queryByRole('list', { name: 'Error messages' })).not.toBeInTheDocument();
    expect(screen.getByText('Saved')).toBeVisible();
    expect(screen.getByText('Information')).toBeVisible();
    expect(screen.getByText('Loading')).toBeVisible();
  });

  it('accounts for accumulated hover pauses when comparing deadlines', () => {
    render(<Toast groupErrors />);
    act(() => {
      toast.error('First', { duration: 2000 });
      toast.error('Second', { duration: 2000 });
    });
    fireEvent.click(screen.getByRole('button', { name: 'View all' }));
    const toaster = screen.getByRole('list', { name: 'Error messages' }).closest('[data-rht-toaster]');
    fireEvent.mouseEnter(toaster);
    act(() => jest.advanceTimersByTime(5000));
    fireEvent.mouseLeave(toaster);
    act(() => toast.error('New', { duration: 3000 }));
    act(() => jest.advanceTimersByTime(2999));
    expect(screen.getByRole('list', { name: 'Error messages' })).toBeVisible();
    act(() => jest.advanceTimersByTime(2));
    act(() => jest.advanceTimersByTime(1001));
    expect(screen.queryByRole('list', { name: 'Error messages' })).not.toBeInTheDocument();
  });

  // Break this catches: expansion replaces each notification's original icon.
  it('preserves notification icons in the expanded list', () => {
    render(<Toast groupErrors />);
    act(() => {
      toast.error('First', { icon: '🔴' });
      toast.error('Latest', { icon: '❌' });
    });
    fireEvent.click(screen.getByRole('button', { name: 'View all' }));
    const list = screen.getByRole('list', { name: 'Error messages' });
    expect(within(list).getByText('🔴')).toBeVisible();
    expect(within(list).getByText('❌')).toBeVisible();
  });

  // Break this catches: View all dismisses failures instead of revealing them, or stays expanded forever.
  it('expands active errors and returns to grouping for the next burst', () => {
    render(<Toast groupErrors />);
    act(() => {
      toast.error('First failure', { duration: 1000 });
      toast.error('Second failure', { duration: 1000 });
    });
    fireEvent.click(screen.getByRole('button', { name: 'View all' }));
    expect(screen.getByText('First failure')).toBeVisible();
    expect(screen.getByText('Second failure')).toBeVisible();
    expect(screen.queryByText('Latest error')).not.toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Error messages' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss errors' }));
    act(() => jest.advanceTimersByTime(2001));
    act(() => {
      toast.error('Next first');
      toast.error('Next second');
    });
    expect(screen.queryByText('Next first')).not.toBeInTheDocument();
    expect(screen.getByText('Next second')).toBeVisible();
    expect(screen.getByRole('button', { name: 'View all' })).toBeVisible();
  });

  // Break this catches: hidden errors stay counted after their individual timeout.
  it('counts only active errors and closes all of them without dismissing success', () => {
    render(<Toast groupErrors />);
    act(() => {
      toast.error('Short failure', { duration: 1000 });
      toast.error('Long failure', { duration: 5000 });
      toast.success('Saved', { duration: 5000 });
    });
    act(() => jest.advanceTimersByTime(1001));
    expect(screen.queryByText(/more error/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'View all' })).not.toBeInTheDocument();
    fireEvent.click(
      within(screen.getByText('Long failure').parentElement).getByRole('button', { name: 'Dismiss notification' })
    );
    act(() => jest.advanceTimersByTime(1001));
    expect(screen.queryByText('Long failure')).not.toBeInTheDocument();
    expect(screen.getByText('Saved')).toBeVisible();
  });

  // Break this catches: editor-only grouping leaks into other application surfaces.
  it('preserves separate errors when grouping is disabled', () => {
    render(<Toast />);
    act(() => {
      toast.error('First failure');
      toast.error('Second failure');
    });
    expect(screen.getByText('First failure')).toBeVisible();
    expect(screen.getByText('Second failure')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'View all' })).not.toBeInTheDocument();
  });

  // Break this catches: an isolated error takes the grouped layout/history/dismissal path.
  it('keeps a single error on the original path, including exit delay', () => {
    render(<Toast groupErrors />);
    act(() => toast.error('Single failure', { duration: 1000 }));
    expect(screen.getByRole('button', { name: 'Dismiss notification' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'View all' })).not.toBeInTheDocument();
    act(() => jest.advanceTimersByTime(1001));
    expect(screen.getByText('Single failure')).toBeInTheDocument();
    act(() => jest.advanceTimersByTime(1001));
    expect(screen.queryByText('Single failure')).not.toBeInTheDocument();
  });

  // Break this catches: errors at separate positions are hidden despite never stacking.
  it('does not group independent positions', () => {
    render(<Toast groupErrors />);
    act(() => {
      toast.error('Top failure', { position: 'top-center' });
      toast.error('Bottom failure', { position: 'bottom-right' });
    });
    expect(screen.getByText('Top failure')).toBeVisible();
    expect(screen.getByText('Bottom failure')).toBeVisible();
  });

  // Break this catches: updating a toast in place leaves the wrong message at the front.
  it('shows the latest update when an existing toast ID is reused', () => {
    render(<Toast groupErrors />);
    act(() => toast.error('First', { id: 'first' }));
    act(() => jest.advanceTimersByTime(10));
    act(() => toast.error('Second', { id: 'second' }));
    act(() => jest.advanceTimersByTime(10));
    act(() => toast.error('Updated first', { id: 'first' }));
    expect(screen.getByText('Updated first')).toBeVisible();
    expect(screen.queryByText('Second')).not.toBeInTheDocument();
    expect(screen.getByText('+1 more error')).toBeVisible();
  });

  // Break this catches: grouping hides actionable/function content or logs it by executing it again.
  it('leaves interactive and function-rendered error notifications alone', () => {
    const retry = jest.fn();
    render(<Toast groupErrors />);
    act(() => {
      toast.error(() => <button onClick={retry}>Retry connection</button>);
      toast.error(<button onClick={retry}>Retry upload</button>);
      toast.error('Plain error');
    });
    fireEvent.click(screen.getByRole('button', { name: 'Retry connection' }));
    fireEvent.click(screen.getByRole('button', { name: 'Retry upload' }));
    expect(retry).toHaveBeenCalledTimes(2);
    expect(screen.getByText('Plain error')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'View all' })).not.toBeInTheDocument();
  });

  // Break this catches: group dismissal or ID reuse swallows non-error notifications.
  it('preserves loading, info, custom, and error-to-success updates beside a group', () => {
    render(<Toast groupErrors />);
    act(() => {
      toast.error('Old error', { id: 'changing' });
      toast.error('Other error');
      toast.loading('Loading');
      toast('Information');
      toast.custom(<div>Custom notice</div>);
      toast.success('Recovered', { id: 'changing' });
    });
    for (const message of ['Other error', 'Loading', 'Information', 'Custom notice', 'Recovered']) {
      expect(screen.getByText(message)).toBeVisible();
    }
    expect(screen.queryByText('Old error')).not.toBeInTheDocument();
    expect(screen.queryByText(/more error/)).not.toBeInTheDocument();
  });

  // Break this catches: grouping restarts durations or removes the library's hover pause.
  it('retains hover pause and individual expiration for a group', () => {
    render(<Toast groupErrors />);
    act(() => {
      toast.error('First error', { duration: 1000 });
      toast.error('Second error', { duration: 1000 });
    });
    act(() => jest.advanceTimersByTime(500));
    fireEvent.mouseEnter(screen.getByText('Second error'));
    act(() => jest.advanceTimersByTime(2000));
    expect(screen.getByText('+1 more error')).toBeVisible();
    fireEvent.mouseLeave(screen.getByText('Second error'));
    act(() => jest.advanceTimersByTime(501));
    expect(screen.queryByText(/more error/)).not.toBeInTheDocument();
    act(() => jest.advanceTimersByTime(1001));
    expect(screen.queryByText('Second error')).not.toBeInTheDocument();
  });

  // Break this catches: the shared viewer/published-app component inherits editor aggregation.
  it('retains independent dismissal, options, and expiry on the viewer path', () => {
    render(<Toast toastOptions={{ style: { color: 'red' } }} />);
    act(() => {
      toast.error('Viewer one', { duration: 1000 });
      toast.error('Viewer two', { duration: 5000 });
    });
    expect(screen.getByText('Viewer one')).toBeVisible();
    expect(screen.getByText('Viewer two').parentElement).toHaveStyle({ color: 'red' });
    fireEvent.click(within(screen.getByText('Viewer one').parentElement).getByRole('button'));
    act(() => jest.advanceTimersByTime(1001));
    expect(screen.queryByText('Viewer one')).not.toBeInTheDocument();
    expect(screen.getByText('Viewer two')).toBeVisible();
  });
  // Break this catches: absorbed errors occupy store slots during their removal delay.
  it('keeps the expanded list during rapidly delivered errors between renders', () => {
    render(<Toast groupErrors />);
    act(() => {
      toast.error('First');
      toast.error('Second');
    });
    fireEvent.click(screen.getByRole('button', { name: 'View all' }));
    const list = screen.getByRole('list', { name: 'Error messages' });
    for (let i = 0; i < 25; i++) {
      act(() => toast.error(`Burst ${i}`));
    }
    expect(screen.getByRole('list', { name: 'Error messages' })).toBe(list);
    expect(screen.getByText('Errors (20)')).toBeVisible();
    expect(
      within(list)
        .getAllByRole('listitem')
        .map((item) => item.textContent)
    ).toEqual(Array.from({ length: 20 }, (_, i) => `Burst ${24 - i}`));
  });
  // Break this catches: equal timestamps reverse errors emitted in the same tick.
  it('orders initial and incoming same-tick errors newest to oldest', () => {
    render(<Toast groupErrors />);
    act(() => {
      toast.error('One');
      toast.error('Two');
      toast.error('Three');
    });
    fireEvent.click(screen.getByRole('button', { name: 'View all' }));
    const list = screen.getByRole('list', { name: 'Error messages' });
    expect(
      within(list)
        .getAllByRole('listitem')
        .map((item) => item.textContent)
    ).toEqual(['Three', 'Two', 'One']);
    act(() => {
      toast.error('Four');
      toast.error('Five');
    });
    expect(
      within(list)
        .getAllByRole('listitem')
        .map((item) => item.textContent)
    ).toEqual(['Five', 'Four', 'Three', 'Two', 'One']);
  });
});
