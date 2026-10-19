/**
 * UI 2.0 Kanban: changing the id field never hands one card's custom-card state to another record. From the Codex
 * audit (KANBAN-IDENTITY-DEFINITION, auditKanbanIdentityFieldTransition.spec.jsx): cards are keyed by their id, and
 * when idField changed to a field whose values reuse the other records' ids (Alpha's code is Beta's id), what was
 * typed on Alpha, Alpha's retained actions and a workflow reading the board all moved to Beta. A new id field now
 * starts the cards over; a refresh under the same id field still keeps each card's draft.
 */
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { componentDefinition } from '@/test/app-builder';
import { binding, setVariableOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const w = createWidgetHarness({
  componentType: 'ShadKanban',
  id: 'board1',
  handle: 'board1',
  widgetHeight: 500,
  widgetWidth: 900,
  capabilities: { dnd: true },
  preload: ['ShadInput', 'ShadButton'],
});
// Unique under each field, but `code` reuses the other record's `id`.
const rows = [
  { id: 'a', code: 'b', alternate: 'new-a', title: 'Alpha', status: 'todo' },
  { id: 'b', code: 'a', alternate: 'new-b', title: 'Beta', status: 'todo' },
];
let width, host;
beforeAll(() => {
  width = Object.getOwnPropertyDescriptor(Element.prototype, 'clientWidth');
  Object.defineProperty(Element.prototype, 'clientWidth', { configurable: true, get: () => 600 });
});
afterAll(() => {
  if (width) Object.defineProperty(Element.prototype, 'clientWidth', width);
  else delete Element.prototype.clientWidth;
});
beforeEach(async () => {
  host = document.createElement('div');
  host.className = 'canvas-content';
  host.innerHTML = '<div class="tj-canvas-area real-canvas"></div>';
  document.body.appendChild(host);
  await w.setup();
});
afterEach(() => {
  w.teardown();
  host.remove();
});

/** Each card has an Input labelled with its title and a constant empty default (so no record-bound reset hides a
 *  transfer); a Button outside the board reads the board. */
const mount = async () => {
  const field = componentDefinition('field1', 'field1', 'ShadInput', {
    label: binding('{{cardData.title}}'),
    defaultValue: binding(''),
  });
  field.component.parent = 'board1';
  field.component.definition.others = { showOnDesktop: binding('{{true}}'), showOnMobile: binding('{{false}}') };
  field.layouts = { desktop: { top: 0, left: 0, width: 20, height: 80 } };
  const read = componentDefinition('read1', 'read1', 'ShadButton', { text: binding('Read Beta draft') });
  w.render({
    currentMode: 'view',
    extraComponents: { field1: field, read1: read },
    also: [{ id: 'read1', componentType: 'ShadButton', widgetWidth: 160, widgetHeight: 40 }],
    properties: {
      data: binding(`{{${JSON.stringify(rows)}}}`),
      idField: binding('id'),
      titleField: binding('title'),
      statusField: binding('status'),
      cardLayout: binding('custom'),
      cardHeight: binding('{{100}}'),
      columns: binding('{{["todo","done"]}}'),
    },
  });
  await screen.findByRole('textbox', { name: 'Alpha' });
  await waitFor(() => expect(w.exposed().children?.[1]?.field1?.value).toBe(''));
};
const typeOnAlpha = () =>
  act(async () =>
    fireEvent.change(screen.getByRole('textbox', { name: 'Alpha' }), { target: { value: 'Alpha draft' } })
  );
const setIdField = (field) => act(async () => w.setComponentProperty('board1', 'idField', field, 'properties'));
const cardState = (title, row) => ({
  visible: screen.getByRole('textbox', { name: title }).value,
  exposed: w.exposed().children[row].field1.value,
});

test.each(['id', 'alternate', 'code'])('idField=%s never moves Alpha draft to Beta', async (field) => {
  await mount();
  await typeOnAlpha();
  await setIdField(field);
  expect(cardState('Beta', 1)).toEqual({ visible: '', exposed: '' });
});

test('a new id field starts the cards over, and their new actions act on their own card', async () => {
  await mount();
  await typeOnAlpha();
  await setIdField('code');
  await waitFor(() => expect(cardState('Alpha', 0)).toEqual({ visible: '', exposed: '' }));
  await act(async () => w.exposed().children[0].field1.setText('Alpha again'));
  expect(cardState('Alpha', 0)).toEqual({ visible: 'Alpha again', exposed: 'Alpha again' });
  expect(cardState('Beta', 1)).toEqual({ visible: '', exposed: '' });
  // And back again.
  await setIdField('id');
  await waitFor(() => expect(cardState('Alpha', 0)).toEqual({ visible: '', exposed: '' }));
  expect(cardState('Beta', 1)).toEqual({ visible: '', exposed: '' });
});

test('a reorder under the same id field keeps Alpha draft with Alpha', async () => {
  await mount();
  await typeOnAlpha();
  await act(async () =>
    w.setComponentProperty('board1', 'data', `{{${JSON.stringify([...rows].reverse())}}}`, 'properties')
  );
  expect(cardState('Alpha', 1)).toEqual({ visible: 'Alpha draft', exposed: 'Alpha draft' });
  expect(cardState('Beta', 0)).toEqual({ visible: '', exposed: '' });
});

test('an action Alpha kept from before the change cannot set Beta', async () => {
  await mount();
  const retained = w.exposed().children[0].field1.setText;
  await setIdField('code');
  await act(async () => retained('From old Alpha action'));
  expect(cardState('Beta', 1)).toEqual({ visible: '', exposed: '' });
});

test.each(['id', 'code'])('a workflow after idField=%s reads Beta with its own value', async (field) => {
  await mount();
  await typeOnAlpha();
  await act(async () =>
    w.setEvents(
      setVariableOn('read1', 'onClick', {
        key: 'capture',
        value:
          '{{({record:components.board1.updatedCardData[1].title,draft:components.board1.children[1].field1.value})}}',
      })
    )
  );
  await setIdField(field);
  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Read Beta draft' })));
  expect(w.variables().capture).toEqual({ record: 'Beta', draft: '' });
});

test('the selected card does not become the record that took its key', async () => {
  await mount();
  await act(async () =>
    fireEvent.click(screen.getByRole('textbox', { name: 'Alpha' }).closest('[aria-roledescription]'))
  );
  expect(w.exposed().lastSelectedCard).toMatchObject({ title: 'Alpha' });
  await setIdField('code');
  await act(async () => {});
  expect(w.exposed().lastSelectedCard?.title).not.toBe('Beta');
});
