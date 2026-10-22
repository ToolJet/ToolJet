/**
 * FileInput: the widget's approved contract
 * (frontend/ee/test/app-builder/widgets/FileInput/TESTING.md).
 * Shared setup lives in Widgets/widgetHarness.js.
 *
 * Real store, real RenderWidget, real FileInput / useFilePicker.
 * Nothing about the widget is mocked.
 *
 * Test titles carry their approved scenario ID
 * (frontend/ee/test/app-builder/widgets/FileInput/TESTING.md) as a
 * `[FileInput-FAMILY-NNN]` prefix, per the widget-testing-contract validator.
 */
import { screen, waitFor, fireEvent } from '@testing-library/react';
import {
  createWidgetHarness,
  binding,
  store,
  MODULE_ID,
  setVariableOn,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'fileinput1';
const NAME = 'fileinput1';

// FileInput's own schema default for enableMultiple is ON (fileinput.js:33-41,493) — unlike
// FileButton's off-by-default. useFilePicker's `?? false` runtime fallback only matters for a
// saved definition that omits the key entirely (an old-app compatibility edge case), not a
// normally-seeded component, so the harness default mirrors what a fresh drop actually gets.
const widget = createWidgetHarness({
  componentType: 'FileInput',
  handle: NAME,
  id: ID,
  defaultProperties: {
    label: binding('Attachment'),
    visibility: binding('{{true}}'),
    enableMultiple: binding('{{true}}'),
  },
});

const q = (container, part) => container.querySelector(`[data-cy="${NAME}-${part}"]`);
const rootEl = (container) => container.querySelector(`[data-cy="${NAME}"]`);
const hiddenInput = (container) => q(container, 'input-field');
const browseButton = (container) => q(container, 'button');
const labelEl = (container) => q(container, 'label');
const clearButton = (container) => q(container, 'clear-button');
const loaderEl = (container) => q(container, 'loader');
const invalidFeedback = (container) => q(container, 'invalid-feedback');
const fieldBox = (container) => container.querySelector('.tj-file-input-field');

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

describe('FileInput: default rendering and label', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[FileInput-DEF-001] the configured label and placeholder render before any file is selected, with the configured label color applied', async () => {
    const { container } = widget.render({ properties: { instructionText: binding('Choose a file') } });

    expect(await screen.findByText('Choose a file')).toBeInTheDocument();
    expect(labelEl(container)).toHaveTextContent('Attachment');
    expect(labelEl(container).querySelector('p')).toHaveStyle({ color: 'var(--cc-primary-text)' });

    const { container: container2 } = widget.render({
      properties: { instructionText: binding('Choose a file') },
      styles: { labelColor: binding('#123456') },
    });
    await screen.findByText('Choose a file');
    expect(labelEl(container2).querySelector('p')).toHaveStyle({ color: '#123456' });
  });

  test('[FileInput-DEF-002] selecting exactly one file replaces the placeholder with that file name', async () => {
    const { container } = widget.render();
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });

    await selectFiles(container, file);

    expect(screen.getByText('hello.txt')).toBeInTheDocument();
    expect(screen.queryByText('Click to select file')).not.toBeInTheDocument();
  });

  test('[FileInput-DEF-003] selecting multiple files shows an "N files selected" summary, and deprecated shared-hook keys never leak into exposed variables', async () => {
    const { container } = widget.render({ properties: { enableMultiple: binding('{{true}}') } });
    const a = new File(['a'], 'a.txt', { type: 'text/plain' });
    const b = new File(['b'], 'b.txt', { type: 'text/plain' });

    await selectFiles(container, [a, b]);
    await waitFor(() => expect(files()).toHaveLength(2));

    expect(screen.getByText('2 files selected')).toBeInTheDocument();
    // Break this catches: FileInput.jsx's wrappedSetExposedVariables filter (commit 1ceae07b82)
    // being dropped, letting the shared hook's deprecated file/clearFiles/setFileName keys leak
    // back onto the exposed variables object.
    expect(widget.exposed().file).toBeUndefined();
    expect(widget.exposed().clearFiles).toBeUndefined();
    expect(widget.exposed().setFileName).toBeUndefined();
  });

  test('[FileInput-DEF-004] a mandatory field shows a red asterisk next to the label', async () => {
    const { container } = widget.render({ validation: { enableValidation: binding('{{true}}') } });

    expect(await screen.findByText('Attachment', { exact: false })).toBeInTheDocument();
    expect(labelEl(container)).toHaveTextContent('Attachment*');
  });

  test('[FileInput-DEF-005] a non-mandatory field shows no asterisk', async () => {
    const { container } = widget.render({ validation: { enableValidation: binding('{{false}}') } });

    expect(await screen.findByText('Attachment', { exact: false })).toBeInTheDocument();
    expect(labelEl(container)).not.toHaveTextContent('Attachment*');
  });

  test('[FileInput-DEF-006] the component own id is exposed as a live variable', async () => {
    widget.render();

    await waitFor(() => expect(widget.exposed().id).toBe(ID));
  });

  test('[FileInput-DEF-007] borderRadius accepts a bare number (appending "px") or a pre-unit string (passed through unchanged)', async () => {
    const { container } = widget.render({ styles: { borderRadius: binding('{{12}}') } });
    await screen.findByText('Attachment', { exact: false });
    // Break this catches: dropping the Number.isNaN(Number(borderRadius)) branch and always
    // appending 'px', which would corrupt a pre-unit string value into e.g. '1remxpx'.
    expect(fieldBox(container)).toHaveStyle({ borderRadius: '12px' });

    const { container: container2 } = widget.render({ styles: { borderRadius: binding('1rem') } });
    await screen.findByText('Attachment', { exact: false });
    expect(fieldBox(container2)).toHaveStyle({ borderRadius: '1rem' });
  });
});

describe('FileInput: selecting files and reaching limits', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[FileInput-SEL-001] a second file selected in single mode is ignored, keeping the first', async () => {
    // Break this catches: useFilePicker's disablePicker effect no longer going inert
    // (`disabled: isDisabled || disablePicker` at useFilePicker.js:420) once one file is already
    // selected in single-file mode — react-dropzone stops processing change events entirely
    // while disabled, so a second selection has no effect at all.
    const { container } = widget.render({ properties: { enableMultiple: binding('{{false}}') } });
    const first = new File(['a'], 'first.txt', { type: 'text/plain' });
    const second = new File(['b'], 'second.txt', { type: 'text/plain' });

    await selectFiles(container, first);
    expect(files()).toHaveLength(1);

    dropFiles(hiddenInput(container), second);
    await new Promise((r) => setTimeout(r, 100));

    expect(files()).toHaveLength(1);
    expect(files()[0].name).toBe('first.txt');
  });

  test('[FileInput-SEL-002] enableMultiple accumulates files across separate selections up to maxFileCount', async () => {
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

  test('[FileInput-SEL-003] a file whose type does not match the configured fileType is rejected with a descriptive error', async () => {
    const { container } = widget.render({ validation: { fileType: binding('image/png') } });
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });

    dropFiles(hiddenInput(container), file);

    await waitFor(() => expect(invalidFeedback(container)).toHaveTextContent(/unsupported file type/));
    expect(files()).toHaveLength(0);
  });

  test('[FileInput-SEL-004] a file smaller than minSize is rejected with a descriptive error naming the limit', async () => {
    const { container } = widget.render({ validation: { minSize: binding('{{1024}}') } });
    const file = new File(['tiny'], 'tiny.txt', { type: 'text/plain' });

    await widget.session.user.upload(hiddenInput(container), file);

    await waitFor(() => expect(invalidFeedback(container)).toHaveTextContent(/smaller than the minimum allowed size/));
    expect(files()).toHaveLength(0);
  });

  test('[FileInput-SEL-005] a file larger than maxSize is rejected with a descriptive error naming the limit', async () => {
    const { container } = widget.render({ validation: { maxSize: binding('{{10}}') } });
    const file = new File(['this is definitely more than ten bytes'], 'big.txt', { type: 'text/plain' });

    await widget.session.user.upload(hiddenInput(container), file);

    await waitFor(() => expect(invalidFeedback(container)).toHaveTextContent(/exceeds the maximum allowed size/));
    expect(files()).toHaveLength(0);
  });

  test('[FileInput-SEL-006] selecting the same file twice is rejected as a duplicate', async () => {
    const { container } = widget.render({ properties: { enableMultiple: binding('{{true}}') } });
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });

    await selectFiles(container, file);
    dropFiles(hiddenInput(container), file);

    await waitFor(() => expect(invalidFeedback(container)).toHaveTextContent('has already been selected'));
    expect(files()).toHaveLength(1);
  });

  test('[FileInput-SEL-007] reaching the max file count natively disables the Browse button', async () => {
    const { container } = widget.render({ properties: { enableMultiple: binding('{{false}}') } });
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });

    await selectFiles(container, file);

    // Break this catches: switching FileInput's native `disabled={disabledState || disablePicker}`
    // (FileInput.jsx:306) to FileButton's aria-only pattern — FileInput deliberately natively
    // disables here, a distinct contract from FileButton (see Research findings).
    expect(browseButton(container)).toBeDisabled();
    expect(fieldBox(container)).toHaveClass('tj-file-input-disabled');
    expect(browseButton(container)).toHaveStyle('cursor: not-allowed');
  });

  test('[FileInput-SEL-008] the Browse button stays enabled with a pointer cursor before any file is selected', async () => {
    const { container } = widget.render({ properties: { enableMultiple: binding('{{false}}') } });
    await screen.findByText('Attachment', { exact: false });

    expect(browseButton(container)).not.toBeDisabled();
    expect(fieldBox(container)).not.toHaveClass('tj-file-input-disabled');
    expect(browseButton(container)).not.toHaveStyle('cursor: not-allowed');
  });

  test('[FileInput-SEL-009] in single mode, the picker disables immediately after exactly one file is selected', async () => {
    const { container } = widget.render({ properties: { enableMultiple: binding('{{false}}') } });
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });

    await selectFiles(container, file);

    expect(browseButton(container)).toBeDisabled();
  });

  test('[FileInput-SEL-010] a maxFileCount of exactly 0 with enableMultiple on immediately disables the picker', async () => {
    // Break this catches: a falsy-swallowing `maxFileCount || <fallback>` that reads a configured
    // 0 as "unset" instead of an immediate limit.
    const { container } = widget.render({
      properties: { enableMultiple: binding('{{true}}') },
      validation: { maxFileCount: binding('{{0}}') },
    });
    await screen.findByText('Attachment', { exact: false });

    expect(browseButton(container)).toBeDisabled();
  });
});

describe('FileInput: validation', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[FileInput-VAL-001] a mandatory field with no file selected is invalid; selecting a file makes it valid', async () => {
    const { container } = widget.render({ validation: { enableValidation: binding('{{true}}') } });
    await screen.findByText('Attachment', { exact: false });

    expect(widget.exposed().isValid).toBe(false);

    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });
    await selectFiles(container, file);

    await waitFor(() => expect(widget.exposed().isValid).toBe(true));
  });

  test('[FileInput-VAL-002] minFileCount is ignored when enableMultiple is off', async () => {
    widget.render({
      properties: { enableMultiple: binding('{{false}}') },
      validation: { minFileCount: binding('{{5}}') },
    });
    await screen.findByText('Attachment', { exact: false });

    expect(widget.exposed().isValid).toBe(true);
  });

  test('[FileInput-VAL-003] a minFileCount of exactly 0 is honored, not swallowed as "unset"', async () => {
    // Break this catches: `minFileCount || <fallback>` reading a configured 0 as unset instead of
    // an already-met minimum.
    widget.render({
      properties: { enableMultiple: binding('{{true}}') },
      validation: { minFileCount: binding('{{0}}') },
    });
    await screen.findByText('Attachment', { exact: false });

    expect(widget.exposed().isValid).toBe(true);
  });

  test('[FileInput-VAL-004] isMandatory mirrors the mandatory validation property', async () => {
    widget.render({ validation: { enableValidation: binding('{{true}}') } });
    await waitFor(() => expect(widget.exposed().isMandatory).toBe(true));

    widget.render({ validation: { enableValidation: binding('{{false}}') } });
    await waitFor(() => expect(widget.exposed().isMandatory).toBe(false));
  });

  test('[FileInput-VAL-005] a Form clear signal empties the selection the same way the clear button does', async () => {
    const { container } = widget.renderInsideForm({ properties: { enableClearSelection: binding('{{true}}') } });
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });

    await selectFiles(container, file);
    expect(files()).toHaveLength(1);

    await widget.session.store.act(async () => {
      await widget.exposed('form1').clearForm();
    });

    await waitFor(() => expect(files()).toHaveLength(0));
  });
});

describe('FileInput: parsing file content', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[FileInput-PARSE-001] parseContent off exposes no parsed value regardless of file type', async () => {
    // Break this catches: shouldProcessFileParsing ignoring the parseContent gate and parsing
    // unconditionally.
    const { container } = widget.render({ properties: { parseContent: binding('{{false}}') } });
    const file = new File(['a,b\n1,2'], 'data.csv', { type: 'text/csv' });

    await selectFiles(container, file);

    expect(files()[0].parsedValue).toBeNull();
  });

  test('[FileInput-PARSE-002] parseContent on with parseFileType csv parses the file into structured rows using the default delimiter', async () => {
    const { container } = widget.render({
      properties: { parseContent: binding('{{true}}'), parseFileType: binding('csv') },
    });
    const file = new File(['a,b\n1,2'], 'data.csv', { type: 'text/csv' });

    await selectFiles(container, file);

    await waitFor(() => expect(files()[0].parsedValue).toEqual([{ a: '1', b: '2' }]));
  });

  test('[FileInput-PARSE-003] parseContent on with parseFileType json parses the file into a structured object', async () => {
    const { container } = widget.render({
      properties: { parseContent: binding('{{true}}'), parseFileType: binding('json') },
    });
    const file = new File(['{"x":1}'], 'data.json', { type: 'application/json' });

    await selectFiles(container, file);

    await waitFor(() => expect(files()[0].parsedValue).toEqual({ x: 1 }));
  });

  test('[FileInput-PARSE-004] parseFileType auto-detect infers the parser from the file MIME type', async () => {
    const { container } = widget.render({
      properties: { parseContent: binding('{{true}}'), parseFileType: binding('auto-detect') },
    });
    const file = new File(['a,b\n1,2'], 'data.csv', { type: 'text/csv' });

    await selectFiles(container, file);

    await waitFor(() => expect(files()[0].parsedValue).toEqual([{ a: '1', b: '2' }]));
  });

  test('[FileInput-PARSE-005] a configured delimiter changes the parsed row shape for a CSV file', async () => {
    const { container } = widget.render({
      properties: { parseContent: binding('{{true}}'), parseFileType: binding('csv'), delimiter: binding(';') },
    });
    const file = new File(['a;b\n1;2'], 'data.csv', { type: 'text/csv' });

    await selectFiles(container, file);

    await waitFor(() => expect(files()[0].parsedValue).toEqual([{ a: '1', b: '2' }]));
  });

  test('[FileInput-PARSE-006] isParsing is true only while a file is being read and parsed', async () => {
    const { container } = widget.render({ properties: { parseContent: binding('{{true}}') } });
    const file = new File(['a,b\n1,2'], 'data.csv', { type: 'text/csv' });

    await widget.session.user.upload(hiddenInput(container), file);
    await waitFor(() => expect(files()).toHaveLength(1));

    expect(widget.exposed().isParsing).toBe(false);
  });
});

describe('FileInput: clearing the selection', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[FileInput-CLR-001] the clear button appears only when files are selected and enableClearSelection is on', async () => {
    const { container } = widget.render({ properties: { enableClearSelection: binding('{{true}}') } });
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });

    await selectFiles(container, file);

    const clear = clearButton(container);
    expect(clear).toBeInTheDocument();
    expect(clear).not.toBeDisabled();
  });

  test('[FileInput-CLR-002] no clear button when enableClearSelection is off, even with files selected', async () => {
    const { container } = widget.render({ properties: { enableClearSelection: binding('{{false}}') } });
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });

    await selectFiles(container, file);

    expect(clearButton(container)).not.toBeInTheDocument();
  });

  test('[FileInput-CLR-003] clicking clear empties the selection and re-enables the picker', async () => {
    const { container } = widget.render({
      properties: { enableClearSelection: binding('{{true}}'), enableMultiple: binding('{{false}}') },
    });
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });

    await selectFiles(container, file);
    expect(browseButton(container)).toBeDisabled();

    await widget.session.user.click(clearButton(container));

    await waitFor(() => expect(screen.getByText('Click to select file')).toBeInTheDocument());
    expect(files()).toHaveLength(0);
    expect(browseButton(container)).not.toBeDisabled();
  });

  test('[FileInput-CLR-004] the Browse control is replaced by the loader while isLoading is true, but the clear button (per D-04) is not', async () => {
    // D-04: unlike FileButton's analogous guard, FileInput's clear button has no `!isLoading`
    // gate today (FileInput.jsx's render guard is `selectedFiles.length > 0 && enableClearSelection`
    // only) — characterized here as-is per the recorded decision, not fixed.
    const { container } = widget.render({ properties: { enableClearSelection: binding('{{true}}') } });
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });

    await selectFiles(container, file);
    expect(clearButton(container)).toBeInTheDocument();

    await widget.act('setLoading', true);

    await waitFor(() => expect(browseButton(container)).not.toBeInTheDocument());
    expect(loaderEl(container)).toBeInTheDocument();
    expect(clearButton(container)).toBeInTheDocument();
  });
});

describe('FileInput: component-specific actions', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[FileInput-ACT-001] the clear action clears the selection the same way as clicking the clear button', async () => {
    const { container } = widget.render();
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });
    await selectFiles(container, file);

    await widget.act('clear');

    await waitFor(() => expect(files()).toHaveLength(0));
  });

  test('[FileInput-ACT-002] setFocus/setBlur move focus to/from the real Browse button, not the outer wrapper', async () => {
    const { container } = widget.render();
    await screen.findByText('Attachment', { exact: false });

    // Break this catches: regression of commit a8557771e1 — focusFn/blurFn targeting the outer
    // (non-interactive) wrapper ref instead of the real Browse button.
    await widget.act('setFocus');
    expect(browseButton(container)).toHaveFocus();

    await widget.act('setBlur');
    expect(browseButton(container)).not.toHaveFocus();
  });

  test('[FileInput-ACT-003] setVisibility/setDisable/setLoading toggle their corresponding exposed state and DOM behavior', async () => {
    const { container } = widget.render();
    await screen.findByText('Attachment', { exact: false });

    await widget.act('setDisable', true);
    await waitFor(() => expect(browseButton(container)).toBeDisabled());
    expect(widget.exposed().isDisabled).toBe(true);
    await widget.act('setDisable', false);

    await widget.act('setLoading', true);
    await waitFor(() => expect(loaderEl(container)).toBeInTheDocument());
    expect(widget.exposed().isLoading).toBe(true);
    await widget.act('setLoading', false);

    await widget.act('setVisibility', false);
    await waitFor(() => expect(screen.queryByText('Attachment')).not.toBeInTheDocument());
    expect(widget.exposed().isVisible).toBe(false);
  });
});

describe('FileInput: loading, disabled, and visibility states', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[FileInput-STATE-001] visibility false renders nothing', async () => {
    const { container } = widget.render({ properties: { visibility: binding('{{false}}') } });

    await waitFor(() => expect(rootEl(container)).not.toBeInTheDocument());
  });

  test('[FileInput-STATE-002] disabledState natively disables the Browse button and marks the hidden input aria-disabled', async () => {
    const { container } = widget.render({ properties: { disabledState: binding('{{true}}') } });
    await waitFor(() => expect(browseButton(container)).toBeDisabled());

    expect(hiddenInput(container)).toHaveAttribute('aria-disabled', 'true');
  });

  test('[FileInput-STATE-003] loadingState shows the loader and blocks interaction independent of disabledState', async () => {
    const { container } = widget.render({
      properties: { loadingState: binding('{{true}}'), disabledState: binding('{{false}}') },
    });

    await waitFor(() => expect(loaderEl(container)).toBeInTheDocument());
    expect(browseButton(container)).not.toBeInTheDocument();
  });

  test('[FileInput-STATE-004] setDisable survives an unrelated property re-resolve', async () => {
    widget.render({ properties: { disabledState: binding('{{false}}') } });
    await screen.findByText('Attachment', { exact: false });

    await widget.act('setDisable', true);
    await waitFor(() => expect(browseButton(document)).toBeDisabled());

    const { container } = widget.render({
      properties: { disabledState: binding('{{false}}'), label: binding('Changed') },
    });
    await waitFor(() => expect(screen.getByText('Changed', { exact: false })).toBeInTheDocument());

    expect(browseButton(container)).toBeDisabled();
  });

  test('[FileInput-STATE-005] setVisibility survives an unrelated property re-resolve', async () => {
    widget.render({ properties: { visibility: binding('{{true}}') } });
    await screen.findByText('Attachment', { exact: false });

    await widget.act('setVisibility', false);
    await waitFor(() => expect(rootEl(document)).not.toBeInTheDocument());

    widget.render({ properties: { visibility: binding('{{true}}'), label: binding('Changed') } });

    expect(screen.queryByText('Changed', { exact: false })).not.toBeInTheDocument();
  });

  test('[FileInput-STATE-006] setLoading survives an unrelated property re-resolve', async () => {
    widget.render({ properties: { loadingState: binding('{{false}}') } });
    await screen.findByText('Attachment', { exact: false });

    await widget.act('setLoading', true);
    await waitFor(() => expect(document.querySelector(`[data-cy="${NAME}-loader"]`)).toBeInTheDocument());

    const { container } = widget.render({
      properties: { loadingState: binding('{{false}}'), label: binding('Changed') },
    });

    expect(loaderEl(container)).toBeInTheDocument();
  });

  test('[FileInput-STATE-007] disabledState and the at-limit signal independently disable the Browse button; clearing one alone does not re-enable it while the other still holds', async () => {
    const { container } = widget.render({
      properties: { enableMultiple: binding('{{false}}'), disabledState: binding('{{false}}') },
    });
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });
    await selectFiles(container, file);
    expect(browseButton(container)).toBeDisabled(); // disablePicker alone (at the limit)

    const { container: container2 } = widget.render({
      properties: { enableMultiple: binding('{{false}}'), disabledState: binding('{{true}}') },
    });
    await waitFor(() => expect(browseButton(container2)).toBeDisabled()); // both sources now true

    // Use the CSA action, not a UI click: the clear button's own `disabled` prop is tied to
    // disabledState, so a real click would be inert while disabledState is true.
    await widget.act('clear');
    await waitFor(() => expect(files()).toHaveLength(0));

    // Break this catches: swapping the OR for an AND (`disabledState && disablePicker`) —
    // clearing disablePicker here must not re-enable the button while disabledState alone holds.
    expect(browseButton(container2)).toBeDisabled();
  });
});

describe('FileInput: events', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[FileInput-EVT-001] onFileSelected fires immediately on pick, before content is read or parsed', async () => {
    const { container } = widget.render({ events: setVariableOn(ID, 'onFileSelected') });
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });

    await widget.session.user.upload(hiddenInput(container), file);

    await waitFor(() => expect(eventSeen()).toBe('YES'));
  });

  test('[FileInput-EVT-002] onFileLoaded fires after processing completes, with the resulting file objects', async () => {
    const { container } = widget.render({ events: setVariableOn(ID, 'onFileLoaded') });
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });

    await widget.session.user.upload(hiddenInput(container), file);

    await waitFor(() => expect(eventSeen()).toBe('YES'));
    expect(files()).toHaveLength(1);
  });
});

describe('FileInput: accessibility attributes on the underlying file input', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[FileInput-A11Y-001] aria-required mirrors the mandatory setting', async () => {
    const { container } = widget.render({ validation: { enableValidation: binding('{{true}}') } });
    await screen.findByText('Attachment', { exact: false });
    expect(hiddenInput(container)).toHaveAttribute('aria-required', 'true');

    const { container: container2 } = widget.render({ validation: { enableValidation: binding('{{false}}') } });
    expect(hiddenInput(container2)).toHaveAttribute('aria-required', 'false');
  });

  test('[FileInput-A11Y-002] aria-labelledby points at the visible label span', async () => {
    const { container } = widget.render();
    await screen.findByText('Attachment', { exact: false });

    expect(hiddenInput(container)).toHaveAttribute('aria-labelledby', `${ID}-label`);
    expect(labelEl(container)).toHaveAttribute('id', `${ID}-label`);
  });

  test('[FileInput-A11Y-003] aria-busy reflects loadingState', async () => {
    const { container } = widget.render({ properties: { loadingState: binding('{{true}}') } });
    await waitFor(() => expect(hiddenInput(container)).toHaveAttribute('aria-busy', 'true'));

    const { container: container2 } = widget.render({ properties: { loadingState: binding('{{false}}') } });
    await waitFor(() => expect(hiddenInput(container2)).toHaveAttribute('aria-busy', 'false'));
  });
});

describe('FileInput: styling', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[FileInput-STYLE-002] backgroundColor falls back based on disabled/loading state when left at its literal default; an explicit backgroundColor overrides', async () => {
    const { container: c1 } = widget.render({ styles: { backgroundColor: binding('#fff') } });
    await screen.findByText('Attachment', { exact: false });
    expect(fieldBox(c1)).toHaveStyle({ backgroundColor: 'var(--surfaces-surface-01)' });

    const { container: c2 } = widget.render({
      styles: { backgroundColor: binding('#fff') },
      properties: { disabledState: binding('{{true}}') },
    });
    // Break this catches: dropping the disabledState/isLoading branch and always returning
    // 'var(--surfaces-surface-01)' regardless of state.
    expect(fieldBox(c2)).toHaveStyle({ backgroundColor: 'var(--surfaces-surface-03)' });

    const { container: c3 } = widget.render({
      styles: { backgroundColor: binding('#00aa00') },
      properties: { disabledState: binding('{{true}}') },
    });
    expect(fieldBox(c3)).toHaveStyle({ backgroundColor: '#00aa00' });
  });

  test('[FileInput-STYLE-003] borderColor falls back based on error/disabled state when left at its literal default; an explicit borderColor overrides', async () => {
    const { container: c1 } = widget.render({
      validation: { fileType: binding('image/png') },
      styles: { errTextColor: binding('#ff00ff') },
    });
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });
    dropFiles(hiddenInput(c1), file);
    await waitFor(() => expect(fieldBox(c1)).toHaveStyle({ borderColor: '#ff00ff' }));

    const { container: c2 } = widget.render({
      styles: { borderColor: binding('#CCD1D5') },
      properties: { disabledState: binding('{{true}}') },
    });
    await screen.findByText('Attachment', { exact: false });
    expect(fieldBox(c2)).toHaveStyle({ borderColor: 'var(--borders-disabled-on-white)' });

    const { container: c3 } = widget.render({ styles: { borderColor: binding('#CCD1D5') } });
    expect(fieldBox(c3)).toHaveStyle({ borderColor: 'var(--borders-default)' });

    const { container: c4 } = widget.render({
      styles: { borderColor: binding('#123456') },
      properties: { disabledState: binding('{{true}}') },
    });
    expect(fieldBox(c4)).toHaveStyle({ borderColor: '#123456' });
  });

  test('[FileInput-STYLE-004] textColor falls back to disabled/default text color when left at its literal default; an explicit textColor overrides', async () => {
    const { container: c1 } = widget.render({ styles: { textColor: binding('#1B1F24') } });
    await screen.findByText('Attachment', { exact: false });
    expect(fieldBox(c1)).toHaveStyle({ color: 'var(--text-primary)' });

    const { container: c2 } = widget.render({
      styles: { textColor: binding('#1B1F24') },
      properties: { disabledState: binding('{{true}}') },
    });
    expect(fieldBox(c2)).toHaveStyle({ color: 'var(--text-disabled)' });

    const { container: c3 } = widget.render({
      styles: { textColor: binding('#654321') },
      properties: { disabledState: binding('{{true}}') },
    });
    expect(fieldBox(c3)).toHaveStyle({ color: '#654321' });
  });

  test('[FileInput-STYLE-005] errTextColor renders the validation error text and drives the field border color while an error is present', async () => {
    const { container } = widget.render({
      validation: { fileType: binding('image/png') },
      styles: { errTextColor: binding('#ff00ff') },
    });
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });
    dropFiles(hiddenInput(container), file);

    await waitFor(() => expect(invalidFeedback(container)).toBeInTheDocument());
    expect(invalidFeedback(container)).toHaveStyle({ color: '#ff00ff' });
    expect(fieldBox(container)).toHaveStyle({ borderColor: '#ff00ff' });
  });

  test('[FileInput-STYLE-006] padding "none" has no effect on the field height (per D-03, characterized as-is)', async () => {
    // D-03: FileInput.jsx computes a padding-aware `inputElementHeight` but never applies it —
    // the field's inline height is hardcoded to '100%' regardless of `styles.padding`. Characterized
    // here as the current shipped behavior, not fixed.
    const { container } = widget.render({ styles: { padding: binding('none') } });
    await screen.findByText('Attachment', { exact: false });

    expect(fieldBox(container)).toHaveStyle({ height: '100%' });
  });

  test('[FileInput-STYLE-007] padding "default" also renders the field at 100% height, identical to "none"', async () => {
    const { container } = widget.render({ styles: { padding: binding('default') } });
    await screen.findByText('Attachment', { exact: false });

    expect(fieldBox(container)).toHaveStyle({ height: '100%' });
  });
});
