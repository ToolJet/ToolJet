/**
 * UI 2.0 pickers are named even without a visible label.
 *
 * Release audit round 2 (17 Oct): with an empty label, the Combobox's field had no accessible name; with a label of
 * spaces, neither the Combobox nor the Multiselect had one (a screen reader announced an unnamed control). The Select
 * falls back to its placeholder, then its component name: all three do now. A real label still names the field.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { waitFor } from '@testing-library/react';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const OPTIONS = "{{[{ label: 'Alpha', value: 'a' }]}}";
const TYPES = ['ShadSelect', 'ShadCombobox', 'ShadMultiselect'];
const harnesses = Object.fromEntries(
  TYPES.map((type) => [type, createWidgetHarness({ componentType: type, id: 'w1', handle: 'team1', preload: [type] })])
);

// [label, placeholder, the name the field has]
const LABELS = [
  ['Team', 'Pick a team', 'Team'],
  ['', 'Pick a team', 'Pick a team'],
  ['   ', 'Pick a team', 'Pick a team'],
  ['', '', 'team1'],
  ['   ', '', 'team1'],
];

describe('[UI2-NAME-001] a picker without a visible label is still named', () => {
  it.each(TYPES.flatMap((type) => LABELS.map((row) => [type, ...row])))(
    '%s, label %j, placeholder %j',
    async (type, label, placeholder, name) => {
      const widget = harnesses[type];
      await widget.setup();
      try {
        widget.render({
          currentMode: 'view',
          properties: { label: binding(label), placeholder: binding(placeholder), options: binding(OPTIONS) },
        });
        await waitFor(() => expect(document.querySelector('[role=combobox]')).not.toBeNull());
        expect(document.querySelector('[role=combobox]')).toHaveAccessibleName(name);
      } finally {
        widget.teardown();
      }
    }
  );
});
