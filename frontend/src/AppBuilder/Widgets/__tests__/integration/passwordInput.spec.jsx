/**
 * PasswordInput — behaviour spec against the real store. Nothing about the
 * widget is mocked. Shared setup lives in ./widgetHarness.js.
 *
 * Scope covers the password-specific behaviour that PasswordInput.jsx adds on
 * top of BaseInput: the eye-icon visibility toggle that switches the input
 * between `type="password"` (hidden) and `type="text"` (visible), and the icon
 * state that tracks it.
 *
 * The fix under test: the eye icon must reflect the CURRENT state of the
 * password — `IconEyeClosed` when hidden, `IconEye` when visible — not the
 * action that clicking will perform.
 */
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { createWidgetHarness, binding } from './widgetHarness';

const widget = createWidgetHarness({
  componentType: 'PasswordInput',
  handle: 'passwordinput1',
  id: 'pw1',
  defaultProperties: {
    label: binding('Password'),
    placeholder: binding('Enter password'),
    value: binding(''),
    visibility: binding('{{true}}'),
    disabledState: binding('{{false}}'),
    loadingState: binding('{{false}}'),
  },
  defaultStyles: {
    alignment: binding('side'),
    direction: binding('left'),
    auto: binding('{{true}}'),
    width: binding('{{33}}'),
    widthType: binding('ofComponent'),
    labelFontSize: binding('{{12}}'),
    borderRadius: binding('{{6}}'),
    icon: binding('IconLock'),
    iconVisibility: binding('{{true}}'),
  },
});

/** The password <input> element. */
const input = (container) => container.querySelector('input');
/** The eye-icon toggle button. */
const toggle = (container) => container.querySelector('[data-cy="password-visibility-icon"]');

describe('PasswordInput', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  describe('eye icon visibility toggle', () => {
    test('the input starts as type="password" (hidden)', async () => {
      const { container } = widget.render();

      await waitFor(() => expect(input(container)).toBeInTheDocument());
      expect(input(container)).toHaveAttribute('type', 'password');
    });

    test('clicking the eye icon switches the input to type="text" (visible)', async () => {
      const { container } = widget.render();

      await waitFor(() => expect(toggle(container)).toBeInTheDocument());
      fireEvent.click(toggle(container));

      await waitFor(() => expect(input(container)).toHaveAttribute('type', 'text'));
    });

    test('clicking the eye icon a second time switches back to type="password"', async () => {
      const { container } = widget.render();

      await waitFor(() => expect(toggle(container)).toBeInTheDocument());
      // First click: password → text
      fireEvent.click(toggle(container));
      await waitFor(() => expect(input(container)).toHaveAttribute('type', 'text'));

      // Second click: text → password
      fireEvent.click(toggle(container));
      await waitFor(() => expect(input(container)).toHaveAttribute('type', 'password'));
    });

    test('the icon is IconEyeClosed when the password is hidden (default state)', async () => {
      const { container } = widget.render();

      await waitFor(() => expect(toggle(container)).toBeInTheDocument());
      // Tabler icons add a class `tabler-icon-eye-closed` for IconEyeClosed
      const svg = toggle(container).querySelector('svg');
      await waitFor(() => expect(svg).toBeInTheDocument());
      expect(svg).toHaveClass('tabler-icon-eye-closed');
    });

    test('the icon switches to IconEye when the password is revealed', async () => {
      const { container } = widget.render();

      await waitFor(() => expect(toggle(container)).toBeInTheDocument());
      fireEvent.click(toggle(container));

      // After toggle, the icon should be the open eye
      const svg = toggle(container).querySelector('svg');
      await waitFor(() => expect(svg).toHaveClass('tabler-icon-eye'));
      expect(svg).not.toHaveClass('tabler-icon-eye-closed');
    });
  });
});
