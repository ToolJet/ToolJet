# UI 2.0 widgets: backward compatibility

Apps saved under an earlier release must keep working after an upgrade. A saved app holds names (property, style and
validation keys, event ids, action handles and their parameters, exposed value keys), relies on defaults for what it
never set, and expects each widget to look the way it did. Three checks guard that; the first two run with the default
jest run, the third on demand.

| Layer | What it catches | Where | Runs |
| --- | --- | --- | --- |
| 1. Frozen contract | A name removed or renamed, a default or value type changed, action parameters changed | `Ui2/__contracts__/<Type>.json`, `compat/contracts.spec.js` | default jest run |
| 2. Saved apps per release | A saved app that no longer loads, renders, dispatches, binds or exposes what it did | `compat/fixtures/<release>/`, `integration/savedApps.spec.jsx` | default jest run |
| 3. Visual | A widget that looks different | `visual/gallery.jsx`, `visual/baselines/`, `scripts/ui2-visual.js` | `npm run test:ui2-visual`, CI label `run-ui2-visual` |

## 1. Frozen contract

`npm run ui2:contracts` (in `frontend`) writes one file per widget from its config: property, style and validation keys
with value type, the whole value schema (pattern, size, optional, an object's fields: the rules a saved value is checked
against), default (what an app that never set the key gets) and initial value (what a new widget starts with); event
ids; action handles with their parameter names in order (saved control-component calls pass arguments by position);
exposed value keys. The keys include those only a config's definition has (Tabs' `tabItems`, Dialog's `headerHeight`),
which the editor saves with every component too.

A changed rule within the same type (a pattern added, a maximum length lowered, `optional` dropped) is a break, as a
saved value it rejects falls back to the default. One that only loosens is accepted with that reason.

When `contracts.spec.js` fails:

- **Something was added.** Run `npm run ui2:contracts` and commit `Ui2/__contracts__`.
- **Something was renamed.** Map the old name to the new one in `legacyNames.ts` and its server copy, and add a data
  migration in `server/data-migrations` that rewrites saved apps (start from `*-RenameUi2PackNames.ts`; never edit a
  migration that shipped). Put `Ui2` in the migration's file name so layer 2 replays it. Then run
  `npm run ui2:contracts`.
- **A break is intended** (a default that was wrong, a removed widget). Add an entry with its reason to
  `Ui2/__contracts__/acceptedBreaks.json`, as the failure message shows, then run `npm run ui2:contracts`.

The script refuses the same changes the spec refuses, so the files cannot be regenerated past a break.

## 2. Saved apps per release

`fixtures/<release>/<Type>.json` is one saved page per widget, in the shape an exported app carries: the widget with
non-default properties and styles; a handler on each of its events that runs a control-component action on a marker
button; a trigger button whose click handlers call each of its actions with arguments; a text bound to each exposed value
by component id and by name; and a RunJS query that calls each action and reads each value by name. The names are the
ones that release's configs had.

`integration/savedApps.spec.jsx` runs every fixture through import's rename (`applyUi2RenamesToImport`) and through every
`server/data-migrations/*Ui2*.ts` migration on a stand-in database (`compat/migrationReplay.js`); the two must give the
same app. It loads the result into the real store with `createWidgetHarness`, renders it in view mode, and fails on:

- a widget that renders "This widget is not available";
- any console error or warning (the console guard every UI 2.0 spec gets from `ui2Harness.js`);
- a saved handler on an event the widget no longer has, or one that no longer runs its action;
- a saved control-component action, RunJS call or binding that names something the widget no longer has;
- exposed values, after loading, after each action and after the RunJS query, that differ from the recorded
  `<Type>.oracle.json`.

Today is pinned to 09:00 local time on 15 June 2026, and times are compared as local wall-clock text (an epoch under a
time key, or a UTC ISO string, reads `local 2026-06-09T00:00:00.000`), so the oracles hold in any time zone; generated
ids in exposed values are masked. A step that shows an absolute moment as local time (the Date time picker's
`setValueInTimestamp`) is recorded as that moment and the names of the values it changed.

**Fixtures are never edited or deleted.** `fixtures/manifest.json` pins each by checksum and the spec fails on a missing
or changed one. If a widget's behaviour changes on purpose, the oracle may be re-recorded: set its file to
`{ "pending": true }`, run the recording command below, and say why in the commit.

### Adding a release's fixture set (at release time)

1. Generate it from the configs being released (a tag or commit, or the working tree):

   ```
   node scripts/ui2-compat-fixtures.js 3.21 --configs-from v3.21.0 --provenance "the configs released in v3.21.0"
   ```

   Without `--configs-from` the working tree's configs are used. Widgets added in that release get fixtures; existing
   sets are left as they are.
2. Record what the widgets expose: `UI2_COMPAT_RECORD=1 npx jest --maxWorkers=2 src/AppBuilder/Widgets/Ui2/__tests__/integration/savedApps`.
   Recording fills only oracles marked pending.
3. Run the spec again without the variable, twice, to see it is stable; commit the new folder and `manifest.json`.

Seeded sets: `pre-rename` (the `staging/ui2-auto` configs before the names were settled; every event and action that
saved apps on the local copy of staging used on these widgets is in them) and `current`.

### Saved-app scenarios

`scenarios/<name>.json` are hand-written saved apps for shapes the per-widget fixtures do not cover, replayed by
`integration/savedAppScenarios.spec.jsx` through the same import and migrations. Their `<name>.oracle.json` holds what a
correct upgrade gives, written by hand rather than recorded, so a rename that misses fails instead of becoming the
expected result: the saved text afterwards (`static`), keys the app owns (`ownKeys`), and, loaded and rendered, bindings
(`resolved`), exposed values, RunJS results and fired events. A scenario the product does not pass yet says so with
`knownFailing` (owner and reason) and runs as `test.failing`, which turns red the day it is fixed.

- `expressions`: a pre-rename Date picker read and called through bracket, comment-split, optional and run-time
  references, in bindings and RunJS, beside plain text that only mentions a reference. Known failing.
- `expression-shapes`: Codex's import edge cases on a pre-rename Tags input, checked as saved code after import: row
  references with a fixed, dynamic and computed index, optional access, text in string and template literals, a call
  with a comment before its parentheses, an action taken as a value, and a plain call. Known failing.
- `proto-key`: own `__proto__` keys in a saved Table row and a query body. Known failing.
- `mixed`: native TextInput, Button and Text with UI 2.0 widgets, bound to and calling each other.

## 3. Visual

`scripts/ui2-visual.js` builds `visual/gallery.jsx` with the app's webpack config (about 90 s the first time, then
cached), renders every widget as a new widget is created (default, loading, disabled) through the real RenderWidget, and
screenshots each row in the light and dark theme with Chromium. Each row is compared with
`visual/baselines/<platform>/<theme>/<Type>.png`; a row fails when more than 0.3% of its pixels differ (a pixel differs
when a channel moves by more than 40 of 255). Differences are written to `build/ui2-visual/diff`.

What would make two runs differ is held still: animations and transitions are off, the clock is fixed, the time zone is
UTC, network requests (map tiles, remote images) get one grey pixel, and the screenshots are taken only once two
full-page captures 400 ms apart are identical (auto-height widgets settle over a few frames). Each widget sits in a
fixed-size slot, so a settling height cannot move the widgets below it. Measured on the macOS baselines: three runs,
150 rows, no differing pixel.

```
npm run test:ui2-visual                         # build and compare
npm run test:ui2-visual -- --update --only ShadSelect   # rewrite baselines (all without --only)
npm run test:ui2-visual -- --no-build --repeat 3        # measure flakiness
```

It needs `playwright-core`, which is not an app dependency: CI installs it with `npm install --no-save`; locally, set
`UI2_VISUAL_DEPS` to a folder whose `node_modules` has it (so the shared `node_modules` is not touched), and
`UI2_VISUAL_CHROME` to a Chromium binary if Playwright's own is not installed.

Text renders differently on macOS and Linux, so each platform has its own baselines. To write the Linux set, run the
"Frontend unit tests" workflow by hand with `update_ui2_visual_baselines`, download the `ui2-visual-baselines-linux`
artifact into `visual/baselines/linux`, and commit it.
