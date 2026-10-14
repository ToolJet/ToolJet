// No-drift contract between the editor's own definitions and the backend validation
// catalogs (server/src/modules/app-validation/catalog/*.json). The server validates every
// app write against those JSONs; this spec fails whenever either side changes alone.
// Same cross-tree pattern as the widget-config parity specs (e.g. Navigation).
import { ActionTypes } from '@/AppBuilder/RightSideBar/Inspector/ActionTypes';
import { PAGE_EVENTS_META } from '@/AppBuilder/RightSideBar/PageSettingsTab/PageMenu/pageEventsMeta';
import { DATA_QUERY_EVENTS_META } from '@/AppBuilder/QueryManager/dataQueryEvents';
import { NO_OF_GRIDS } from '@/AppBuilder/AppCanvas/appCanvasConstants';
import { validateQueryName, validateKebabCase } from '@/_helpers/utils';
import { widgets as frontendWidgets } from '@/AppBuilder/WidgetManager/configs/widgetConfig';

import { componentTypes as serverWidgets } from '../../../../server/src/modules/apps/services/widget-config';
import eventsCatalog from '../../../../server/src/modules/app-validation/catalog/events.json';
import pagesCatalog from '../../../../server/src/modules/app-validation/catalog/pages.json';
import queriesCatalog from '../../../../server/src/modules/app-validation/catalog/queries.json';
import componentsCatalog from '../../../../server/src/modules/app-validation/catalog/components.json';
import layoutsCatalog from '../../../../server/src/modules/app-validation/catalog/layouts.json';

describe('backend validation catalog parity', () => {
  it('knows exactly the actions the editor offers', () => {
    const editorActionIds = ActionTypes.map((action) => action.id).sort();
    expect([...eventsCatalog.actionIds].sort()).toEqual(editorActionIds);
  });

  it('only maps entity references for actions that exist', () => {
    const editorActionIds = new Set(ActionTypes.map((action) => action.id));
    for (const actionId of Object.keys(eventsCatalog.actionEntityRefs)) {
      expect(editorActionIds.has(actionId)).toBe(true);
    }
  });

  it('knows the events each page type fires', () => {
    const editorEventsByType = Object.fromEntries(
      Object.entries(PAGE_EVENTS_META).map(([type, meta]) => [type, Object.keys(meta.events)])
    );
    expect(pagesCatalog.eventsByType).toEqual(editorEventsByType);
  });

  it('knows the events a data query fires', () => {
    expect(queriesCatalog.events).toEqual(Object.keys(DATA_QUERY_EVENTS_META));
  });

  it('agrees with validateKebabCase on page handles', () => {
    const handlePattern = new RegExp(pagesCatalog.handlePattern);
    const samples = [
      'orders',
      'order-details',
      'a1-b2-c3',
      'Order Details',
      'order--details',
      '-orders',
      'orders-',
      'ORDERS',
      '42',
      '',
    ];
    for (const sample of samples) {
      expect(`${sample}: ${handlePattern.test(sample)}`).toBe(`${sample}: ${validateKebabCase(sample).isValid}`);
    }
  });

  it('agrees with validateQueryName on query and component names', () => {
    expect(componentsCatalog.namePattern).toBe(queriesCatalog.namePattern);
    const namePattern = new RegExp(queriesCatalog.namePattern);
    const samples = ['getOrders', 'get_orders-2', 'get orders', 'runQuery!', 'ordersTable', 'a.b', '42', 'ABC_def'];
    for (const sample of samples) {
      // validateQueryName uses a `*` quantifier, so it accepts ''; the backend rule only
      // ever sees non-empty names (emptiness is rejected separately), so compare non-empty.
      expect(`${sample}: ${namePattern.test(sample)}`).toBe(`${sample}: ${validateQueryName(sample)}`);
    }
  });

  it('matches the canvas column count', () => {
    expect(layoutsCatalog.canvasColumns).toBe(NO_OF_GRIDS);
  });

  it('knows every widget type the editor can place', () => {
    // The server validates component writes against its own widget-config registry
    // (app-validation/catalog/widgets.ts reads componentTypes). A widget shipped only in
    // the frontend would trip COMPONENT_UNKNOWN_TYPE on every save - and block PAT/MCP
    // writes outright - so the editor's widget list must be a subset of the server's.
    const serverTypes = new Set(serverWidgets.map((widget) => widget.component));
    const missing = frontendWidgets.map((widget) => widget.component).filter((type) => !serverTypes.has(type));
    expect(missing).toEqual([]);
  });
});
