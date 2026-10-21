/**
 * Record list (and Progress list, which shares its section) in its box. In the editor, which draws the saved height, or
 * with Dynamic height off, the list's card ended at its last row and left a blank band under it in a taller box. With
 * dynamic height on in the viewer the box follows the rows. Real store, real RenderWidget, real widgets.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const records = (n, progress = false) =>
  binding(
    `{{Array.from({ length: ${n} }, (_, i) => ({ id: i + 1, customer: 'Customer ' + (i + 1), status: 'Paid', total: 10 * i${
      progress ? ', done: i * 10' : ''
    } }))}}`
  );
const list = createWidgetHarness({
  componentType: 'ShadRecordList',
  handle: 'records1',
  id: 'records1',
  widgetHeight: 340,
  widgetWidth: 520,
});
const progress = createWidgetHarness({
  componentType: 'ShadProgressList',
  handle: 'progress1',
  id: 'progress1',
  widgetHeight: 340,
  widgetWidth: 520,
});
const shell = () => document.querySelector('.tj-shadcn');
const frame = () => shell().firstElementChild;

describe('A list section in its box', () => {
  beforeEach(async () => {
    await list.setup();
    await progress.setup();
  });
  afterEach(() => {
    list.teardown();
    progress.teardown();
  });

  test('[ListBox-001] a few records in the editor: the card fills the box, no blank band under it', () => {
    list.render({ currentMode: 'edit', properties: { data: records(2) } });
    expect(shell()).toHaveClass('tw-h-full');
    expect(frame()).toHaveClass('tw-h-full');
  });

  test('[ListBox-002] dynamic height off in the viewer, with a custom height: the card fills the box too', () => {
    list.render({ currentMode: 'view', properties: { data: records(2), dynamicHeight: binding('{{false}}') } });
    expect(frame()).toHaveClass('tw-h-full');
  });

  test('[ListBox-003] no records in the editor: the empty card fills the box with its message in the middle', () => {
    list.render({ currentMode: 'edit', properties: { data: binding('{{[]}}') } });
    expect(frame()).toHaveClass('tw-h-full', 'tw-flex', 'tw-items-center');
    expect(frame()).toHaveTextContent('Nothing here yet');
  });

  test('[ListBox-004] dynamic height on in the viewer: the card keeps its rows height and the box follows it', () => {
    list.render({ currentMode: 'view', properties: { data: records(2) } });
    expect(shell()).not.toHaveClass('tw-h-full');
    expect(frame()).not.toHaveClass('tw-h-full');
  });

  test('[ListBox-005] the Progress list shares the section and fills its box in the editor', () => {
    progress.render({ currentMode: 'edit' });
    expect(shell()).toHaveClass('tw-h-full');
    expect(frame()).toHaveClass('tw-h-full');
  });
});
