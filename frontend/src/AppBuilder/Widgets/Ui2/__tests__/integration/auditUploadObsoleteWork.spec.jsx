// Release audit round 4 (Codex fixture auditUploadObsoleteReadWork, trimmed): after clearFiles or unmount, a file
// read already under way was correctly dropped when it finished, but the work went on first: its text was read and,
// with Parse content on, its CSV parsed. Clearing and unmounting now stop the read where it is.
import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
import React from 'react';
import Papa from 'papaparse';
import { act, fireEvent, waitFor } from '@testing-library/react';
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { binding, countInvocationsOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { registrySize } from '@/AppBuilder/_utils/fileHandleRegistry';

const w = createWidgetHarness({
  componentType: 'ShadFileUpload',
  id: 'upload1',
  handle: 'upload1',
  widgetWidth: 440,
  widgetHeight: 220,
  defaultProperties: { accept: binding(''), parseContent: binding('{{false}}') },
});
let baseline;
beforeEach(async () => {
  await w.setup();
  baseline = registrySize();
});
afterEach(() => {
  w.teardown();
  jest.restoreAllMocks();
  expect(registrySize()).toBe(baseline);
});

const cases = ['live', 'clear', 'unmount'].flatMap((mode) => [false, true].map((parse) => [mode, parse]));
test.each(cases)('%s owner, parse=%s: no read or parse starts for a file no longer wanted', async (mode, parse) => {
  // The data-URL read is held until the test lets it finish; the text read runs as usual.
  let releaseDataURL;
  let textFinished;
  const nativeDataURL = FileReader.prototype.readAsDataURL;
  const nativeText = FileReader.prototype.readAsText;
  const parsing = jest.spyOn(Papa, 'parse');
  jest.spyOn(FileReader.prototype, 'readAsDataURL').mockImplementation(function read(file) {
    const reader = this;
    releaseDataURL = () =>
      new Promise((resolve) => {
        const loaded = reader.onload;
        reader.onload = (event) => {
          loaded.call(reader, event);
          resolve();
        };
        nativeDataURL.call(reader, file);
      });
  });
  const textReads = jest.spyOn(FileReader.prototype, 'readAsText').mockImplementation(function read(file) {
    const reader = this;
    textFinished = new Promise((resolve) => {
      const loaded = reader.onload;
      reader.onload = (event) => {
        loaded.call(reader, event);
        resolve();
      };
    });
    nativeText.call(reader, file);
  });
  const view = w.render({ currentMode: 'view', properties: { parseContent: binding(`{{${parse}}}`) } });
  w.setEvents(countInvocationsOn('upload1', 'onFileLoaded'));
  await act(async () =>
    fireEvent.change(view.container.querySelector('input[type=file]'), {
      target: { files: [new File(['title\nAudit value\n'], 'audit.csv', { type: 'text/csv' })] },
    })
  );
  expect(releaseDataURL).toBeDefined();
  expect(textReads).not.toHaveBeenCalled();
  if (mode === 'clear') await w.act('clearFiles');
  if (mode === 'unmount') act(() => w.session.render(<></>));
  // Finish the held read; should a text read start anyway, let it finish too so no work outlives the test.
  await act(async () => releaseDataURL());
  if (textFinished) await act(async () => textFinished);
  if (mode === 'live') {
    await waitFor(() => expect(w.exposed().file.map((f) => f.name)).toEqual(['audit.csv']));
    expect(w.variables().calls).toBe(1);
    expect(textReads).toHaveBeenCalledTimes(1);
    expect(parsing).toHaveBeenCalledTimes(parse ? 1 : 0);
    if (parse) expect(w.exposed().file[0].parsedData).toEqual([{ title: 'Audit value' }]);
    await w.act('clearFiles');
  } else {
    expect(w.variables().calls || 0).toBe(0);
    expect(registrySize()).toBe(baseline);
    expect({ textReads: textReads.mock.calls.length, parses: parsing.mock.calls.length }).toEqual({
      textReads: 0,
      parses: 0,
    });
  }
});
