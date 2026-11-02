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

function visibleProperties(enablePaginationExpression) {
  const component = {
    id: LV_ID,
    component: {
      component: 'Listview',
      definition: { properties: { enablePagination: { value: enablePaginationExpression } } },
    },
  };
  const items = baseComponentProperties(
    ['data', 'enablePagination', 'rowsPerPage'],
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
  return items.find((item) => item.children)?.children ?? [];
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
