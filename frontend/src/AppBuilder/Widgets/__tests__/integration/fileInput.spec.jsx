/**
 * FileInput — mandatory indicator, a11y attributes, and max-file-count disabling.
 * Lives in __tests__/integration/ since it imports the real store via ./widgetHarness.js.
 */
import { screen, waitFor } from '@testing-library/react';
import { createWidgetHarness, binding } from './widgetHarness';

const INPUT = 'fileinput1';

const widget = createWidgetHarness({
  componentType: 'FileInput',
  handle: 'fileinput1',
  id: INPUT,
  defaultProperties: { label: binding('Attachment'), visibility: binding('{{true}}') },
});

const labelEl = (container) => container.querySelector(`#${INPUT}-label`);
const hiddenInput = (container) => container.querySelector('input[type="file"]');
const browseButton = (container) => container.querySelector('button');
const clickableField = (container) => container.querySelector('.tj-file-input-field');

describe('FileInput widget', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  describe('mandatory indicator', () => {
    test('shows a red asterisk next to the label when the field is mandatory', async () => {
      const { container } = widget.render({ validation: { enableValidation: binding('{{true}}') } });

      expect(await screen.findByText('Attachment', { exact: false })).toBeInTheDocument();
      expect(labelEl(container)).toHaveTextContent('Attachment*');
    });

    test('does not show an asterisk when the field is not mandatory', async () => {
      const { container } = widget.render({ validation: { enableValidation: binding('{{false}}') } });

      expect(await screen.findByText('Attachment', { exact: false })).toBeInTheDocument();
      expect(labelEl(container)).not.toHaveTextContent('Attachment*');
    });
  });

  describe('accessibility attributes on the underlying file input', () => {
    test('aria-required reflects the mandatory setting', async () => {
      const { container } = widget.render({ validation: { enableValidation: binding('{{true}}') } });
      await screen.findByText('Attachment', { exact: false });

      expect(hiddenInput(container)).toHaveAttribute('aria-required', 'true');
    });

    test('aria-labelledby points at the visible label', async () => {
      const { container } = widget.render();
      await screen.findByText('Attachment', { exact: false });

      expect(hiddenInput(container)).toHaveAttribute('aria-labelledby', `${INPUT}-label`);
      expect(labelEl(container)).toHaveAttribute('id', `${INPUT}-label`);
    });
  });

  describe('reaching the maximum file count', () => {
    test('disables the Browse button and shows a not-allowed cursor once a file is selected', async () => {
      const { container } = widget.render();
      const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });

      await widget.session.user.upload(hiddenInput(container), file);

      await waitFor(() => expect(browseButton(container)).toBeDisabled());
      expect(clickableField(container)).toHaveClass('tj-file-input-disabled');
      // Set directly on the button, not just inherited from the row: Button.jsx's disabled
      // treatment never actually applies pointer-events: none (malformed Tailwind class), so
      // hover doesn't fall through to the ancestor's cursor.
      expect(browseButton(container)).toHaveStyle('cursor: not-allowed');
    });

    test('the Browse button stays enabled with a pointer cursor before any file is selected', async () => {
      const { container } = widget.render();
      await screen.findByText('Attachment', { exact: false });

      expect(browseButton(container)).not.toBeDisabled();
      expect(clickableField(container)).not.toHaveClass('tj-file-input-disabled');
      expect(browseButton(container)).not.toHaveStyle('cursor: not-allowed');
    });
  });
});
