// Release audit round 2 (Codex fixture, kept as written): with custom tags off, a picked suggestion was matched back
// by value or label in list order, so picking "Second choice" (value code-2) added code-1, whose label is code-2. A
// candidate now resolves by its exact value first.
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { binding, setVariableOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { fireEvent, screen, waitFor } from '@testing-library/react';
const json = (v) => '{{' + JSON.stringify(v) + '}}';
test.each([
  [false, false],
  [false, true],
  [true, false],
])('picked tag keeps exact identity: allowCustom=%s reverseOrder=%s', async (allowCustom, reverse) => {
  const w = createWidgetHarness({
    componentType: 'ShadTagsInput',
    id: 'tags1',
    handle: 'tags1',
    widgetHeight: 100,
    widgetWidth: 500,
  });
  await w.setup();
  try {
    const suggestions = [
      { label: 'code-2', value: 'code-1' },
      { label: 'Second choice', value: 'code-2' },
    ];
    if (reverse) suggestions.reverse();
    w.render({
      currentMode: 'view',
      properties: {
        defaultValue: binding('{{[]}}'),
        allowCustomTags: binding(json(allowCustom)),
        caseSensitive: binding('{{true}}'),
        suggestions: binding(json(suggestions)),
      },
    });
    w.setEvents(setVariableOn('tags1', 'onTagAdded', { key: 'added', value: '{{components.tags1.lastAddedTag}}' }));
    fireEvent.focus(screen.getByRole('combobox'));
    fireEvent.click(await screen.findByRole('option', { name: 'Second choice' }));
    await waitFor(() =>
      expect({ values: w.exposed().values, added: w.variables().added }).toEqual({
        values: ['code-2'],
        added: 'code-2',
      })
    );
  } finally {
    w.teardown();
  }
});
