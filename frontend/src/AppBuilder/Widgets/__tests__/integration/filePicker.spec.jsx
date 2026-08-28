/**
 * FilePicker — regression spec for the mandatory-field indicator.
 *
 * Bug: `useFilePicker` already resolved `isMandatory` from
 * `validation.enableValidation`, but FilePicker.jsx only forwarded it to
 * `UploadArea`'s `aria-required` — no red `*` was ever rendered next to the
 * visible `<h3>` label, unlike FileInput. See FilePicker.jsx for the fix.
 *
 * Lives in __tests__/integration/ because it imports the real store via
 * ./widgetHarness.js (scripts/validate-test-layout.js). Setup shared across
 * widgets lives in ./widgetHarness.js.
 */
import { screen } from '@testing-library/react';
import { createWidgetHarness, binding } from './widgetHarness';

const PICKER = 'filepicker1';

const widget = createWidgetHarness({
  componentType: 'FilePicker',
  handle: 'filepicker1',
  id: PICKER,
  defaultProperties: { label: binding('Upload files'), visibility: binding('{{true}}') },
});

const labelHeading = (container) => container.querySelector(`#${PICKER}-label`);
const hiddenInput = (container) => container.querySelector('input[type="file"]');
const rootWrapper = (container) => container.querySelector('.file-picker-widget-wrapper');

describe('FilePicker widget', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  describe('mandatory indicator', () => {
    test('shows a red asterisk next to the label when the field is mandatory', async () => {
      const { container } = widget.render({ validation: { enableValidation: binding('{{true}}') } });

      expect(await screen.findByText('Upload files', { exact: false })).toBeInTheDocument();
      expect(labelHeading(container)).toHaveTextContent('Upload files*');
    });

    test('does not show an asterisk when the field is not mandatory', async () => {
      const { container } = widget.render({ validation: { enableValidation: binding('{{false}}') } });

      expect(await screen.findByText('Upload files', { exact: false })).toBeInTheDocument();
      expect(labelHeading(container)).toHaveTextContent('Upload files');
      expect(labelHeading(container)).not.toHaveTextContent('Upload files*');
    });
  });

  describe('accessibility attributes on the underlying file input', () => {
    test('aria-required reflects the mandatory setting', async () => {
      const { container } = widget.render({ validation: { enableValidation: binding('{{true}}') } });
      await screen.findByText('Upload files', { exact: false });

      expect(hiddenInput(container)).toHaveAttribute('aria-required', 'true');
    });

    test('aria-labelledby points at the visible label heading', async () => {
      const { container } = widget.render();
      await screen.findByText('Upload files', { exact: false });

      expect(hiddenInput(container)).toHaveAttribute('aria-labelledby', `${PICKER}-label`);
      expect(labelHeading(container)).toHaveAttribute('id', `${PICKER}-label`);
    });
  });

  describe('scroll affordance', () => {
    // The scrollbar-thumb color is transparent by default and only set on :hover (style.scss),
    // so the widget only needs to carry the class that CSS hooks into.
    test('the scrollable root carries the hover-reveal scrollbar class', async () => {
      const { container } = widget.render();
      await screen.findByText('Upload files', { exact: false });

      expect(rootWrapper(container)).toHaveClass('files-pane-scrollable');
    });
  });
});
