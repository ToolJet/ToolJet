/**
 * FileButton — regression spec for the mandatory-field indicator.
 *
 * Bug: `validation.enableValidation` ("Make this field mandatory") was
 * defined in the widget's config (WidgetManager/widgets/fileButton.js) but
 * FileButton.jsx never read it, so unlike FileInput no red `*` ever appeared
 * next to the label, and the hidden file input carried no `aria-required`
 * for assistive tech either. See FileButton.jsx for the fix.
 *
 * Lives in __tests__/integration/ because it imports the real store via
 * ./widgetHarness.js (scripts/validate-test-layout.js). Setup shared across
 * widgets lives in ./widgetHarness.js.
 */
import { screen } from '@testing-library/react';
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
});
