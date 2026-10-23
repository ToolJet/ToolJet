/**
 * UI 2.0 Timeline: rows wired to onItemClicked are reachable and operable from the keyboard.
 *
 * Release audit (18 Oct), Codex's reviewTimelineKeyboard and reviewTimelineRefresh: a wired row showed a pointer
 * cursor but had no tab stop, role or key handler, so a keyboard user could neither reach it nor fire onItemClicked.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { binding, setVariableOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'tl1';
const w = createWidgetHarness({
  componentType: 'ShadTimeline',
  id: ID,
  handle: 'timeline1',
  widgetWidth: 500,
  widgetHeight: 250,
});
beforeEach(() => w.setup());
afterEach(w.teardown);

const ITEMS = '{{[{id:"a",title:"Alpha",time:"09:00"},{id:"b",title:"Beta",time:"11:30"}]}}';
const mount = async (wired = true) => {
  w.render({ currentMode: 'view', properties: { items: binding(ITEMS) } });
  await screen.findByText('Alpha');
  if (wired) {
    await act(async () =>
      w.setEvents(
        setVariableOn(ID, 'onItemClicked', {
          key: 'history',
          value: '{{[...(variables.history||[]),components.timeline1.lastClickedItem]}}',
        })
      )
    );
  }
};
const history = () => w.variables().history || [];

test.each(['{Enter}', ' '])('a wired row is reached with Tab and fires onItemClicked with %s', async (key) => {
  await mount();
  const user = userEvent.setup();
  await user.tab();
  expect(screen.getByRole('button', { name: /Alpha/ })).toHaveFocus();
  await user.keyboard(key);
  await waitFor(() => expect(history()).toHaveLength(1));
  expect(history()[0]).toMatchObject({ id: 'a', title: 'Alpha', index: 0 });
  await user.tab();
  await user.keyboard(key);
  await waitFor(() => expect(history()).toHaveLength(2));
  expect(history()[1]).toMatchObject({ id: 'b', index: 1 });
});

test('after a data refresh the keyboard fires the current record', async () => {
  await mount();
  w.setComponentProperty(ID, 'items', '{{[{id:"b",title:"Beta new",time:"14:00"}]}}', 'properties');
  const user = userEvent.setup();
  await user.click(await screen.findByText('Beta new'));
  await user.keyboard('{Enter}');
  await waitFor(() => expect(history()).toHaveLength(2));
  expect(history()[1]).toMatchObject({ id: 'b', title: 'Beta new', index: 0 });
});

test('a disabled timeline has no tab stops and fires nothing from the keyboard', async () => {
  await mount();
  await w.act('setDisable', true);
  expect(screen.queryByRole('button')).toBeNull();
  const user = userEvent.setup();
  await user.tab();
  await user.keyboard('{Enter}');
  expect(history()).toEqual([]);
});

test('a timeline without a workflow stays a passive list', async () => {
  await mount(false);
  expect(screen.getAllByRole('listitem')).toHaveLength(2);
  expect(screen.queryByRole('button')).toBeNull();
  await userEvent.setup().tab();
  expect(document.body).toHaveFocus();
});
