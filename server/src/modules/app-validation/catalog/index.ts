// Single source of truth for pattern- and list-type validation data, one JSON per entity.
// Each JSON's `$sources` names the frontend file it mirrors;
// frontend/src/AppBuilder/__tests__/validationCatalogParity.spec.js fails on any drift.
import * as componentsCatalog from './components.json';
import * as layoutsCatalog from './layouts.json';
import * as pagesCatalog from './pages.json';
import * as queriesCatalog from './queries.json';

export * from './widgets';
export * from './actions';

// components.json
export const COMPONENT_NAME_PATTERN = new RegExp(componentsCatalog.namePattern);
export const DYNAMIC_EVENT_SOURCES: ReadonlySet<string> = new Set(componentsCatalog.dynamicEventSources);

// pages.json
export const PAGE_HANDLE_PATTERN = new RegExp(pagesCatalog.handlePattern);
export const PAGE_EVENT_IDS_BY_TYPE: Record<string, readonly string[]> = pagesCatalog.eventsByType;

// queries.json
export const QUERY_NAME_PATTERN = new RegExp(queriesCatalog.namePattern);
export const DATA_QUERY_EVENT_IDS: readonly string[] = queriesCatalog.events;

// layouts.json
export const LAYOUT_TYPES: readonly string[] = layoutsCatalog.types;
export const LAYOUT_POSITION_FIELDS: readonly string[] = layoutsCatalog.positionFields;
export const LAYOUT_SIZE_FIELDS: readonly string[] = layoutsCatalog.sizeFields;
export const LAYOUT_NUMERIC_FIELDS: readonly string[] = [
  ...layoutsCatalog.positionFields,
  ...layoutsCatalog.sizeFields,
  ...layoutsCatalog.extraNumericFields,
];
