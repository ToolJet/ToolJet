/**
 * FileInput — regression spec for the accessibility attributes added to its
 * hidden file input alongside the FileButton/FilePicker asterisk fix.
 *
 * FileInput already rendered the mandatory `*` next to its label (via the
 * shared Label component), but its `<input>` carried no `aria-required`,
 * `aria-disabled`, `aria-busy` or `aria-labelledby` — so a screen reader user
 * had no way to know the field was required. See FileInput.jsx for the fix.
 *
 * Lives in __tests__/integration/ because it imports the real store via
 * ./widgetHarness.js (scripts/validate-test-layout.js). Setup shared across
 * widgets lives in ./widgetHarness.js.
 */
import { screen } from '@testing-library/react';
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
});
