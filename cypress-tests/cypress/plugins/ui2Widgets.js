// Node side of the UI 2.0 browser QA suite (cypress/e2e/happyPath/appbuilder/ui2): reads the pack's widget configs
// (frontend/src/AppBuilder/WidgetManager/widgets/shad*.js, listed by shadcn.js) and the canvas grid constants, and
// hands them to the specs as Cypress.env("ui2Widgets"), so the data-driven cases are generated from the configs of
// the frontend under test. CYPRESS_ui2_frontend_dir points at another checkout's frontend/ (the one the stack you test
// serves); the default is this repo's own frontend/.
const fs = require("fs");
const path = require("path");

const evalConfig = (file) => {
  // Each config is one `export const xConfig = { ... };` with no imports.
  const src = fs.readFileSync(file, "utf8").replace(/export const \w+ =/, "module.exports =");
  const mod = { exports: {} };
  new Function("module", "exports", src)(mod, mod.exports); // eslint-disable-line no-new-func
  return mod.exports;
};

const loadUi2Widgets = (frontendDir) => {
  const widgetsDir = path.join(frontendDir, "src/AppBuilder/WidgetManager/widgets");
  const index = path.join(widgetsDir, "shadcn.js");
  if (!fs.existsSync(index)) return null;
  const src = fs.readFileSync(index, "utf8");
  // The pack's order: the shadcnConfigs array.
  const list = (src.match(/export const shadcnConfigs = \[([\s\S]*?)\];/) || [])[1] || "";
  const order = [...list.matchAll(/(shad\w+Config)/g)].map((m) => m[1]);
  const files = [...src.matchAll(/import \{ (shad\w+Config) \} from '\.\/(shad\w+)'/g)];
  const byName = Object.fromEntries(files.map(([, name, file]) => [name, path.join(widgetsDir, `${file}.js`)]));
  const configs = (order.length ? order : Object.keys(byName)).filter((n) => byName[n]).map((n) => evalConfig(byName[n]));
  const constants = fs.readFileSync(path.join(frontendDir, "src/AppBuilder/AppCanvas/appCanvasConstants.js"), "utf8");
  const num = (name) => Number((constants.match(new RegExp(`export const ${name} = (\\d+)`)) || [])[1]);
  return {
    source: frontendDir,
    gridHeight: num("GRID_HEIGHT"),
    gridColumns: num("NO_OF_GRIDS"),
    configs: configs.map((c) => ({
      name: c.name,
      component: c.component,
      displayName: c.displayName,
      defaultSize: c.defaultSize,
      propertyKeys: Object.keys(c.properties || {}),
      definition: c.definition,
      defaultChildren: c.defaultChildren,
    })),
  };
};

module.exports = (on, config) => {
  const dir = path.resolve(config.env.ui2_frontend_dir || path.join(__dirname, "../../../frontend"));
  const loaded = loadUi2Widgets(dir);
  if (loaded) config.env.ui2Widgets = loaded;
  return config;
};
