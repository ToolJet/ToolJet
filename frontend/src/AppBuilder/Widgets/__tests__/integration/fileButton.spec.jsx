/**
 * FileButton — mandatory indicator, a11y attributes, and max-file-count disabling.
 * Lives in __tests__/integration/ since it imports the real store via ./widgetHarness.js.
 */
import { screen, waitFor } from '@testing-library/react';
import { createWidgetHarness, binding } from './widgetHarness';

const BTN = 'filebtn1';

const widget = createWidgetHarness({
  componentType: 'FileButton',
  handle: 'filebutton1',
  id: BTN,
  defaultProperties: { buttonText: binding('Upload file'), visibility: binding('{{true}}') },
});

const labelSpan = (container) => container.querySelector(`#${BTN}-label`);
const hiddenInput = (container) => container.querySelector('input[type="file"]');
const allButtons = (container) => Array.from(container.querySelectorAll('button'));
const browseButton = (container) => allButtons(container)[0];
const clearButton = (container) => allButtons(container)[1];

describe('FileButton widget', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  describe('mandatory indicator', () => {
    test('shows a red asterisk next to the label when the field is mandatory', async () => {
      const { container } = widget.render({ validation: { enableValidation: binding('{{true}}') } });

      expect(await screen.findByText('Upload file')).toBeInTheDocument();
      expect(labelSpan(container)).toHaveTextContent('Upload file*');
    });

    test('does not show an asterisk when the field is not mandatory', async () => {
      const { container } = widget.render({ validation: { enableValidation: binding('{{false}}') } });

      expect(await screen.findByText('Upload file')).toBeInTheDocument();
      expect(labelSpan(container)).toHaveTextContent('Upload file');
      expect(labelSpan(container)).not.toHaveTextContent('Upload file*');
    });
  });

  describe('accessibility attributes on the underlying file input', () => {
    test('aria-required reflects the mandatory setting', async () => {
      const { container } = widget.render({ validation: { enableValidation: binding('{{true}}') } });
      await screen.findByText('Upload file');
      expect(hiddenInput(container)).toHaveAttribute('aria-required', 'true');

      const { container: container2 } = widget.render({ validation: { enableValidation: binding('{{false}}') } });
      expect(hiddenInput(container2)).toHaveAttribute('aria-required', 'false');
    });

    test('aria-labelledby points at the visible label span', async () => {
      const { container } = widget.render();
      await screen.findByText('Upload file');

      expect(hiddenInput(container)).toHaveAttribute('aria-labelledby', `${BTN}-label`);
      expect(labelSpan(container)).toHaveAttribute('id', `${BTN}-label`);
    });
  });

  describe('reaching the maximum file count', () => {
    // disabled stays false here on purpose (avoids the Button component's disabled recolor);
    // aria-disabled + inline cursor communicate the unavailable state instead.
    test('shows a not-allowed cursor once the max file count is reached, without natively disabling or recoloring the button', async () => {
      const { container } = widget.render({ properties: { enableClearSelection: binding('{{false}}') } });
      const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });

      await widget.session.user.upload(hiddenInput(container), file);
      await waitFor(() => expect(screen.getByText('hello.txt')).toBeInTheDocument());

      expect(browseButton(container)).not.toBeDisabled();
      expect(browseButton(container)).toHaveAttribute('aria-disabled', 'true');
      expect(browseButton(container)).toHaveStyle('cursor: not-allowed');
    });

    test('the button stays enabled with a pointer cursor before any file is selected', async () => {
      const { container } = widget.render({ properties: { enableClearSelection: binding('{{false}}') } });
      await screen.findByText('Upload file');

      expect(browseButton(container)).not.toBeDisabled();
      expect(browseButton(container)).toHaveAttribute('aria-disabled', 'false');
      expect(browseButton(container)).not.toHaveStyle('cursor: not-allowed');
    });
  });

  describe('content height vs widget padding', () => {
    const contentBox = (container) => container.querySelector('.fileButton-widget > div');

    test('fills the full widget height when padding is "none"', async () => {
      const { container } = widget.render({ styles: { padding: binding('none') } });
      await screen.findByText('Upload file');

      // Break this catches: dropping the `padding === 'none' ? height + 4 : height`
      // compensation FileButton needs — RenderWidget always hands the widget
      // `widgetHeight - 4`, reserving 4px for its own 2px/side wrapper padding, but
      // zeroes that wrapper padding out when the widget's padding style is 'none'.
      expect(contentBox(container)).toHaveStyle({ height: '40px' });
    });

    test('renders 4px short of the full widget height when padding is "default"', async () => {
      const { container } = widget.render({ styles: { padding: binding('default') } });
      await screen.findByText('Upload file');

      expect(contentBox(container)).toHaveStyle({ height: '36px' });
    });
  });

  describe('label size scaling', () => {
    test('label line-height grows with labelSize instead of staying fixed', async () => {
      const { container } = widget.render({ styles: { labelSize: binding('32') } });
      await screen.findByText('Upload file');

      // Break this catches: leaving line-height unset on the label span, which makes it inherit
      // the shared Button component's fixed 24px `size="default"` line-height — a larger labelSize
      // then gets clipped by the wrapping span's tw-overflow-hidden no matter how large the widget
      // itself is resized, since that inherited line-height never grows with labelSize.
      expect(labelSpan(container)).toHaveStyle({ fontSize: '32px', lineHeight: '45.44px' });
    });

    test('icon size grows together with labelSize instead of staying fixed at 16px', async () => {
      const { container } = widget.render({
        styles: { labelSize: binding('32'), iconVisibility: { value: true } },
      });
      await screen.findByText('Upload file');

      const icon = await waitFor(() => {
        const svg = container.querySelector('svg');
        expect(svg).toBeInTheDocument();
        return svg;
      });
      // Break this catches: leaving the icon's size hardcoded at 16 instead of deriving it from
      // labelSize, so the icon stays visually mismatched with a label whose font size grew.
      expect(icon).toHaveAttribute('width', '36.352');
      expect(icon).toHaveAttribute('height', '36.352');
    });
  });

  describe('clearing the selection while at capacity', () => {
    // The clear button must be a sibling of the browse Button, not nested inside it, so a
    // disabled browse button can't take the clear button down with it (see FileInput.jsx too).
    test('the clear button is not nested inside the browse button', async () => {
      const { container } = widget.render({ properties: { enableClearSelection: binding('{{true}}') } });
      const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });

      await widget.session.user.upload(hiddenInput(container), file);
      await waitFor(() => expect(screen.getByText('hello.txt')).toBeInTheDocument());

      const clear = clearButton(container);
      expect(clear).toBeInTheDocument();
      expect(browseButton(container).contains(clear)).toBe(false);
      expect(clear).not.toBeDisabled();
    });

    test('clicking the clear button removes the selected file', async () => {
      const { container } = widget.render({ properties: { enableClearSelection: binding('{{true}}') } });
      const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });

      await widget.session.user.upload(hiddenInput(container), file);
      await waitFor(() => expect(screen.getByText('hello.txt')).toBeInTheDocument());

      await widget.session.user.click(clearButton(container));

      await waitFor(() => expect(screen.getByText('Upload file')).toBeInTheDocument());
      expect(browseButton(container)).toHaveAttribute('aria-disabled', 'false');
    });
  });
});
