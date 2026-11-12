/**
 * The compare (review) view renders each version through the viewer in a read-only frame (?compare=1). An on-load
 * query that asks for confirmation queues a QueryConfirmPopup inside that frame, and the reviewer has to be able to
 * dismiss it to see the rest of the page. Confirming must stay impossible there: it would run the query of a version
 * that is only being previewed, and comparing must never run the app's actions.
 *
 * Nothing is mocked: the real store, the real Popups and the real react-bootstrap Modal. The only controlled
 * boundary is the browser's frame context (window.parent and the URL), which is what makes a document a compare frame.
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

  // Break this catches: the frame keeps the Yes button, so the reviewer can run an on-load query of a version that is
  // only being previewed.
  it('offers no way to run the query', async () => {
    becomeCompareFrame();
    render(<Popups darkMode={false} />);
    await queueConfirmation();

    expect(screen.getByText('Load?')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Yes' })).not.toBeInTheDocument();
  });

  // Break this catches: nothing in the frame can dismiss the popup, so it covers the page for good.
  it('lets the reviewer dismiss it with the Close button, and the query stays unrun', async () => {
    becomeCompareFrame();
    render(<Popups darkMode={false} />);
    await queueConfirmation();

    await user.click(screen.getByRole('button', { name: 'Close' }));

    expect(queued()).toEqual([]);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
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
