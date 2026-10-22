// Pure data: the events a data query fires (runtime dispatch in _stores/slices/eventsSlice.js).
// Single source of truth shared with backend validation - the server mirror lives in
// server/src/modules/app-validation/catalog/queries.json and
// frontend/src/AppBuilder/__tests__/validationCatalogParity.spec.js fails on any drift.
export const DATA_QUERY_EVENTS_META = {
  onDataQuerySuccess: { displayName: 'Query Success' },
  onDataQueryFailure: { displayName: 'Query Failure' },
};
