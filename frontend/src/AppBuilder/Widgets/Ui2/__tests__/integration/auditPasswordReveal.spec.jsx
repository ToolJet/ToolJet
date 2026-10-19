// Release audit round 3 (Codex fixture reviewPasswordRevealLifetime, trimmed): a password shown with the toggle stayed
// in clear text after showToggle was turned off, with no button left to hide it.
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const w = createWidgetHarness({ componentType: 'ShadPasswordInput', id: 'pw1', handle: 'pw1' });
beforeEach(() => w.setup());
afterEach(() => w.teardown());

test('turning showToggle off masks a revealed password, and back on starts masked', async () => {
  w.render({
    currentMode: 'view',
    properties: { label: binding('Secret'), defaultValue: binding('Initial-secret'), showToggle: binding('{{true}}') },
  });
  await userEvent.setup().click(await screen.findByRole('button', { name: 'Show password' }));
  expect(screen.getByLabelText('Secret')).toHaveAttribute('type', 'text');
  act(() => w.setComponentProperty('pw1', 'showToggle', '{{false}}', 'properties'));
  expect(screen.queryByRole('button', { name: /password/ })).not.toBeInTheDocument();
  expect(screen.getByLabelText('Secret')).toHaveAttribute('type', 'password');
  act(() => w.setComponentProperty('pw1', 'showToggle', '{{true}}', 'properties'));
  expect(screen.getByRole('button', { name: 'Show password' })).toBeInTheDocument();
  expect(screen.getByLabelText('Secret')).toHaveAttribute('type', 'password');
});
