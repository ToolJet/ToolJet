/**
 * UI 2.0 File upload with reads still pending: clearing cancels them (release audit 1), and pending reads hold their
 * places against maxFiles (2). FileReader reads are held until a test lets them finish. Titles carry
 * [ShadFileUpload-<AREA>-<NNN>] scenario ids.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, fireEvent } from '@testing-library/react';
import { binding, countInvocationsOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
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
const file = (name, text = 'hello') => new File([text], name, { type: 'text/plain', lastModified: 100 });
const names = () => (widget.exposed().file || []).map((f) => f.name);
const drop = (view, ...files) =>
  act(async () => fireEvent.change(view.container.querySelector('input[type=file]'), { target: { files } }));

let held;
let baseline;
const finishReads = () =>
  act(async () => {
    held.splice(0).forEach((run) => run());
    await new Promise((r) => setTimeout(r, 30));
  });

describe('UI 2.0 File upload with pending reads', () => {
  beforeEach(async () => {
    await widget.setup();
    baseline = registrySize();
    held = [];
    const native = FileReader.prototype.readAsDataURL;
    jest.spyOn(FileReader.prototype, 'readAsDataURL').mockImplementation(function hold(f) {
      held.push(() => native.call(this, f));
    });
  });
  afterEach(() => {
    jest.restoreAllMocks();
    widget.teardown();
  });

  test('[ShadFileUpload-PEND-001] clearFiles before a read finishes cancels it: no file, no event, no payload kept', async () => {
    const view = widget.render({ currentMode: 'view' });
    widget.setEvents(countInvocationsOn(ID, 'onFileLoaded'));
    await drop(view, file('late.txt'));
    expect(held).toHaveLength(1);
    await widget.act('clearFiles');
    await finishReads();
    expect(names()).toEqual([]);
    expect(widget.variables().calls ?? 0).toBe(0);
    expect(registrySize()).toBe(baseline);
  });

  test('[ShadFileUpload-PEND-002] a drop for a place a pending read holds is turned away, not read', async () => {
    const view = widget.render({ currentMode: 'view', properties: { maxFiles: binding('{{1}}') } });
    await drop(view, file('first.txt'));
    await drop(view, file('second.txt'));
    expect(held).toHaveLength(1);
    await finishReads();
    expect(names()).toEqual(['first.txt']);
    expect(registrySize()).toBe(baseline + 1);
    await widget.act('clearFiles');
    expect(registrySize()).toBe(baseline);
  });
});
