import { tableConfig } from '@tooljet/widget-definitions';
import useStore from '@/AppBuilder/_stores/store';
import { seedApp, componentDefinition, drainExposedValueBatch } from '@/test/app-builder';

const state = () => useStore.getState();

describe('Table-ADDROWFORM-005 add new row cancelled event', () => {
  afterEach(drainExposedValueBatch);

  test('Table-ADDROWFORM-005 is offered on the Table as "Add new row cancelled"', () => {
    // Break this catches: the event missing from the Table's event list, so builders cannot attach a handler.
    expect(tableConfig.events.onAddNewRowCancelled).toEqual({ displayName: 'Add new row cancelled' });
  });

  test('Table-ADDROWFORM-005 firing it runs the handlers attached to it', () => {
    // Break this catches: the event name missing from the event runner's list, so handlers silently never run.
    seedApp({ t1: componentDefinition('t1', 'table1', 'Table') });
    state().setEditorLoading(false, 'canvas');
    state().setCurrentMode('edit', 'canvas');
    state().eventsSlice.setEvents(
      [
        {
          id: 'evt-cancelled',
          name: 'onAddNewRowCancelled',
          index: 0,
          sourceId: 't1',
          target: 'component',
          event: {
            eventId: 'onAddNewRowCancelled',
            actionId: 'set-custom-variable',
            key: 'cancelledSeen',
            value: 'yes',
          },
        },
      ],
      'canvas'
    );

    state().eventsSlice.fireEvent('onAddNewRowCancelled', 't1', 'canvas', {}, {});

    expect(state().getVariable('cancelledSeen', 'canvas')).toBe('yes');
  });
});
