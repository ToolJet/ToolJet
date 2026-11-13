/**
 * The compare (review) view renders each version through the viewer in a read-only frame (?compare=1). An on-load
 * query that asks for confirmation queues a QueryConfirmPopup inside that frame, and the reviewer answers it like the
 * app's own user would: Cancel dismisses it and leaves the query unrun, Yes runs the query.
 *
 * Nothing is mocked: the real store, the real Popups and the real react-bootstrap Modal. The only controlled
 * boundary is the browser's frame context (window.parent and the URL), which is what makes a document a compare frame,
 * and the query run itself, which would otherwise call the network.
 */
import React from 'react';
import { render, screen, act, userEvent } from '@/test/test-utils';
import useStore from '@/AppBuilder/_stores/store';
import { Popups } from '../../Popups';

const state = () => useStore.getState();

const queueConfirmation = () =>
  act(() => {
    useStore.setState((s) => ({
      dataQuery: {
        ...s.dataQuery,
        queryConfirmationList: [
          { queryId: 'q1', queryName: 'loadOrders', parameters: {}, confirmationMessage: 'Load?' },
        ],
      },
    }));
  });

const stubRunQuery = () => {
  const runQuery = jest.fn();
  useStore.setState((s) => ({ queryPanel: { ...s.queryPanel, runQuery } }));
  return runQuery;
};

const queued = () => state().dataQuery.queryConfirmationList.map((q) => q.queryName);

describe('QueryConfirmPopup in a compare frame', () => {
  const realParent = Object.getOwnPropertyDescriptor(window, 'parent');
  let user;

  const becomeCompareFrame = () => {
    Object.defineProperty(window, 'parent', { value: {}, configurable: true });
    window.history.replaceState({}, '', '/applications/crm?version=v2&compare=1');
  };

  beforeEach(() => {
    user = userEvent.setup();
    useStore.setState((s) => ({
      isEditorOverlayOpen: false,
      dataQuery: { ...s.dataQuery, queryConfirmationList: [] },
    }));
  });

  afterEach(() => {
    if (realParent) Object.defineProperty(window, 'parent', realParent);
    window.history.replaceState({}, '', '/');
  });

  // Break this catches: the frame drops Yes or renames Cancel, so the reviewer cannot answer both ways.
  it('offers both Cancel and Yes', async () => {
    becomeCompareFrame();
    render(<Popups darkMode={false} />);
    await queueConfirmation();

    expect(screen.getByText('Load?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Yes' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();
  });

  // Break this catches: nothing in the frame can dismiss the popup, so it covers the page for good.
  it('lets the reviewer dismiss it with Cancel, and the query stays unrun', async () => {
    becomeCompareFrame();
    const runQuery = stubRunQuery();
    render(<Popups darkMode={false} />);
    await queueConfirmation();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(queued()).toEqual([]);
    expect(runQuery).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  // Break this catches: Yes being inert in the frame, so confirming never runs the query.
  it('runs the query when the reviewer clicks Yes', async () => {
    becomeCompareFrame();
    const runQuery = stubRunQuery();
    render(<Popups darkMode={false} />);
    await queueConfirmation();

    await user.click(screen.getByRole('button', { name: 'Yes' }));

    expect(queued()).toEqual([]);
    expect(runQuery).toHaveBeenCalledWith(
      'q1',
      'loadOrders',
      true,
      'edit',
      {},
      undefined,
      undefined,
      undefined,
      false,
      'canvas'
    );
  });

  // Break this catches: Escape being swallowed or the popup being kept open by the frame's own settings.
  it('lets the reviewer dismiss it with Escape', async () => {
    becomeCompareFrame();
    render(<Popups darkMode={false} />);
    await queueConfirmation();

    await user.keyboard('{Escape}');

    expect(queued()).toEqual([]);
  });

  // Break this catches: removing Yes everywhere, which would stop the app from confirming its own queries.
  it('still offers Yes and Cancel outside a compare frame', async () => {
    render(<Popups darkMode={false} />);
    await queueConfirmation();

    expect(screen.getByRole('button', { name: 'Yes' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();
  });
});
