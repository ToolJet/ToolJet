import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
// Release audit 016 (Codex fixture auditNavigationOwnExpansion, from currentNavigationStateAcceptance016): a sidebar
// parent whose value was __proto__, constructor or toString started expanded with its child showing, because the
// expanded state was a plain object and the lookup found Object.prototype's members. Only the parent's own entry
// counts now. An ordinary value (the control) already started collapsed, and every value could be toggled and its
// child picked.
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const w = createWidgetHarness({
  componentType: 'ShadNavigation',
  id: 'nav1',
  handle: 'nav1',
  widgetHeight: 400,
  widgetWidth: 400,
});
const keys = ['ordinary', '__proto__', 'constructor', 'toString'];
beforeEach(() => w.setup());
afterEach(w.teardown);

async function mount(key) {
  const items = [{ label: 'Parent', value: key, children: [{ label: 'Child', value: 'child-value' }] }];
  w.render({
    currentMode: 'view',
    properties: {
      items: binding(`{{${JSON.stringify(items)}}}`),
      orientation: binding('vertical'),
      collapsed: binding('{{false}}'),
      defaultValue: binding(''),
    },
  });
  await waitFor(() => expect(screen.getByRole('button', { name: 'Parent' })).toBeInTheDocument());
  return screen.getByRole('button', { name: 'Parent' });
}

test.each(keys)('parent value %s starts collapsed when no child is selected', async (key) => {
  const parent = await mount(key);
  expect({
    expanded: parent.getAttribute('aria-expanded'),
    visibleChild: !!screen.queryByRole('button', { name: 'Child' }),
  }).toEqual({ expanded: 'false', visibleChild: false });
});

test.each(keys)('parent value %s can be collapsed, reopened and its child selected', async (key) => {
  const parent = await mount(key);
  if (parent.getAttribute('aria-expanded') === 'true') await act(async () => fireEvent.click(parent));
  expect(parent).toHaveAttribute('aria-expanded', 'false');
  await act(async () => fireEvent.click(parent));
  expect(parent).toHaveAttribute('aria-expanded', 'true');
  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Child' })));
  expect(w.exposed()).toMatchObject({
    value: 'child-value',
    selectedItem: { label: 'Child', value: 'child-value', parentValue: key },
  });
});
