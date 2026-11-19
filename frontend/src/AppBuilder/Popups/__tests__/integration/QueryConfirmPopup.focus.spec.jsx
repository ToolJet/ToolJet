/**
 * Opening the review (compare) view from a notification loads the editor and the compare view together. An on-load
 * query that asks for confirmation queues a QueryConfirmPopup in the editor at the same moment, and the compare
 * view (a full-screen overlay, z-index above the Bootstrap modal) covers it. The popup is a react-bootstrap Modal
 * with enforceFocus on, so it pulled focus back from every field in the compare view, including the comment box,
 * and Escape cancelled the hidden query.
 *
 * While the editor overlay is open the popup must stand aside, as ReleaseConfirmation already does.
 *
 * Nothing is mocked: the real store, the real Popups and the real react-bootstrap Modal. Timers are faked only so
 * the modal's deferred focus enforcement can be flushed without a sleep.
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
        queryConfirmationList: [{ queryId: 'q1', queryName: 'loadOrders', parameters: {} }],
      },
    }));
  });

const setOverlayOpen = (open) => act(() => useStore.setState({ isEditorOverlayOpen: open }));

const flushFocusEnforcement = () => act(async () => jest.runOnlyPendingTimers());

describe('QueryConfirmPopup while the compare view covers the editor', () => {
  let user;

  beforeEach(() => {
    jest.useFakeTimers();
    user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    useStore.setState((s) => ({
      isEditorOverlayOpen: false,
      dataQuery: { ...s.dataQuery, queryConfirmationList: [] },
    }));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const renderEditorBehindCompareView = async () => {
    render(
      <>
        <Popups darkMode={false} />
        <textarea aria-label="Comment" />
      </>
    );
    // The order a notification click produces: the confirmation is queued first, the compare view opens after.
    await queueConfirmation();
    await setOverlayOpen(true);
    await flushFocusEnforcement();
  };

  // Break this catches: QueryConfirmPopup keeps react-bootstrap's default enforceFocus, so clicking the comment box
  // in the compare view hands focus straight back to the hidden popup.
  it('lets the comment box keep focus while the compare view is open', async () => {
    await renderEditorBehindCompareView();

    await user.click(screen.getByLabelText('Comment'));
    await flushFocusEnforcement();

    expect(screen.getByLabelText('Comment')).toHaveFocus();
  });

  // Break this catches: the popup's document-level Escape handler cancelling the hidden query when the person
  // presses Escape in the compare view.
  it('keeps the hidden query waiting when Escape is pressed in the compare view', async () => {
    await renderEditorBehindCompareView();

    await user.click(screen.getByLabelText('Comment'));
    await user.keyboard('{Escape}');

    expect(state().dataQuery.queryConfirmationList.map((q) => q.queryName)).toEqual(['loadOrders']);
  });

  // Break this catches: switching focus enforcement off for good, which would let focus leave a popup the person
  // can actually see.
  it('still holds focus inside the popup when no overlay covers the editor', async () => {
    render(
      <>
        <Popups darkMode={false} />
        <textarea aria-label="Comment" />
      </>
    );
    await queueConfirmation();
    await flushFocusEnforcement();

    await user.click(screen.getByLabelText('Comment'));
    await flushFocusEnforcement();

    expect(screen.getByLabelText('Comment')).not.toHaveFocus();
    expect(screen.getByRole('dialog')).toContainElement(document.activeElement);
  });
});
