// ci-select-specs.js — pick the specs of a Cypress config that a change can affect.
//
//   node ci-select-specs.js <config file> <changed-files file>
//
// The changed-files file lists repo-root-relative paths, one per line (a submodule's
// own changes as `frontend/ee/<path>`; a bare `frontend/ee` means its changes are
// unknown). Prints one JSON line: { mode: "all" | "some" | "none", specs, reasons }.
// When in doubt a file selects every spec: a missed regression costs more than a run.
//
// Rules, first match wins, per changed file:
//   1. docs, agent context, Jest tests, other suites and workflows → nothing
//   2. this config, the Cypress support file and everything it imports, the CI
//      scripts, the EE image Dockerfile, package files → every spec
//   3. a spec of this config → that spec
//   4. another file under cypress-tests/cypress → the specs that import it, directly or
//      through helpers (non-JS files: the specs whose code names the file)
//   5. a widget's runtime or definition → that widget's spec folder (none if it has no
//      browser specs); shared widget code → every spec
//   6. anything else → every spec
const fs = require("fs");
const path = require("path");
const Module = require("module");

const CYPRESS_DIR = __dirname;
const REPO_ROOT = path.resolve(CYPRESS_DIR, "..");
const COMPONENTS_DIR = "cypress/e2e/happyPath/appbuilder/components";

const ALIASES = {
  // jsconfig.json paths
  "Fixtures/": "cypress/fixtures/",
  "Plugins/": "cypress/plugins/",
  "Support/": "cypress/support/",
  "Texts/": "cypress/constants/texts/",
  "Selectors/": "cypress/constants/selectors/",
  "Constants/": "cypress/constants/",
};

const IGNORED = [
  /\.md$/i,
  /^docs\//,
  /^\.agents\//,
  /^\.claude\//,
  /^\.cursor\//,
  /^marketplace\//, // own workflow (cypress-marketplace.yml)
  /(^|\/)__tests__\//,
  /\.(spec|test)\.[jt]sx?$/, // Jest; Cypress specs are *.cy.js
  /^\.github\/(?!workflows\/cypress-appbuilder\.yml$)/,
  /^frontend\/ee\/test\//, // widget contracts and the testing manifest
  /^cypress-tests\/cypress-(?!appbuilder\.config\.js$)[\w-]+\.config\.js$/, // other suites' configs
  /^cypress-tests\/(cypress-main|cypress-ci)\.Dockerfile$/,
  /^cypress-tests\/(cloud-ci\.compose\.yaml|cypress\.env\.\w+\.?example|cypress\.env\.example|proxy\.nginx|subpath\.nginx)$/,
  /^cypress-tests\/tools\//,
];

const GLOBAL = [
  /^cypress-tests\/(package(-lock)?\.json|jsconfig\.json|ci-shard\.js|ci-select-specs\.js|cy-ci-run\.js)$/,
  /^cypress-tests\/cypress-lts\.Dockerfile$/, // the image the suite runs against
  /^cypress-tests\/cypress\/plugins\//,
  /^\.github\/workflows\/cypress-appbuilder\.yml$/,
];

// Widget runtime/definition names whose spec folder has a different name; [] = no browser specs.
const WIDGET_SPEC_FOLDERS = {
  newtable: ["table"],
  phonecurrency: ["phoneInput", "currencyInput"],
  toggle: ["toggleSwitch"],
  togglev2: ["toggleSwitchV2"],
  drafteditor: ["richTextEditor"],
  tabnavitem: ["tabs"],
  librarycomponentdefaults: ["libraryComponent"],
  librarycomponentrevision: ["libraryComponent"],
  date: ["datePickerV2", "datetimePickerV2", "daterangePicker", "timePicker", "datePickerHappyPath.cy.js"],
  datepicker: ["datePickerHappyPath.cy.js"],
  modal: ["modalHappyPath.cy.js"],
  text: ["text", "textHappyPath.cy.js"],
  rating: [],
  plotlycompat: [], // Chart, which has no browser specs
};
// A changed file under frontend/src/AppBuilder/Widgets with one of these names is shared by many widgets.
const SHARED_WIDGET_CODE = new Set(["basecomponents", "componentutils", "hooks", "utils", "widgetharness"]);

const WIDGET_SOURCES = [
  /^frontend\/src\/AppBuilder\/Widgets\/([^/]+?)(?:\.[a-z]+)?(?:\/|$)/,
  /^frontend\/src\/AppBuilder\/WidgetManager\/widgets\/([^/]+?)\.[a-z]+$/,
  /^packages\/widget-definitions\/src\/widgets\/([^/]+?)\.[a-z]+$/,
  /^server\/src\/modules\/apps\/services\/widget-config\/([^/]+?)\.[a-z]+$/,
];

const toPosix = (p) => p.split(path.sep).join("/");

// The config's top-level requires include packages the selecting job does not install
// (pg, pdf-parse, …); only `defineConfig` (an identity function) is used at load time.
function loadConfig(configFile) {
  const load = Module._load;
  Module._load = function (request, ...rest) {
    try {
      return load.call(this, request, ...rest);
    } catch (error) {
      if (error.code !== "MODULE_NOT_FOUND" || request.startsWith(".")) throw error;
      return { defineConfig: (config) => config };
    }
  };
  try {
    return require(path.resolve(CYPRESS_DIR, configFile));
  } finally {
    Module._load = load;
  }
}

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function listSpecs(configFile) {
  const { expandPattern } = require("./ci-shard");
  const config = loadConfig(configFile);
  const cwd = process.cwd();
  process.chdir(CYPRESS_DIR); // spec patterns are relative to cypress-tests
  try {
    return [...new Set([].concat(config.e2e.specPattern).flatMap(expandPattern))];
  } finally {
    process.chdir(cwd);
  }
}

// cypress-tests-relative JS file → the cypress-tests-relative files it imports
function importGraph() {
  const files = walk(path.join(CYPRESS_DIR, "cypress"))
    .map((f) => toPosix(path.relative(CYPRESS_DIR, f)))
    .filter((f) => f.endsWith(".js"));
  const exists = new Set(files);
  const resolve = (from, spec) => {
    let base;
    const alias = Object.keys(ALIASES).find((a) => spec.startsWith(a));
    if (alias) base = ALIASES[alias] + spec.slice(alias.length);
    else if (spec.startsWith(".")) base = path.posix.normalize(path.posix.join(path.posix.dirname(from), spec));
    else return null; // a package
    return [base, `${base}.js`, `${base}/index.js`].find((candidate) => exists.has(candidate)) || null;
  };
  const importRe = /(?:import|export)\s[^'"`;]*?from\s*['"]([^'"]+)['"]|import\s*['"]([^'"]+)['"]|require\(\s*['"]([^'"]+)['"]\s*\)/g;
  const graph = new Map();
  for (const file of files) {
    const source = fs.readFileSync(path.join(CYPRESS_DIR, file), "utf8");
    const deps = new Set();
    for (const m of source.matchAll(importRe)) {
      const target = resolve(file, m[1] || m[2] || m[3]);
      if (target) deps.add(target);
    }
    graph.set(file, deps);
  }
  return graph;
}

function closure(graph, start) {
  const seen = new Set([start]);
  const stack = [start];
  while (stack.length) {
    for (const dep of graph.get(stack.pop()) || []) {
      if (!seen.has(dep)) {
        seen.add(dep);
        stack.push(dep);
      }
    }
  }
  return seen;
}

function selectSpecs(configFile, changedFiles) {
  const specs = listSpecs(configFile);
  const graph = importGraph();
  const config = loadConfig(configFile);
  const supportFile = config.e2e.supportFile || "cypress/support/e2e.js";
  const globalCypressFiles = closure(graph, supportFile);
  const reach = new Map(specs.map((spec) => [spec, closure(graph, spec)]));
  const configPath = `cypress-tests/${toPosix(configFile)}`;
  const componentFolders = fs
    .readdirSync(path.join(CYPRESS_DIR, COMPONENTS_DIR), { withFileTypes: true })
    .map((entry) => entry.name);

  const selected = new Set();
  const reasons = [];
  let all = false;
  const everything = (file, why) => {
    all = true;
    reasons.push(`${file}: every spec (${why})`);
  };
  const add = (file, list, why) => {
    list.forEach((spec) => selected.add(spec));
    reasons.push(`${file}: ${list.length} spec(s) (${why})`);
  };
  const specsUsing = (cypressFile) => specs.filter((spec) => reach.get(spec).has(cypressFile));
  const folderSpecs = (folder) => {
    const prefix = `${COMPONENTS_DIR}/${folder}`;
    return specs.filter((spec) => spec === prefix || spec.startsWith(`${prefix}/`));
  };

  for (const file of changedFiles) {
    if (IGNORED.some((re) => re.test(file))) {
      reasons.push(`${file}: no spec (not tested by this suite)`);
      continue;
    }
    if (file === configPath || GLOBAL.some((re) => re.test(file))) {
      everything(file, "suite-wide file");
      continue;
    }
    if (file.startsWith("cypress-tests/cypress/")) {
      const cypressFile = file.slice("cypress-tests/".length);
      if (globalCypressFiles.has(cypressFile)) {
        everything(file, "loaded by the support file");
      } else if (specs.includes(cypressFile)) {
        add(file, [cypressFile], "changed spec");
      } else if (cypressFile.endsWith(".js")) {
        add(file, specsUsing(cypressFile), "imported by");
      } else {
        // a fixture: the specs whose code, or whose helpers' code, names it
        const name = path.posix.basename(cypressFile);
        const namers = [...graph.keys()].filter((f) => fs.readFileSync(path.join(CYPRESS_DIR, f), "utf8").includes(name));
        if (namers.some((f) => globalCypressFiles.has(f))) everything(file, "used by the support file");
        else add(file, specs.filter((spec) => namers.some((f) => reach.get(spec).has(f))), "fixture used by");
      }
      continue;
    }
    const widget = WIDGET_SOURCES.map((re) => file.match(re)).find(Boolean);
    if (widget) {
      const key = widget[1].toLowerCase().replace(/\.(scss|css)$/, "");
      if (SHARED_WIDGET_CODE.has(key)) {
        everything(file, "shared widget code");
        continue;
      }
      const folders = WIDGET_SPEC_FOLDERS[key] || componentFolders.filter((f) => f.toLowerCase() === key);
      const isWidget = key in WIDGET_SPEC_FOLDERS || folders.length || isWidgetDefinition(key);
      if (!isWidget) everything(file, "not a known widget");
      else add(file, folders.flatMap(folderSpecs), "widget spec folder");
      continue;
    }
    everything(file, "outside the mapped areas");
  }

  if (all) return { mode: "all", specs, reasons };
  const picked = specs.filter((spec) => selected.has(spec)); // config order
  return { mode: picked.length ? "some" : "none", specs: picked, reasons };
}

function isWidgetDefinition(key) {
  const dir = path.join(REPO_ROOT, "packages/widget-definitions/src/widgets");
  return fs.existsSync(dir) && fs.readdirSync(dir).some((f) => f.replace(/\.[a-z]+$/, "").toLowerCase() === key);
}

module.exports = { selectSpecs };

if (require.main === module) {
  const [configFile, listFile] = process.argv.slice(2);
  const changed = fs
    .readFileSync(listFile, "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  process.stdout.write(`${JSON.stringify(selectSpecs(configFile, changed))}\n`);
}
