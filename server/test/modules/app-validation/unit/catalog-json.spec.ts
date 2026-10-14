import * as componentsCatalog from '@modules/app-validation/catalog/components.json';
import * as eventsCatalog from '@modules/app-validation/catalog/events.json';
import * as layoutsCatalog from '@modules/app-validation/catalog/layouts.json';
import * as pagesCatalog from '@modules/app-validation/catalog/pages.json';
import * as queriesCatalog from '@modules/app-validation/catalog/queries.json';
import {
  ACTION_ENTITY_REFS,
  COMPONENT_NAME_PATTERN,
  DATA_QUERY_EVENT_IDS,
  EVENT_ACTION_IDS,
  PAGE_HANDLE_PATTERN,
  QUERY_NAME_PATTERN,
} from '@modules/app-validation/catalog';

// The frontend side of the no-drift contract lives in
// frontend/src/AppBuilder/__tests__/validationCatalogParity.spec.js.
describe('app-validation JSON catalogs', () => {
  it('compiles the name and handle patterns', () => {
    expect(COMPONENT_NAME_PATTERN.test('orders_table-2')).toBe(true);
    expect(COMPONENT_NAME_PATTERN.test('bad name')).toBe(false);
    expect(QUERY_NAME_PATTERN.test('getOrders')).toBe(true);
    expect(QUERY_NAME_PATTERN.test('get orders')).toBe(false);
    expect(PAGE_HANDLE_PATTERN.test('order-details')).toBe(true);
    expect(PAGE_HANDLE_PATTERN.test('Order Details')).toBe(false);
    expect(PAGE_HANDLE_PATTERN.test('a--b')).toBe(false);
  });

  it('only maps entity references for known actions', () => {
    const ids = new Set(EVENT_ACTION_IDS);
    for (const actionId of Object.keys(ACTION_ENTITY_REFS)) {
      expect(ids.has(actionId)).toBe(true);
    }
  });

  it('references real entity kinds and non-empty fields', () => {
    for (const ref of Object.values(ACTION_ENTITY_REFS)) {
      expect(['query', 'component', 'page']).toContain(ref.entity);
      expect(ref.field.length).toBeGreaterThan(0);
    }
  });

  it('keeps the catalog lists non-empty and duplicate-free', () => {
    for (const list of [
      eventsCatalog.actionIds,
      eventsCatalog.targets,
      queriesCatalog.events,
      componentsCatalog.dynamicEventSources,
      layoutsCatalog.types,
      layoutsCatalog.positionFields,
      layoutsCatalog.sizeFields,
    ]) {
      expect(list.length).toBeGreaterThan(0);
      expect(new Set(list).size).toBe(list.length);
    }
    expect(DATA_QUERY_EVENT_IDS).toEqual(queriesCatalog.events);
    expect(Object.keys(pagesCatalog.eventsByType)).toEqual(['default', 'custom']);
  });
});
