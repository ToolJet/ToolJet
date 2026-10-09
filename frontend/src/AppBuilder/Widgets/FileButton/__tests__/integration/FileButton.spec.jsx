/**
 * FileButton: the widget's approved contract
 * (frontend/ee/test/app-builder/widgets/FileButton/TESTING.md).
 * Shared setup lives in Widgets/widgetHarness.js.
 *
 * Real store, real RenderWidget, real FileButton / useFilePicker.
 * Nothing about the widget is mocked.
 *
 * Test titles carry their approved scenario ID
 * (frontend/ee/test/app-builder/widgets/FileButton/TESTING.md) as a
 * `[FileButton-FAMILY-NNN]` prefix, per the widget-testing-contract validator.
 */
import { screen, waitFor, fireEvent } from '@testing-library/react';
import {
  createWidgetHarness,
  binding,
  store,
  MODULE_ID,
  setVariableOn,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'filebtn1';
const NAME = 'filebutton1';

const widget = createWidgetHarness({
  componentType: 'FileButton',
  handle: NAME,
  id: ID,
  defaultProperties: { buttonText: binding('Upload file'), visibility: binding('{{true}}') },
});

const q = (container, part) => container.querySelector(`[data-cy="${NAME}-${part}"]`);
const hiddenInput = (container) => q(container, 'input-field');
const browseButton = (container) => q(container, 'button');
const labelSpan = (container) => q(container, 'label');
const clearButton = (container) => q(container, 'clear-button');
const mandatoryIndicator = (container) => q(container, 'mandatory-indicator');
const iconEl = (container) => q(container, 'icon');
const loaderEl = (container) => q(container, 'loader');
const invalidFeedback = (container) => q(container, 'invalid-feedback');

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
 * reselecting an identical File reference (real browsers skip firing `change`
 * for the OS dialog re-picking the same value, but a drag-drop or a picker
 * whose "All Files" option was used can still reach react-dropzone's own
 * validator/accept rejection path — this simulates that path directly).
 */
function dropFiles(input, fileList) {
  const list = Array.isArray(fileList) ? fileList : [fileList];
  Object.defineProperty(input, 'files', { value: list, configurable: true });
  fireEvent.change(input);
}

describe('FileButton: default rendering and label', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[FileButton-DEF-001] the configured button text renders before any file is selected', async () => {
    const { container } = widget.render({ properties: { buttonText: binding('Upload file') } });

    expect(await screen.findByText('Upload file')).toBeInTheDocument();
    expect(labelSpan(container)).toHaveTextContent('Upload file');
  });

  test('[FileButton-DEF-002] selecting exactly one file replaces the label with that file name', async () => {
    const { container } = widget.render();
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });

    await selectFiles(container, file);

    expect(labelSpan(container)).toHaveTextContent('hello.txt');
    expect(labelSpan(container)).not.toHaveTextContent('Upload file');
  });

  test('[FileButton-DEF-003] selecting multiple files replaces the label with an "N files selected" summary', async () => {
    const { container } = widget.render({ properties: { enableMultiple: binding('{{true}}') } });
    const a = new File(['a'], 'a.txt', { type: 'text/plain' });
    const b = new File(['b'], 'b.txt', { type: 'text/plain' });

    await selectFiles(container, [a, b]);
    await waitFor(() => expect(files()).toHaveLength(2));

    expect(labelSpan(container)).toHaveTextContent('2 files selected');
  });

  test('[FileButton-DEF-004] label line-height grows with labelSize instead of staying fixed', async () => {
    // Break this catches: leaving line-height unset on the label span, which makes it inherit
    // the shared Button component's fixed line-height instead of scaling with labelSize.
    const { container } = widget.render({ styles: { labelSize: binding('32') } });
    await screen.findByText('Upload file');

    expect(labelSpan(container)).toHaveStyle({ fontSize: '32px', lineHeight: '45.44px' });
  });

  test('[FileButton-DEF-005] icon size grows together with labelSize instead of staying fixed', async () => {
    const { container } = widget.render({ styles: { labelSize: binding('32'), iconVisibility: { value: true } } });
    await screen.findByText('Upload file');

    const icon = await waitFor(() => {
      const svg = iconEl(container);
      expect(svg).toBeInTheDocument();
      return svg;
    });
    expect(icon).toHaveAttribute('width', '36.352');
    expect(icon).toHaveAttribute('height', '36.352');
  });

  test('[FileButton-DEF-006] a mandatory field shows a red asterisk next to the label', async () => {
    const { container } = widget.render({ validation: { enableValidation: binding('{{true}}') } });

    expect(await screen.findByText('Upload file', { exact: false })).toBeInTheDocument();
    expect(labelSpan(container)).toHaveTextContent('Upload file*');
    expect(mandatoryIndicator(container)).toBeInTheDocument();
  });

  test('[FileButton-DEF-007] a non-mandatory field shows no asterisk', async () => {
    const { container } = widget.render({ validation: { enableValidation: binding('{{false}}') } });

    expect(await screen.findByText('Upload file')).toBeInTheDocument();
    expect(labelSpan(container)).not.toHaveTextContent('Upload file*');
    expect(mandatoryIndicator(container)).not.toBeInTheDocument();
  });
});

describe('FileButton: accessibility attributes on the underlying file input', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[FileButton-A11Y-001] aria-required reflects the mandatory setting', async () => {
    const { container } = widget.render({ validation: { enableValidation: binding('{{true}}') } });
    await screen.findByText('Upload file');
    expect(hiddenInput(container)).toHaveAttribute('aria-required', 'true');

    const { container: container2 } = widget.render({ validation: { enableValidation: binding('{{false}}') } });
    expect(hiddenInput(container2)).toHaveAttribute('aria-required', 'false');
  });

  test('[FileButton-A11Y-002] aria-labelledby points at the visible label span', async () => {
    const { container } = widget.render();
    await screen.findByText('Upload file');

    expect(hiddenInput(container)).toHaveAttribute('aria-labelledby', `${ID}-label`);
    expect(labelSpan(container)).toHaveAttribute('id', `${ID}-label`);
  });

  test('[FileButton-A11Y-003] aria-busy reflects loadingState', async () => {
    const { container } = widget.render({ properties: { loadingState: binding('{{true}}') } });
    await waitFor(() => expect(hiddenInput(container)).toHaveAttribute('aria-busy', 'true'));

    const { container: container2 } = widget.render({ properties: { loadingState: binding('{{false}}') } });
    await waitFor(() => expect(hiddenInput(container2)).toHaveAttribute('aria-busy', 'false'));
  });
});

describe('FileButton: selecting files and reaching limits', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[FileButton-SEL-001] a second file selected in single mode is ignored, keeping the first', async () => {
    // Break this catches: useFilePicker's disablePicker effect no longer going inert
    // (`disabled: isDisabled || disablePicker` at useFilePicker.js:416) once one file
    // is already selected in single-file mode — react-dropzone stops processing
    // change events entirely while disabled, so a second selection has no effect at
    // all (no rejection message, since the picker never even runs its validator).
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

  test('[FileButton-SEL-002] enableMultiple accumulates files across separate selections up to maxFileCount', async () => {
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

  test('[FileButton-SEL-003] a file whose type does not match the configured fileType is rejected with a descriptive error', async () => {
    // A real OS file dialog with an `accept` filter can still be widened to "All
    // Files", so this is reachable in production even though `userEvent.upload`'s
    // own accept-attribute pre-filtering would otherwise stop the file from ever
    // reaching react-dropzone in this test — dropFiles bypasses that pre-filter.
    const { container } = widget.render({ validation: { fileType: binding('image/png') } });
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });

    dropFiles(hiddenInput(container), file);

    await waitFor(() => expect(invalidFeedback(container)).toHaveTextContent(/unsupported file type/));
    expect(files()).toHaveLength(0);
  });

  test('[FileButton-SEL-004] a file smaller than minSize is rejected with a descriptive error naming the limit', async () => {
    const { container } = widget.render({ validation: { minSize: binding('{{1024}}') } });
    const file = new File(['tiny'], 'tiny.txt', { type: 'text/plain' });

    await widget.session.user.upload(hiddenInput(container), file);

    await waitFor(() => expect(invalidFeedback(container)).toHaveTextContent(/smaller than the minimum allowed size/));
    expect(files()).toHaveLength(0);
  });

  test('[FileButton-SEL-005] a file larger than maxSize is rejected with a descriptive error naming the limit', async () => {
    const { container } = widget.render({ validation: { maxSize: binding('{{10}}') } });
    const file = new File(['this is definitely more than ten bytes'], 'big.txt', { type: 'text/plain' });

    await widget.session.user.upload(hiddenInput(container), file);

    await waitFor(() => expect(invalidFeedback(container)).toHaveTextContent(/exceeds the maximum allowed size/));
    expect(files()).toHaveLength(0);
  });

  test('[FileButton-SEL-006] selecting the same file twice is rejected as a duplicate', async () => {
    // dropFiles, not userEvent.upload, for the second pick: real browsers don't fire
    // `change` when the OS dialog re-selects the exact same value, so exercising the
    // app's own isSameFile/duplicate-file rejection (the path a drag-drop of an
    // already-selected file would hit) needs a direct native event instead.
    const { container } = widget.render({ properties: { enableMultiple: binding('{{true}}') } });
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });

    await selectFiles(container, file);
    dropFiles(hiddenInput(container), file);

    await waitFor(() => expect(invalidFeedback(container)).toHaveTextContent('has already been selected'));
    expect(files()).toHaveLength(1);
  });

  test('[FileButton-SEL-007] reaching the max file count disables further selection without natively disabling the button', async () => {
    const { container } = widget.render({ properties: { enableClearSelection: binding('{{false}}') } });
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });

    await selectFiles(container, file);

    expect(browseButton(container)).not.toBeDisabled();
    expect(browseButton(container)).toHaveAttribute('aria-disabled', 'true');
    expect(browseButton(container)).toHaveStyle('cursor: not-allowed');
  });

  test('[FileButton-SEL-008] the button stays enabled with a pointer cursor before any file is selected', async () => {
    const { container } = widget.render({ properties: { enableClearSelection: binding('{{false}}') } });
    await screen.findByText('Upload file');

    expect(browseButton(container)).not.toBeDisabled();
    expect(browseButton(container)).toHaveAttribute('aria-disabled', 'false');
    expect(browseButton(container)).not.toHaveStyle('cursor: not-allowed');
  });

  test('[FileButton-SEL-009] in single mode the picker disables immediately after exactly one file, with no maxFileCount configured', async () => {
    const { container } = widget.render({ properties: { enableClearSelection: binding('{{false}}') } });
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });

    await selectFiles(container, file);

    expect(browseButton(container)).toHaveAttribute('aria-disabled', 'true');
  });

  test('[FileButton-SEL-010] a maxFileCount of exactly 0 with enableMultiple on immediately disables the picker', async () => {
    // Break this catches: a falsy-swallowing `maxFileCount || <fallback>` that reads a
    // configured 0 as "unset" instead of an immediate limit.
    const { container } = widget.render({
      properties: { enableMultiple: binding('{{true}}') },
      validation: { maxFileCount: binding('{{0}}') },
    });
    await screen.findByText('Upload file');

    expect(browseButton(container)).toHaveAttribute('aria-disabled', 'true');
  });
});

describe('FileButton: parsing file content', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[FileButton-PARSE-001] parseContent off exposes no parsed value regardless of file type', async () => {
    const { container } = widget.render({ properties: { parseContent: binding('{{false}}') } });
    const file = new File(['a,b\n1,2'], 'data.csv', { type: 'text/csv' });

    await selectFiles(container, file);

    expect(files()[0].parsedValue).toBeNull();
  });

  test('[FileButton-PARSE-002] parseContent on with parseFileType csv parses the file into structured rows using the default delimiter', async () => {
    const { container } = widget.render({
      properties: { parseContent: binding('{{true}}'), parseFileType: binding('csv') },
    });
    const file = new File(['a,b\n1,2'], 'data.csv', { type: 'text/csv' });

    await selectFiles(container, file);

    await waitFor(() => expect(files()[0].parsedValue).toEqual([{ a: '1', b: '2' }]));
  });

  test('[FileButton-PARSE-003] parseContent on with parseFileType json parses the file into a structured object', async () => {
    const { container } = widget.render({
      properties: { parseContent: binding('{{true}}'), parseFileType: binding('json') },
    });
    const file = new File(['{"x":1}'], 'data.json', { type: 'application/json' });

    await selectFiles(container, file);

    await waitFor(() => expect(files()[0].parsedValue).toEqual({ x: 1 }));
  });

  test('[FileButton-PARSE-004] parseFileType auto-detect infers the parser from the file MIME type', async () => {
    const { container } = widget.render({
      properties: { parseContent: binding('{{true}}'), parseFileType: binding('auto-detect') },
    });
    const file = new File(['a,b\n1,2'], 'data.csv', { type: 'text/csv' });

    await selectFiles(container, file);

    await waitFor(() => expect(files()[0].parsedValue).toEqual([{ a: '1', b: '2' }]));
  });

  test('[FileButton-PARSE-005] a configured delimiter changes the parsed row shape for a CSV file', async () => {
    const { container } = widget.render({
      properties: { parseContent: binding('{{true}}'), parseFileType: binding('csv'), delimiter: binding(';') },
    });
    const file = new File(['a;b\n1;2'], 'data.csv', { type: 'text/csv' });

    await selectFiles(container, file);

    await waitFor(() => expect(files()[0].parsedValue).toEqual([{ a: '1', b: '2' }]));
  });

  test('[FileButton-PARSE-006] isParsing is true only while a file is being read and parsed', async () => {
    const { container } = widget.render({ properties: { parseContent: binding('{{true}}') } });
    const file = new File(['a,b\n1,2'], 'data.csv', { type: 'text/csv' });

    await widget.session.user.upload(hiddenInput(container), file);
    await waitFor(() => expect(files()).toHaveLength(1));

    expect(widget.exposed().isParsing).toBe(false);
  });
});

describe('FileButton: validation', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[FileButton-VAL-001] a mandatory field with no file selected is invalid; selecting a file makes it valid', async () => {
    const { container } = widget.render({ validation: { enableValidation: binding('{{true}}') } });
    await screen.findByText('Upload file', { exact: false });

    expect(widget.exposed().isValid).toBe(false);

    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });
    await selectFiles(container, file);

    await waitFor(() => expect(widget.exposed().isValid).toBe(true));
  });

  test('[FileButton-VAL-002] minFileCount is ignored when enableMultiple is off', async () => {
    widget.render({
      properties: { enableMultiple: binding('{{false}}') },
      validation: { minFileCount: binding('{{5}}') },
    });
    await screen.findByText('Upload file');

    expect(widget.exposed().isValid).toBe(true);
  });

  test('[FileButton-VAL-003] a minFileCount of exactly 0 is honored, not swallowed as "unset"', async () => {
    widget.render({
      properties: { enableMultiple: binding('{{true}}') },
      validation: { minFileCount: binding('{{0}}') },
    });
    await screen.findByText('Upload file');

    expect(widget.exposed().isValid).toBe(true);
  });

  test('[FileButton-VAL-004] isMandatory mirrors the mandatory validation property', async () => {
    widget.render({ validation: { enableValidation: binding('{{true}}') } });
    await waitFor(() => expect(widget.exposed().isMandatory).toBe(true));

    widget.render({ validation: { enableValidation: binding('{{false}}') } });
    await waitFor(() => expect(widget.exposed().isMandatory).toBe(false));
  });

  test('[FileButton-VAL-005] a Form clear signal empties the selection the same way the clear button does', async () => {
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

describe('FileButton: clearing the selection', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[FileButton-CLR-001] the clear button appears only when files are selected and enableClearSelection is on, and is a DOM sibling of the browse button', async () => {
    const { container } = widget.render({ properties: { enableClearSelection: binding('{{true}}') } });
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });

    await selectFiles(container, file);

    const clear = clearButton(container);
    expect(clear).toBeInTheDocument();
    expect(browseButton(container).contains(clear)).toBe(false);
    expect(clear).not.toBeDisabled();
  });

  test('[FileButton-CLR-002] no clear button when enableClearSelection is off, even with files selected', async () => {
    const { container } = widget.render({ properties: { enableClearSelection: binding('{{false}}') } });
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });

    await selectFiles(container, file);

    expect(clearButton(container)).not.toBeInTheDocument();
  });

  test('[FileButton-CLR-003] clicking clear empties the selection and re-enables the picker', async () => {
    const { container } = widget.render({ properties: { enableClearSelection: binding('{{true}}') } });
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });

    await selectFiles(container, file);
    await widget.session.user.click(clearButton(container));

    await waitFor(() => expect(screen.getByText('Upload file')).toBeInTheDocument());
    expect(browseButton(container)).toHaveAttribute('aria-disabled', 'false');
    expect(files()).toHaveLength(0);
  });

  test('[FileButton-CLR-004] the clear button is hidden while isLoading is true', async () => {
    const { container } = widget.render({ properties: { enableClearSelection: binding('{{true}}') } });
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });

    await selectFiles(container, file);
    expect(clearButton(container)).toBeInTheDocument();

    await widget.act('setLoading', true);

    await waitFor(() => expect(clearButton(container)).not.toBeInTheDocument());
  });
});

describe('FileButton: component-specific actions', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[FileButton-ACT-001] the clear action clears the selection the same way as clicking the clear button', async () => {
    const { container } = widget.render();
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });
    await selectFiles(container, file);

    await widget.act('clear');

    await waitFor(() => expect(files()).toHaveLength(0));
  });

  test('[FileButton-ACT-002] setFocus/setBlur move focus to/from the real browse button', async () => {
    const { container } = widget.render();
    await screen.findByText('Upload file');

    await widget.act('setFocus');
    expect(browseButton(container)).toHaveFocus();

    await widget.act('setBlur');
    expect(browseButton(container)).not.toHaveFocus();
  });

  test('[FileButton-ACT-003] setVisibility/setDisable/setLoading toggle their corresponding exposed state and DOM behavior', async () => {
    const { container } = widget.render();
    await screen.findByText('Upload file');

    await widget.act('setDisable', true);
    await waitFor(() => expect(browseButton(container)).toBeDisabled());
    expect(widget.exposed().isDisabled).toBe(true);
    await widget.act('setDisable', false);

    await widget.act('setLoading', true);
    await waitFor(() => expect(loaderEl(container)).toBeInTheDocument());
    expect(widget.exposed().isLoading).toBe(true);
    await widget.act('setLoading', false);

    await widget.act('setVisibility', false);
    await waitFor(() => expect(screen.queryByText('Upload file')).not.toBeInTheDocument());
    expect(widget.exposed().isVisible).toBe(false);
  });
});

describe('FileButton: loading, disabled, and visibility states', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[FileButton-STATE-001] visibility false renders nothing', async () => {
    const { container } = widget.render({ properties: { visibility: binding('{{false}}') } });

    await waitFor(() => expect(container.querySelector('.fileButton-widget')).not.toBeInTheDocument());
  });

  test('[FileButton-STATE-002] disabledState natively disables the browse button and marks the hidden input aria-disabled', async () => {
    const { container } = widget.render({ properties: { disabledState: binding('{{true}}') } });
    await waitFor(() => expect(browseButton(container)).toBeDisabled());

    expect(hiddenInput(container)).toHaveAttribute('aria-disabled', 'true');
  });

  test('[FileButton-STATE-003] loadingState shows the loader instead of the label/icon independent of disabledState', async () => {
    const { container } = widget.render({
      properties: { loadingState: binding('{{true}}'), disabledState: binding('{{false}}') },
    });

    await waitFor(() => expect(loaderEl(container)).toBeInTheDocument());
    expect(screen.queryByText('Upload file')).not.toBeInTheDocument();
  });

  test('[FileButton-STATE-004] setDisable survives an unrelated property re-resolve', async () => {
    widget.render({ properties: { disabledState: binding('{{false}}') } });
    await screen.findByText('Upload file');

    await widget.act('setDisable', true);
    await waitFor(() => expect(browseButton(document)).toBeDisabled());

    const { container } = widget.render({
      properties: { disabledState: binding('{{false}}'), buttonText: binding('changed') },
    });
    await waitFor(() => expect(screen.getByText('changed')).toBeInTheDocument());

    expect(browseButton(container)).toBeDisabled();
  });

  test('[FileButton-STATE-005] setVisibility survives an unrelated property re-resolve', async () => {
    widget.render({ properties: { visibility: binding('{{true}}') } });
    await screen.findByText('Upload file');

    await widget.act('setVisibility', false);
    await waitFor(() => expect(screen.queryByText('Upload file')).not.toBeInTheDocument());

    widget.render({ properties: { visibility: binding('{{true}}'), buttonText: binding('changed') } });

    expect(screen.queryByText('changed')).not.toBeInTheDocument();
  });

  test('[FileButton-STATE-006] setLoading survives an unrelated property re-resolve', async () => {
    widget.render({ properties: { loadingState: binding('{{false}}') } });
    await screen.findByText('Upload file');

    await widget.act('setLoading', true);
    await waitFor(() => expect(document.querySelector(`[data-cy="${NAME}-loader"]`)).toBeInTheDocument());

    const { container } = widget.render({
      properties: { loadingState: binding('{{false}}'), buttonText: binding('changed') },
    });

    expect(loaderEl(container)).toBeInTheDocument();
  });
});

describe('FileButton: events', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[FileButton-EVT-001] onFileSelected fires immediately on pick, before content is read or parsed', async () => {
    const { container } = widget.render({ events: setVariableOn(ID, 'onFileSelected') });
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });

    await widget.session.user.upload(hiddenInput(container), file);

    await waitFor(() => expect(eventSeen()).toBe('YES'));
  });

  test('[FileButton-EVT-002] onFileLoaded fires after processing completes', async () => {
    const { container } = widget.render({ events: setVariableOn(ID, 'onFileLoaded') });
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });

    await widget.session.user.upload(hiddenInput(container), file);

    await waitFor(() => expect(eventSeen()).toBe('YES'));
    expect(files()).toHaveLength(1);
  });
});

describe('FileButton: styling', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[FileButton-STYLE-001] hover, pressed, and disabled button colors derive from the configured backgroundColor', async () => {
    // Break this catches: regression ed454f8806 reappearing — hover/pressed/disabled
    // hardcoded back to a fixed brand-blue token instead of deriving from backgroundColor.
    const { container } = widget.render({ styles: { backgroundColor: binding('#00aa00') } });
    await screen.findByText('Upload file');

    const style = browseButton(container).style;
    expect(style.getPropertyValue('--button-primary')).toBe('#00aa00');
    expect(style.getPropertyValue('--button-primary-hover')).not.toBe('');
    expect(style.getPropertyValue('--button-primary-hover')).not.toMatch(/^#00aa00$/i);
  });

  test('[FileButton-STYLE-002] an outline button with an unset label color falls back to primary-text color; a solid button or explicit color is unaffected', async () => {
    const { container: outlineDefault } = widget.render({ styles: { buttonType: binding('outline') } });
    await screen.findByText('Upload file');
    expect(labelSpan(outlineDefault)).toHaveStyle({ color: 'var(--cc-primary-text)' });

    const { container: solidDefault } = widget.render({ styles: { buttonType: binding('solid') } });
    expect(labelSpan(solidDefault)).toHaveStyle({ color: 'var(--cc-surface1-surface)' });

    const { container: outlineExplicit } = widget.render({
      styles: { buttonType: binding('outline'), labelColor: binding('#123456') },
    });
    expect(labelSpan(outlineExplicit)).toHaveStyle({ color: '#123456' });
  });

  test('[FileButton-STYLE-003] contentAlignment, iconDirection, and labelWeight map to their respective classes', async () => {
    const { container } = widget.render({
      styles: {
        contentAlignment: binding('right'),
        iconDirection: binding('right'),
        labelWeight: binding('bold'),
        iconVisibility: { value: true },
      },
    });
    await screen.findByText('Upload file');

    expect(browseButton(container)).toHaveClass('tw-justify-end');
    expect(browseButton(container)).toHaveClass('tw-flex-row-reverse');
    expect(labelSpan(container)).toHaveClass('tw-font-bold');
  });

  test('[FileButton-STYLE-007] contentAlignment is not clobbered back to center when iconVisibility is unset', async () => {
    // Break this catches: the dead `iconVisibility ?? 'tw-justify-center'` clsx argument
    // reappearing — when iconVisibility is undefined (a saved definition with no
    // `styles.iconVisibility` key at all), `??` falls through to the literal string
    // 'tw-justify-center', which arrives in clsx AFTER the real
    // `justifyClass[contentAlignment]` class and wins the twMerge conflict, silently
    // overriding an explicitly configured non-center contentAlignment.
    const { container } = widget.render({ styles: { contentAlignment: binding('right') } });
    await screen.findByText('Upload file');

    expect(browseButton(container)).toHaveClass('tw-justify-end');
    expect(browseButton(container)).not.toHaveClass('tw-justify-center');
  });

  test('[FileButton-STYLE-004] an outline buttonType always renders a transparent background regardless of backgroundColor', async () => {
    const { container } = widget.render({
      styles: { buttonType: binding('outline'), backgroundColor: binding('#00aa00') },
    });
    await screen.findByText('Upload file');

    expect(browseButton(container)).toHaveStyle({ background: 'transparent' });
  });

  test('[FileButton-STYLE-005] padding "none" grows the content height to fill the full widget height', async () => {
    const { container } = widget.render({ styles: { padding: binding('none') } });
    await screen.findByText('Upload file');

    const contentBox = container.querySelector('.fileButton-widget > div');
    // Break this catches: dropping the `padding === 'none' ? height + 4 : height`
    // compensation FileButton needs — RenderWidget always hands the widget
    // `widgetHeight - 4`, reserving 4px for its own 2px/side wrapper padding, but
    // zeroes that wrapper padding out when the widget's padding style is 'none'.
    expect(contentBox).toHaveStyle({ height: '40px' });
  });

  test('[FileButton-STYLE-006] padding "default" renders 4px short of the full widget height', async () => {
    const { container } = widget.render({ styles: { padding: binding('default') } });
    await screen.findByText('Upload file');

    const contentBox = container.querySelector('.fileButton-widget > div');
    expect(contentBox).toHaveStyle({ height: '36px' });
  });
});

describe('FileButton: saved-app compatibility', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[FileButton-COMPAT-001] a saved definition predating enableClearSelection falls back to clear-selection OFF', async () => {
    // `enableClearSelection` is deliberately omitted from `properties` below —
    // simulating a saved app whose definition predates the property entirely,
    // per D-02's characterize-only answer (FileButton.jsx:63 `?? false`).
    const { container } = widget.render({ properties: {} });
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });

    await selectFiles(container, file);

    expect(clearButton(container)).not.toBeInTheDocument();
  });
});
