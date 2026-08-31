/**
 * PopoverMenu — hover trigger behaviour, against the REAL store.
 *
 * Regression coverage for a bug where, with "Show menu" set to hover, moving
 * the pointer away from the trigger button without ever entering the popup
 * left the popup open forever: closing was wired only to `Popover.Content`'s
 * own onMouseLeave (PopoverMenu.jsx), and the trigger (CustomButton.jsx) had
 * no leave handler at all. The fix adds a shared, cancellable close-on-hover
 * delay (`scheduleClosePopoverOnHover`) used by both the trigger and the
 * content, so leaving either one closes the popup unless the pointer lands
 * on the other within the grace window.
 */
import { screen, waitFor } from '@testing-library/react';
import { createWidgetHarness, binding } from './widgetHarness';

const ID = 'pm1';
const NAME = 'popovermenu1';

const widget = createWidgetHarness({
  componentType: 'PopoverMenu',
  handle: NAME,
  id: ID,
  defaultProperties: {
    label: binding('Menu'),
    trigger: binding('hover'),
    visibility: binding('{{true}}'),
  },
});

/** The trigger wrapper: what `onMouseEnter`/`onMouseLeave` for hover mode are attached to. */
const triggerEl = (container) => container.querySelector('[data-cy="popover-menu-button-container"]');

/** Portalled by Radix into document.body, so it's queried through `screen`, not `container`. */
const popupContent = () => screen.queryByRole('dialog', { name: 'Menu options' });

describe('PopoverMenu', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  describe('show menu on hover', () => {
    test('hovering the trigger opens the popup', async () => {
      const { container } = widget.render();

      await widget.session.user.hover(triggerEl(container));

      await waitFor(() => expect(popupContent()).toBeInTheDocument());
    });

    test('moving away from the trigger without entering the popup closes it', async () => {
      const { container } = widget.render();

      await widget.session.user.hover(triggerEl(container));
      await waitFor(() => expect(popupContent()).toBeInTheDocument());

      await widget.session.user.unhover(triggerEl(container));

      await waitFor(() => expect(popupContent()).not.toBeInTheDocument());
    });

    test('moving from the trigger into the popup within the grace window keeps it open', async () => {
      const { container } = widget.render();

      await widget.session.user.hover(triggerEl(container));
      await waitFor(() => expect(popupContent()).toBeInTheDocument());

      await widget.session.user.unhover(triggerEl(container));
      await widget.session.user.hover(popupContent());

      // Past the close delay: if the pending close from leaving the trigger
      // hadn't been cancelled by entering the content, the popup would
      // already be gone.
      await new Promise((resolve) => setTimeout(resolve, 200));
      expect(popupContent()).toBeInTheDocument();
    });

    test('leaving the popup content closes it', async () => {
      const { container } = widget.render();

      await widget.session.user.hover(triggerEl(container));
      await waitFor(() => expect(popupContent()).toBeInTheDocument());
      await widget.session.user.hover(popupContent());

      await widget.session.user.unhover(popupContent());

      await waitFor(() => expect(popupContent()).not.toBeInTheDocument());
    });
  });
});
