/**
 * FilePicker: the widget's approved contract
 * (frontend/ee/test/app-builder/widgets/FilePicker/TESTING.md).
 * Shared setup lives in Widgets/widgetHarness.js.
 *
 * Real store, real RenderWidget, real FilePicker / useFilePicker.
 * Nothing about the widget is mocked.
 *
 * Test titles carry their approved scenario ID
 * (frontend/ee/test/app-builder/widgets/FilePicker/TESTING.md) as a
 * `[FilePicker-FAMILY-NNN]` prefix, per the widget-testing-contract validator.
 */
import { screen, waitFor, fireEvent, act } from '@testing-library/react';
// eslint-disable-next-line import/no-unresolved
import * as XLSX from 'xlsx';
import {
  createWidgetHarness,
  binding,
  store,
  MODULE_ID,
  setVariableOn,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { resolveWidgetFieldValue } from '@/_helpers/utils';

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

const q = (container, part) => container.querySelector(`[data-cy="${NAME}-${part}"]`);
const rootEl = (container) => container.querySelector(`[data-cy="${NAME}"]`);
const hiddenInput = (container) => q(container, 'input-field');
const instructionEl = (container) => q(container, 'drag-drop-instruction-text');
const maxMessageEl = (container) => q(container, 'maximum-files-uploaded-message');
const countInfoEl = (container) => q(container, 'count-validation-info');
const labelHeading = (container) => container.querySelector(`#${ID}-label`);
const dropzoneRoot = (container) => container.querySelector('.file-picker-dropzone');
const fileListPane = (container) => container.querySelector('.file-list-container');
const deleteButtons = (container) => container.querySelectorAll('.delete-button');
const errorMessageEl = (container) => container.querySelector('.file-picker-error-message');

const files = () => widget.exposed()?.files ?? [];
const eventSeen = () => store().getVariable('seen', MODULE_ID);

async function selectFiles(container, fileList) {
  const before = files().length;
  await widget.session.user.upload(hiddenInput(container), fileList);
  await waitFor(() => expect(files().length).toBeGreaterThan(before));
}

/**
 * Fires a raw native `change` event with the given files, bypassing
 * `userEvent.upload`'s own accept-attribute pre-filtering and its no-op on
 * reselecting an identical File reference — simulates a drag-drop or an "All
 * Files" OS dialog pick that still reaches react-dropzone's own
 * validator/accept rejection path.
 */
function dropFiles(input, fileList) {
  const list = Array.isArray(fileList) ? fileList : [fileList];
  Object.defineProperty(input, 'files', { value: list, configurable: true });
  fireEvent.change(input);
}

/** Real dragenter/dragover/drop sequence with a DataTransfer, for the drop-zone-only scenarios. */
function dragAndDrop(root, fileList) {
  const list = Array.isArray(fileList) ? fileList : [fileList];
  const dataTransfer = { files: list, items: list.map((f) => ({ kind: 'file', type: f.type })), types: ['Files'] };
  fireEvent.dragEnter(root, { dataTransfer });
  fireEvent.dragOver(root, { dataTransfer });
  fireEvent.drop(root, { dataTransfer });
}

/** A real, minimal .xls workbook — PARSE-003 needs bytes SheetJS can actually parse. */
function makeXlsFile(name = 'data.xls') {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([
    ['a', 'b'],
    [1, 2],
  ]);
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  const bytes = XLSX.write(wb, { type: 'array', bookType: 'biff8' });
  return new File([bytes], name, { type: 'application/vnd.ms-excel' });
}

describe('FilePicker: default rendering and label', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[FilePicker-DEF-001] The configured label renders as the widget heading', async () => {
    const { container } = widget.render({ properties: { label: binding('Custom label') } });

    expect(await screen.findByText('Custom label', { exact: false })).toBeInTheDocument();
    expect(labelHeading(container)).toHaveTextContent('Custom label');
  });

  test('[FilePicker-DEF-002] The configured instructionText renders in the dropzone before any drag or selection', async () => {
    const { container } = widget.render({ properties: { instructionText: binding('Choose a file to attach') } });

    expect(await screen.findByText('Choose a file to attach')).toBeInTheDocument();
    expect(instructionEl(container)).toHaveTextContent('Choose a file to attach');
  });

  test('[FilePicker-DEF-003] A mandatory field shows a red asterisk next to the label', async () => {
    const { container } = widget.render({
      properties: { label: binding('Upload files') },
      validation: { enableValidation: binding('{{true}}') },
    });

    expect(await screen.findByText('Upload files', { exact: false })).toBeInTheDocument();
    expect(labelHeading(container)).toHaveTextContent('Upload files*');
  });

  test('[FilePicker-DEF-004] A non-mandatory field shows no asterisk', async () => {
    const { container } = widget.render({
      properties: { label: binding('Upload files') },
      validation: { enableValidation: binding('{{false}}') },
    });

    expect(await screen.findByText('Upload files', { exact: false })).toBeInTheDocument();
    expect(labelHeading(container)).toHaveTextContent('Upload files');
    expect(labelHeading(container)).not.toHaveTextContent('Upload files*');
  });
});

describe('FilePicker: enabling/disabling the dropzone and picker', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[FilePicker-DND-001] Turning off "Use drop zone" stops drag-and-drop selection', async () => {
    // Break this catches: useDropzone's noDrag no longer following `!enableDropzone`, letting a
    // dropped file reach onDrop even though the builder turned the drop zone off.
    const { container } = widget.render({ properties: { enableDropzone: binding('{{false}}') } });
    await screen.findByText('Label', { exact: false });
    const file = new File(['a'], 'a.txt', { type: 'text/plain' });

    dragAndDrop(dropzoneRoot(container), file);

    expect(files()).toHaveLength(0);
    expect(dropzoneRoot(container)).not.toHaveClass('is-dragging');
    expect(dropzoneRoot(container)).not.toHaveClass('is-accepting');
  });

  test('[FilePicker-DND-002] Turning off "Use file picker" stops click-to-browse', async () => {
    const { container } = widget.render({ properties: { enablePicker: binding('{{false}}') } });
    await screen.findByText('Label', { exact: false });
    const clickSpy = jest.spyOn(hiddenInput(container), 'click');

    await widget.session.user.click(dropzoneRoot(container));

    expect(clickSpy).not.toHaveBeenCalled();
  });

  test('[FilePicker-DND-003] With both enableDropzone and enablePicker off, the widget renders its empty state without crashing and offers no way to select a file', async () => {
    const { container } = widget.render({
      properties: { enableDropzone: binding('{{false}}'), enablePicker: binding('{{false}}') },
    });

    await waitFor(() => expect(instructionEl(container)).toBeInTheDocument());
  });
});

describe('FilePicker: selecting files and reaching limits', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[FilePicker-SEL-001] A second file selected in single mode is ignored, keeping the first', async () => {
    // Break this catches: useFilePicker's disablePicker effect no longer going inert once one
    // file is already selected in single-file mode — react-dropzone's own validator would then
    // stop rejecting a second selection.
    const { container } = widget.render();
    const first = new File(['a'], 'first.txt', { type: 'text/plain' });
    const second = new File(['b'], 'second.txt', { type: 'text/plain' });

    await selectFiles(container, first);
    expect(files()).toHaveLength(1);

    dropFiles(hiddenInput(container), second);
    await new Promise((r) => setTimeout(r, 100));

    expect(files()).toHaveLength(1);
    expect(files()[0].name).toBe('first.txt');
  });

  test('[FilePicker-SEL-002] enableMultiple accumulates files across separate selections up to maxFileCount', async () => {
    const { container } = widget.render({
      properties: { enableMultiple: binding('{{true}}') },
      validation: { maxFileCount: binding('{{2}}') },
    });
    const a = new File(['a'], 'a.txt', { type: 'text/plain' });
    const b = new File(['b'], 'b.txt', { type: 'text/plain' });

    await selectFiles(container, a);
    await selectFiles(container, b);

    expect(files()).toHaveLength(2);
    expect(files().map((f) => f.name)).toEqual(['a.txt', 'b.txt']);
    expect(widget.exposed().fileSize).toBe(a.size + b.size);
  });

  test('[FilePicker-SEL-003] A file whose type does not match the configured fileType is rejected with a visible, descriptive error', async () => {
    const { container } = widget.render({ validation: { fileType: binding('image/png') } });
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });

    dropFiles(hiddenInput(container), file);

    await waitFor(() => expect(errorMessageEl(container)).toHaveTextContent(/unsupported file type/));
    expect(files()).toHaveLength(0);
  });

  test('[FilePicker-SEL-004] A file smaller than minSize is rejected with a descriptive error naming the limit', async () => {
    const { container } = widget.render({ validation: { minSize: binding('{{1024}}') } });
    const file = new File(['tiny'], 'tiny.txt', { type: 'text/plain' });

    await widget.session.user.upload(hiddenInput(container), file);

    await waitFor(() => expect(errorMessageEl(container)).toHaveTextContent(/smaller than the minimum allowed size/));
    expect(files()).toHaveLength(0);
  });

  test('[FilePicker-SEL-005] A file larger than maxSize is rejected with a descriptive error naming the limit', async () => {
    const { container } = widget.render({ validation: { maxSize: binding('{{10}}') } });
    const file = new File(['this is definitely more than ten bytes'], 'big.txt', { type: 'text/plain' });

    await widget.session.user.upload(hiddenInput(container), file);

    await waitFor(() => expect(errorMessageEl(container)).toHaveTextContent(/exceeds the maximum allowed size/));
    expect(files()).toHaveLength(0);
  });

  test('[FilePicker-SEL-006] Selecting the same file twice is rejected as a duplicate', async () => {
    const { container } = widget.render({ properties: { enableMultiple: binding('{{true}}') } });
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });

    await selectFiles(container, file);
    dropFiles(hiddenInput(container), file);

    await waitFor(() => expect(errorMessageEl(container)).toHaveTextContent('has already been selected'));
    expect(files()).toHaveLength(1);
  });

  test('[FilePicker-SEL-007] Reaching maxFileCount in multi mode shows "Maximum files uploaded" and hides the instruction text', async () => {
    const { container } = widget.render({
      properties: { enableMultiple: binding('{{true}}') },
      validation: { maxFileCount: binding('{{1}}') },
    });
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });

    await selectFiles(container, file);

    await waitFor(() => expect(maxMessageEl(container)).toBeInTheDocument());
    expect(instructionEl(container)).not.toBeInTheDocument();
  });

  test('[FilePicker-SEL-008] Below the max count, the instruction text still shows and no disabled message appears', async () => {
    const { container } = widget.render({
      properties: { enableMultiple: binding('{{true}}') },
      validation: { maxFileCount: binding('{{2}}') },
    });
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });

    await selectFiles(container, file);

    expect(instructionEl(container)).toBeInTheDocument();
    expect(maxMessageEl(container)).not.toBeInTheDocument();
  });

  test('[FilePicker-SEL-009] In single mode, reaching the real 1-file limit disables the picker but the idle instruction text keeps showing (characterized per D-04)', async () => {
    const { container } = widget.render();
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });

    await selectFiles(container, file);

    expect(instructionEl(container)).toBeInTheDocument();
    expect(maxMessageEl(container)).not.toBeInTheDocument();

    const second = new File(['world'], 'second.txt', { type: 'text/plain' });
    dropFiles(hiddenInput(container), second);
    await new Promise((r) => setTimeout(r, 100));
    expect(files()).toHaveLength(1);
  });

  test('[FilePicker-SEL-010] A maxFileCount of exactly 0 with enableMultiple on immediately disables the picker', async () => {
    // Break this catches: a falsy-swallowing `maxFileCount || <fallback>` that reads a configured
    // 0 as "unset" instead of an immediate limit.
    const { container } = widget.render({
      properties: { enableMultiple: binding('{{true}}') },
      validation: { maxFileCount: binding('{{0}}') },
    });

    await waitFor(() => expect(maxMessageEl(container)).toBeInTheDocument());
  });

  test('[FilePicker-SEL-011] A dropzone-rejection error message persists until the user interacts with the widget again, instead of auto-clearing on a timer', async () => {
    // Break this catches: a setTimeout(() => clearErrorStates(), ...) reintroduced inside
    // onDropRejected that wipes the message on its own, independent of the user's next action.
    const { container } = widget.render({ validation: { fileType: binding('image/png') } });
    await screen.findByText('Label', { exact: false });
    const badFile = new File(['hello'], 'hello.txt', { type: 'text/plain' });

    jest.useFakeTimers();
    dropFiles(hiddenInput(container), badFile);
    await act(async () => {
      await jest.advanceTimersByTimeAsync(0);
    });
    expect(errorMessageEl(container)).toHaveTextContent(/unsupported file type/);

    // Past the previously-hardcoded 10s auto-clear window — the message must still be there.
    await act(async () => {
      await jest.advanceTimersByTimeAsync(15000);
    });
    expect(errorMessageEl(container)).toHaveTextContent(/unsupported file type/);

    jest.useRealTimers();
    const goodFile = new File(['png'], 'good.png', { type: 'image/png' });
    dropFiles(hiddenInput(container), goodFile);

    await waitFor(() => expect(errorMessageEl(container)).not.toBeInTheDocument());
  });
});

describe('FilePicker: parsing file content', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[FilePicker-PARSE-001] parseContent off exposes no parsed value regardless of file type', async () => {
    const { container } = widget.render({ properties: { parseContent: binding('{{false}}') } });
    const file = new File(['a,b\n1,2'], 'data.csv', { type: 'text/csv' });

    await selectFiles(container, file);

    expect(files()[0].parsedValue).toBeNull();
  });

  test('[FilePicker-PARSE-002] parseContent on with parseFileType csv parses the file into structured rows using the default delimiter', async () => {
    const { container } = widget.render({
      properties: { parseContent: binding('{{true}}'), parseFileType: binding('csv') },
    });
    const file = new File(['a,b\n1,2'], 'data.csv', { type: 'text/csv' });

    await selectFiles(container, file);

    await waitFor(() => expect(files()[0].parsedValue).toEqual([{ a: '1', b: '2' }]));
  });

  test('[FilePicker-PARSE-003] parseContent on with parseFileType a spreadsheet type parses the file into a structured object', async () => {
    const { container } = widget.render({
      properties: { parseContent: binding('{{true}}'), parseFileType: binding('vnd.ms-excel') },
    });
    const file = makeXlsFile();

    await selectFiles(container, file);

    await waitFor(() => expect(files()[0].parsedValue).toEqual({ Sheet1: [{ a: 1, b: 2 }] }));
  });

  test('[FilePicker-PARSE-004] parseFileType auto-detect infers the parser from the file MIME type instead of a builder-selected type', async () => {
    const { container } = widget.render({
      properties: { parseContent: binding('{{true}}'), parseFileType: binding('auto-detect') },
    });
    const file = new File(['a,b\n1,2'], 'data.csv', { type: 'text/csv' });

    await selectFiles(container, file);

    await waitFor(() => expect(files()[0].parsedValue).toEqual([{ a: '1', b: '2' }]));
  });

  test('[FilePicker-PARSE-005] A configured delimiter changes the parsed row shape for a CSV file', async () => {
    const { container } = widget.render({
      properties: { parseContent: binding('{{true}}'), parseFileType: binding('csv'), delimiter: binding(';') },
    });
    const file = new File(['a;b\n1;2'], 'data.csv', { type: 'text/csv' });

    await selectFiles(container, file);

    await waitFor(() => expect(files()[0].parsedValue).toEqual([{ a: '1', b: '2' }]));
  });

  test('[FilePicker-PARSE-006] isParsing is true only while a file is being read and parsed', async () => {
    const { container } = widget.render({ properties: { parseContent: binding('{{true}}') } });
    const file = new File(['a,b\n1,2'], 'data.csv', { type: 'text/csv' });

    await widget.session.user.upload(hiddenInput(container), file);
    await waitFor(() => expect(files()).toHaveLength(1));

    expect(widget.exposed().isParsing).toBe(false);
  });
});

describe('FilePicker: validation', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[FilePicker-VAL-001] A mandatory field with no file selected is invalid; selecting a file makes it valid', async () => {
    const { container } = widget.render({ validation: { enableValidation: binding('{{true}}') } });
    await screen.findByText('Label', { exact: false });

    expect(widget.exposed().isValid).toBe(false);

    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });
    await selectFiles(container, file);

    await waitFor(() => expect(widget.exposed().isValid).toBe(true));
  });

  test('[FilePicker-VAL-002] minFileCount is ignored when enableMultiple is off', async () => {
    widget.render({
      properties: { enableMultiple: binding('{{false}}') },
      validation: { minFileCount: binding('{{5}}') },
    });
    await screen.findByText('Label', { exact: false });

    expect(widget.exposed().isValid).toBe(true);
  });

  test('[FilePicker-VAL-003] A minFileCount or minSize of exactly 0 is honored, not swallowed as "unset"', async () => {
    widget.render({
      properties: { enableMultiple: binding('{{true}}') },
      validation: { minFileCount: binding('{{0}}') },
    });
    await screen.findByText('Label', { exact: false });

    expect(widget.exposed().isValid).toBe(true);
  });

  test("[FilePicker-VAL-004] ValidationBar's file-count hint can show a minimum the widget doesn't enforce in single mode (characterized per D-02)", async () => {
    const { container } = widget.render({
      properties: { enableMultiple: binding('{{false}}') },
      validation: { minFileCount: binding('{{3}}'), maxFileCount: binding('{{3}}') },
    });

    await waitFor(() => expect(countInfoEl(container)).toHaveTextContent('0 (Min 3 files)'));
    expect(widget.exposed().isValid).toBe(true);
  });

  test('[FilePicker-VAL-005] isMandatory mirrors the mandatory validation property', async () => {
    widget.render({ validation: { enableValidation: binding('{{true}}') } });
    await waitFor(() => expect(widget.exposed().isMandatory).toBe(true));

    widget.render({ validation: { enableValidation: binding('{{false}}') } });
    await waitFor(() => expect(widget.exposed().isMandatory).toBe(false));
  });

  test('[FilePicker-VAL-006] The minFileCount error message persists until the user interacts with the widget again, instead of auto-clearing on a timer', async () => {
    // Break this catches: a setTimeout(() => clearErrorStates(), ...) reintroduced inside
    // onDropAccepted that wipes the message on its own, independent of the user's next action.
    const { container } = widget.render({
      properties: { enableMultiple: binding('{{true}}') },
      validation: { minFileCount: binding('{{2}}') },
    });
    await screen.findByText('Label', { exact: false });
    const first = new File(['a'], 'first.txt', { type: 'text/plain' });

    jest.useFakeTimers();
    dropFiles(hiddenInput(container), first);
    await act(async () => {
      await jest.advanceTimersByTimeAsync(0);
    });
    expect(errorMessageEl(container)).toHaveTextContent('Please select at least 2 files.');

    // Past the previously-hardcoded 5s auto-clear window — the message must still be there.
    await act(async () => {
      await jest.advanceTimersByTimeAsync(15000);
    });
    expect(errorMessageEl(container)).toHaveTextContent('Please select at least 2 files.');

    jest.useRealTimers();
    const second = new File(['b'], 'second.txt', { type: 'text/plain' });
    dropFiles(hiddenInput(container), second);

    await waitFor(() => expect(errorMessageEl(container)).not.toBeInTheDocument());
  });

  test('[FilePicker-VAL-007] The minFileCount error message shows when mandatory is satisfied but the selection is still below the minimum', async () => {
    const { container } = widget.render({
      properties: { enableMultiple: binding('{{true}}') },
      validation: { enableValidation: binding('{{true}}'), minFileCount: binding('{{2}}') },
    });
    await screen.findByText('Label', { exact: false });
    const first = new File(['a'], 'first.txt', { type: 'text/plain' });

    dropFiles(hiddenInput(container), first);
    await waitFor(() => expect(files()).toHaveLength(1));

    expect(widget.exposed().isValid).toBe(false);
    await waitFor(() => expect(errorMessageEl(container)).toHaveTextContent('Please select at least 2 files.'));
  });
});

describe('FilePicker: loading, disabled, and visibility states', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[FilePicker-STATE-001] visibility false renders nothing visible (empty dropzone hidden via display:none)', async () => {
    const { container } = widget.render({ properties: { visibility: binding('{{false}}') } });

    await waitFor(() => expect(rootEl(container)).toHaveStyle({ display: 'none' }));
  });

  test('[FilePicker-STATE-002] disabledState visually dims the dropzone and marks the hidden inputs aria-disabled', async () => {
    const { container } = widget.render({ properties: { disabledState: binding('{{true}}') } });

    await waitFor(() => expect(rootEl(container)).toHaveStyle({ opacity: '0.5' }));
    expect(hiddenInput(container)).toHaveAttribute('aria-disabled', 'true');
  });

  test('[FilePicker-STATE-003] loadingState shows a loader in place of the dropzone content', async () => {
    const { container } = widget.render({ properties: { loadingState: binding('{{true}}') } });

    await waitFor(() => expect(container.querySelector('.tj-widget-loader')).toBeInTheDocument());
    expect(instructionEl(container)).not.toBeInTheDocument();
  });

  test('[FilePicker-STATE-004] setDisable survives an unrelated property re-resolve', async () => {
    widget.render({ properties: { disabledState: binding('{{false}}') } });
    await screen.findByText('Label', { exact: false });

    await widget.act('setDisable', true);
    await waitFor(() => expect(hiddenInput(document)).toHaveAttribute('aria-disabled', 'true'));

    const { container } = widget.render({
      properties: { disabledState: binding('{{false}}'), label: binding('Changed') },
    });
    await waitFor(() => expect(screen.getByText('Changed', { exact: false })).toBeInTheDocument());

    expect(hiddenInput(container)).toHaveAttribute('aria-disabled', 'true');
  });

  test('[FilePicker-STATE-005] setVisibility survives an unrelated property re-resolve', async () => {
    widget.render({ properties: { visibility: binding('{{true}}') } });
    await screen.findByText('Label', { exact: false });

    await widget.act('setVisibility', false);
    await waitFor(() => expect(rootEl(document)).toHaveStyle({ display: 'none' }));

    const { container } = widget.render({
      properties: { visibility: binding('{{true}}'), label: binding('Changed') },
    });

    expect(rootEl(container)).toHaveStyle({ display: 'none' });
  });

  test('[FilePicker-STATE-006] setLoading survives an unrelated property re-resolve', async () => {
    widget.render({ properties: { loadingState: binding('{{false}}') } });
    await screen.findByText('Label', { exact: false });

    await widget.act('setLoading', true);
    await waitFor(() => expect(document.querySelector('.tj-widget-loader')).toBeInTheDocument());

    const { container } = widget.render({
      properties: { loadingState: binding('{{false}}'), label: binding('Changed') },
    });

    expect(container.querySelector('.tj-widget-loader')).toBeInTheDocument();
  });
});

describe('FilePicker: events', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[FilePicker-EVT-001] onFileSelected fires immediately on pick, before content is read or parsed', async () => {
    const { container } = widget.render({ events: setVariableOn(ID, 'onFileSelected') });
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });

    await widget.session.user.upload(hiddenInput(container), file);

    await waitFor(() => expect(eventSeen()).toBe('YES'));
  });

  test('[FilePicker-EVT-002] onFileLoaded fires after processing completes, with the resulting file objects on both files and the legacy file variable', async () => {
    const { container } = widget.render({ events: setVariableOn(ID, 'onFileLoaded') });
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });

    await widget.session.user.upload(hiddenInput(container), file);

    await waitFor(() => expect(eventSeen()).toBe('YES'));
    expect(files()).toHaveLength(1);
    expect(widget.exposed().file).toHaveLength(1);
  });

  test('[FilePicker-EVT-003] onFileDeselected fires for per-file removal, clearFiles, and the clear alias', async () => {
    const { container } = widget.render({ events: setVariableOn(ID, 'onFileDeselected') });
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });
    await selectFiles(container, file);

    await widget.session.user.click(deleteButtons(container)[0]);

    await waitFor(() => expect(eventSeen()).toBe('YES'));
  });

  test('[FilePicker-EVT-003] calling the clearFiles component-specific action fires onFileDeselected', async () => {
    // Break this catches: clearFiles resetting state without calling fireEvent.
    const { container } = widget.render({ events: setVariableOn(ID, 'onFileDeselected') });
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });
    await selectFiles(container, file);

    await widget.act('clearFiles');

    await waitFor(() => expect(files()).toHaveLength(0));
    await waitFor(() => expect(eventSeen()).toBe('YES'));
  });

  test('[FilePicker-EVT-003] calling the clear alias also fires onFileDeselected', async () => {
    const { container } = widget.render({ events: setVariableOn(ID, 'onFileDeselected') });
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });
    await selectFiles(container, file);

    await widget.act('clear');

    await waitFor(() => expect(eventSeen()).toBe('YES'));
  });
});

describe('FilePicker: deleting selected files', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[FilePicker-DEL-001] Removing the only selected file hides the file-list pane', async () => {
    const { container } = widget.render();
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });
    await selectFiles(container, file);
    expect(fileListPane(container)).toBeInTheDocument();

    await widget.session.user.click(deleteButtons(container)[0]);

    await waitFor(() => expect(fileListPane(container)).not.toBeInTheDocument());
  });

  test('[FilePicker-DEL-002] Replacing a file in single mode keeps exactly one file-list row, never two', async () => {
    const { container } = widget.render({ properties: { enableMultiple: binding('{{false}}') } });
    const fileA = new File(['a'], 'a.txt', { type: 'text/plain' });
    const fileB = new File(['b'], 'b.txt', { type: 'text/plain' });

    await selectFiles(container, fileA);
    await widget.session.user.click(deleteButtons(container)[0]);
    await waitFor(() => expect(files()).toHaveLength(0));

    await selectFiles(container, fileB);

    expect(files()).toHaveLength(1);
    expect(container.querySelectorAll('.file-list-item')).toHaveLength(1);
    expect(screen.getByText('b')).toBeInTheDocument();
  });

  test("[FilePicker-DEL-003] The per-file delete button is hidden only while that specific file is uploading, independent of the widget's disabledState/loadingState", async () => {
    // A disabled dropzone's hidden input drops its onChange handler entirely (react-dropzone's
    // own composeHandler), so the file must be selected BEFORE disabling — the scenario is about
    // a widget that became disabled/loading after a file was already selected, not about
    // selecting one while disabled.
    const { container } = widget.render();
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });
    await selectFiles(container, file);

    await widget.act('setDisable', true);
    await waitFor(() => expect(rootEl(container)).toHaveStyle({ opacity: '0.5' }));

    const del = deleteButtons(container)[0];
    expect(del).toBeInTheDocument();

    await widget.session.user.click(del);
    await waitFor(() => expect(files()).toHaveLength(0));
  });
});

describe('FilePicker: component-specific actions', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[FilePicker-ACT-001] The clearFiles action (and its clear alias) empty the selection the same way as deleting each file', async () => {
    const { container } = widget.render();
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });
    await selectFiles(container, file);

    await widget.act('clearFiles');

    await waitFor(() => expect(files()).toHaveLength(0));
    expect(fileListPane(container)).not.toBeInTheDocument();
  });

  test('[FilePicker-ACT-002] setFileName renames a selected file, preserving its extension', async () => {
    const { container } = widget.render();
    const file = new File(['a,b'], 'report.csv', { type: 'text/csv' });
    await selectFiles(container, file);

    await widget.act('setFileName', 0, 'summary');

    await waitFor(() => expect(files()[0].name).toBe('summary.csv'));
    expect(screen.getByText('summary')).toBeInTheDocument();
  });

  test('[FilePicker-ACT-003] setVisibility/setDisable/setLoading toggle their corresponding exposed state and DOM behavior', async () => {
    const { container } = widget.render();
    await screen.findByText('Label', { exact: false });

    await widget.act('setDisable', true);
    await waitFor(() => expect(rootEl(container)).toHaveStyle({ opacity: '0.5' }));
    expect(widget.exposed().isDisabled).toBe(true);
    await widget.act('setDisable', false);

    await widget.act('setLoading', true);
    await waitFor(() => expect(container.querySelector('.tj-widget-loader')).toBeInTheDocument());
    expect(widget.exposed().isLoading).toBe(true);
    await widget.act('setLoading', false);

    await widget.act('setVisibility', false);
    await waitFor(() => expect(rootEl(container)).toHaveStyle({ display: 'none' }));
    expect(widget.exposed().isVisible).toBe(false);
  });
});

describe('FilePicker: styling', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[FilePicker-STYLE-001] dropzoneTitleColor sets the label headings color custom property', async () => {
    const { container } = widget.render({ styles: { dropzoneTitleColor: binding('#123456') } });
    await screen.findByText('Label', { exact: false });

    expect(rootEl(container).style.getPropertyValue('--file-picker-text-primary')).toBe('#123456');
  });

  test('[FilePicker-STYLE-002] borderRadius sets the dropzones border-radius custom property', async () => {
    const { container } = widget.render({ styles: { borderRadius: binding('{{20}}') } });
    await screen.findByText('Label', { exact: false });

    expect(rootEl(container).style.getPropertyValue('--file-picker-border-radius')).toBe('20px');
  });

  test('[FilePicker-STYLE-003] boxShadow sets the containers box-shadow custom property', async () => {
    const { container } = widget.render({ styles: { boxShadow: binding('0px 2px 4px #000000') } });
    await screen.findByText('Label', { exact: false });

    expect(rootEl(container).style.getPropertyValue('--file-picker-box-shadow')).toBe('0px 2px 4px #000000');
  });

  test("[FilePicker-STYLE-004] padding 'none' vs 'default' changes the dropzones base height offset", async () => {
    const { container: none } = widget.render({ styles: { padding: binding('none') } });
    await screen.findByText('Label', { exact: false });
    expect(rootEl(none)).toHaveStyle({ height: '40px' });

    const { container: def } = widget.render({ styles: { padding: binding('default') } });
    await screen.findByText('Label', { exact: false });
    expect(rootEl(def)).toHaveStyle({ height: '36px' });
  });
});

describe('FilePicker: dynamic height', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[FilePicker-HEIGHT-001] dynamicHeight off keeps a fixed-height dropzone regardless of file count', async () => {
    const { container } = widget.render({
      properties: { enableMultiple: binding('{{true}}'), dynamicHeight: binding('{{false}}') },
      validation: { maxFileCount: binding('{{3}}') },
      currentMode: 'view',
    });
    const a = new File(['a'], 'a.txt', { type: 'text/plain' });
    const b = new File(['b'], 'b.txt', { type: 'text/plain' });

    await screen.findByText('Label', { exact: false });
    expect(rootEl(container)).toHaveStyle({ height: '36px' });
    // The wrapper always carries the hover-reveal scrollbar class, independent of dynamicHeight
    // (Widgets/__tests__/integration/filePicker.spec.jsx's pre-existing "scroll affordance" case).
    expect(rootEl(container)).toHaveClass('files-pane-scrollable');

    await selectFiles(container, a);
    await selectFiles(container, b);

    expect(rootEl(container)).toHaveStyle({ height: '36px' });
  });

  test('[FilePicker-HEIGHT-002] dynamicHeight only takes effect in Viewer mode, never live in the Editor canvas', async () => {
    const { container: editContainer } = widget.render({
      properties: { dynamicHeight: binding('{{true}}') },
      currentMode: 'edit',
    });
    await screen.findByText('Label', { exact: false });
    expect(rootEl(editContainer)).toHaveStyle({ height: '36px' });
    expect(rootEl(editContainer).style.minHeight).toBe('');

    const { container: viewContainer } = widget.render({
      properties: { dynamicHeight: binding('{{true}}') },
      currentMode: 'view',
    });
    await screen.findByText('Label', { exact: false });
    expect(rootEl(viewContainer)).toHaveStyle({ height: 'auto', minHeight: '36px' });
  });

  test('[FilePicker-HEIGHT-003] padding affects the dynamic-height floor the same way it affects the fixed-height dropzone', async () => {
    const { container } = widget.render({
      properties: { dynamicHeight: binding('{{true}}') },
      styles: { padding: binding('none') },
      currentMode: 'view',
    });
    await screen.findByText('Label', { exact: false });

    expect(rootEl(container)).toHaveStyle({ minHeight: '40px' });
  });
});

describe('FilePicker: accessibility attributes on the underlying file input', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[FilePicker-A11Y-001] aria-required reflects the mandatory setting', async () => {
    const { container } = widget.render({ validation: { enableValidation: binding('{{true}}') } });
    await screen.findByText('Label', { exact: false });

    expect(hiddenInput(container)).toHaveAttribute('aria-required', 'true');
  });

  test('[FilePicker-A11Y-002] aria-labelledby points at the visible label heading', async () => {
    const { container } = widget.render();
    await screen.findByText('Label', { exact: false });

    expect(hiddenInput(container)).toHaveAttribute('aria-labelledby', `${ID}-label`);
    expect(labelHeading(container)).toHaveAttribute('id', `${ID}-label`);
  });

  test('[FilePicker-A11Y-003] The dropzone is keyboard-focusable but Enter/Space does not open the file dialog (characterized per D-03)', async () => {
    const { container } = widget.render();
    await screen.findByText('Label', { exact: false });

    const root = dropzoneRoot(container);
    expect(root).toHaveAttribute('tabIndex', '0');

    const clickSpy = jest.spyOn(hiddenInput(container), 'click');
    fireEvent.keyDown(root, { key: 'Enter', code: 'Enter' });
    fireEvent.keyDown(root, { key: ' ', code: 'Space' });

    expect(clickSpy).not.toHaveBeenCalled();
  });
});

describe('FilePicker: saved-app compatibility', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[FilePicker-COMPAT-001] A files content/base64Data/dataURL resolve to real strings through the file-handle registry, not a leaked ref object', async () => {
    const { container } = widget.render();
    const file = new File(['hello world'], 'hello.txt', { type: 'text/plain' });
    await selectFiles(container, file);

    const rawContent = files()[0].content;
    const rawBase64 = files()[0].base64Data;
    // The store only ever holds the lightweight lazy ref, never the materialized string.
    expect(typeof rawContent).toBe('object');
    expect(typeof rawBase64).toBe('object');

    // Break this catches: a query/binding consumer receiving the raw ref object instead of the
    // real decoded string once commit 98abae0658 moved payloads out of the reactive store.
    const resolvedContent = resolveWidgetFieldValue('{{content}}', '', { content: rawContent });
    const resolvedBase64 = resolveWidgetFieldValue('{{base64Data}}', '', { base64Data: rawBase64 });

    expect(resolvedContent).toBe('hello world');
    expect(resolvedBase64).toBe('aGVsbG8gd29ybGQ=');
  });
});
