/**
 * Rows per page is shown only while Enable pagination is on. Deciding that means resolving the
 * builder's expression, and an expression can reference another component — so it has to be
 * resolved against the live store, the way every other Inspector gate already is.
 */
jest.mock('../../Utils', () => ({
  renderElement: (component, componentMeta, paramUpdated, dataQueries, property) => property,
}));

import useStore from '@/AppBuilder/_stores/store';
import { seedApp, componentDefinition } from '@/test/app-builder';
import { baseComponentProperties } from '../../Components/DefaultComponent';

const LV_ID = 'lv1';
const state = () => useStore.getState();

function visibleProperties(enablePaginationExpression, serverSidePagination) {
  const component = {
    id: LV_ID,
    component: {
      component: 'Listview',
      definition: {
        properties: {
          enablePagination: { value: enablePaginationExpression },
          ...(serverSidePagination ? { serverSidePagination: { value: serverSidePagination } } : {}),
        },
      },
    },
  };
  const items = baseComponentProperties(
    ['data', 'enablePagination', 'serverSidePagination', 'rowsPerPage', 'totalRecords'],
    [],
    component,
    { properties: {} },
    () => {},
    () => {},
    [],
    {},
    () => {},
    [],
    {},
    {},
    false,
    [],
    [],
    LV_ID
  );
  return items.find((item) => item.title === 'Configure list item')?.children ?? [];
}

beforeEach(() => {
  seedApp({ tgl1: componentDefinition('tgl1', 'toggle1', 'ToggleSwitchV2') });
});

describe('Rows per page follows Enable pagination', () => {
  test('[Listview-BUG-031] Enable pagination bound to another component still shows Rows per page', () => {
    // Break this catches: resolving the expression with no state at all, so any reference to another
    // component comes back falsy and the field disappears from a correctly configured list.
    state().setExposedValue('tgl1', 'value', true);

    expect(visibleProperties('{{components.toggle1.value}}')).toContain('rowsPerPage');
  });

  test('[Listview-BUG-031] the same binding resolving to false still hides Rows per page', () => {
    // Guard, not a bug: the gate must keep gating, or the fix just shows the field always.
    state().setExposedValue('tgl1', 'value', false);

    expect(visibleProperties('{{components.toggle1.value}}')).not.toContain('rowsPerPage');
  });
});

describe('Pagination Type and Total records follow Enable pagination and Type', () => {
  test('[Listview-SRV-009] pagination off hides Type, Rows per page and Total records', () => {
    // Break this catches: showing pagination settings while the pager is off.
    const shown = visibleProperties('{{false}}', '{{true}}');

    expect(shown).not.toContain('serverSidePagination');
    expect(shown).not.toContain('rowsPerPage');
    expect(shown).not.toContain('totalRecords');
  });

  test('[Listview-SRV-009] client side shows Type and Rows per page but not Total records', () => {
    // Break this catches: asking for Total records on a list that counts its own data.
    const shown = visibleProperties('{{true}}', '{{false}}');

    expect(shown).toContain('serverSidePagination');
    expect(shown).toContain('rowsPerPage');
    expect(shown).not.toContain('totalRecords');
  });

  test('[Listview-SRV-009] a saved list without Type is client side: Total records stays hidden', () => {
    // Break this catches: treating a missing Type as server side.
    expect(visibleProperties('{{true}}')).not.toContain('totalRecords');
  });

  test('[Listview-SRV-009] server side shows Type, Rows per page and Total records', () => {
    // Break this catches: hiding Total records when it is the field server side needs.
    const shown = visibleProperties('{{true}}', '{{true}}');

    expect(shown).toEqual(expect.arrayContaining(['serverSidePagination', 'rowsPerPage', 'totalRecords']));
  });
});
