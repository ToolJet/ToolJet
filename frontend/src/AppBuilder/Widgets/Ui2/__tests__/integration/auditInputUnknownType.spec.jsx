// Release audit round 3 (from Codex fixture reviewInputErrorActionLifetime): a bound Type outside the Type list
// ('file') reached the <input> as is, and the widget crashed to its error box. A type the list does not offer now
// shows a text box.
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { act, screen } from '@testing-library/react';

const w = createWidgetHarness({
  componentType: 'ShadInput',
  id: 'field1',
  handle: 'field1',
  widgetHeight: 100,
  widgetWidth: 400,
});
beforeEach(() => w.setup());
afterEach(() => w.teardown());

test.each(['file', 'checkbox', 'not-a-type'])('a bound Type of %s shows a working text box', async (type) => {
  w.render({ currentMode: 'view', properties: { defaultValue: binding('Initial'), inputType: binding('text') } });
  act(() => w.setComponentProperty('field1', 'inputType', type, 'properties'));
  expect(screen.queryByText('Something went wrong.')).toBeNull();
  const input = screen.getByRole('textbox');
  expect(input).toHaveAttribute('type', 'text');
  expect(input).toHaveValue('Initial');
  await w.act('setText', 'After');
  expect(input).toHaveValue('After');
});

test.each(['email', 'url', 'password', 'search'])('a Type from the list (%s) is kept', (type) => {
  w.render({ currentMode: 'view', properties: { inputType: binding(type) } });
  expect(document.querySelector('input')).toHaveAttribute('type', type);
});
