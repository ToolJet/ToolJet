// Release audit round 2 (Codex fixture, kept as written): with caseSensitive on and custom tags off, picking the
// suggestion valued alpha added Alpha (the match ignored case). Resolution follows the case rule.
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { binding, setVariableOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
const json = (v) => '{{' + JSON.stringify(v) + '}}';
const harness = () =>
  createWidgetHarness({
    componentType: 'ShadTagsInput',
    id: 'tags1',
    handle: 'tags1',
    widgetHeight: 100,
    widgetWidth: 500,
  });
test.each(['limit only', 'default only', 'both'])('Tags refresh %s preserves reset/clamp precedence', async (mode) => {
  const w = harness();
  await w.setup();
  try {
    w.render({
      currentMode: 'view',
      properties: { defaultValue: binding(json(['A', 'B', 'C'])), maxTags: binding('{{3}}') },
    });
    await waitFor(() => expect(w.exposed().values).toEqual(['A', 'B', 'C']));
    act(() => {
      if (mode !== 'limit only') w.setComponentProperty('tags1', 'defaultValue', json(['X', 'Y']), 'properties');
      if (mode !== 'default only') w.setComponentProperty('tags1', 'maxTags', '{{1}}', 'properties');
    });
    await waitFor(() =>
      expect(w.exposed().values).toEqual(mode === 'limit only' ? ['A'] : mode === 'default only' ? ['X', 'Y'] : ['X'])
    );
  } finally {
    w.teardown();
  }
});
test.each([
  ['Upper', 'Alpha'],
  ['Lower', 'alpha'],
  ['Other', 'Beta'],
])('case-sensitive restricted suggestion %s keeps its exact value', async (label, value) => {
  const w = harness();
  await w.setup();
  try {
    w.render({
      currentMode: 'view',
      properties: {
        defaultValue: binding('{{[]}}'),
        allowCustomTags: binding('{{false}}'),
        caseSensitive: binding('{{true}}'),
        suggestions: binding(
          json([
            { label: 'Upper', value: 'Alpha' },
            { label: 'Lower', value: 'alpha' },
            { label: 'Other', value: 'Beta' },
          ])
        ),
      },
    });
    w.setEvents(setVariableOn('tags1', 'onTagAdded', { key: 'added', value: '{{components.tags1.lastAddedTag}}' }));
    fireEvent.focus(screen.getByRole('combobox'));
    fireEvent.click(await screen.findByRole('option', { name: label }));
    await waitFor(() =>
      expect({ values: w.exposed().values, added: w.variables().added }).toEqual({ values: [value], added: value })
    );
  } finally {
    w.teardown();
  }
});
