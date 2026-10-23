// Release audit round 3 (Codex fixture reviewUploadLimitPruningRegistry, trimmed): with two files read and a third
// still reading, maxFiles dropped to 1. When the third finished, the list was cut to one file but the file cut from
// it kept its payload in the file registry, through clearFiles and unmount. Every file cut by the limit is released.
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { registrySize } from '@/AppBuilder/_utils/fileHandleRegistry';
import { act, fireEvent, waitFor } from '@testing-library/react';

const w = createWidgetHarness({
  componentType: 'ShadFileUpload',
  id: 'up1',
  handle: 'up1',
  widgetWidth: 440,
  widgetHeight: 220,
  defaultProperties: { accept: binding('') },
});

// The third file's read is held until the test lets it finish.
let finishPending;
let baseline;
beforeEach(async () => {
  await w.setup();
  baseline = registrySize();
  const native = FileReader.prototype.readAsDataURL;
  jest.spyOn(FileReader.prototype, 'readAsDataURL').mockImplementation(function read(file) {
    if (file.name !== 'pending.txt') return native.call(this, file);
    finishPending = () => native.call(this, file);
    return undefined;
  });
});
afterEach(() => {
  jest.restoreAllMocks();
  w.teardown();
});

const file = (name) => new File(['tiny payload'], name, { type: 'text/plain', lastModified: 100 });

test.each([1, 3])(
  '[UI2-AUDIT-UPLOAD-005] a read finishing after maxFiles drops to %i keeps exactly the files shown',
  async (limit) => {
    const view = w.render({
      currentMode: 'view',
      properties: { multiple: binding('{{true}}'), maxFiles: binding('{{3}}') },
    });
    const input = () => view.container.querySelector('input[type=file]');
    await act(async () => fireEvent.change(input(), { target: { files: [file('first.txt'), file('second.txt')] } }));
    await waitFor(() => expect(w.exposed().file).toHaveLength(2));
    await act(async () => fireEvent.change(input(), { target: { files: [file('pending.txt')] } }));
    expect(finishPending).toBeDefined();
    await act(async () => w.setComponentProperty('up1', 'maxFiles', `{{${limit}}}`, 'properties'));
    await act(async () => finishPending());
    await waitFor(() => expect(w.exposed().file).toHaveLength(limit));

    expect(registrySize() - baseline).toBe(limit);
    await w.act('clearFiles');
    expect(registrySize() - baseline).toBe(0);
    await act(async () => view.unmount());
    expect(registrySize() - baseline).toBe(0);
  }
);
