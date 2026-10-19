// Release audit round 3 (Codex fixture reviewUploadDuplicateHeaderDiagnostics, trimmed): a CSV with a repeated header
// (name,name) was parsed with the second column renamed name_1 and an empty parseError, so only the console said so.
// The data is kept as parsed, and parseError names the renamed columns.
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { binding, setVariableOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { act, fireEvent, waitFor } from '@testing-library/react';

const w = createWidgetHarness({
  componentType: 'ShadFileUpload',
  id: 'upload1',
  handle: 'upload1',
  widgetWidth: 440,
  widgetHeight: 220,
  defaultProperties: { accept: binding('') },
});
beforeEach(async () => {
  await w.setup();
  // Papa logs its own warning for the rename.
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => {
  w.teardown();
  jest.restoreAllMocks();
});

const load = async (text) => {
  const view = w.render({ currentMode: 'view', properties: { parseContent: binding('{{true}}') } });
  w.setEvents(
    setVariableOn('upload1', 'onFileLoaded', { key: 'rows', value: '{{components.upload1.file[0].parsedData}}' })
  );
  const file = new File([text], 'people.csv', { type: 'text/csv' });
  await act(async () =>
    fireEvent.change(view.container.querySelector('input[type=file]'), { target: { files: [file] } })
  );
  await waitFor(() => expect(w.variables().rows).toHaveLength(1));
  return { rows: w.variables().rows, parseError: w.exposed().file[0].parseError };
};

test.each([
  ['name,name', ['Alice', 'Bob'], 'name to name_1'],
  ['name, name ', ['Alice', 'Bob'], 'name to name_1'],
  ['name,name,name_1', ['Alice', 'Bob', 'Charlie'], 'name to name_'],
])('duplicate headers %s keep every value and say which columns were renamed', async (header, values, note) => {
  const { rows, parseError } = await load(`${header}\n${values.join(',')}`);
  expect(Object.values(rows[0]).sort()).toEqual([...values].sort());
  expect(parseError).toContain('people.csv: duplicate headers renamed:');
  expect(parseError).toContain(note);
});

test('distinct headers have no parse error (the control)', async () => {
  const { rows, parseError } = await load('name,city\nAlice,Paris');
  expect(rows).toEqual([{ name: 'Alice', city: 'Paris' }]);
  expect(parseError).toBe('');
});
