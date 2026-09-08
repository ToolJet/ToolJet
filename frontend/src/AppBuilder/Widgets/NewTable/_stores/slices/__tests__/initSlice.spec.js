/**
 * setTableProperties (initSlice.js) copies each named property onto
 * state.components[id].properties one line at a time - it is not a generic
 * spread of the incoming `properties` object. A property left out of that list
 * is silently dropped, however correctly it is configured everywhere upstream.
 *
 * defaultSortColumn/defaultSortDirection (tj-ee#2082) hit exactly this: the
 * default sort setting was configurable in the Inspector and resolved
 * correctly, but never reached the running table, because these two lines
 * were missing here.
 */
import useTableStore from '../../tableStore';

const state = () => useTableStore.getState();

describe('setTableProperties - defaultSortColumn/defaultSortDirection', () => {
  test('copies the configured default sort column and direction into table properties', () => {
    state().initializeComponent('t1');

    state().setTableProperties('t1', { defaultSortColumn: 'age', defaultSortDirection: 'desc' });

    expect(state().getTableProperties('t1').defaultSortColumn).toBe('age');
    expect(state().getTableProperties('t1').defaultSortDirection).toBe('desc');
  });

  test('defaults to no column and "auto" direction when not configured', () => {
    state().initializeComponent('t1');

    state().setTableProperties('t1', {});

    expect(state().getTableProperties('t1').defaultSortColumn).toBe('');
    expect(state().getTableProperties('t1').defaultSortDirection).toBe('auto');
  });
});
