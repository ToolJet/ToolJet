// The UI 2.0 leak suite: mounts and unmounts each widget CYCLES times through the widget harness (real store, real
// RenderWidget, view mode, the widget's own registered definition with its sample data) and checks it leaves nothing
// behind. Shared by the per-family leaks/*.spec.jsx files; leakProbes.js has the instruments.
//
// Per widget: a few empty cycles (the harness seeds the store and renders nothing) give the untouched page and the
// timer baseline, then WARMUP widget cycles load anything a module does once, then CYCLES widget cycles are measured.
// A widget with an overlay opens it in every cycle (OPENS), and VARIANTS adds cases for paths the defaults leave off.
//  - window and document listeners, live observers, zustand subscriptions, document.body's children and elements,
//    document.head's children and live Leaflet tile layers are back where they were before the measured cycles;
//  - the body's attributes and scroll-lock styles, and hidden or inert nodes, are as on the untouched page;
//  - no cycle leaves a timer scheduled after its unmount beyond what an empty cycle leaves (leakProbes.js, timerProbe);
//  - every Leaflet map made is removed; a chart leaves no Recharts node behind.
// KNOWN lists the leaks found in code outside this folder. probes.spec.jsx checks that each probe sees a leak.
import React from 'react';
import { act } from '@testing-library/react';
import { shadcnConfigs } from '@/AppBuilder/WidgetManager/widgets/shadcn';
import { binding, createWidgetHarness } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { OPENS, OVERLAY, addPageCanvas, boxOf, openOverlay, press } from '../packWidgets';
import { installProbes } from './leakProbes';

const CYCLES = Number(process.env.LEAK_CYCLES) || 50;
const WARMUP = 2;
const BASELINE_CYCLES = 3;
// The charts drawn with Recharts (the funnel and the heatmap are the pack's own SVG).
const RECHARTS = /^Shad(Area|Bar|Line|Pie|Radar|Radial|Scatter|Combo)Chart$|^ShadSparkline$/;

// Leaks the suite finds in code this folder does not own, or that another change is fixing. Each must still reproduce
// (delete the entry once it is fixed), and nothing else may show up for that widget.
const KNOWN = {
  // The native ModalV2's sizing effect (Widgets/ModalV2/Components/Modal.jsx) schedules a 100 ms timeout on every
  // change of its inputs and never clears it; the fix is to clear it in the effect's cleanup.
  ShadDialog: /^timers still scheduled after unmount: [\s\S]*ModalV2\/Components\/Modal\.jsx/,
  // @tanstack/virtual-core debounces its isScrolling reset (150 ms) from the first offset read, and its cleanup removes
  // the scroll listener but not that timeout.
  ShadTable: /^timers still scheduled after unmount: [\s\S]*virtual-core/,
};

// Every widget, in exactly one family (one spec file each, so the families run in parallel).
export const FAMILIES = {
  charts: [
    'ShadAreaChart',
    'ShadBarChart',
    'ShadLineChart',
    'ShadPieChart',
    'ShadRadarChart',
    'ShadRadialChart',
    'ShadScatterChart',
    'ShadComboChart',
    'ShadFunnelChart',
    'ShadHeatmapChart',
    'ShadSparkline',
    'ShadMap',
  ],
  pickers: [
    'ShadSelect',
    'ShadCombobox',
    'ShadMultiselect',
    'ShadDatePicker',
    'ShadDateTimePicker',
    'ShadTimePicker',
    'ShadColorPicker',
    'ShadDropdownMenu',
    'ShadDialog',
    'ShadTagsInput',
    'ShadPhoneInput',
    'ShadCalendar',
  ],
  inputs: [
    'ShadInput',
    'ShadTextarea',
    'ShadCheckbox',
    'ShadSwitch',
    'ShadRadioGroup',
    'ShadSlider',
    'ShadToggleGroup',
    'ShadNumberInput',
    'ShadCurrencyInput',
    'ShadPasswordInput',
    'ShadOtpInput',
    'ShadRating',
    'ShadFileUpload',
    'ShadButton',
    'ShadButtonGroup',
    'ShadQuestionnaire',
  ],
  collections: [
    'ShadTable',
    'ShadListView',
    'ShadCardGrid',
    'ShadKanban',
    'ShadRecordList',
    'ShadSchedule',
    'ShadTimeline',
    'ShadChat',
    'ShadCarousel',
    'ShadTabs',
    'ShadAccordion',
    'ShadNavigation',
    'ShadPagination',
    'ShadSteps',
  ],
};
FAMILIES.display = shadcnConfigs.map((c) => c.name).filter((n) => !Object.values(FAMILIES).flat().includes(n));

// Paths the defaults leave dormant that hold a timer or a page-level listener while active: each runs as one more case
// of its widget, with these properties over the defaults and, when given, a press on `press` before the unmount.
const VARIANTS = {
  ShadCarousel: [{ label: 'autoplay', properties: { autoplay: binding('{{true}}') } }],
  ShadMap: [
    {
      label: 'full screen, search, picking and heat',
      properties: {
        showFullscreen: binding('{{true}}'),
        showSearch: binding('{{true}}'),
        pickLocation: binding('{{true}}'),
        display: binding('both'),
      },
      press: 'button[aria-label="Full screen"]',
    },
  ],
};

const delta = (label, before, after, describe) =>
  after === before
    ? []
    : [`${label}: ${before} before the cycles, ${after} after${describe ? `\n    ${describe}` : ''}`];

/** Mounts and unmounts one widget CYCLES times; returns its measurements and the problems found (empty: no leak). */
export const measureWidget = async (name, variant = {}) => {
  const box = boxOf(name);
  const widget = createWidgetHarness({
    componentType: name,
    handle: 'leak1',
    id: 'leak1',
    widgetWidth: box.width,
    widgetHeight: box.height,
    capabilities: { dnd: true },
    preload: ['ShadText'],
  });
  const removeCanvas = addPageCanvas();
  await widget.setup();
  // Recharts warns about its first, unmeasured render on every mount; React's errors are kept for the report.
  const errors = [];
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  const error = jest
    .spyOn(console, 'error')
    .mockImplementation((...args) => errors.push(args.map(String).join(' ').slice(0, 300)));
  const probes = installProbes({ size: () => box });
  const settle = () =>
    act(async () => {
      await new Promise((r) => probes.timers.realSetTimeout(r, 0));
      await new Promise((r) => probes.timers.realSetTimeout(r, 0));
    });
  const unmount = () => act(() => widget.session.render(<></>));
  const problems = [];
  let rechartsMounted = 0;
  let rechartsLeft = 0;
  let overlaysOpened = 0;
  let pressed = 0;
  // While mounted, so a report shows the checks are not vacuous.
  const peak = { listeners: 0, observers: 0, subscriptions: 0 };
  const cycle = async (empty) => {
    probes.timers.begin();
    if (empty) await act(async () => widget.session.render(<></>));
    else await act(async () => widget.render({ currentMode: 'view', properties: variant.properties }));
    await settle();
    // A widget with an overlay opens it in every cycle, since an overlay unmounted while open is where portals,
    // outside-press listeners and focus timers are left behind.
    if (!empty && OPENS.has(name)) {
      await openOverlay(widget.exposed());
      await settle();
      overlaysOpened += document.querySelector(OVERLAY) ? 1 : 0;
    }
    if (!empty && variant.press) {
      const target = document.querySelector(variant.press);
      if (target) await act(async () => press(target));
      await settle();
      pressed += target ? 1 : 0;
    }
    if (!empty) {
      peak.listeners = Math.max(peak.listeners, probes.listeners.count());
      peak.observers = Math.max(peak.observers, probes.observers.count());
      peak.subscriptions = Math.max(peak.subscriptions, probes.subscriptions() ?? 0);
    }
    rechartsMounted += document.querySelectorAll('.recharts-wrapper, .recharts-surface').length ? 1 : 0;
    probes.timers.unmounting();
    unmount();
    rechartsLeft += document.querySelectorAll('.recharts-wrapper, .recharts-responsive-container').length;
    return probes.timers.leftovers();
  };

  try {
    // An empty cycle first, so the harness's own portal hosts are in the body before anything is counted.
    let baselineTimers = 0;
    for (let i = 0; i < BASELINE_CYCLES; i += 1) baselineTimers = Math.max(baselineTimers, (await cycle(true)).length);
    // The page as no widget has touched it: a widget leaves the body exactly so.
    const page = {
      listeners: probes.listeners.snapshot(),
      bodyNodes: [...document.body.children],
      bodyState: probes.bodyState(),
    };
    for (let i = 0; i < WARMUP; i += 1) await cycle(false);

    const before = {
      listeners: probes.listeners.snapshot(),
      observers: probes.observers.live(),
      subscriptions: probes.subscriptions(),
      headChildren: probes.headChildren(),
      bodyChildren: probes.bodyChildren(),
      bodyElements: probes.bodyElements(),
      tiles: probes.leaflet.liveTiles(),
      maps: probes.leaflet.made(),
      removed: probes.leaflet.removed(),
    };
    rechartsMounted = 0;
    rechartsLeft = 0;
    overlaysOpened = 0;
    pressed = 0;
    const timers = [];
    const started = performance.now();
    for (let i = 0; i < CYCLES; i += 1) {
      const left = await cycle(false);
      if (left.length > baselineTimers) timers.push(...left);
    }
    const ms = performance.now() - started;

    const listeners = probes.listeners.newSince(before.listeners);
    if (listeners.length)
      problems.push(
        `window/document listeners added and never removed: ${listeners.length}\n    ${[
          ...new Set(probes.listeners.describe(listeners)),
        ]
          .slice(0, 4)
          .join('\n    ')}`
      );
    const observers = probes.observers.live().filter((o) => !before.observers.includes(o));
    if (observers.length)
      problems.push(
        `observers still observing after unmount: ${observers.length}\n    ${[
          ...new Set(probes.observers.describe(observers)),
        ]
          .slice(0, 4)
          .join('\n    ')}`
      );
    if (before.subscriptions !== null)
      problems.push(...delta('zustand subscriptions', before.subscriptions, probes.subscriptions()));
    problems.push(...delta('document.body children', before.bodyChildren, probes.bodyChildren()));
    problems.push(...delta('document.body elements', before.bodyElements, probes.bodyElements()));
    problems.push(...delta('body attributes and hidden or inert nodes', page.bodyState, probes.bodyState()));
    problems.push(...delta('document.head children', before.headChildren, probes.headChildren()));
    if (timers.length)
      problems.push(
        `timers still scheduled after unmount: ${
          timers.length
        } over ${CYCLES} cycles (an empty cycle leaves ${baselineTimers})\n    ${[
          ...new Set(timers.map((t) => `${t.kind}(${t.delay} ms) from ${t.from}`)),
        ]
          .slice(0, 4)
          .join('\n    ')}`
      );
    const maps = probes.leaflet.made() - before.maps;
    const mapsRemoved = probes.leaflet.removed() - before.removed;
    if (maps !== mapsRemoved) problems.push(`Leaflet maps: ${maps} made, ${mapsRemoved} removed`);
    problems.push(...delta('Leaflet tile layers on a map', before.tiles, probes.leaflet.liveTiles()));
    if (rechartsLeft) problems.push(`Recharts nodes left after unmount: ${rechartsLeft}`);

    return {
      name,
      problems,
      ms,
      // Nodes the first mounts put in the body for good (a library's measuring node, the pack's portal root).
      bodyKeptFromFirstMount: [...document.body.children]
        .filter((n) => !page.bodyNodes.includes(n))
        .map((n) => n.outerHTML.slice(0, 120)),
      // Added by the first mounts and kept for good (module-level, once per page): not a per-mount leak.
      keptFromFirstMount: probes.listeners.describe(probes.listeners.newSince(page.listeners)),
      consoleErrors: [...new Set(errors)].slice(0, 5),
      checked: {
        mounted: peak,
        unmounted: {
          listeners: probes.listeners.count(),
          observers: probes.observers.count(),
          subscriptions: probes.subscriptions(),
        },
        leafletMaps: maps,
        rechartsMountedCycles: RECHARTS.test(name) ? rechartsMounted : null,
        overlayOpenedCycles: OPENS.has(name) ? overlaysOpened : null,
        pressedCycles: variant.press ? pressed : null,
      },
    };
  } finally {
    warn.mockRestore();
    error.mockRestore();
    probes.restore();
    widget.teardown();
    removeCanvas();
  }
};

/** One family's suite: a test per widget (and per variant) that fails with what it leaked. */
export const leakSuite = (family) => {
  const cases = FAMILIES[family].flatMap((name) => [
    [name, {}],
    ...(VARIANTS[name] || []).map((variant) => [`${name} (${variant.label})`, variant]),
  ]);
  describe(`UI 2.0 ${family}: nothing left behind after ${CYCLES} mounts and unmounts`, () => {
    it.each(cases)(
      '%s',
      async (title, variant) => {
        const name = title.split(' ')[0];
        const result = await measureWidget(name, variant);
        if (process.env.LEAK_OUT) {
          const fs = require('fs');
          fs.mkdirSync(process.env.LEAK_OUT, { recursive: true });
          fs.writeFileSync(`${process.env.LEAK_OUT}/${title}.json`, JSON.stringify(result, null, 1));
        }
        // The checks are not vacuous: the chart drew, the overlay opened, the map was made, the press landed.
        if (RECHARTS.test(name)) expect([title, result.checked.rechartsMountedCycles > 0]).toEqual([title, true]);
        if (OPENS.has(name)) expect([title, result.checked.overlayOpenedCycles]).toEqual([title, CYCLES]);
        if (name === 'ShadMap') expect([title, result.checked.leafletMaps]).toEqual([title, CYCLES]);
        if (variant.press) expect([title, result.checked.pressedCycles]).toEqual([title, CYCLES]);
        const known = KNOWN[name];
        expect(result.problems.filter((p) => !known?.test(p))).toEqual([]);
        if (known) {
          const still = result.problems.some((p) => known.test(p));
          expect([title, 'still leaks as KNOWN says', still]).toEqual([title, 'still leaks as KNOWN says', true]);
        }
      },
      120000
    );
  });
};
