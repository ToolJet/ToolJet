// Release audit round 3 (Codex fixture reviewButtonGroupActionModeReset, trimmed): a mandatory Button group in actions
// mode stayed valid after its Form's clearForm or resetForm: its validity reads the last click, which the clear did not
// reset. Single and multiple modes are the controls.
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const w = createWidgetHarness({ componentType: 'ShadButtonGroup', id: 'group1', handle: 'group1', preload: ['Form'] });
beforeEach(() => w.setup());
afterEach(w.teardown);

const CASES = ['actions', 'single', 'multiple'].flatMap((mode) => [
  [mode, 'clearForm'],
  [mode, 'resetForm'],
]);

test.each(CASES)('a mandatory %s group is invalid again after its Form %s', async (mode, action) => {
  w.renderInsideForm({
    properties: {
      buttons: binding('{{[{label:"Alpha",value:"a"}]}}'),
      mode: binding(mode),
      defaultValue: binding(mode === 'multiple' ? '{{[]}}' : ''),
    },
    validation: { mandatory: binding('{{true}}') },
  });
  await waitFor(() => expect(w.exposed().isValid).toBe(false));
  await userEvent.setup().click(screen.getByRole('button', { name: 'Alpha' }));
  await waitFor(() => expect(w.exposed().isValid).toBe(true));
  await act(async () => w.exposed('form1')[action]());
  await waitFor(() => expect(w.exposed().isValid).toBe(false));
  expect(w.exposed().selected).toEqual([]);
});
