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
| Code every widget shares | `_shared`: `Shell` (root element, loading and visibility), `field` (label, help, error), `formHooks` (validation), `packHooks` (exposed values and actions), `ui` (the primitives), `looks` (style keys to CSS variables), `types.ts` |
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

## Checks that keep it this way

These run with the frontend jest suite (`npx jest --maxWorkers=2 src/AppBuilder/Widgets/Ui2`):

- `codeLayout.spec.js`: widget code is TypeScript, files stay under 400 lines, one folder per widget, each in the
  registry.
- `behaviourSpecs.spec.js`: every widget has a behaviour spec, and that spec mentions each property, event, action
  and exposed value the widget adds.
- `packConfigs.spec.js`: configs are literals, carry the standard set, and follow the naming rules.
- `legacyNames.spec.js`: the frontend and server rename tables agree.
- `_stores/__tests__/integration/everyWidgetEventDispatches.spec.js`: every config event is on the dispatcher's list.
- `npm run test:ui2-fuzz` (not in the default run): every widget with junk bindings, mounted and re-rendered.
