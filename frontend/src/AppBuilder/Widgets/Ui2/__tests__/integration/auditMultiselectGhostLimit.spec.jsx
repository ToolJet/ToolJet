// Release audit round 2: Codex's fixture reviewSplitMultiselectGhostLimit, kept as written, as the regression check for a fix made earlier
// from its description (see the commit that fixed it).
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { fireEvent, screen, waitFor } from '@testing-library/react';
const json = (v) => '{{' + JSON.stringify(v) + '}}';
test.each([
  ['action', false],
  ['action', true],
  ['click', false],
])('removed local selection frees limit: %s clear=%s', async (route, clear) => {
  const w = createWidgetHarness({
    componentType: 'ShadMultiselect',
    id: 'choice1',
    handle: 'choice1',
    widgetHeight: 150,
    widgetWidth: 500,
  });
  await w.setup();
  try {
    w.render({
      currentMode: 'view',
      properties: {
        options: binding(json([{ label: 'Old', value: 'old' }])),
        maxSelections: binding('{{1}}'),
        serverSideSearch: binding('{{false}}'),
        defaultValue: binding('{{[]}}'),
      },
    });
    await w.act('selectOptions', ['old']);
    await waitFor(() => expect(w.exposed().values).toEqual(['old']));
    w.setComponentProperty('choice1', 'options', json([{ label: 'Replacement', value: 'new' }]), 'properties');
    await waitFor(() => expect(w.exposed().values).toEqual([]));
    if (clear) await w.act('clear');
    if (route === 'action') await w.act('selectOptions', ['new']);
    else {
      fireEvent.click(screen.getByRole('combobox'));
      fireEvent.click(await screen.findByRole('option', { name: 'Replacement' }));
    }
    await waitFor(() => expect(w.exposed().values).toEqual(['new']));
  } finally {
    w.teardown();
  }
});
