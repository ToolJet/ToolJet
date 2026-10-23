# UI 2.0 browser QA

Cypress specs for the bug classes the team kept finding by hand in the real browser, which jsdom specs cannot
measure: pixel geometry, editor vs preview parity, and state transitions. Every measurement is a
`getBoundingClientRect` on the canvas wrapper (the `.ele-<id>` box, parent of `[data-cy="draggable-widget-<name>"]`)
and on the widget's root and parts.

The cases are data-driven: `cypress/plugins/ui2Widgets.js` reads the pack's configs
(`frontend/src/AppBuilder/WidgetManager/widgets/shad*.js`, in `shadcn.js` order) and the grid constants, and the
specs generate one set of cases per widget, so a new widget is covered without an edit here.

| Spec | What it checks | Where |
|---|---|---|
| `grid.cy.js` | A real drop from the components panel (`cy.dragAndDropWidget`) lands a multiple of the grid row (`GRID_HEIGHT`, 10px) tall: the saved layout, and the rendered box when Dynamic height is off. | editor |
| `geometryViewer.cy.js` | Fill and containment, at the default size and at a small fixed size (about half, Dynamic height off): the root fills the box within 2px on every side; no blank band at the top or bottom of a painted surface; nothing paints more than 1px outside the box; content larger than the box scrolls instead of being cut off. | viewer at 1600, 1280, 390 px, light and dark |
| `geometryEditor.cy.js` | The same checks on the editor canvas. | editor at 1600, 1280 px, light and dark |
| `parity.cy.js` | Each widget's top and height match within 1px between the editor canvas and the preview (canvas capped at 1100px so both are the same width), and between the light and dark themes. A top that moved only because a widget above changed height is not counted against the widget below. | editor vs viewer at 1600 and 1280 px; light vs dark |
| `parts.cy.js` | Switch thumb inside its track (on and off); Slider thumbs on the track (single and range); every day column of the Calendar, Date picker and Date and time picker the same width and under its heading; Tabs underline straight and on the tab list's line; chips centred (Tags, Tags input, Multiselect); checkbox on its label's line; radio dots centred; rating stars in line; progress indicator on its track. A self-test first breaks each part on purpose (an injected style) and expects the check to fail. | viewer light and dark, editor light, 1600px |
| `transitions.cy.js` | A loading cycle (`loadingState` bound to a switch, on then off) keeps typed drafts in a List view's rows and in an open Dialog; no widget with a loading state changes height through the cycle (sampled every animation frame); in the editor, switching tabs keeps the Tabs selected and the inspector never shows "Add new component", and a selected child in a tab that goes away hands the selection to the Tabs. | viewer and editor, 1600px |

Helpers live in `cypress/support/utils/appBuilder/ui2/`: `widgets.js` (the widget list), `app.js` (sign-in, test
apps, viewer and editor), `geometry.js` (the measurements), `parts.js` (part checks), `suites.js` (the shared
geometry suite), `known.js` (tracked failures), `report.js` (results).

## Test apps

Each spec creates its own app named `Cypress UI2 ...` through the components endpoint the editor saves to, each
component being its config's definition exactly as a drop makes it (plus the registry's `general` / `generalStyles`;
List view and Dialog get their default children). The grid spec is the exception: it drags every widget from the
components panel. Every spec deletes its app in `after`, and sweeps any `Cypress UI2 ...` app left by an aborted run
first. No other app is touched. `CYPRESS_ui2_keep_apps=true` keeps the app for debugging.

## Running

Use the App Builder config, one spec at a time, headless:

```sh
cd cypress-tests
npx cypress run --config-file cypress-appbuilder.config.js \
  --config baseUrl=http://localhost:8090 \
  --spec cypress/e2e/happyPath/appbuilder/ui2/geometryViewer.cy.js
```

- `server_host` (the API, e.g. `http://localhost:3020`) comes from `cypress.env.json` or `CYPRESS_server_host`, as for
  the rest of the suite. Sign-in is `cy.apiLogin` with the suite's seed account.
- `CYPRESS_ui2_workspace` (default `final`): the workspace slug to work in.
- `CYPRESS_ui2_frontend_dir`: the `frontend/` whose configs drive the cases, when the stack serves another checkout
  than this one (the sizes must match the code under test).
- On a loaded machine add `pageLoadTimeout=90000,requestTimeout=60000,responseTimeout=60000` to `--config`.
- Narrowing: `CYPRESS_ui2_only=ShadSwitch,ShadTabs`, `CYPRESS_ui2_widths=1600`, `CYPRESS_ui2_themes=dark`,
  `CYPRESS_ui2_modes=viewer-dark` (parts).

Results: every measurement is appended to `cypress/reports/ui2/<spec>.jsonl` (gitignored), failures get a screenshot
under `cypress/screenshots/<spec>/`, and `node tools/ui2/report.js --md` prints the pass/fail table and every failure
with its numbers.

## Known failures

`known.js` marks single failure lines out of scope (by design) per widget, check, size and kind: they are recorded and reported but do not fail the test, while every other line of that test still does. Today that is E19, the editor drawing a fitted widget's saved height (its editor vs preview height gap, and the bands or overflow it leaves on the editor canvas only). It also lists tracked bugs, failures the team already tracks. Those tests still run and still fail, with the reason in the title
and the message, so a fix shows up as a pass; `CYPRESS_ui2_skip_known=true` skips them for a baseline run. Remove an
entry when its fix lands. The list is empty: the 36 off-grid default heights it held at `a839e007ee` were fixed by
`b61ce368e1`.

## Tolerances and what is not checked

- Nothing is measured on a timer. After a page opens, and again for each widget after it is scrolled into view, the
  suite reads every measured widget's canvas top, box height and root height every 300ms until two reads in a row
  match (`waitForStableBoxes`): a fitted widget first renders at its saved height and then fits its content, a Table
  once its rows arrive. It fails after 30s, naming the widgets still moving and their last two reads.

- Fill: 2px per side (the canvas wrapper's 2px padding), plus 0.5px rounding. Containment: 1px. Parity: 1px.
- Bands are checked only against a painted surface at least half the box wide and tall (a card, a field, a chart):
  text-only widgets and small controls are vertically centred on purpose.
- Not counted as painting outside: a spinning element (its rotated box swells), `position: fixed` elements, popovers
  (portals, outside the widget). Not counted as cut off: text that asks for an ellipsis or line clamp, and media
  cropped by its frame (map tiles, cover images).
- The editor has no phone width; 390px runs in the viewer, which switches to the mobile layout below 600px (every
  test component is shown on mobile at full width).
