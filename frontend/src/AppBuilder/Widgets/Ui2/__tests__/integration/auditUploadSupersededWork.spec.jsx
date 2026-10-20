import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
// Release audit 016 (Codex fixtures currentUploadSupersededWorkSized016 and its pending-admission case, trimmed):
// with one file allowed, choosing a new file while the old one was still being read let the old read go on, its text
// read and, with Parse content on, its content parsed, before the result was thrown away. And drops made while
// earlier ones were still reading were let in against the files already listed only, so five quick drops with
// maxFiles 1 started five reads. A newer single-file choice now aborts the older read, and pending reads take their
// place against maxFiles when a drop is let in.
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { binding, countInvocationsOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { registrySize } from '@/AppBuilder/_utils/fileHandleRegistry';
import * as parser from '@/AppBuilder/Widgets/Ui2/FileUpload/fileParse';

const w = createWidgetHarness({
  componentType: 'ShadFileUpload',
  id: 'upload1',
  handle: 'upload1',
  widgetWidth: 440,
  widgetHeight: 220,
  defaultProperties: { accept: binding('') },
});
let baseline;
let held;
let textReads;
let parses;
let aborts;
const file = (name) => new File(['{"value":"audit"}'], name, { type: 'application/json', lastModified: 100 });
const names = () => w.exposed().file.map((f) => f.name);
const drop = (view, f) =>
  act(async () => fireEvent.change(view.container.querySelector('input[type=file]'), { target: { files: [f] } }));
// Lets a held data-URL read run for real, then waits for the rest of that file's work.
const finish = (name) =>
  act(async () => {
    const run = held.get(name);
    expect(run).toBeDefined();
    held.delete(name);
    run();
    await new Promise((r) => setTimeout(r, 30));
  });

beforeEach(async () => {
  await w.setup();
  baseline = registrySize();
  held = new Map();
  const read = FileReader.prototype.readAsDataURL;
  jest.spyOn(FileReader.prototype, 'readAsDataURL').mockImplementation(function hold(f) {
    held.set(f.name, () => read.call(this, f));
  });
  textReads = jest.spyOn(FileReader.prototype, 'readAsText');
  parses = jest.spyOn(parser, 'parseContent');
  aborts = jest.spyOn(FileReader.prototype, 'abort');
});
afterEach(() => {
  w.teardown();
  jest.restoreAllMocks();
  expect(registrySize()).toBe(baseline);
});

const cases = [false, true].flatMap((parse) => ['live', 'replaced'].map((mode) => [parse, mode]));
test.each(cases)('one file allowed, parse=%s, %s: only the chosen file is read and parsed', async (parse, mode) => {
  const view = w.render({
    currentMode: 'view',
    properties: { multiple: binding('{{false}}'), parseContent: binding(`{{${parse}}}`) },
  });
  w.setEvents(countInvocationsOn('upload1', 'onFileLoaded'));
  await drop(view, file('old.json'));
  const chosen = mode === 'replaced' ? 'new.json' : 'old.json';
  if (mode === 'replaced') {
    await drop(view, file('new.json'));
    // The old read is aborted as soon as the new file is chosen, not when it finishes.
    expect(aborts).toHaveBeenCalledTimes(1);
    await finish('new.json');
    await waitFor(() => expect(names()).toEqual(['new.json']));
  }
  await finish('old.json');
  await waitFor(() => expect(names()).toEqual([chosen]));
  expect(w.variables().calls).toBe(1);
  expect(registrySize() - baseline).toBe(1);
  expect(textReads.mock.calls.map(([f]) => f.name)).toEqual([chosen]);
  expect(parses.mock.calls.map(([f]) => f.name)).toEqual(parse ? [chosen] : []);
  expect(w.exposed().isParsing).toBe(false);
  await w.act('clearFiles');
});

test('drops made while reads are pending are let in against maxFiles, pending reads included', async () => {
  const view = w.render({
    currentMode: 'view',
    properties: { multiple: binding('{{true}}'), maxFiles: binding('{{1}}') },
  });
  for (let i = 0; i < 5; i += 1) await drop(view, file(`pending-${i}.json`));
  expect([...held.keys()]).toEqual(['pending-0.json']);
  expect(screen.getByText('You can upload up to 1 file')).toBeInTheDocument();
  await finish('pending-0.json');
  await waitFor(() => expect(names()).toEqual(['pending-0.json']));
  expect(textReads).toHaveBeenCalledTimes(1);
  await w.act('clearFiles');
});

test('clearing gives pending places back: the next drops are read', async () => {
  const view = w.render({
    currentMode: 'view',
    properties: { multiple: binding('{{true}}'), maxFiles: binding('{{2}}') },
  });
  await drop(view, file('a.json'));
  await drop(view, file('b.json'));
  await drop(view, file('c.json'));
  expect([...held.keys()]).toEqual(['a.json', 'b.json']);
  await w.act('clearFiles');
  expect(aborts).toHaveBeenCalledTimes(2);
  held.clear();
  await drop(view, file('d.json'));
  await drop(view, file('e.json'));
  expect([...held.keys()]).toEqual(['d.json', 'e.json']);
  await finish('d.json');
  await finish('e.json');
  await waitFor(() => expect(names()).toEqual(['d.json', 'e.json']));
  await w.act('clearFiles');
});
