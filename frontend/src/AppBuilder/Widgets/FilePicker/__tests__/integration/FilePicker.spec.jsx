/**
 * FilePicker: clearFiles() (the CSA, aliased as `clear`) must fire
 * onFileDeselected like per-file removal already does.
 *
 * Narrow regression test, not a full widget contract — FilePicker has no
 * approved TESTING.md yet (widget-testing-manifest.json: not-started).
 */
import { waitFor } from '@testing-library/react';
import {
  createWidgetHarness,
  binding,
  store,
  MODULE_ID,
  setVariableOn,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'filepicker1';
const NAME = 'filepicker1';

const widget = createWidgetHarness({
  componentType: 'FilePicker',
  handle: NAME,
  id: ID,
  defaultProperties: {
    label: binding('Label'),
    instructionText: binding('Drag and drop files or click here to upload'),
    enableDropzone: binding('{{true}}'),
    enablePicker: binding('{{true}}'),
    enableMultiple: binding('{{false}}'),
    visibility: binding('{{true}}'),
    loadingState: binding('{{false}}'),
    disabledState: binding('{{false}}'),
  },
});

const hiddenInput = (container) => container.querySelector('input[type="file"]');
const deleteButton = (container) => container.querySelector('.delete-button');
const exposed = (key = 'files') => widget.exposed()?.[key];
const eventSeen = () => store().getVariable('seen', MODULE_ID);

async function selectFile(container, name = 'hello.txt') {
  const file = new File(['hello'], name, { type: 'text/plain' });
  await waitFor(() => expect(hiddenInput(container)).toBeInTheDocument());
  await widget.session.user.upload(hiddenInput(container), file);
  await waitFor(() => expect(exposed('files')).toHaveLength(1));
}

describe('FilePicker: onFileDeselected event', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('control: removing a single file via the file-list delete button fires onFileDeselected', async () => {
    const { container } = widget.render({ events: setVariableOn(ID, 'onFileDeselected') });
    await selectFile(container);

    await widget.session.user.click(deleteButton(container));

    await waitFor(() => expect(eventSeen()).toBe('YES'));
  });

  test('calling the clearFiles component-specific action fires onFileDeselected', async () => {
    // Break this catches: clearFiles resetting state without calling fireEvent.
    const { container } = widget.render({ events: setVariableOn(ID, 'onFileDeselected') });
    await selectFile(container);

    await widget.act('clearFiles');

    await waitFor(() => expect(exposed('files')).toHaveLength(0));
    await waitFor(() => expect(eventSeen()).toBe('YES'));
  });

  test('calling the clear alias also fires onFileDeselected', async () => {
    const { container } = widget.render({ events: setVariableOn(ID, 'onFileDeselected') });
    await selectFile(container);

    await widget.act('clear');

    await waitFor(() => expect(eventSeen()).toBe('YES'));
  });
});
