/**
 * UI 2.0 File upload: a dropzone (react-dropzone) that reads files the native File picker's way.
 *
 * Real store, real RenderWidget, real widget; nothing about the widget is mocked. Standard control behaviour
 * (visibility, disabled, loading, tooltip) is covered for every UI 2.0 widget in Ui2/__tests__/controlState.spec.jsx;
 * this file covers what the File upload itself does. Titles carry [ShadFileUpload-<AREA>-<NNN>] scenario ids.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, screen, waitFor, fireEvent } from '@testing-library/react';
import { binding, setVariableOn, countInvocationsOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'upload1';
const widget = createWidgetHarness({
  componentType: 'ShadFileUpload',
  handle: 'fileupload1',
  id: ID,
  widgetHeight: 200,
  widgetWidth: 360,
  defaultProperties: {
    label: binding('Attachments'),
    // Any file type: the registered default accepts images and PDFs only.
    accept: binding(''),
  },
});

// Interactions are tested as an app user meets them: in view mode, where the editor's canvas does not take presses.
const render = (options = {}) => widget.render({ currentMode: 'view', ...options });
const exposed = () => widget.exposed() ?? {};
const textFile = (name, content, type = 'text/plain') => new File([content], name, { type });
/** Drops files on the dropzone's file input, as the browser's file dialog does. */
const upload = async (container, ...files) => {
  await act(async () => {
    fireEvent.change(container.querySelector('input[type=file]'), { target: { files } });
  });
};

describe('UI 2.0 File upload', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadFileUpload-DEF-001] shows the label, help text, title and a hint built from the limits', async () => {
    render({
      properties: {
        description: binding('Receipts for this claim'),
        accept: binding('image/*,application/pdf'),
        maxSize: binding('{{5242880}}'),
        maxFiles: binding('{{5}}'),
      },
    });

    expect(await screen.findByText('Attachments')).toBeInTheDocument();
    expect(screen.getByText('Receipts for this claim')).toBeInTheDocument();
    expect(screen.getByText('Drag & drop files here')).toBeInTheDocument();
    expect(screen.getByText(/up to 5 MB · max 5 files/)).toBeInTheDocument();
    await waitFor(() => expect(exposed().file).toEqual([]));
    expect(exposed()).toMatchObject({ fileSize: 0, isParsing: false, label: 'Attachments' });
  });

  test('[ShadFileUpload-PROP-001] title and hint replace the dropzone text', async () => {
    render({ properties: { title: binding('Drop receipts'), hint: binding('PNG or PDF, one per expense') } });

    expect(await screen.findByText('Drop receipts')).toBeInTheDocument();
    expect(screen.getByText('PNG or PDF, one per expense')).toBeInTheDocument();
  });

  test('[ShadFileUpload-EVT-001] a dropped file is read like the native file picker and fires onFileSelected then onFileLoaded', async () => {
    const { container } = render();
    widget.setEvents([
      ...setVariableOn(ID, 'onFileSelected', { key: 'size', value: '{{components.fileupload1.fileSize}}' }),
      ...setVariableOn(ID, 'onFileLoaded', { key: 'name', value: '{{components.fileupload1.file[0].name}}' }),
    ]);

    await upload(container, textFile('notes.txt', 'hello world'));

    await waitFor(() => expect(widget.variables().name).toBe('notes.txt'));
    expect(widget.variables().size).toBe(11);
    const [file] = exposed().file;
    expect(file).toMatchObject({ name: 'notes.txt', type: 'text/plain', size: 11 });
    expect(String(file.content)).toBe('hello world');
    expect(String(file.base64Data)).toBe(btoa('hello world'));
    expect(String(file.dataURL)).toMatch(/^data:text\/plain;base64,/);
    expect(screen.getByText('notes.txt')).toBeInTheDocument();
  });

  test('[ShadFileUpload-EVT-002] removing a file empties the list and fires onFileDeselected', async () => {
    const { container } = render();
    widget.setEvents(countInvocationsOn(ID, 'onFileDeselected'));
    await upload(container, textFile('notes.txt', 'hello world'));
    await waitFor(() => expect(exposed().file).toHaveLength(1));

    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Remove notes.txt' })));

    await waitFor(() => expect(widget.variables().calls).toBe(1));
    expect(exposed().file).toEqual([]);
    expect(exposed().fileSize).toBe(0);
  });

  test('[ShadFileUpload-PROP-002] accept refuses other file types with a message', async () => {
    const { container } = render({ properties: { accept: binding('image/*') } });

    await upload(container, textFile('a.txt', 'x'));

    expect(await screen.findByRole('alert')).toHaveTextContent('"a.txt" is not an accepted file type');
    expect(exposed().file).toEqual([]);
  });

  test('[ShadFileUpload-PROP-003] maxSize and minSize refuse files outside the limits', async () => {
    const { container } = render({ properties: { maxSize: binding('{{5}}') } });
    await upload(container, textFile('big.txt', 'more than five bytes'));
    expect(await screen.findByRole('alert')).toHaveTextContent('"big.txt" is larger than 5 B');

    render({ properties: { maxSize: binding('{{0}}'), minSize: binding('{{1000}}') } });
    await upload(container, textFile('tiny.txt', 'x'));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('"tiny.txt" is smaller than 1000 B'));
    expect(exposed().file).toEqual([]);
  });

  test('[ShadFileUpload-PROP-004] maxFiles keeps to the limit, says so, and closes the dropzone', async () => {
    const { container } = render({ properties: { maxFiles: binding('{{1}}') } });

    await upload(container, textFile('a.txt', 'a'), textFile('b.txt', 'b'));

    await waitFor(() => expect(exposed().file).toHaveLength(1));
    expect(screen.getByRole('alert')).toHaveTextContent('You can upload up to 1 file');
    expect(screen.getByText('Limit of 1 file reached')).toBeInTheDocument();
  });

  test('[ShadFileUpload-PROP-005] multiple off keeps one file, the newest replacing the last', async () => {
    const { container } = render({ properties: { multiple: binding('{{false}}') } });

    await upload(container, textFile('first.txt', '1'));
    await waitFor(() => expect(exposed().file).toHaveLength(1));
    await upload(container, textFile('second.txt', '22'));

    await waitFor(() => expect(exposed().file[0].name).toBe('second.txt'));
    expect(exposed().file).toHaveLength(1);
    expect(screen.queryByText('first.txt')).toBeNull();
  });

  test('[ShadFileUpload-PROP-006] showPreview draws an image thumbnail; off, the file-type icon instead', async () => {
    const { container } = render();
    await upload(container, textFile('dot.png', 'png', 'image/png'));
    await waitFor(() => expect(container.querySelector('li img')).toBeTruthy());

    render({ properties: { showPreview: binding('{{false}}') } });
    await waitFor(() => expect(container.querySelector('li img')).toBeNull());
    expect(screen.getByText('dot.png')).toBeInTheDocument();
  });

  test('[ShadFileUpload-PROP-007] parseContent parses a CSV into rows; off, the file is not parsed', async () => {
    const { container } = render();
    await upload(container, textFile('items.csv', 'name,qty\nTea,2', 'text/csv'));
    await waitFor(() => expect(exposed().file).toHaveLength(1));
    expect(exposed().file[0].parsedData).toBeNull();

    render({ properties: { parseContent: binding('{{true}}') } });
    await upload(container, textFile('more.csv', 'name,qty\nCoffee,3', 'text/csv'));
    await waitFor(() => expect(exposed().file).toHaveLength(2));
    expect(exposed().file[1].parsedData).toEqual([{ name: 'Coffee', qty: '3' }]);
    expect(exposed().isParsing).toBe(false);
  });

  test('[ShadFileUpload-PROP-008] parseFileType csv parses with the delimiter given, and json leaves a CSV unparsed', async () => {
    const { container } = render({
      properties: { parseContent: binding('{{true}}'), parseFileType: binding('csv'), delimiter: binding(';') },
    });
    await upload(container, textFile('items.csv', 'name;qty\nTea;2', 'text/csv'));
    await waitFor(() => expect(exposed().file).toHaveLength(1));
    expect(exposed().file[0].parsedData).toEqual([{ name: 'Tea', qty: '2' }]);

    render({ properties: { parseContent: binding('{{true}}'), parseFileType: binding('json') } });
    await upload(container, textFile('people.csv', 'name,age\nAda,36', 'text/csv'));
    await waitFor(() => expect(exposed().file).toHaveLength(2));
    expect(exposed().file[1].parsedData).toBeNull();
  });

  // As on the native File picker, the delimiter is offered (and applies) when the file is parsed as CSV; under
  // auto-detect a .csv is read with commas.
  test('[ShadFileUpload-PROP-009] delimiter applies when the file is parsed as CSV', async () => {
    const { container } = render({
      properties: { parseContent: binding('{{true}}'), parseFileType: binding('csv'), delimiter: binding(';') },
    });

    await upload(container, textFile('items.csv', 'name;qty\nTea;2', 'text/csv'));

    await waitFor(() => expect(exposed().file).toHaveLength(1));
    expect(exposed().file[0].parsedData).toEqual([{ name: 'Tea', qty: '2' }]);
  });

  test('[ShadFileUpload-ACT-001] setFileName renames a file and keeps its extension; clearFiles empties the list', async () => {
    const { container } = render();
    await upload(container, textFile('notes.txt', 'hello'));
    await waitFor(() => expect(exposed().file).toHaveLength(1));

    await widget.act('setFileName', 0, 'renamed');
    await waitFor(() => expect(exposed().file[0].name).toBe('renamed.txt'));
    expect(screen.getByText('renamed.txt')).toBeInTheDocument();

    await widget.act('clearFiles');
    await waitFor(() => expect(exposed().file).toEqual([]));
    expect(screen.queryByText('renamed.txt')).toBeNull();
  });

  test('[ShadFileUpload-VAL-001] a mandatory upload is invalid until a file is added', async () => {
    const { container } = render({ validation: { mandatory: binding('{{true}}') } });

    await waitFor(() => expect(exposed().isValid).toBe(false));
    expect(exposed().isMandatory).toBe(true);
    await upload(container, textFile('a.txt', 'a'));
    await waitFor(() => expect(exposed().isValid).toBe(true));
  });

  test('[ShadFileUpload-VAL-002] a customRule message makes the upload invalid and is shown', async () => {
    const { container } = render({
      validation: { customRule: binding("{{components.fileupload1.fileSize > 3 ? 'Keep it under 4 bytes' : ''}}") },
    });

    await upload(container, textFile('a.txt', 'too big'));

    await waitFor(() => expect(exposed().isValid).toBe(false));
    expect(await screen.findByText('Keep it under 4 bytes')).toBeInTheDocument();
  });

  test('[ShadFileUpload-STY-001] dropzone styles reach the widget as CSS variables', async () => {
    const { container } = render({
      styles: { dropzoneBackgroundColor: binding('#f0f9ff'), accentColor: binding('#e11d48') },
    });

    await screen.findByText('Drag & drop files here');
    const root = container.querySelector('.tj-shadcn');
    expect(root.style.getPropertyValue('--lk-drop-bg')).toBe('#f0f9ff');
    expect(root.style.getPropertyValue('--sc-primary')).toBe('#e11d48');
  });

  test('[ShadFileUpload-STY-010] the selected files list scrolls past about five files', async () => {
    // With many files the list was drawn whole and took over the page below the widget (Dynamic height on).
    const { container } = render({ properties: { multiple: binding('{{true}}'), maxFiles: binding('{{20}}') } });
    await upload(container, ...Array.from({ length: 8 }, (_, i) => textFile(`notes-${i}.txt`, 'x')));
    const list = await screen.findByRole('list', { name: 'Selected files' });
    await waitFor(() => expect(list.querySelectorAll('li')).toHaveLength(8));
    expect(list).toHaveClass('tw-max-h-[296px]', 'tw-overflow-y-auto');
  });

  test('[ShadFileUpload-ACT-020] Clear all, shown for two or more files, clears them as clearFiles does', async () => {
    // A user could only remove files one by one.
    const { container } = render({ properties: { multiple: binding('{{true}}') } });
    widget.setEvents(countInvocationsOn(ID, 'onFileDeselected'));
    await upload(container, textFile('a.txt', 'a'));
    await waitFor(() => expect(exposed().file).toHaveLength(1));
    expect(screen.queryByRole('button', { name: 'Clear all' })).toBeNull();

    await upload(container, textFile('b.txt', 'b'));
    await waitFor(() => expect(exposed().file).toHaveLength(2));
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Clear all' })));
    await waitFor(() => expect(exposed().file).toEqual([]));
    // One onFileDeselected, as the clearFiles action fires.
    await waitFor(() => expect(widget.variables().calls).toBe(1));
    expect(screen.queryByRole('button', { name: 'Clear all' })).toBeNull();
  });
});
