// The UI 2.0 widgets under test, read from the pack's own configs (frontend/src/AppBuilder/WidgetManager/widgets/
// shad*.js) by cypress/plugins/ui2Widgets.js and handed over as Cypress.env("ui2Widgets"), so a widget added to the
// pack gets every data-driven case without an edit here, and the sizes match the frontend under test
// (CYPRESS_ui2_frontend_dir when the stack serves another checkout).
import { cyParamName } from "Selectors/common";

const loaded = Cypress.env("ui2Widgets");
if (!loaded || !loaded.configs?.length) {
  throw new Error(
    "UI 2.0 widget configs not loaded: cypress/plugins/ui2Widgets.js found no frontend/src/AppBuilder/WidgetManager/widgets/shadcn.js (set CYPRESS_ui2_frontend_dir)"
  );
}

/** One grid row in px (GRID_HEIGHT in AppCanvas/appCanvasConstants.js): every widget height should be a multiple. */
export const GRID_ROW = loaded.gridHeight;
export const GRID_COLUMNS = loaded.gridColumns;
export const CONFIG_SOURCE = loaded.source;

/** The base of a widget's canvas name, as computeComponentName makes it: ShadLineChart -> linechart. */
const baseOf = (type) => type.replace(/^Shad(?=[A-Z])/, "").toLowerCase();

const describeWidget = (config) => ({
  type: config.component,
  displayName: config.displayName,
  base: baseOf(config.component),
  // The components panel item: `widget-list-box-<cyParamName(displayName)>`, which dragAndDropWidget drags.
  paletteId: cyParamName(config.displayName),
  defaultSize: config.defaultSize,
  hasDynamicHeight: config.propertyKeys.includes("dynamicHeight"),
  hasLoading: config.propertyKeys.includes("loadingState"),
  config,
});

const ALL = loaded.configs.map(describeWidget);

/**
 * The widgets a run covers. `CYPRESS_ui2_only=ShadSwitch,ShadTabs` narrows it (for debugging one widget); the default
 * is every widget in the pack.
 */
export const ui2Widgets = () => {
  const only = String(Cypress.env("ui2_only") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return only.length ? ALL.filter((w) => only.includes(w.type)) : ALL;
};

export const widgetByType = (type) => ALL.find((w) => w.type === type);
