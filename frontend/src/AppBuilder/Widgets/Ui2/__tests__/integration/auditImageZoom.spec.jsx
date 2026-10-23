/**
 * UI 2.0 Image: the zoom hands focus back to the image, closes with the image, and closes inside a disabled Form;
 * setImageURL and clearImage expose hasError for the new source as soon as they return.
 *
 * Release audit (18 Oct), Codex's reviewImageZoomFocus, reviewImageZoomLifecycle, reviewFormImageEscape and
 * reviewImageActionSnapshots: closing a zoom opened from the keyboard left focus on the page body (the dialog had no
 * trigger to return to); the zoom stayed open after setVisibility(false) or clearImage; in a disabled Form the
 * widget's input guard swallowed the Close button's click (Escape worked); and hasError followed the source a render
 * late, so the next query step read the old source's state.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'image1';
const w = createWidgetHarness({
  componentType: 'ShadImage',
  id: ID,
  handle: ID,
  preload: ['Form'],
  widgetWidth: 400,
  widgetHeight: 250,
});
beforeEach(() => w.setup());
afterEach(w.teardown);

const ZOOM = {
  source: binding('/audit.png'),
  alternativeText: binding('Preview'),
  zoomOnClick: binding('{{true}}'),
};
const loaded = async (view) => act(async () => fireEvent.load(view.container.querySelector('figure img')));
const openZoom = async (user) => {
  await user.click(screen.getByRole('button', { name: 'Preview' }));
  expect(await screen.findByRole('dialog')).toBeVisible();
};

describe('zoom', () => {
  test.each(['Escape', 'Close'])(
    'opened from the keyboard, closing with %s returns focus to the image',
    async (how) => {
      const view = w.render({ currentMode: 'view', properties: ZOOM });
      await loaded(view);
      const image = screen.getByRole('button', { name: 'Preview' });
      act(() => image.focus());
      const user = userEvent.setup();
      await user.keyboard('{Enter}');
      await screen.findByRole('dialog');
      await waitFor(() => expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus());
      await user.keyboard(how === 'Escape' ? '{Escape}' : '{Enter}');
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
      await waitFor(() => expect(image).toHaveFocus());
    }
  );

  test.each(['setVisibility', 'clearImage'])('%s closes an open zoom, which does not come back', async (action) => {
    const view = w.render({ currentMode: 'view', properties: ZOOM });
    await loaded(view);
    await openZoom(userEvent.setup());
    if (action === 'setVisibility') await w.act('setVisibility', false);
    else await w.act('clearImage');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    if (action === 'setVisibility') await w.act('setVisibility', true);
    else await w.act('setImageURL', '/audit.png');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  test.each(
    [false, true].flatMap((disabled) =>
      ['Close', 'Escape', 'Enter on Close', 'the backdrop'].map((how) => [disabled, how])
    )
  )('in a Form (disabled: %s), %s dismisses the zoom', async (disabled, how) => {
    const view = w.renderInsideForm({ properties: ZOOM });
    await waitFor(() => expect(w.exposed('form1')?.setDisable).toBeInstanceOf(Function));
    await loaded(view);
    const user = userEvent.setup();
    await openZoom(user);
    if (disabled) await act(async () => w.exposed('form1').setDisable(true));
    const close = screen.getByRole('button', { name: 'Close' });
    if (how === 'Close') await user.click(close);
    else if (how === 'Escape') await user.keyboard('{Escape}');
    else if (how === 'the backdrop') await user.click(document.querySelector('div[data-ui2-dismiss]'));
    else {
      act(() => close.focus());
      await user.keyboard('{Enter}');
    }
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(document.body).not.toHaveAttribute('data-scroll-locked');
  });

  test('in a disabled Form, the image itself still takes no click', async () => {
    const view = w.renderInsideForm({ properties: ZOOM });
    await waitFor(() => expect(w.exposed('form1')?.setDisable).toBeInstanceOf(Function));
    await loaded(view);
    await act(async () => w.exposed('form1').setDisable(true));
    await userEvent.setup().click(view.container.querySelector('figure img'));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('source actions', () => {
  const mount = async (outcome) => {
    const view = w.render({
      currentMode: 'view',
      properties: { source: binding('/original.png'), alternativeText: binding('Preview') },
    });
    await act(async () => fireEvent[outcome](view.container.querySelector('figure img')));
    await waitFor(() => expect(w.exposed().hasError).toBe(outcome === 'error'));
    return view;
  };

  test('an awaited clearImage exposes the empty source as an error at once', async () => {
    const view = await mount('load');
    const r = await w.runQuery([['clearImage']]);
    expect(r.after[0]).toMatchObject({ imageURL: '', hasError: true });
    expect(r.settled).toMatchObject({ imageURL: '', hasError: true });
    expect(view.container.querySelector('figure img')).toBeNull();
  });

  test('an awaited setImageURL clears the old source error at once', async () => {
    const view = await mount('error');
    const r = await w.runQuery([['setImageURL', '/replacement.png']]);
    expect(r.after[0]).toMatchObject({ imageURL: '/replacement.png', hasError: false });
    expect(r.settled).toMatchObject({ imageURL: '/replacement.png', hasError: false });
    expect(view.container.querySelector('figure img')).toHaveAttribute('src', '/replacement.png');
  });
});
