/**
 * UI 2.0 Card grid covers after an image fails: new data with another URL tries it (release audit 46). Titles carry
 * [ShadCardGrid-<AREA>-<NNN>] scenario ids.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { fireEvent, waitFor } from '@testing-library/react';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'grid1';
const widget = createWidgetHarness({
  componentType: 'ShadCardGrid',
  handle: 'cardgrid1',
  id: ID,
  widgetWidth: 640,
  widgetHeight: 400,
});
const bad = 'https://example.invalid/old.png';
const good = 'https://example.invalid/new.png';
const data = (url, id = 'a') => `{{${JSON.stringify([{ id, title: 'Product Alpha', image: url }])}}}`;
const img = (url) => document.querySelector(`img[src="${url}"]`);
const mount = async () => {
  widget.render({
    currentMode: 'view',
    properties: {
      data: binding(data(bad)),
      titleField: binding('title'),
      imageField: binding('image'),
      showImage: binding('{{true}}'),
    },
  });
  await waitFor(() => expect(img(bad)).not.toBeNull());
  fireEvent.error(img(bad));
  expect(img(bad)).toBeNull();
};

describe('UI 2.0 Card grid covers', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadCardGrid-IMG-001] a failed cover is tried again when new data brings another URL', async () => {
    await mount();
    widget.setComponentProperty(ID, 'data', data(good), 'properties');
    await waitFor(() => expect(img(good)).not.toBeNull());
  });

  test('[ShadCardGrid-IMG-002] another record in the failed card gets its own cover', async () => {
    await mount();
    widget.setComponentProperty(ID, 'data', data(good, 'b'), 'properties');
    await waitFor(() => expect(img(good)).not.toBeNull());
  });
});
