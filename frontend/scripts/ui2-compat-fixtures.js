#!/usr/bin/env node
// Writes one release's saved-app fixtures for the UI 2.0 backward-compatibility spec
// (Widgets/Ui2/__tests__/compat/fixtures/<release>/<Type>.json), one per widget, in the shape an exported app carries
// (pages, components, events, dataQueries; what import and the data migrations rewrite). Each fixture is a page with:
//  - the widget, with non-default properties and styles, saved as the editor saves them ({ key: { value } });
//  - a handler on every event the widget had, running a control-component action on a marker button;
//  - a trigger button whose click handlers call every action the widget had, with arguments;
//  - a text whose binding reads every exposed value the widget had, by component id (as the editor stores it);
//  - a RunJS query that calls every action and reads every exposed value by component name.
// The names are the ones that release's configs had. (For pre-rename: every event and action saved apps on the local
// copy of staging used on these widgets, 16 Oct 2026, is in those configs.) A fixture set is written once per release and never edited or
// deleted: the spec checks each file against the checksum in fixtures/manifest.json.
//
//   node scripts/ui2-compat-fixtures.js <release> [--configs-from <git ref>] [--provenance <text>] [--only ShadX,ShadY]
//
// Then record what the widgets expose: UI2_COMPAT_RECORD=1 npx jest Widgets/Ui2/__tests__/compat/savedApps
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const hook = require('./ui2-require-hook');

const ROOT = path.resolve(__dirname, '..');
const FIXTURES = path.join(ROOT, 'src/AppBuilder/Widgets/Ui2/__tests__/compat/fixtures');
const WIDGETS = 'frontend/src/AppBuilder/WidgetManager/widgets';
const SCHEMA_VERSION = 1;

const args = process.argv.slice(2);
const option = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
const release = args[0];
if (!release || release.startsWith('--')) {
  console.error('usage: node scripts/ui2-compat-fixtures.js <release> [--configs-from <git ref>] [--only ShadX]');
  process.exit(1);
}
const configsFrom = option('--configs-from');
const only = option('--only')?.split(',');

/** The release's configs: this tree's, or those of a commit (written to a temporary folder and required from there). */
function loadConfigs() {
  if (!configsFrom) return require('../src/AppBuilder/WidgetManager/widgets/shadcn').shadcnConfigs;
  const git = (...a) =>
    execFileSync('git', a, { cwd: path.resolve(ROOT, '..'), encoding: 'utf8', maxBuffer: 64 << 20 });
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ui2-configs-'));
  hook.allow(dir);
  for (const file of git('ls-tree', '--name-only', `${configsFrom}:${WIDGETS}`).split('\n')) {
    if (/^shad\w*\.js$/.test(file))
      fs.writeFileSync(path.join(dir, file), git('show', `${configsFrom}:${WIDGETS}/${file}`));
  }
  return require(path.join(dir, 'shadcn.js')).shadcnConfigs;
}

// Values a widget's actions are called with, where the config's own parameter default says nothing useful. Saved as
// the editor saves a parameter: plain text, or {{ expression }}.
const ARGS = {
  ShadButtonGroup: { setSelected: ['month'] },
  ShadCarousel: { goTo: ['{{1}}'] },
  ShadQuestionnaire: { goTo: ['{{1}}'] },
  ShadPagination: { setPage: ['{{3}}'] },
  ShadCalendar: { selectDate: ['2026-06-18', ''], setMonth: ['2026-07-01'] },
  ShadNavigation: {
    selectItem: ['orders'],
    setActive: ['orders'],
    setItemVisibility: ['reports', '{{false}}'],
    setItemDisable: ['customers', '{{true}}'],
  },
  ShadImage: { setImageURL: ['https://picsum.photos/seed/tj-saved/640/360'] },
  ShadLink: { setLinkTarget: ['https://example.com/saved'], setLinkText: ['Saved link'] },
  ShadSteps: { setStepVisible: ['{{4}}', '{{false}}'], setStepDisable: ['{{3}}', '{{true}}'] },
  ShadCurrencyInput: { setValue: ['{{1234.5}}', 'EUR'] },
  ShadDateTimePicker: {
    setValue: ['2026-06-18 14:30', 'YYYY-MM-DD HH:mm'],
    setDate: ['2026-06-18 14:30', 'YYYY-MM-DD HH:mm'],
    setValueInTimestamp: ['{{1781000000000}}'],
    setTime: ['09:15', 'HH:mm'],
    setMinDate: ['2026-01-01'],
    setMaxDate: ['2026-12-31'],
  },
  ShadNumberInput: { setText: ['{{42}}'], setValue: ['{{42}}'] },
  ShadOtpInput: { setText: ['1234'] },
  ShadPasswordInput: { setText: ['s3cret-saved'] },
  ShadPhoneInput: { setValue: ['2025550143', 'US'], setCountryCode: ['GB'], setCountry: ['GB'] },
  ShadTimePicker: {
    setValue: ['09:15', 'HH:mm'],
    setTime: ['09:15', 'HH:mm'],
    setMinTime: ['08:00'],
    setMaxTime: ['18:00'],
  },
  ShadAccordion: { expand: ['{{1}}'], collapse: ['{{1}}'] },
  ShadDatePicker: {
    setValue: ['2026-06-18', 'YYYY-MM-DD'],
    setDate: ['2026-06-18', 'YYYY-MM-DD'],
    setValueInTimestamp: ['{{1781000000000}}'],
    setStartDate: ['2026-06-10', 'YYYY-MM-DD'],
    setEndDate: ['2026-06-20', 'YYYY-MM-DD'],
    setDateRange: ['2026-06-01', '2026-06-07', 'YYYY-MM-DD'],
    setMinDate: ['2026-01-01'],
    setMaxDate: ['2026-12-31'],
    setDisabledDates: ["{{['2026-06-25']}}"],
  },
  ShadHeading: { setText: ['Saved heading'] },
  ShadInput: { setText: ['Saved text'] },
  ShadKanban: {
    addCard: ["{{{ id: 9, title: 'Saved card', status: 'todo' }}}", 'todo'],
    moveCard: ['{{1}}', 'done'],
    updateCard: ['{{2}}', "{{{ title: 'Renamed card' }}}"],
    updateCardData: ['{{2}}', "{{{ title: 'Renamed card' }}}"],
    deleteCard: ['{{3}}'],
  },
  ShadRadioGroup: { selectOption: ['Premium'] },
  ShadSelect: { selectOption: ['{{2}}'] },
  ShadStat: { setPrimaryValue: ['$12,400'], setSecondaryValue: ['+8% on last month'] },
  ShadText: { setText: ['Saved text'] },
  ShadTextarea: { setText: ['Saved notes'] },
  ShadToggleGroup: { setSelected: ['Open'] },
  ShadListView: { selectItem: ['{{2}}'] },
  ShadTabs: {
    setTab: ['t1'],
    setTabDisable: ['t2', '{{true}}'],
    setTabLoading: ['t2', '{{false}}'],
    setTabVisibility: ['t2', '{{true}}'],
  },
  ShadMap: { selectMarker: ['S-101'], setMapStyle: ['streets'] },
  ShadChat: {
    appendHistory: ["{{{ message: 'Saved message', type: 'response' }}}"],
    sendMessage: ["{{{ message: 'Hello from a saved app' }}}"],
    setError: ['Saved error'],
    setHistory: ["{{[{ message: 'Earlier message', type: 'message' }]}}"],
    setResponderAvatar: ['https://picsum.photos/seed/tj-bot/64/64'],
    setUserAvatar: ['https://picsum.photos/seed/tj-user/64/64'],
  },
  ShadCombobox: { selectOption: ['ca'] },
  ShadFileUpload: { setFileName: ['{{0}}', 'saved.csv'] },
  ShadMultiselect: { selectOptions: ["{{['sales']}}"], deselectOptions: ["{{['design']}}"] },
  ShadTagsInput: { setTags: ["{{['saved', 'tags']}}"], selectTags: ["{{['node']}}"], deselectTags: ["{{['react']}}"] },
  ShadTable: {
    selectRow: ['id', '{{2}}'],
    selectRows: ['id', '{{[1, 3]}}'],
    deselectRows: ['id', '{{[3]}}'],
    setSort: ['amount', 'desc'],
    setSearchText: ['Ada'],
  },
};

// Actions a fixture does not call: they hand the browser a file, which jsdom cannot.
const SKIPPED_ACTIONS = new Set(['downloadChat', 'downloadTableData']);

/** The three control actions every widget has, by the names this release's configs give them. */
const CONTROL = [
  { names: ['loading', 'setLoading'], exposed: 'isLoading', on: '{{true}}', off: '{{false}}' },
  { names: ['disable', 'setDisable'], exposed: 'isDisabled', on: '{{true}}', off: '{{false}}' },
  { names: ['visibility', 'setVisibility'], exposed: 'isVisible', on: '{{false}}', off: '{{true}}' },
];

const KEEP = new Set([
  'visibility',
  'disabledState',
  'loadingState',
  'collapseWhenHidden',
  'dynamicHeight',
  'tooltipFormat',
  'autoplay',
  'loop',
  'useDynamicOptions',
]);
// Switches that change what a widget does rather than how it looks (server-side modes, gates, a picker's mode, a
// loading flag) keep the value a new widget has, so its actions run their usual path.
const BEHAVIOUR =
  /^(serverSide|enable|allow|disable|loading|optionsLoading|max(Selections|Tags|Files)$)|^(mode|multiple|cardLayout|hideTabs|collapsed|stepsSelectable|linearSteps|renderOnlyActiveTab|parseContent|pickLocation|totalRecords|isCountryChangeEnabled|selectionMode)$/;
const TEXTUAL =
  /label|title|text|description|placeholder|caption|heading|subtitle|message|tooltip|empty|helper|header|footer/i;
const PALETTE = ['#0f766e', '#7c3aed', '#b45309', '#be123c', '#1d4ed8', '#4d7c0f', '#a21caf', '#0369a1', '#c2410c'];

/** A deterministic id, so a regenerated fixture is byte-identical. */
const uuid = (...parts) => {
  const h = crypto.createHash('sha1').update(parts.join('/')).digest('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
};
const lowerFirst = (s) => s[0].toLowerCase() + s.slice(1);
const options = (def) => (def.options || []).map((o) => (typeof o === 'object' ? o.value : o));

/** The value a builder might have saved instead of the one a new widget starts with. */
function savedProperty(key, def, created) {
  const value = created?.value;
  if (KEEP.has(key) || BEHAVIOUR.test(key) || value === undefined) return value;
  if (value === '{{true}}' || value === '{{false}}') return value === '{{true}}' ? '{{false}}' : '{{true}}';
  const choices = options(def);
  if (choices.length > 1) return choices.find((c) => c !== value && String(c) !== String(value)) ?? value;
  const number = /^\{\{(-?\d+(\.\d+)?)\}\}$/.exec(String(value));
  if (number && !/index|interval|current/i.test(key)) return `{{${Number(number[1]) + 1}}}`;
  if (typeof value === 'string' && !value.includes('{{') && TEXTUAL.test(key))
    return value ? `${value} (saved)` : `Saved ${key}`;
  return value;
}

function savedStyle(key, def, created, index) {
  const value = created?.value;
  switch (def.type) {
    case 'colorSwatches':
    case 'color':
      return PALETTE[index % PALETTE.length];
    case 'numberInput':
    case 'number':
      return String(Number(String(value ?? '').replace(/[{}]/g, '')) + 2 || 6);
    case 'boxShadow':
      return '0px 4px 12px 0px #0f172a1f';
    case 'toggle':
      return value === '{{true}}' ? '{{false}}' : '{{true}}';
    default: {
      const choices = options(def);
      return choices.find((c) => c !== value) ?? value;
    }
  }
}

const bucket = (entries) =>
  Object.fromEntries(entries.filter(([, v]) => v !== undefined).map(([k, v]) => [k, { value: v }]));

/** A saved value as a JavaScript expression, for the RunJS query. */
const asJs = (value) => {
  const m = /^\{\{([\s\S]*)\}\}$/.exec(String(value));
  return m ? m[1].trim() : JSON.stringify(value);
};

function fixtureFor(config, byName) {
  const type = config.name;
  const base = lowerFirst(type.replace(/^Shad/, ''));
  const id = (...role) => uuid(release, type, ...role);
  const versionId = id('version');
  const pageId = id('page');
  const widget = { id: id('widget'), name: `${base}1` };
  const probe = { id: id('probe'), name: 'savedBindings' };
  const marker = { id: id('marker'), name: 'eventMarker' };
  const trigger = { id: id('trigger'), name: 'runActions' };
  const queryId = id('query');

  const def = config.definition || {};
  const component = (c, cType, { properties = {}, styles = {}, validation = {}, top = 0, height = 40 }) => ({
    id: c.id,
    name: c.name,
    type: cType,
    pageId,
    parent: null,
    properties,
    general: {},
    styles,
    generalStyles: {},
    validation,
    displayPreferences: { showOnDesktop: { value: '{{true}}' }, showOnMobile: { value: '{{false}}' } },
    layouts: { desktop: { top, left: 0, width: 20, height } },
  });

  // The editor saves every key of the definition, including those the inspector does not list (Tabs' tabItems).
  const keys = (inspector, created) => [...new Set([...Object.keys(created || {}), ...Object.keys(inspector || {})])];
  const properties = bucket(
    keys(config.properties, def.properties).map((k) => [
      k,
      savedProperty(k, config.properties?.[k] ?? {}, def.properties?.[k]),
    ])
  );
  const styles = bucket(
    keys(config.styles, def.styles).map((k, i) => [k, savedStyle(k, config.styles?.[k] ?? {}, def.styles?.[k], i)])
  );
  const validation = bucket(Object.entries(def.validation || {}).map(([k, v]) => [k, v.value]));

  const button = byName.ShadButton;
  const controlName = (c) => c.names.find((n) => button.actions.some((a) => a.handle === n));
  const handler = (sourceId, eventId, index, event) => ({
    id: id('handler', sourceId, eventId, index),
    name: eventId,
    index,
    sourceId,
    target: 'component',
    appVersionId: versionId,
    event: { eventId, ...event },
  });
  const control = (componentId, handle, params, values) => ({
    actionId: 'control-component',
    componentId,
    componentSpecificActionHandle: handle,
    componentSpecificActionParams: (params || []).map((p, i) => ({ handle: p.handle, value: values[i] ?? '' })),
  });

  // Every event the widget had, each switching one control state of the marker.
  const eventHandlers = Object.keys(config.events || {}).map((eventId, i) => {
    const c = CONTROL[i % CONTROL.length];
    const handle = controlName(c);
    const params = button.actions.find((a) => a.handle === handle).params;
    return handler(widget.id, eventId, 0, control(marker.id, handle, params, [c.on]));
  });

  // Every action the widget had, from the trigger's click, the control actions last and each switched back.
  const own = (config.actions || []).filter(
    (a) => !SKIPPED_ACTIONS.has(a.handle) && !CONTROL.some((c) => c.names.includes(a.handle))
  );
  const calls = own.map((a) => {
    const values = (a.params || []).map((p, i) => ARGS[type]?.[a.handle]?.[i] ?? p.defaultValue ?? '');
    return { action: a, values };
  });
  for (const c of CONTROL) {
    for (const action of (config.actions || []).filter((a) => c.names.includes(a.handle))) {
      calls.push({ action, values: [c.on] }, { action, values: [c.off] });
    }
  }
  const actionHandlers = calls.map(({ action, values }, i) =>
    handler(trigger.id, 'onClick', i, control(widget.id, action.handle, action.params, values))
  );

  const exposedKeys = Object.keys(config.exposedVariables || {});
  // Saved bindings name a component by id (what the editor stores in event and query code) or by name (most
  // component properties); the text reads every value both ways.
  const read = (ref) => exposedKeys.map((k) => `${JSON.stringify(k)}: components.${ref}.${k}`).join(', ');
  const bindings = `byId: { ${read(widget.id)} }, byName: { ${read(widget.name)} }`;
  const code = [
    `// Calls ${widget.name}'s actions and reads its values by name, as RunJS code in a saved app does.`,
    ...calls.map(
      ({ action, values }) => `await components.${widget.name}.${action.handle}(${values.map(asJs).join(', ')});`
    ),
    `return { ${exposedKeys.map((k) => `${JSON.stringify(k)}: components.${widget.name}.${k}`).join(', ')} };`,
  ].join('\n');

  const height = config.defaultSize?.height ?? 40;
  return {
    schemaVersion: SCHEMA_VERSION,
    release,
    widget: type,
    pages: [{ id: pageId, appVersionId: versionId, name: 'Home', handle: 'home' }],
    components: [
      component(widget, type, { properties, styles, validation, height }),
      component(probe, 'ShadText', {
        properties: { text: { value: `{{JSON.stringify({ ${bindings} })}}` } },
        top: height + 10,
      }),
      component(marker, 'ShadButton', { properties: { text: { value: 'Marker' } }, top: height + 60 }),
      component(trigger, 'ShadButton', { properties: { text: { value: 'Run actions' } }, top: height + 110 }),
    ],
    events: [...eventHandlers, ...actionHandlers],
    dataQueries: [
      {
        id: queryId,
        name: 'callWidget',
        kind: 'runjs',
        appVersionId: versionId,
        options: { code, hasParamSupport: false, parameters: [] },
      },
    ],
  };
}

const configs = loadConfigs();
const byName = Object.fromEntries(configs.map((c) => [c.name, c]));
const dir = path.join(FIXTURES, release);
fs.mkdirSync(dir, { recursive: true });
const manifestFile = path.join(FIXTURES, 'manifest.json');
const manifest = fs.existsSync(manifestFile)
  ? JSON.parse(fs.readFileSync(manifestFile, 'utf8'))
  : { version: 1, fixtures: {} };
const provenance =
  option('--provenance') ?? `generated by scripts/ui2-compat-fixtures.js from the configs at ${configsFrom ?? 'HEAD'}`;

let written = 0;
for (const config of configs.filter((c) => !only || only.includes(c.name))) {
  const key = `${release}/${config.name}`;
  const file = path.join(dir, `${config.name}.json`);
  const oracle = path.join(dir, `${config.name}.oracle.json`);
  if (manifest.fixtures[key]) {
    console.log(`${key}: already frozen, left as is`);
    continue;
  }
  const source = `${JSON.stringify(fixtureFor(config, byName), null, 2)}\n`;
  fs.writeFileSync(file, source);
  if (!fs.existsSync(oracle)) fs.writeFileSync(oracle, `${JSON.stringify({ pending: true }, null, 2)}\n`);
  manifest.fixtures[key] = {
    path: path.relative(FIXTURES, file),
    sha256: crypto.createHash('sha256').update(source).digest('hex'),
    schemaVersion: SCHEMA_VERSION,
    provenance,
    applicability: ['ce', 'ee'],
    oracle: path.relative(FIXTURES, oracle),
  };
  written++;
}
const sorted = Object.fromEntries(Object.entries(manifest.fixtures).sort(([a], [b]) => a.localeCompare(b)));
fs.writeFileSync(manifestFile, `${JSON.stringify({ ...manifest, fixtures: sorted }, null, 2)}\n`);
console.log(`${written} fixture(s) written to ${path.relative(ROOT, dir)}. Record their oracles next:`);
console.log('  UI2_COMPAT_RECORD=1 npx jest --maxWorkers=2 src/AppBuilder/Widgets/Ui2/__tests__/compat/savedApps');
