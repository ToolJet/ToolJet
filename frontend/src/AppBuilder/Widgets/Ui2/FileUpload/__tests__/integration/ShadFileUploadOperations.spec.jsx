/**
 * UI 2.0 File upload with reads finishing in any order (release audit round 2): the newest single-file selection wins,
 * isParsing stays true while any current read is pending, the limits in force when a read finishes apply, and each
 * file has one parse outcome (parsedData, and parseError when its content could not be parsed). FileReader reads are
 * held per file until a test lets them finish. Titles carry [ShadFileUpload-<AREA>-<NNN>] scenario ids.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, fireEvent, screen } from '@testing-library/react';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { registrySize } from '@/AppBuilder/_utils/fileHandleRegistry';

const ID = 'upload1';
const widget = createWidgetHarness({
  componentType: 'ShadFileUpload',
  handle: 'upload1',
  id: ID,
  widgetWidth: 440,
  widgetHeight: 220,
  defaultProperties: { accept: binding('') },
});
const file = (name, text = 'hello', type = 'text/plain') => new File([text], name, { type, lastModified: 100 });
const names = () => (widget.exposed().file || []).map((f) => f.name);
const parsing = () => widget.exposed().isParsing;
const drop = (view, ...files) =>
  act(async () => fireEvent.change(view.container.querySelector('input[type=file]'), { target: { files } }));
const setProperty = (key, value) => act(async () => widget.setComponentProperty(ID, key, value, 'properties'));

let held;
let baseline;
/** Lets the held reads of these files finish (all of them without names). */
const finish = (...which) =>
  act(async () => {
    for (const [name, run] of [...held]) {
      if (which.length && !which.includes(name)) continue;
      held.delete(name);
      run();
    }
    await new Promise((r) => setTimeout(r, 30));
  });

describe('UI 2.0 File upload operations', () => {
  beforeEach(async () => {
    await widget.setup();
    baseline = registrySize();
    held = new Map();
    const native = FileReader.prototype.readAsDataURL;
    jest.spyOn(FileReader.prototype, 'readAsDataURL').mockImplementation(function hold(f) {
      held.set(f.name, () => native.call(this, f));
    });
  });
  afterEach(() => {
    jest.restoreAllMocks();
    widget.teardown();
  });

  test('[ShadFileUpload-OP-001] single file: an older read finishing last does not replace the newer selection', async () => {
    const view = widget.render({ currentMode: 'view', properties: { multiple: binding('{{false}}') } });
    await drop(view, file('old.txt'));
    await drop(view, file('new.txt'));
    await finish('new.txt');
    await finish('old.txt');
    expect(names()).toEqual(['new.txt']);
    expect(registrySize()).toBe(baseline + 1);
  });

  test('[ShadFileUpload-OP-002] isParsing stays true while another read of the same moment is pending', async () => {
    const view = widget.render({ currentMode: 'view', properties: { parseContent: binding('{{true}}') } });
    await drop(view, file('a.txt'));
    await drop(view, file('b.txt'));
    expect(parsing()).toBe(true);
    await finish('a.txt');
    expect(parsing()).toBe(true);
    await finish('b.txt');
    expect(parsing()).toBe(false);
    expect(names()).toEqual(['a.txt', 'b.txt']);
  });

  test('[ShadFileUpload-OP-003] a read cleared away does not end isParsing for a newer one', async () => {
    const view = widget.render({ currentMode: 'view', properties: { parseContent: binding('{{true}}') } });
    await drop(view, file('cleared.txt'));
    await widget.act('clearFiles');
    await drop(view, file('kept.txt'));
    await finish('cleared.txt');
    expect(parsing()).toBe(true);
    await finish('kept.txt');
    expect(parsing()).toBe(false);
    expect(names()).toEqual(['kept.txt']);
    expect(registrySize()).toBe(baseline + 1);
  });

  test('[ShadFileUpload-OP-004] maxFiles or multiple changed while reads are pending apply when they finish', async () => {
    const view = widget.render({ currentMode: 'view' });
    await drop(view, file('a.txt'), file('b.txt'));
    await setProperty('maxFiles', '{{1}}');
    await finish();
    expect(names()).toHaveLength(1);
    expect(registrySize()).toBe(baseline + 1);

    await widget.act('clearFiles');
    await setProperty('maxFiles', '{{5}}');
    await drop(view, file('c.txt'), file('d.txt'));
    await setProperty('multiple', '{{false}}');
    await finish();
    expect(names()).toHaveLength(1);
    expect(registrySize()).toBe(baseline + 1);
  });

  describe('parse outcomes', () => {
    beforeEach(() => jest.restoreAllMocks());
    const parsed = () => widget.exposed().file.map((f) => [f.name, f.parsedData, f.parseError]);

    test('[ShadFileUpload-PARSE-001] invalid JSON reports a parse error; valid null parses to null with none', async () => {
      const view = widget.render({ currentMode: 'view', properties: { parseContent: binding('{{true}}') } });
      await drop(view, file('bad.json', '{ "a": ', 'application/json'), file('null.json', 'null', 'application/json'));
      await act(() => new Promise((r) => setTimeout(r, 50)));
      const [bad, nothing] = parsed();
      expect(bad[1]).toBeNull();
      expect(bad[2]).toMatch(/could not be parsed as JSON/);
      expect(nothing).toEqual(['null.json', null, '']);
      expect(screen.getByText(/bad\.json could not be parsed as JSON/)).toBeInTheDocument();
    });

    test('[ShadFileUpload-PARSE-002] CSV rows with the wrong field count are reported on the file, not only in the console', async () => {
      const view = widget.render({ currentMode: 'view', properties: { parseContent: binding('{{true}}') } });
      await drop(view, file('people.csv', 'name,age\nAda,36\nGrace\n', 'text/csv'));
      await act(() => new Promise((r) => setTimeout(r, 50)));
      const [[, rows, error]] = parsed();
      expect(rows).toEqual([{ name: 'Ada', age: '36' }, { name: 'Grace' }]);
      expect(error).toBe('people.csv: row 2: Too few fields: expected 2 fields but parsed 1');
      expect(screen.getByText(/people\.csv: row 2/)).toBeInTheDocument();
    });
  });
});
