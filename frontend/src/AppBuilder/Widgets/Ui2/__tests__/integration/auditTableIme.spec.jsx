// Release audit round 2: Codex's fixture reviewSplitTableIME, kept as written. Table inline editor: the Enter that ends an IME composition (isComposing or keyCode 229) commits nothing; a plain Enter commits.
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, fireEvent, waitFor } from '@testing-library/react';
import { binding, countInvocationsOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
const w = createWidgetHarness({
  componentType: 'ShadTable',
  id: 'table1',
  handle: 'table1',
  widgetHeight: 400,
  widgetWidth: 600,
});
test.each([
  ['composition flag', { isComposing: true }, false],
  ['keyCode229', { keyCode: 229 }, false],
  ['ordinary Enter', {}, true],
])('inline editor handles %s without premature commit', async (label, extra, commit) => {
  await w.setup();
  try {
    w.render({
      currentMode: 'view',
      properties: {
        data: binding('{{[{id:"a",name:"Original"}]}}'),
        columns: binding('{{[{key:"name",name:"Name",isEditable:true}]}}'),
      },
    });
    w.setEvents(countInvocationsOn('table1', 'onCellValueChanged', { key: 'changes' }));
    await waitFor(() => expect(document.querySelector('tbody td')).not.toBeNull());
    await act(async () => fireEvent.click(document.querySelector('tbody td')));
    const input = document.querySelector('tbody input');
    expect(input).not.toBeNull();
    await act(async () => fireEvent.change(input, { target: { value: 'とう' } }));
    await act(async () => fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', ...extra }));
    if (commit) {
      expect(w.variables().changes).toBe(1);
      expect(w.exposed().dataUpdates).toEqual([{ id: 'a', name: 'とう' }]);
      expect(document.querySelector('tbody input')).toBeNull();
    } else {
      expect({ updates: w.exposed().dataUpdates, changes: w.variables().changes ?? 0 }).toEqual({
        updates: [],
        changes: 0,
      });
      expect(document.querySelector('tbody input')).toHaveValue('とう');
    }
  } finally {
    w.teardown();
  }
});
