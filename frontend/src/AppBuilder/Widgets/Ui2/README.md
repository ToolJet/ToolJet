# ToolJet UI 2.0 widgets

The UI 2.0 widgets are ordinary ToolJet widgets: RenderWidget renders them with the same props as the native ones
(`properties`, `styles`, `validation`, `width`, `height`, `setExposedVariable(s)`, `fireEvent`, `validate`), their
configs sit with the native configs, and their events go through the same dispatcher. Their component types start
with `Shad` (saved in apps, so they stay); nothing user-facing uses that prefix.

## Where things are

| What | Where |
| --- | --- |
| A widget's code | `Ui2/<Widget>/<Widget>.tsx` (default export), with any module only it uses beside it |
| A widget's config | `WidgetManager/widgets/shad<Widget>.js`, listed in `WidgetManager/widgets/shadcn.js` |
| Registration | `Ui2/registry.ts`, one `lazy()` import per widget, spread into `AllComponents` in `_helpers/editorHelpers.js` |
| Code a family shares | `_inputs`, `_pickers`, `_display`, `_actions`, `_sections`, `_charts` |
| Code every widget shares | `_shared`: `Shell` (root element, loading and visibility), `field` (label, help, error, `FormField`), `formHooks` (validation), `packHooks` (exposed values and actions), `values` (readers for bound values: `toText`, `isSet`, `num`, `clamp`...), `format` (numbers, money, percentages, dates, table cells), `ui` (the primitives), `looks` (style keys to CSS variables), `types.ts` |
| Names | `NAMING.md`; retired names in `legacyNames.ts` |
| Behaviour tests | `Ui2/<Widget>/__tests__/integration/<Type>.spec.jsx` |

Each widget loads in its own chunk, the first time a page shows it.

## Adding or changing a widget

1. Config: copy a sibling `shad<Widget>.js`; keep it a plain object literal (no spreads or helpers), with the
   standard properties, events and actions every UI 2.0 widget has (`packConfigs.spec.js` lists them).
2. Code: `Ui2/<Widget>/<Widget>.tsx` taking `WidgetProps`, wrapped in `withControlState` and rendering inside
   `Shell`. Read what the app bound defensively: a binding can be undefined, a string, NaN or an object.
3. Register it in `registry.ts`.
4. Names follow `NAMING.md`. Renaming anything already released needs an entry in `legacyNames.ts` and the server
   copy, which the data migration and the import path use.
5. Write the behaviour spec with `createWidgetHarness`, scenario ids in the titles (`[ShadX-EVT-001]`), checking
   what a builder sees: the exposed values, which handlers ran, and what is on screen.

## Styling

- Classes are ToolJet's Tailwind build with the `tw-` prefix. The pack's theme keys are under `ui2`
  (`_shared/styles/ui2.tailwind.js`, merged into `tailwind.config.js`): `tw-bg-ui2-primary`, `tw-border-ui2-input`,
  `tw-rounded-ui2-md`, `tw-text-ui2-sm`. They read the `--sc-*` variables a widget's root sets from the app theme, so
  a widget follows the app's theme, not the builder's.
- A widget's style properties become CSS variables on its root (`_shared/looks`), read by its classes with the theme
  as the fallback, e.g. `tw-text-[color:var(--lk-label,var(--sc-foreground))]`.
- `_shared/styles/shadcn.scss` holds the tokens, a small reset at element specificity (`:where(.tj-shadcn)`, so any
  utility wins over it), and rules a class cannot express. No `!important`, except the one documented rule there.
- Merge classes with `cn` (ToolJet's, in `@/lib/utils`), so a widget's class overrides a primitive's.
- The primitives (`_shared/ui`) are shadcn's source on this build, not Rocket's shadcn layer: that layer follows the
  builder (its type and radius scale, colour names the config does not define, overlays portalled to `body`, outside
  the app theme).

## Sizing

- A widget's box comes as props: `width` and `height` from the grid or its FlexContainer, and `boxFit` (`grid`,
  `fixed` or `fill`) for whether a flex child fills its share of the line.
- Content-fitted height goes through the core reflow: `useAutoHeight` for a widget, and `useFittedRowHeight` for a
  List view row or a Kanban custom card (the same path as the native List view's rows; see `isUi2PerRowType` in
  `_helpers/dynamicHeightPolicy.js`).
- Widgets do not read the canvas's DOM (its wrappers or layout attributes). Observing a widget's own content (whether
  chips fit, a scroll position) is fine.

## Hooks

- Bound data goes through `useStable` (keeps the previous reference while the content is equal) before it is a
  dependency; never a JSON string key.
- Callbacks and props an effect reads without rerunning go through `useLatest`.
- `useExposed` publishes exposed values and registers each action once as a stable function over the latest closure.
- No `react-hooks/exhaustive-deps` suppressions (ESLint error in this folder).

## Checks that keep it this way

These run with the frontend jest suite (`npx jest --maxWorkers=2 src/AppBuilder/Widgets/Ui2`):

- `codeLayout.spec.js`: widget code is TypeScript, files stay under 400 lines, one folder per widget, each in the
  registry.
- `behaviourSpecs.spec.js`: every widget has a behaviour spec, and that spec mentions each property, event, action
  and exposed value the widget adds.
- `packConfigs.spec.js`: configs are literals, carry the standard set, and follow the naming rules.
- `legacyNames.spec.js`: the frontend and server rename tables agree.
- `_stores/__tests__/integration/everyWidgetEventDispatches.spec.js`: every config event is on the dispatcher's list.
- `codeRules.spec.js`: prefixed classes only, no `!important` beyond the documented one, no reading of the canvas's
  DOM, no `exhaustive-deps` suppressions.
- `__tests__/integration/renderCounts.spec.jsx`: on a page of every widget, typing in one input re-renders only it,
  typing in a native input re-renders no UI 2.0 widget, and new query data re-renders only the widgets bound to it
  (React Profiler commit counts).
- `__tests__/integration/scale.spec.jsx`: a 10k-row Table, 500-card Kanban, 1,000-row List view and 5,000-point charts
  draw a bounded number of DOM nodes, and big charts do not animate (the Map's 2,000 points: `[ShadMap-PROP-004]`).
- `__tests__/integration/accessibility.spec.jsx`: axe-core (jest-axe) over every widget's defaults, disabled and error
  states and open overlays, and each overlay's keyboard path (open, focus, Escape, focus back; Tab kept in the Dialog).
- `__tests__/integration/hostileData.spec.jsx`: HTML, quote breakouts, script URLs and markdown through every text,
  URL and data field from a query; nothing may run or reach the DOM unsanitised. Bound URLs go through `safeUrl` or
  `safeImageUrl` (`_shared/values.ts`), HTML through DOMPurify or rehype-sanitize.
- `npm run test:ui2-browsers` and `npm run test:ui2-phone` (not in the default run): Chromium, WebKit and Firefox on a
  running ToolJet's gallery app of every widget (axe with colour contrast in light and dark, every overlay, the Map),
  and phones at 375 and 414 px (overflow, cut-off text, touch targets). Setup is in `scripts/ui2-browsers.js`.
- `npm run test:ui2-fuzz` (not in the default run): every widget with junk bindings, mounted and re-rendered.
- `npm run test:ui2-leaks` (not in the default run, about 1.5 minutes): every widget mounted and unmounted 50 times
  with its defaults (overlays opened first), leaving no window or document listener, observer, timer, store
  subscription, body node or attribute, Leaflet map or Recharts node behind. `__tests__/leaks/leakSuite.jsx` lists the
  known leaks in code outside this folder.
