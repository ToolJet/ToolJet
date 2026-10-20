import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
// Release audit (Codex fixtures currentRepeatedUploadPendingOwner016 and currentConcurrentUploadRowOwnership016,
// trimmed): a File upload in a List view row (rows keyed by id) published its read file through the setter it held
// when the file was dropped, which writes to the row's index at that time. When the rows reordered while the read was
// pending, the file landed on the other record: Alpha's row showed alpha.txt but components.list1.children gave it to
// Beta, and with two pending reads the files (and their parsed data) swapped. A widget's publishers now write to its
// record's current row whenever they are called. Controls: no reorder, removal while pending (the read is dropped),
// and a reorder after the read finished.
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { componentDefinition } from '@/test/app-builder';
import { binding, countInvocationsOn, setVariableOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { registrySize } from '@/AppBuilder/_utils/fileHandleRegistry';

const w = createWidgetHarness({
  componentType: 'ShadListView',
  id: 'list1',
  handle: 'list1',
  widgetWidth: 800,
  widgetHeight: 700,
  capabilities: { dnd: true },
  preload: ['ShadFileUpload'],
});
const A = { id: 'A', name: 'Alpha upload' };
const B = { id: 'B', name: 'Beta upload' };
const expr = (v) => `{{${JSON.stringify(v)}}}`;

let descriptor;
let baseline;
// The first FileReader call of each file, held until the test releases it.
let held;
beforeAll(() => {
  descriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'clientWidth');
  Object.defineProperty(Element.prototype, 'clientWidth', { configurable: true, get: () => 650 });
});
afterAll(() => {
  if (descriptor) Object.defineProperty(Element.prototype, 'clientWidth', descriptor);
  else delete Element.prototype.clientWidth;
});
beforeEach(() => {
  w.setup();
  baseline = registrySize();
  held = new Map();
  const native = FileReader.prototype.readAsDataURL;
  jest.spyOn(FileReader.prototype, 'readAsDataURL').mockImplementation(function (file) {
    held.set(file.name, () => native.call(this, file));
  });
});
afterEach(() => {
  w.teardown();
  jest.restoreAllMocks();
  expect(registrySize()).toBe(baseline);
});

const field = (name) => screen.getByText(name, { selector: 'label' }).parentElement;
const input = (name) => field(name).querySelector('input[type=file]');
const visible = (rows) =>
  rows.map((r) => ({
    label: r.name,
    files: [...field(r.name).querySelectorAll('ul[aria-label="Selected files"] li p')]
      .filter((_, i) => i % 2 === 0)
      .map((e) => e.textContent),
  }));
const published = () =>
  Object.values(w.exposed().children || {}).map((r) => ({
    label: r.upload1?.label,
    files: (r.upload1?.file || []).map((f) => f.name),
  }));
const finish = (...names) =>
  act(async () => {
    names.forEach((name) => {
      const run = held.get(name);
      expect(run).toBeDefined();
      held.delete(name);
      run();
    });
    await new Promise((resolve) => setTimeout(resolve, 40));
  });

const renderList = async (parse) => {
  const upload = componentDefinition('upload1', 'upload1', 'ShadFileUpload', {
    label: binding('{{listItem.name}}'),
    accept: binding(''),
    parseContent: binding(parse),
  });
  upload.component.parent = 'list1';
  upload.component.definition.others = { showOnDesktop: binding(true), showOnMobile: binding(false) };
  upload.layouts = { desktop: { top: 0, left: 0, width: 30, height: 240 } };
  w.render({
    currentMode: 'view',
    extraComponents: { upload1: upload },
    properties: {
      data: binding(expr([A, B])),
      idField: binding('id'),
      enablePagination: binding(false),
      itemHeight: binding(270),
    },
  });
  await waitFor(() => expect(published().map((r) => r.label)).toEqual([A.name, B.name]));
  // onFileLoaded counts its calls and notes the record it fired for.
  const owner = setVariableOn('upload1', 'onFileLoaded', { key: 'owner', value: '{{listItem.name}}' })[0];
  w.setEvents([...countInvocationsOn('upload1', 'onFileLoaded'), { ...owner, id: 'evt-owner', index: 1 }]);
};
const setRows = async (rows) => {
  await act(async () => w.setComponentProperty('list1', 'data', expr(rows), 'properties'));
  await waitFor(() => expect(published().map((r) => r.label)).toEqual(rows.map((r) => r.name)));
};
const choose = (row, file) => act(async () => fireEvent.change(input(row.name), { target: { files: [file] } }));

test.each(['unchanged', 'pending-reorder', 'pending-remove', 'completed-reorder'])(
  "a pending read lands on its record's row: %s",
  async (mode) => {
    await renderList(false);
    const alphaNode = input(A.name);
    await choose(A, new File(['payload'], 'alpha.txt', { type: 'text/plain' }));
    expect(held.size).toBe(1);
    if (mode === 'completed-reorder') {
      await finish('alpha.txt');
      await waitFor(() => expect(published()[0].files).toEqual(['alpha.txt']));
    }
    const next = { 'pending-remove': [B], unchanged: [A, B] }[mode] || [B, A];
    if (mode !== 'unchanged') await setRows(next);
    if (mode !== 'pending-remove') expect(input(A.name)).toBe(alphaNode);
    if (mode !== 'completed-reorder') await finish('alpha.txt');
    await act(async () => new Promise((resolve) => setTimeout(resolve, 0)));
    const expected = next.map((r) => ({ label: r.name, files: r.id === 'A' ? ['alpha.txt'] : [] }));
    expect(visible(next)).toEqual(expected);
    expect(w.variables().calls || 0).toBe(mode === 'pending-remove' ? 0 : 1);
    expect(w.variables().owner).toBe(mode === 'pending-remove' ? undefined : A.name);
    expect(registrySize() - baseline).toBe(mode === 'pending-remove' ? 0 : 1);
    expect(published()).toEqual(expected);
  }
);

test.each([false, true].flatMap((parse) => ['unchanged', 'A-first', 'B-first'].map((mode) => [parse, mode])))(
  'two pending reads keep their own records, parse=%s, reorder=%s',
  async (parse, mode) => {
    await renderList(parse);
    const nodes = [input(A.name), input(B.name)];
    for (const r of [A, B]) {
      await choose(r, new File([JSON.stringify({ owner: r.id })], `${r.id}.json`, { type: 'application/json' }));
    }
    expect(held.size).toBe(2);
    const next = mode === 'unchanged' ? [A, B] : [B, A];
    if (mode !== 'unchanged') await setRows(next);
    expect([input(A.name), input(B.name)]).toEqual(nodes);
    const [first, second] = mode === 'B-first' ? ['B.json', 'A.json'] : ['A.json', 'B.json'];
    await finish(first);
    // The other read is still pending: its own row still says so.
    const pending = Object.values(w.exposed().children || {})
      .map(({ upload1 }) => upload1)
      .find((upload) => upload?.label === (second === 'A.json' ? A.name : B.name));
    expect(pending.file || []).toEqual([]);
    if (parse) expect(pending.isParsing).toBe(true);
    await finish(second);
    expect(w.variables().calls).toBe(2);
    expect(registrySize() - baseline).toBe(2);
    expect(visible(next)).toEqual(next.map((r) => ({ label: r.name, files: [`${r.id}.json`] })));
    const children = Object.values(w.exposed().children || {}).map(({ upload1 }) => ({
      label: upload1?.label,
      files: (upload1?.file || []).map((f) => ({ name: f.name, parsedData: f.parsedData })),
      isParsing: upload1?.isParsing,
    }));
    expect(children).toEqual(
      next.map((r) => ({
        label: r.name,
        files: [{ name: `${r.id}.json`, parsedData: parse ? { owner: r.id } : null }],
        isParsing: false,
      }))
    );
  }
);
