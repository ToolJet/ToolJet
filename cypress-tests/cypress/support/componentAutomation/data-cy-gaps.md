# data-cy gaps found during widget browser-scenario automation

This is the fix list for the end of the widget browser-scenario Cypress effort. While automating each widget,
specs, helpers and selector constants had to fall back to class names, tag/structural walks, ARIA/role/id
picks or broken `data-cy` values wherever the widget did not render a stable, unique `data-cy`. Every row below
names the element, where it renders in product code, which test code currently works around it, and a proposed
attribute.

## How to use

1. Add the suggested `data-cy` in product code at the **Renders at** location. Thread the widget's `dataCy` prop
   down if the element lives in a child component.
2. Switch every listed spec/helper/constant to `cy.get('[data-cy="..."]')`. Drop the class, structural or
   `closest()` fallback, along with any `.first()` that only existed to dodge a duplicate.
3. Run that widget's specs, then set the row's **Status** to `Fixed` (add the commit SHA) and update the summary
   table.

## Naming conventions

- Prefix with the widget's existing `dataCy`. `RenderWidget.jsx:367` passes `dataCy={componentName}`. Keep the
  casing rule the widget already uses: BaseInput, PhoneInput, CurrencyInput and DropdownV2 lower-case it with
  `String(dataCy).toLowerCase()`, and the others use it verbatim.
- Shape: `<dataCy>-<part>` (`${dataCy}-label`, `${dataCy}-menu`, `${dataCy}-clear-button`). For repeated parts,
  add a zero-based index: `${dataCy}-option-<index>`, matching the existing `${dataCy}-button-${index}` and
  `${dataCy}-option-input-${index}`. Use a value slug only where the index is unstable (for example, Tags
  already uses `${name}-tag-<slug>`).
- Portaled parts (menus, popovers, tooltips) must still carry the widget prefix, so tests never need the
  component id.
- Never emit a global or unprefixed value (`cascader-clear`, `checkbox-input`), and never let a prefix render as
  `undefined`.

## Path abbreviations

| Prefix | Path |
|---|---|
| `S:` | `cypress-tests/cypress/e2e/happyPath/appbuilder/components/` |
| `H:` | `cypress-tests/cypress/support/utils/appBuilder/components/` |
| `C:` | `cypress-tests/cypress/constants/selectors/appBuilder/components/` |
| `W:` | `frontend/src/AppBuilder/Widgets/` |

Line numbers were verified against branch `test/browser-scenarios-cypress` on 2026-11-15. They drift as code
changes, so re-check before editing.

## Summary

263 widget-specific gaps across 46 widgets, plus 16 cross-cutting items.

| Widget | Open gaps | Fixed |
|---|---|---|
| [Cross-cutting](#cross-cutting) | 16 | 0 |
| [AudioRecorder](#audiorecorder) | 9 | 0 |
| [BoundedBox](#boundedbox) | 9 | 0 |
| [ButtonGroupV2](#buttongroupv2) | 2 | 0 |
| [Calendar](#calendar) | 9 | 0 |
| [Camera](#camera) | 11 | 0 |
| [Cascader](#cascader) | 8 | 0 |
| [CircularProgressBar](#circularprogressbar) | 4 | 0 |
| [CodeEditor](#codeeditor) | 5 | 0 |
| [ColorPicker](#colorpicker) | 7 | 0 |
| [CurrencyInput](#currencyinput) | 8 | 0 |
| [CustomComponent](#customcomponent) | 3 | 0 |
| [DaterangePicker](#daterangepicker) | 4 | 0 |
| [DatetimePickerV2](#datetimepickerv2) | 3 | 0 |
| [Divider](#divider) | 2 | 0 |
| [DropdownV2](#dropdownv2) | 15 | 0 |
| [EmailInput](#emailinput) | 1 | 0 |
| [FileInput](#fileinput) | 2 | 0 |
| [FilePicker](#filepicker) | 6 | 0 |
| [Html](#html) | 1 | 0 |
| [Icon](#icon) | 1 | 0 |
| [Image](#image) | 4 | 0 |
| [JSONEditor](#jsoneditor) | 7 | 0 |
| [JSONExplorer](#jsonexplorer) | 3 | 0 |
| [KeyValuePair](#keyvaluepair) | 15 | 0 |
| [LibraryComponent](#librarycomponent) | 4 | 0 |
| [Link](#link) | 5 | 0 |
| [Map](#map) | 5 | 0 |
| [Navigation](#navigation) | 11 | 0 |
| [Pagination](#pagination) | 5 | 0 |
| [PDF](#pdf) | 11 | 0 |
| [PhoneInput](#phoneinput) | 9 | 0 |
| [PopoverMenu](#popovermenu) | 10 | 0 |
| [ProgressBar](#progressbar) | 5 | 0 |
| [QrScanner](#qrscanner) | 6 | 0 |
| [RadioButtonV2](#radiobuttonv2) | 4 | 0 |
| [RichTextEditor](#richtexteditor) | 9 | 0 |
| [Spinner](#spinner) | 1 | 0 |
| [Steps](#steps) | 6 | 0 |
| [SvgImage](#svgimage) | 1 | 0 |
| [Tabs](#tabs) | 9 | 0 |
| [Tags](#tags) | 10 | 0 |
| [TextArea](#textarea) | 0 (none found) | 0 |
| [Timeline](#timeline) | 5 | 0 |
| [TimePicker](#timepicker) | 1 | 0 |
| [TreeSelect](#treeselect) | 6 | 0 |
| [VerticalDivider](#verticaldivider) | 1 | 0 |
| **Total** | **279** | **0** |

## Cross-cutting

These items cover several widgets and should be fixed once in shared code. Per-widget sections reference them
in their notes and don't list them again. Exceptions are per-widget instances that need their own product-code
change, such as a call site that has to pass `dataCy`; those are listed in the widget's table.

| # | Problem | Renders at (file:line) | Current fallback selector (spec/helper file:line) | Suggested fix | Status |
|---|---|---|---|---|---|
| DCY-X-01 | `draggable-widget-<name>` is **duplicated**: the canvas box in `RenderWidget` carries it, and Tags and Image stamp the same value on their own inner root. `[data-cy="draggable-widget-x"]` matches 2 nodes, so tests use `.first()` (24 lines across the scanned files) or class-qualify it. | `frontend/src/AppBuilder/AppCanvas/RenderWidget.jsx:346`; inner copies `W:Tags/Tags.jsx:302`, `W:Image/Image.jsx:353` | `` `.canvas-component[data-cy="draggable-widget-x"]` `` / `` `.tag-comp-wrapper[data-cy=...]` `` — `C:tags.js:15`; `C:tags.js:19`; `H:tags.js:136`; `H:image.js:11` (+ `.first()` e.g. `H:icon.js:147`, `H:divider.js:56`, `H:dropdownV2.js:140`) | Keep `draggable-widget-<name>` only on the RenderWidget box. Rename the inner roots to `${dataCy}-container` (Tags) and `${dataCy}-wrapper` (Image). | Open |
| DCY-X-02 | `_ui/Label` renders `` data-cy={`${dataCy}-label`} `` unconditionally, so a caller that omits `dataCy` gets **`undefined-label`**. Four scanned call sites omit it: TreeSelect, ProgressBar, KeyValuePair (every field row) and DaterangePicker (which doesn't forward `dataCy` to `BaseDateComponent`). | `frontend/src/_ui/Label.jsx:98`; call sites `W:TreeSelect/TreeSelect.jsx:461`, `W:Progressbar/Progressbar.jsx:168`, `W:KeyValuePair/_components/KeyValueRow.jsx:188`, `W:Date/BaseDateComponent.jsx:181` (via `W:Date/DaterangePicker.jsx:377`) | DCY-TreeSelect-01 (no spec can target it), DCY-ProgressBar-01 (`` `[data-cy=x] label` ``, `C:progressBar.js:9`), DCY-KeyValuePair-01 (`` `[data-cy=x] .key-value-label` ``, `C:keyValuePair.js:15`), DCY-DaterangePicker-04 (not selected) | Pass `dataCy` at each call site. Make `Label` omit the attribute (or throw in dev) when `dataCy` is falsy. | Open |
| DCY-X-03 | The widget root data-cy is the **bare component name** (`dataCy={componentName}`). It isn't namespaced, so tests have to qualify it with a class or scope it under `draggable-widget-<name>` to be sure they hit the widget root. | `frontend/src/AppBuilder/AppCanvas/RenderWidget.jsx:367` (prop); consumed by each widget root | `` `[data-cy=x].icon-widget` `` `C:icon.js:7`; `` `.link-widget` `` `C:link.js:7`; `` `.html-widget-container` `` `C:html.js:4`; `` `.button-group-widget[data-cy=x]` `` `C:buttonGroupV2.js:7`; `` `.custom-checkbox-tree[data-cy=x]` `` `C:treeSelect.js:7`; `` `.card[data-cy=x]` `` `C:timeline.js:7`; `` `[data-cy=x].spinner-container` `` `C:spinner.js:7`; `` `.dropdown-widget` `` `C:dropdownV2.js:13`; `` `.cascader-widget` `` `C:cascader.js:11` | Add a namespaced root `data-cy="${dataCy}-root"` (or `widget-<name>`) on every widget root. Keep the bare value only for back-compat until old specs are migrated. | Open |
| DCY-X-04 | Portaled menus and validation ids are keyed by the **component id**, not the name. Helpers walk `closest('[component-type]')` on the WidgetWrapper to read the id before they can select the menu. | `frontend/src/AppBuilder/AppCanvas/WidgetWrapper.jsx:267` (`component-type`, `id`) | `` `[component-type]` `` — `C:phoneInput.js:11`; `C:currencyInput.js:10`; `C:dropdownV2.js:11`; `H:phoneInput.js:17`; `H:currencyInput.js:21`; `H:dropdownV2.js:140`; `S:phoneInput/canvas.cy.js:164`; PopoverMenu reads the menu id `popover-menu-<id>` (`W:PopoverMenu/PopoverMenu.jsx:209`) off the trigger's `aria-controls` — `C:popoverMenu.js:27`; `H:popoverMenu.js:76-78,130` | Put `${dataCy}`-prefixed data-cy on every portaled menu, option and validation message (see per-widget rows), so tests never need the id. | Open |
| DCY-X-05 | BaseInput (EmailInput, TextArea, etc.) renders the clear button and the label+field row with **no data-cy**. | `W:BaseComponents/BaseInput.jsx:146` (`.tj-input-clear-btn`); `W:BaseComponents/BaseInput.jsx:171` (`.text-input` row) | `` `[data-cy="draggable-widget-x"] .tj-input-clear-btn` `` — `C:emailInput.js:20`; `S:emailInput/canvas.cy.js:192`; `` `... .text-input` `` — `C:emailInput.js:22`; `H:baseInput.js:62`; `H:baseInput.js:86` | `${String(dataCy).toLowerCase()}-clear-button` on the button and `${String(dataCy).toLowerCase()}-row` on the row div | Open |
| DCY-X-06 | The shared `Loader` has **no data-cy** and takes no `dataCy` prop. PhoneInput, CurrencyInput, DropdownV2 and PopoverMenu find it by class. | `frontend/src/ToolJetUI/Loader/Loader.jsx:10` (div `.tj-widget-loader`); call sites `W:BaseComponents/BaseInput.jsx:299`, `W:PhoneCurrency/PhoneInput.jsx:374`, `W:PhoneCurrency/CurrencyInput.jsx:393`, `W:DropdownV2/DropdownV2.jsx:623`, `W:PopoverMenu/components/CustomButton.jsx:243` | `` `[data-cy="draggable-widget-x"] .tj-widget-loader` `` — `C:phoneInput.js:29`; `C:currencyInput.js:28`; `C:dropdownV2.js:31`; `C:popoverMenu.js:21`; `H:dropdownV2.js:254`; `S:phoneInput/canvas.cy.js:286`; `S:dropdownV2/styles.cy.js:155` | Add an optional `dataCy` prop that renders `${dataCy}-loader`, and pass it from each call site | Open |
| DCY-X-07 | The `_ui/Label` text `<p>` (which carries the label colour and the mandatory `*`) has **no data-cy**, so colour checks reach it with a descendant tag selector. | `frontend/src/_ui/Label.jsx:36` | `` `[data-cy="<name>-label"] p` `` — `C:radioButtonV2.js:10`; `H:radioButtonV2.js:61`; `S:emailInput/styles.cy.js:107` | `${dataCy}-label-text` on the `<p>` (fix once in `_ui/Label.jsx`) | Open |
| DCY-X-08 | The canvas hover tooltip carries one **global, unprefixed** `widget-tooltip` data-cy for every widget, and its per-format body has none. Tests take `.first()` and pick the body by class. | `frontend/src/AppBuilder/AppCanvas/WidgetTooltip.jsx:71` (`data-cy="widget-tooltip"`); bodies at `:28` (html), `:32` (markdown), `:36` (plain) | `` `[data-cy="widget-tooltip"]` `` + `span.tw-whitespace-pre-wrap` / `.widget-tooltip-markdown` / `.widget-tooltip-html` — `C:radioButtonV2.js:22`; `C:radioButtonV2.js:24-26`; `S:radioButtonV2/properties.cy.js:34`; `S:radioButtonV2/properties.cy.js:74` | `${dataCy}-tooltip` on the content and `${dataCy}-tooltip-body` on the body. Keep `widget-tooltip` as a secondary attribute if other suites rely on it. | Open |
| DCY-X-09 | Every SubContainer canvas carries the **same `data-cy="real-canvas"`** as the main canvas, so once a Tabs (or any other sub-canvas host) is on the page `[data-cy="real-canvas"]` matches several nodes. The shared canvas commands then throw or hit the wrong canvas, and a sub-canvas can only be reached by its id `#canvas-<componentId>-<slot>`. | `frontend/src/AppBuilder/AppCanvas/Container.jsx:305` (id at :304); Tabs pane call site `W:Tabs/Tabs.jsx:607` | `` `[data-cy="real-canvas"]` `` — `cypress-tests/cypress/constants/selectors/common.js:26`; `cypress-tests/cypress/support/utils/appBuilder/canvas.js:102,211,248,258`; worked around by overwriting `forceClickOnCanvas` / `moveComponent` to filter to `#real-canvas` (`H:tabs.js:269-286`, `H:tabs.js:296`; enabled at `S:tabs/canvas.cy.js:70`, `S:tabs/contexts.cy.js:75`) | Emit `real-canvas` only on the main canvas (`id === 'canvas'`). Give `Container` an optional `dataCy` prop that the host widget fills for its sub-canvases (Tabs: DCY-Tabs-09). Keep the `real-canvas` class, which existing `.real-canvas` lookups use. | Open |
| DCY-X-10 | The shared date-widget shell renders the **label + field row and the validation message with no data-cy**, so every `BaseDateComponent` widget (DatetimePickerV2, DaterangePicker, and also DatePickerV2 and TimePicker) is reached by class or a structural walk. `DatepickerInput` is also inconsistent about casing: the input and icon lower-case `dataCy` (`:97`, `:104`), the clear button doesn't (`:143`). | `W:Date/BaseDateComponent.jsx:155` (`.datetimepicker-component` row); `W:Date/DatepickerInput.jsx:109` (validation `<div>`); casing at `W:Date/DatepickerInput.jsx:143` | `` `[data-cy="draggable-widget-x"] .datetimepicker-component` `` — `C:datetimePickerV2.js:16`; `C:daterangePicker.js:17`; `S:datetimePickerV2/properties.cy.js:90,100`; `S:daterangePicker/properties.cy.js:59,69,70`; `S:daterangePicker/userflow.cy.js:245`; `` `... .react-datepicker__input-container > span > div` `` — `C:datetimePickerV2.js:18`; `C:daterangePicker.js:19`; `S:daterangePicker/userflow.cy.js:233,239,241` (+5 more); TimePicker `C:timePicker.js:17,19`; `S:timePicker/properties.cy.js:59,69,70`; `S:timePicker/userflow.cy.js:224,237,241` (+9 more) | `${String(dataCy).toLowerCase()}-row` on the row div and `${String(dataCy).toLowerCase()}-invalid-feedback` on the message (matches DCY-X-05 and DCY-DropdownV2-15). Lower-case the clear button value too. | Open |
| DCY-X-11 | The **react-datepicker popup and every part inside it have no data-cy**: the popper (portalled to `#component-portal`), the day / month / year cells react-datepicker renders itself, and ToolJet's `CustomDatePickerHeader` arrows, month/year selectors and range month/year selects. The selectors are global, so specs rely on "only one popup open at a time", pick days by react-datepicker's `--0NN` class and reach a range month with `.eq(i)` on the month container. Shared by DatetimePickerV2 and DaterangePicker (and DatePickerV2, TimePicker). KeyValuePair date cells use the same library through their own renderer (DCY-KeyValuePair-11). | `W:Date/BaseDateComponent.jsx:190` (`DatePickerComponent`; `portalId` at :207, header at :231); `popperClassName` at `W:Date/DatetimePickerV2.jsx:403`, `W:Date/DaterangePicker.jsx:305` and `W:Date/TimePicker.jsx:166`; `W:Date/CustomDatePickerHeader.jsx:162` (prev), `:177` (month selector), `:182` (year selector), `:191` / `:205` (range month / year selects), `:225` (next) | `` `#component-portal .react-datepicker-popper` `` + `.react-datepicker__day--0NN`, `.tj-datepicker-widget-left/-right/-month-selector/-year-selector`, `.react-datepicker__month-text` / `__year-text`, `.daterangepicker-header .react-select__single-value` — `C:dateTimeCommon.js:6-26`; `H:dateTimeCommon.js:178,186,215,221,222`; `C:daterangePicker.js:22-32`; `H:daterangePicker.js:27,35`; `S:datetimePickerV2/userflow.cy.js:81,179,183,190` (+44 more); `S:daterangePicker/userflow.cy.js:88,89,136,159` (+36 more); TimePicker `` `.react-datepicker-popper.cc-timepicker-widget` `` / `` `.react-datepicker--time-only` `` — `C:timePicker.js:22,24`; `S:timePicker/canvas.cy.js:171,172,188`; `S:timePicker/userflow.cy.js:76` | Thread `dataCy` into the calendar (`dc` = `String(dataCy).toLowerCase()`, as `DatepickerInput` does): a `calendarContainer` wrapper with `${dc}-popup`; `renderDayContents` / `renderMonthContent` / `renderYearContent` (react-datepicker 7.6) emitting `${dc}-day-<YYYY-MM-DD>`, `${dc}-month-<index>` and `${dc}-year-<yyyy>` (these land on the inner span; the state classes stay on its parent cell); and a `dataCy` prop on `CustomDatePickerHeader` for `${dc}-prev`, `${dc}-next`, `${dc}-month-selector`, `${dc}-year-selector`, `${dc}-header-month-<i>` and `${dc}-header-year-<i>` (`i` = `customHeaderCount`). Date-keyed days remove the month-container `.eq(i)` walk. | Open |
| DCY-X-12 | `_ui/Select` (react-select wrapper) puts `` `${dataCy}-select-dropdown-input` `` on its input with `dataCy` defaulting to `''`, so a caller that omits it renders the **empty-prefixed `-select-dropdown-input`**, and its options (default react-select `Option`) have **no data-cy**. The menu is portalled to `<body>`, so tests match `.react-select__option` by text page-wide. | `frontend/src/_ui/Select/SelectComponent.jsx:7` (input), `:40` (`dataCy = ''`), `:86` (`components`, no custom `Option`); call sites `W:BoundedBox/RenderEditor.jsx:36`, `W:BoundedBox/RenderHighlight.jsx:76`, `frontend/src/AppBuilder/RightSideBar/Inspector/Components/DatetimePickerV2.jsx:412,434` | `` `.react-select__option` `` — `C:boundedBox.js:23`; `H:boundedBox.js:211`; `S:datetimePickerV2/properties.cy.js:221` (rows DCY-BoundedBox-05, DCY-BoundedBox-09, DCY-DatetimePickerV2-03) | Add a custom `Option` that renders `${dataCy}-option-<value>` and a menu `${dataCy}-menu`, and omit the input attribute when `dataCy` is empty. Each call site passes `dataCy` (listed as per-widget rows). | Open |
| DCY-X-13 | **CodeMirror 6 (`@uiw/react-codemirror`) renders the whole editor with no data-cy**: the `.cm-editor` root, `.cm-scroller`, `.cm-content` / `.cm-line`, the gutters and line numbers, fold markers and lint markers / tooltips. Every CodeMirror surface (the CodeEditor and JSONEditor widgets, and the inspector's multi-line CodeHinter that CustomComponent's Code field uses) is reached through a widget class plus `cm-*` classes. | `W:CodeEditor.jsx:119` (`extensions` at :127); `W:JSONEditor/JSONEditor.jsx:305` (`extensions` at :321); `frontend/src/AppBuilder/CodeEditor/MultiLineCodeEditor.jsx:364` (`extensions` at :373) | `` `... .cm-content` `` / `.cm-line` / `.cm-scroller` / `.cm-gutters` — `C:codeEditor.js:15-19`; `C:jsonEditor.js:16-31`; `C:customComponent.js:17,18` (rows DCY-CodeEditor-02..05, DCY-JSONEditor-02..07, DCY-CustomComponent-02) | Add one shared extension that takes the prefix and returns `EditorView.editorAttributes` (`` `${dc}-editor` ``) and `EditorView.contentAttributes` (`` `${dc}-content` ``), plus a small `ViewPlugin` that tags `view.scrollDOM` (`` `${dc}-scroller` ``) and the gutter element (`` `${dc}-gutter` ``). Append it to each `extensions` array. Leave `cm-*` state classes (`.cm-matchingBracket`, `.cm-activeLine`) alone. | Open |
| DCY-X-14 | CodeHinter builds its field data-cy as `` `${cyLabel}-input-field` `` from `paramLabel`, falling back to `props.cyLabel`. A call site that passes neither renders a **broken value**: the multi-line editor has no default and emits **`undefined-input-field`**, and the single-line editor defaults to `''` and emits **`-input-field`**. Every such field on the page shares the value. | `frontend/src/AppBuilder/CodeEditor/MultiLineCodeEditor.jsx:276` (derivation), `:363` (attribute); `frontend/src/AppBuilder/CodeEditor/SingleLineCodeEditor.jsx:284` (`cyLabel = ''`), `:571`, `:577`; inspector call sites with neither prop in `frontend/src/AppBuilder/RightSideBar/Inspector/Components/`: `CustomComponent.jsx:22,35`, `FilePicker.jsx:63`, `Steps.jsx:199,215,229`, `Tags.jsx:217` (more in that folder) | `` `.custom-component-inspector-multiline .cm-content` `` (scoped by the call site's `className`) — `C:customComponent.js:17,18`; `H:customComponent.js:93,94,102` (rows DCY-CustomComponent-02, DCY-CustomComponent-03) | Pass `cyLabel` at each call site (listed as per-widget rows). Make both editors omit the attribute (or warn in dev) when the derived label is empty. | Open |
| DCY-X-15 | `ToolJetUI/Tabs` renders its tab buttons with **no data-cy** (only `role="tab"`, `data-tab-key` and a `.tab-label` span). The Inspector's Properties / Styles tabs are reached by position, and the Components panel's tabs by `data-tab-key`. | `frontend/src/ToolJetUI/Tabs/Tabs.jsx:47` (button; `data-tab-key` at :50); callers `frontend/src/AppBuilder/RightSideBar/Inspector/Inspector.jsx:659` (`id="inspector"`), `frontend/src/AppBuilder/RightSideBar/ComponentManagerTab/ComponentsManagerTab.jsx:290` (`id="components-manager-tabs"` at :295) | `` `#inspector .nav-link:eq(1)` `` — `cypress-tests/cypress/constants/selectors/common.js:400` (`buttonStylesEditorSideBar`, referenced from 42 files, e.g. `S:customComponent/styles.cy.js:47`); `` `#inspector .nav-link:eq(0)` `` — `C:phoneInput.js:34`; `S:currencyInput/canvas.cy.js:257`; `` `#components-manager-tabs button[role="tab"][data-tab-key="custom"]` `` — `C:libraryComponent.js:16`; `H:libraryComponent.js:259,263` | Add an optional `dataCy` prop (defaulting to `id`) and render `` `${dataCy}-tab-${eventKey}` `` on the button: `inspector-tab-properties`, `inspector-tab-styles`; ComponentsManagerTab passes `dataCy="components-manager"` → `components-manager-tab-custom`. | Open |
| DCY-X-16 | The widget **drops its `dataCy` prop entirely**, so nothing it renders carries a data-cy, not even its root. AudioRecorder destructures the prop as `_dataCy` and never uses it; Camera and BoundedBox don't destructure it. Specs scope every part under RenderWidget's `draggable-widget-<name>` box and fall back to classes, aria-labels and DOM structure. | `W:AudioRecorder/AudioRecorder.jsx:20` (root div :297); `W:Camera/Camera.jsx:25` (root div :510); `W:BoundedBox/BoundedBox.jsx:12` (root div :184) | `` `[data-cy="draggable-widget-x"] .<class>` `` as the base of every selector — `C:audioRecorder.js:6`; `C:camera.js:6`; `C:boundedBox.js:5` (rows DCY-AudioRecorder-01..09, DCY-Camera-01..11, DCY-BoundedBox-01..09) | Destructure `dataCy`, render `data-cy={dataCy}` on the widget root (namespaced per DCY-X-03), and pass it to each child component that renders a tested part (listed as per-widget rows). Add a unit check that every registered widget's root carries the `dataCy` it receives, so a new widget can't drop it again. | Open |

## Per-widget gaps

### AudioRecorder

Instance of DCY-X-16: `W:AudioRecorder/AudioRecorder.jsx:20` destructures the prop as `_dataCy` and never uses it, so nothing the widget renders has a data-cy and every selector is a class or aria-label scoped under `draggable-widget-<name>` (`C:audioRecorder.js:6`). `RecorderStatusDisplay`, `Waveform` and `RecorderActions` take no `dataCy`, so it has to be passed down from `W:AudioRecorder/AudioRecorder.jsx:322`, `:332` and `:342`. The button container (`:303`, `C:audioRecorder.js:11`) and the save/discard container (`:341`, `C:audioRecorder.js:18`) have constants but are not selected by current specs.

| # | Element | Renders at (file:line) | Current fallback selector (spec/helper file:line) | Suggested data-cy | Status |
|---|---|---|---|---|---|
| DCY-AudioRecorder-01 | Widget root (instance of DCY-X-16: the `dataCy` prop is discarded) | `W:AudioRecorder/AudioRecorder.jsx:20` (prop renamed `_dataCy`); root div `:297` | `` `[data-cy="draggable-widget-x"]` `` + class as the base of every part — `C:audioRecorder.js:6`; widget presence read through the label — `S:audioRecorder/contexts.cy.js:40,55` | `data-cy={dataCy}` on the root div (destructure the prop; namespaced per DCY-X-03) | Open |
| DCY-AudioRecorder-02 | Record / pause / resume / play button (state only in its aria-label) | `W:AudioRecorder/AudioRecorder.jsx:304` (aria-label at :309) | `` `... .audio-recorder-transparent-button` `` / `` `... button[aria-label="<state>"]` `` — `C:audioRecorder.js:13,14`; `S:audioRecorder/canvas.cy.js:63`; `S:audioRecorder/userflow.cy.js:49,50,96,239` | `` `${dataCy}-recorder-button` `` (keep the aria-label for the state) | Open |
| DCY-AudioRecorder-03 | Label / status text | `W:AudioRecorder/AudioRecorder.jsx:321` | `` `... .audio-recorder-label` `` — `C:audioRecorder.js:15`; `S:audioRecorder/canvas.cy.js:64`; `S:audioRecorder/contexts.cy.js:40,55`; `S:audioRecorder/userflow.cy.js:105,159,175,292` | `` `${dataCy}-label` `` | Open |
| DCY-AudioRecorder-04 | Recording / playback timer | `W:AudioRecorder/RecorderStatusDisplay.jsx:10` | `` `... .audio-recorder-timer-container` `` — `C:audioRecorder.js:16`; `H:audioRecorder.js:69`; `S:audioRecorder/userflow.cy.js:60,115,148,176` (+4 more) | `` `${dataCy}-timer` `` (add a `dataCy` prop to `RecorderStatusDisplay`) | Open |
| DCY-AudioRecorder-05 | Waveform `<canvas>` | `W:AudioRecorder/Waveform.jsx:106` | `` `... .audio-recorder-waveform-container canvas` `` — `C:audioRecorder.js:17`; `H:audioRecorder.js:61`; `S:audioRecorder/userflow.cy.js:177,246,300` | `` `${dataCy}-waveform` `` | Open |
| DCY-AudioRecorder-06 | Save (check) button, no aria-label | `W:AudioRecorder/RecorderActions.jsx:9` | `` `... .audio-recorder-save-button` `` — `C:audioRecorder.js:19`; `S:audioRecorder/canvas.cy.js:65`; `S:audioRecorder/userflow.cy.js:72,106,114,125` (+4 more) | `` `${dataCy}-save-button` `` | Open |
| DCY-AudioRecorder-07 | Discard button: X while paused, trash while stopped (no aria-label, no own class on the X) | `W:AudioRecorder/RecorderActions.jsx:17` (X), `:25` (trash) | `` `... .save-discard-button-container .audio-recorder-button:not(.audio-recorder-save-button)` `` — `C:audioRecorder.js:21`; `S:audioRecorder/userflow.cy.js:126,147,157,173` | `` `${dataCy}-discard-button` `` on both | Open |
| DCY-AudioRecorder-08 | "Know more" link (microphone permission denied) | `W:AudioRecorder/RecorderActions.jsx:37` | `` `... .permission-denied-text` `` — `C:audioRecorder.js:22`; `S:audioRecorder/userflow.cy.js:288,293,307` | `` `${dataCy}-permission-help` `` | Open |
| DCY-AudioRecorder-09 | Loader (call site of the shared `Loader`, DCY-X-06) | `W:AudioRecorder/AudioRecorder.jsx:299` (`Loader` at :300) | `` `... .audio-recorder-loader-container` `` — `C:audioRecorder.js:23` (constant defined; no spec usage yet) | `` `${dataCy}-loader` `` (pass `dataCy` to `Loader` once DCY-X-06 adds the prop) | Open |

### BoundedBox

The widget renders **no data-cy at all**: `W:BoundedBox/BoundedBox.jsx` never reads the `dataCy` prop, so specs start from `draggable-widget-<name>` (helpers take `.first()`, DCY-X-01; e.g. `H:boundedBox.js:79,154,177`) and walk the react-image-annotation tree (`Container > [Img, Items, Target, Overlay, editor]`). `Img`, `Items` and the editor slot are third-party, so the hooks have to go on the elements we render (`RenderSelector`, `RenderEditor`, `RenderHighlight`, `Box`) or be set through a ref. The label pickers are `_ui/Select` (DCY-X-12). The highlight's own label select (`C:boundedBox.js:20-21`, `W:BoundedBox/RenderHighlight.jsx:76`) is not selected by current specs.

| # | Element | Renders at (file:line) | Current fallback selector (spec/helper file:line) | Suggested data-cy | Status |
|---|---|---|---|---|---|
| DCY-BoundedBox-01 | Widget root (display / height / box-shadow; instance of DCY-X-16) | `W:BoundedBox/BoundedBox.jsx:184` (class at :187) | `` `[data-cy="draggable-widget-x"] .bounded-box` `` — `C:boundedBox.js:10`; `H:boundedBox.js:105`; `S:boundedBox/canvas.cy.js:496`; `S:boundedBox/contexts.cy.js:180,183` (+23 more) | `data-cy={dataCy}` (destructure the unused prop; namespaced per DCY-X-03) | Open |
| DCY-BoundedBox-02 | Annotated `<img>` (library-rendered `Img`) | `W:BoundedBox/BoundedBox.jsx:189` (`Annotation`) | `` `... .bounded-box img` `` — `C:boundedBox.js:12`; `H:boundedBox.js:106,177,199`; `S:boundedBox/canvas.cy.js:111`; `S:boundedBox/properties.cy.js:95` | `` `${dataCy}-image` `` (set through a ref, or scope as `[data-cy=${dataCy}] img`) | Open |
| DCY-BoundedBox-03 | In-progress selection box | `W:BoundedBox/RenderSelector.jsx:8` → `W:BoundedBox/Box.jsx:4` | "the `Items` child without a `.row.m-0`" — `H:boundedBox.js:111` | `` `${dataCy}-selection` `` (add a `dataCy` prop to `Box`) | Open |
| DCY-BoundedBox-04 | Create-label picker (editor of the annotation being drawn) | `W:BoundedBox/RenderEditor.jsx:25` (class at :34) | `` `... .bounded-box > div > .col` `` / `... .col .react-select__control` — `C:boundedBox.js:14,15`; `H:boundedBox.js:112`; `S:boundedBox/userflow.cy.js:96,117` (+14 more) | `` `${dataCy}-label-editor` `` | Open |
| DCY-BoundedBox-05 | Create-label picker input (instance of DCY-X-12: renders `-select-dropdown-input`) | `W:BoundedBox/RenderEditor.jsx:36` → `frontend/src/_ui/Select/SelectComponent.jsx:7` | `` `... .bounded-box > div > .col input` `` — `C:boundedBox.js:16`; `S:boundedBox/userflow.cy.js:198,250` | pass `` dataCy={`${dataCy}-label`} `` → `` `${dataCy}-label-select-dropdown-input` `` | Open |
| DCY-BoundedBox-06 | Committed annotation box | `W:BoundedBox/RenderHighlight.jsx:24` → `W:BoundedBox/Box.jsx:4` | wrapper's `firstElementChild` — `H:boundedBox.js:110,128` | `` `${dataCy}-annotation-<index>` `` (annotation ids are runtime uuids) | Open |
| DCY-BoundedBox-07 | Annotation label row | `W:BoundedBox/RenderHighlight.jsx:34` (class at :45) | `` `... .bounded-box .row.m-0` `` — `C:boundedBox.js:18`; `H:boundedBox.js:110,124`; `S:boundedBox/userflow.cy.js:213,219,239` | `` `${dataCy}-annotation-<index>-label` `` | Open |
| DCY-BoundedBox-08 | Annotation delete button | `W:BoundedBox/RenderHighlight.jsx:47` | `` `... .bounded-box .row.m-0 > span` `` — `C:boundedBox.js:19`; `H:boundedBox.js:125`; `S:boundedBox/userflow.cy.js:273,286` | `` `${dataCy}-annotation-<index>-delete-button` `` | Open |
| DCY-BoundedBox-09 | Portalled label options (instance of DCY-X-12) | `W:BoundedBox/RenderEditor.jsx:36`, `W:BoundedBox/RenderHighlight.jsx:76` → `_ui/Select` menu | `` `.react-select__option` `` matched by text / `` `.react-select__menu` `` — `C:boundedBox.js:23,24`; `H:boundedBox.js:211,212`; `S:boundedBox/userflow.cy.js:200,223,252`; `S:boundedBox/canvas.cy.js:396` | `` `${dataCy}-label-option-<value>` `` | Open |

### ButtonGroupV2

Root is the bare `<name>` data-cy, class-qualified as `.button-group-widget` (DCY-X-03); the helper takes `.first()` of the draggable (DCY-X-01). The button list is still collected by class `button.button-group-button` (`C:buttonGroupV2.js:16`, `H:buttonGroupV2.js:54`) even though each button has `${dataCy}-button-${index}` (`W:ButtonGroupV2/ButtonGroupV2.jsx:383`), so this is a test-side change only. The icon data-cy `${dataCy}-icon` (`W:ButtonGroupV2/ButtonGroupV2.jsx:436`) repeats on every button and is not unique; current specs do not select it, and it should become `${dataCy}-button-${index}-icon`.

| # | Element | Renders at (file:line) | Current fallback selector (spec/helper file:line) | Suggested data-cy | Status |
|---|---|---|---|---|---|
| DCY-ButtonGroupV2-01 | content wrapper (scroll and overflow container) | `W:ButtonGroupV2/ButtonGroupV2.jsx:372` | `` `.button-group-content-wrapper` `` — `C:buttonGroupV2.js:11`; `H:buttonGroupV2.js:52`; `S:buttonGroupV2/canvas.cy.js:262`; `S:buttonGroupV2/canvas.cy.js:388`; `S:buttonGroupV2/contexts.cy.js:335` | `` `${dataCy}-content-wrapper` `` | Open |
| DCY-ButtonGroupV2-02 | button row/column container | `W:ButtonGroupV2/ButtonGroupV2.jsx:380` | `` `.button-group-content` `` — `C:buttonGroupV2.js:13`; `H:buttonGroupV2.js:53`; `S:buttonGroupV2/canvas.cy.js:245`; `S:buttonGroupV2/canvas.cy.js:315` | `` `${dataCy}-content` `` | Open |

### Calendar

The root carries the bare `<name>` data-cy (`W:Calendar/Calendar.jsx:138`, DCY-X-03; `C:calendar.js:10`, `H:calendar.js:178`). It also repeats the component id (`id={id}` at :131, the same value WidgetWrapper puts on its own node at `frontend/src/AppBuilder/AppCanvas/WidgetWrapper.jsx:265`), so `#<id>` matches 2 nodes. That is not a data-cy gap and is not counted. Everything inside the root is rendered by `react-big-calendar` (`<ReactCalendar>` at :141), which takes no data-cy. Hooks have to go through its `components` overrides (ToolJet already sets some at :122-127) or through props the library spreads onto its root. The event popover's sub-canvas carries the shared `real-canvas` data-cy (DCY-X-09; `C:calendar.js:43`; `S:calendar/properties.cy.js:91,122,139`). `.rbc-active`, `.rbc-today` and `.rbc-selected-cell` are state classes and are not counted.

| # | Element | Renders at (file:line) | Current fallback selector (spec/helper file:line) | Suggested data-cy | Status |
|---|---|---|---|---|---|
| DCY-Calendar-01 | Toolbar and its buttons (Today / Back / Next, Month / Week / Day view switcher) (library) | `W:Calendar/Calendar.jsx:141` (default react-big-calendar toolbar; `toolbar` prop at :189) | `` `[data-cy="draggable-widget-x"] .rbc-toolbar button` `` + exact text / `` `... .rbc-toolbar button.rbc-active` `` — `C:calendar.js:13,14,16`; `H:calendar.js:63,126`; `S:calendar/canvas.cy.js:80,219`; `S:calendar/contexts.cy.js:46`; `S:calendar/userflow.cy.js:106,168,188` (+6 more) | `` `${dataCy}-toolbar` `` and `` `${dataCy}-toolbar-<today\|back\|next\|month\|week\|day>` `` through a custom `components.toolbar` (add `aria-pressed` for the active view) | Open |
| DCY-Calendar-02 | Toolbar date label (library) | `W:Calendar/Calendar.jsx:141` (default toolbar) | `` `... .rbc-toolbar-label` `` — `C:calendar.js:15`; `H:calendar.js:125`; `S:calendar/canvas.cy.js:220`; `S:calendar/contexts.cy.js:87,108,112`; `S:calendar/events.cy.js:67` (+10 more) | `` `${dataCy}-toolbar-label` `` (same custom toolbar) | Open |
| DCY-Calendar-03 | Calendar body and current view (`.rbc-calendar`, `.rbc-month-view`, `.rbc-time-view`, `.rbc-time-view-resources`, `.rbc-time-content`) (library) | `W:Calendar/Calendar.jsx:141` | `` `... .rbc-calendar` `` / `` `... .rbc-month-view` `` / `` `... .rbc-time-view` `` — `C:calendar.js:12,19,28,29,30`; `H:calendar.js:116,117,127,136,137`; `S:calendar/canvas.cy.js:79,189,251,273` (+16 more) | `` `${dataCy}-calendar` `` passed to `ReactCalendar` (it spreads unknown props onto `.rbc-calendar`) plus `data-view={currentView}`, so view checks don't need `.rbc-month-view` / `.rbc-time-view` | Open |
| DCY-Calendar-04 | Month day cells (`.rbc-day-bg` by row / column index, `.rbc-date-cell`) (library) | `W:Calendar/Calendar.jsx:141` (month view) | `` `... .rbc-month-row:eq(r) .rbc-day-bg:eq(c)` `` / `` `... .rbc-day-bg.rbc-today` `` / `.rbc-date-cell` — `C:calendar.js:21,23,24,25`; `H:calendar.js:129,131,132,134,135`; `S:calendar/events.cy.js:71,73,86`; `S:calendar/userflow.cy.js:126,138,140,141` | `` `${dataCy}-day-<YYYY-MM-DD>` `` through `components.dateCellWrapper` (clone the background cell it wraps with the attribute) | Open |
| DCY-Calendar-05 | Week / day time slots, gutter labels and the drag-selection box (library) | `W:Calendar/Calendar.jsx:141` (time grid) | `` `... .rbc-time-content .rbc-day-slot:eq(c) .rbc-time-slot:eq(s)` `` / `` `... .rbc-slot-selection` `` / `.rbc-time-gutter .rbc-label` — `C:calendar.js:31,32,34,35`; `H:calendar.js:140,141,142,144,149`; `S:calendar/events.cy.js:105,112,128,152`; `S:calendar/userflow.cy.js:192,193,195,196` (+2 more) | `` `${dataCy}-slot-<ISO start>` `` through `components.timeSlotWrapper` (clone the slot it wraps); the selection box has no hook and stays scoped under DCY-Calendar-03 | Open |
| DCY-Calendar-06 | Month, day and resource column headers (library) | `W:Calendar/Calendar.jsx:141`; week header override at :124 | `` `... .rbc-month-header .rbc-header` `` / `` `... .rbc-time-header-cell .rbc-header` `` / `` `... .rbc-time-header .rbc-row-resource .rbc-header` `` — `C:calendar.js:20,36,37`; `H:calendar.js:128,138,139` (snapshot read by `readCalendarBoxes`) | `` `${dataCy}-header-<YYYY-MM-DD>` `` from the `week.header` override (:124) and a `month.header` one; `` `${dataCy}-resource-<resourceId>` `` through `components.resourceHeader` | Open |
| DCY-Calendar-07 | Event (`.rbc-event`) (library) | `W:Calendar/Calendar.jsx:141`; `eventPropGetter` at :60 can only return `className` / `style` | `` `... .rbc-event` `` — `C:calendar.js:39`; `H:calendar.js:150`; `S:calendar/properties.cy.js:71,75,96,103` (+3 more) | `` `${dataCy}-event-<index>` `` through `components.event` (renders inside `.rbc-event`) | Open |
| DCY-Calendar-08 | Event popover | `W:Calendar/CalendarPopover.jsx:112` (id at :127); rendered from `W:Calendar/Calendar.jsx:195` | `` `... .popover[id$="-popover"]` `` — `C:calendar.js:42`; `H:calendar.js:118`; `S:calendar/properties.cy.js:72,77,95,97` (+6 more) | `` `${dataCy}-event-popover` `` (pass `dataCy` to `CalendarEventPopover`) | Open |
| DCY-Calendar-09 | Errored widget: the inline error boundary replaces the inner box, so `draggable-widget-<name>` disappears and the fallback carries the **global, unprefixed** `error-boundary-fallback` | `frontend/src/_ui/ErrorBoundary/FallbackBoundary.tsx:135`; wrapped at `frontend/src/AppBuilder/AppCanvas/RenderWidget.jsx:384` | `` `.ele-<componentId>` `` (component id pinned through the API) + `[data-cy="error-boundary-fallback"]` — `C:calendar.js:47,48`; `S:calendar/userflow.cy.js:258,264,265,267` | Give `FallbackBoundary` an optional `dataCy` and pass `componentName` from RenderWidget → `` `${componentName}-error-boundary` `` | Open |

### Camera

Instance of DCY-X-16: `W:Camera/Camera.jsx:25` never destructures `dataCy`, so nothing the widget renders has a data-cy and every selector is a class or aria-label scoped under `draggable-widget-<name>` (`C:camera.js:6`). `Content`, `Footer` and `DeviceSelect` take no `dataCy`, so it has to be passed down from `W:Camera/Camera.jsx:516` (`Content`), `:527` (`Footer`) and `W:Camera/Footer.jsx:64,74` (`DeviceSelect`). The aria-label variant of the capture button (`C:camera.js:16`) is unused, and the placeholder's "Learn more" link (`W:Camera/Content.jsx:157`) is not selected by current specs.

| # | Element | Renders at (file:line) | Current fallback selector (spec/helper file:line) | Suggested data-cy | Status |
|---|---|---|---|---|---|
| DCY-Camera-01 | Widget container (instance of DCY-X-16; carries `data-permission-error` and the fullscreen class) | `W:Camera/Camera.jsx:25` (no `dataCy` in props); container `W:Camera/Camera.jsx:510` (class at :512) | `` `[data-cy="draggable-widget-x"] .camera-container` `` — `C:camera.js:10`; `S:camera/userflow.cy.js:62,63,279,280` (+3 more) | `data-cy={dataCy}` on the container (destructure the prop; namespaced per DCY-X-03) | Open |
| DCY-Camera-02 | Live / recorded `<video>` | `W:Camera/Content.jsx:141` (class at :143) | `` `... video.camera-content-video` `` — `C:camera.js:11`; `H:camera.js:186,213`; `S:camera/userflow.cy.js:87,137,138,193` | `` `${dataCy}-video` `` | Open |
| DCY-Camera-03 | Captured still `<img>` | `W:Camera/Content.jsx:139` | `` `... img.camera-content-image` `` — `C:camera.js:12`; `S:camera/userflow.cy.js:86,90,104` | `` `${dataCy}-captured-image` `` | Open |
| DCY-Camera-04 | Placeholder text (no stream / permission error) | `W:Camera/Content.jsx:152` | `` `... .camera-content-placeholder` `` — `C:camera.js:13` (constant defined; no spec usage yet) | `` `${dataCy}-placeholder` `` | Open |
| DCY-Camera-05 | Capture / record button (mode only in its aria-label) | `W:Camera/Footer.jsx:100` (aria-label at :107) | `` `... .camera-capture-button-trigger` `` — `C:camera.js:15`; `S:camera/canvas.cy.js:63`; `S:camera/contexts.cy.js:40,55`; `S:camera/userflow.cy.js:80,85,106,124` (+6 more) | `` `${dataCy}-capture-button` `` (keep the aria-label) | Open |
| DCY-Camera-06 | Save (check) button, no aria-label | `W:Camera/Footer.jsx:86` | `` `... .camera-save-button` `` — `C:camera.js:17`; `S:camera/userflow.cy.js:88,97,136,142` (+1 more) | `` `${dataCy}-save-button` `` | Open |
| DCY-Camera-07 | Discard (X) button, no aria-label | `W:Camera/Footer.jsx:89` (class at :91) | `` `... .camera-discard-button` `` — `C:camera.js:18`; `S:camera/userflow.cy.js:89` | `` `${dataCy}-discard-button` `` | Open |
| DCY-Camera-08 | Fullscreen toggle | `W:Camera/Footer.jsx:124` (class at :126) | `` `... .camera-fullscreen-button-trigger` `` — `C:camera.js:19`; `S:camera/userflow.cy.js:289,291,305,307` | `` `${dataCy}-fullscreen-button` `` | Open |
| DCY-Camera-09 | Flip-camera button (mobile only) | `W:Camera/Footer.jsx:53` (class at :55) | `` `... .camera-flip-button` `` — `C:camera.js:20`; `S:camera/userflow.cy.js:165,247,252,259` | `` `${dataCy}-flip-camera-button` `` | Open |
| DCY-Camera-10 | Camera / microphone device-select triggers | `W:Camera/DeviceSelect.jsx:41` (aria-label at :43); call sites `W:Camera/Footer.jsx:64` (camera), `:74` (microphone) | `` `... button[aria-label="Select camera device"]` `` / `` `... "Select microphone device"` `` — `C:camera.js:22,23`; `H:camera.js:315`; `S:camera/canvas.cy.js:64`; `S:camera/userflow.cy.js:172,196,248` | `` `${dataCy}-camera-select` `` / `` `${dataCy}-microphone-select` `` (pass `dataCy` and the kind into `DeviceSelect`) | Open |
| DCY-Camera-11 | Device options (Radix popover portalled to `<body>`; global selector that relies on only one popover being open, see DCY-X-04) | `W:Camera/DeviceSelect.jsx:57` (role at :60; popover content at :51) | `` `.camera-device-popover-content [role="option"]` `` matched by label text — `C:camera.js:25`; `H:camera.js:317,318`; `S:camera/userflow.cy.js:173,180,197` | `` `${dataCy}-<kind>-menu` `` on the popover content and `` `${dataCy}-<kind>-option-<index>` `` on each option (`kind` = `camera` / `microphone`) | Open |

### Cascader

Depends on DCY-X-01 and DCY-X-03 (root reached as `` `${box(name)} .cascader-widget` ``, `C:cascader.js:11`). The popover's stacking is read off Radix's own `[data-radix-popper-content-wrapper]` (`H:cascader.js:127`), which is third-party and not counted. The existing menu data-cy values are global (no widget prefix), so two Cascaders on one page collide. The specs rely on "only one menu open at a time".

| # | Element | Renders at (file:line) | Current fallback selector (spec/helper file:line) | Suggested data-cy | Status |
|---|---|---|---|---|---|
| DCY-Cascader-01 | Combobox control (`#component-<id>`, `role="combobox"`) | `W:Cascader/Cascader.tsx:314` (role at :317) | `` `${box(name)} [role="combobox"]` `` — `C:cascader.js:17`; `H:cascader.js:88,121`; `S:cascader/userflow.cy.js:132` (+20 more) | `` `${dataCy}-control` `` | Open |
| DCY-Cascader-02 | Selected path / placeholder text | `W:Cascader/Cascader.tsx:353` | `` `${box(name)} .cascader-display` `` — `C:cascader.js:19`; `H:cascader.js:110,122` | `` `${dataCy}-display` `` | Open |
| DCY-Cascader-03 | Clear button (broken: global `cascader-clear`) | `W:Cascader/Cascader.tsx:368` (data-cy at :370) | `` `${box(name)} [data-cy="cascader-clear"]` `` — `C:cascader.js:21`; `S:cascader/contexts.cy.js:161`; `S:cascader/canvas.cy.js:218` | `` `${dataCy}-clear-button` `` | Open |
| DCY-Cascader-04 | Portaled popover | `W:Cascader/Cascader.tsx:389` (class at :393) | `` `.cascader-popover` `` (global) — `C:cascader.js:24`; `H:cascader.js:87,89,123` (+3 more) | `` `${dataCy}-popover` `` | Open |
| DCY-Cascader-05 | Menu root | `W:Cascader/CascaderMenu.tsx:139` | `` `.cascader-popover .cascader-menu` `` — `C:cascader.js:26` (constant only; `menuList` builds on the same class) | `` `${dataCy}-menu` `` | Open |
| DCY-Cascader-06 | Back / breadcrumb header (broken: global `cascader-menu-back`) | `W:Cascader/CascaderMenu.tsx:141` (data-cy at :158) | `` `.cascader-popover [data-cy="cascader-menu-back"]` `` — `C:cascader.js:28`; `H:cascader.js:125`; `S:cascader/contexts.cy.js:251,256,305` | `` `${dataCy}-menu-back` `` | Open |
| DCY-Cascader-07 | Scrolling option list | `W:Cascader/CascaderMenu.tsx:170` | `` `.cascader-popover .cascader-menu > div:last-child` `` — `C:cascader.js:30`; `H:cascader.js:124`; `S:cascader/userflow.cy.js:237,261` | `` `${dataCy}-menu-list` `` | Open |
| DCY-Cascader-08 | Option row (broken: global `cascader-option-<value>`, value read back by string-stripping the prefix) | `W:Cascader/CascaderMenu.tsx:204` (data-cy at :210) | `` `.cascader-popover [data-cy="cascader-option-<value>"]` `` / `` `[data-cy^="cascader-option-"]` `` — `C:cascader.js:32,33`; `H:cascader.js:100,129,209`; `S:cascader/userflow.cy.js:252` (+1 more) | `` `${dataCy}-option-<value>` `` (scoped; optionally add `data-value`) | Open |

### CircularProgressBar

Root is the bare `<name>` data-cy scoped under `draggable-widget-<name>` (DCY-X-03). The SVG, trail and text come from `react-circular-progressbar`, which sets only `className` and `data-test-id="CircularProgressbar"` and forwards no other props (`frontend/node_modules/react-circular-progressbar/dist/index.js:109-113`). Those parts need a data-cy set through a ref, or a scoped selector under DCY-CircularProgressBar-01.

| # | Element | Renders at (file:line) | Current fallback selector (spec/helper file:line) | Suggested data-cy | Status |
|---|---|---|---|---|---|
| DCY-CircularProgressBar-01 | inner container (alignment and `rotate-forever` loading spin) | `W:CircularProgressBar/CirularProgressbar.jsx:133` | `` `[data-cy=<name>] > div` `` / `root.firstElementChild` — `C:circularProgressBar.js:9`; `H:circularProgressBar.js:31`; `H:circularProgressBar.js:129` | `` `${dataCy}-inner` `` | Open |
| DCY-CircularProgressBar-02 | progress SVG (library-rendered) | `W:CircularProgressBar/CirularProgressbar.jsx:134` | `` `svg.CircularProgressbar` `` — `C:circularProgressBar.js:11`; `H:circularProgressBar.js:32`; `S:circularProgressBar/styles.cy.js:110`; `S:circularProgressBar/contexts.cy.js:75` (+6 more) | `` `${dataCy}-svg` `` (set through a ref, or `[data-cy=${dataCy}-inner] > svg`) | Open |
| DCY-CircularProgressBar-03 | value text (library-rendered `<text>`) | `W:CircularProgressBar/CirularProgressbar.jsx:134` | `` `.CircularProgressbar-text` `` — `C:circularProgressBar.js:12`; `H:circularProgressBar.js:34`; `S:circularProgressBar/canvas.cy.js:68`; `S:circularProgressBar/styles.cy.js:64` | `` `${dataCy}-text` `` | Open |
| DCY-CircularProgressBar-04 | trail ring path (library-rendered) | `W:CircularProgressBar/CirularProgressbar.jsx:134` | `` `.CircularProgressbar-trail` `` — `H:circularProgressBar.js:33`; `H:circularProgressBar.js:124` | `` `${dataCy}-trail` `` | Open |

### CodeEditor

The widget root carries the bare `<name>` data-cy (`W:CodeEditor.jsx:104`, DCY-X-03). Everything inside the bordered box is rendered by `@uiw/react-codemirror` (CodeMirror 6), which takes no data-cy. CodeMirror's `EditorView.editorAttributes` / `EditorView.contentAttributes` extensions can set attributes on `.cm-editor` and `.cm-content` from the `extensions` array at `W:CodeEditor.jsx:127`. The gutter, scroller and autocomplete tooltip have no attribute API, so those rows are scoped selectors under a tagged editor (`[data-cy=${dataCy}-editor] .cm-gutters`) unless a view plugin sets them. `C:codeEditor.js:20` (`.cm-matchingBracket`) is a CodeMirror state class and not counted.

| # | Element | Renders at (file:line) | Current fallback selector (spec/helper file:line) | Suggested data-cy | Status |
|---|---|---|---|---|---|
| DCY-CodeEditor-01 | Bordered editor box (height / min / max-height, border, radius) | `W:CodeEditor.jsx:105` | `` `[data-cy="draggable-widget-x"] .code-editor-widget` `` — `C:codeEditor.js:12`; `H:codeEditor.js:111` | `` `${dataCy}-editor-box` `` | Open |
| DCY-CodeEditor-02 | Scroll area (library) | `W:CodeEditor.jsx:119` (`CodeMirror`) | `` `... .cm-scroller` `` — `C:codeEditor.js:15`; `S:codeEditor/canvas.cy.js:361,370,378` (+7 more) | `` `${dataCy}-scroller` `` | Open |
| DCY-CodeEditor-03 | Text area / lines (library; carries `data-language`) | `W:CodeEditor.jsx:119` | `` `... .cm-content` `` / `` `... .cm-line` `` — `C:codeEditor.js:16,17`; `H:codeEditor.js:75,87,127,153,159`; `S:codeEditor/canvas.cy.js:84,253,255` (+18 more) | `` `${dataCy}-content` `` (via `EditorView.contentAttributes`) | Open |
| DCY-CodeEditor-04 | Gutter / line numbers (library) | `W:CodeEditor.jsx:119` | `` `... .cm-gutters` `` / `` `... .cm-lineNumbers .cm-gutterElement` `` — `C:codeEditor.js:18,19`; `H:codeEditor.js:112,128,149,150`; `S:codeEditor/canvas.cy.js:435,444,446` | `` `${dataCy}-gutter` `` | Open |
| DCY-CodeEditor-05 | Autocomplete tooltip and options (library) | `W:CodeEditor.jsx:119` | `` `... .cm-tooltip-autocomplete` `` / `... li` — `C:codeEditor.js:21,22`; `S:codeEditor/userflow.cy.js:98,99,104` | `` `${dataCy}-autocomplete` `` / `` `${dataCy}-autocomplete-option-<index>` `` | Open |

### ColorPicker

The widget root (`data-cy={dataCy}`, `W:ColorPicker/ColorPicker.jsx:327`), trigger (`-button`, :358) and popover (`-popover`, :404) are already tagged. The slider gaps come from react-color's `SketchPicker` (third-party, no data-cy hooks). The fix is a wrapper, or composing `CustomPicker` + `Saturation`/`Hue`/`Alpha` inside data-cy'd divs at the render site.

| # | Element | Renders at (file:line) | Current fallback selector (spec/helper file:line) | Suggested data-cy | Status |
|---|---|---|---|---|---|
| DCY-ColorPicker-01 | Trigger colour swatch | `W:ColorPicker/ColorPicker.jsx:373` | `` `[data-cy="<name>-button"] .color-preview` `` — `C:colorPicker.js:11`; `H:colorPicker.js:137` | `` `${dataCy}-preview` `` | Open |
| DCY-ColorPicker-02 | Trigger colour code text | `W:ColorPicker/ColorPicker.jsx:379` | `` `[data-cy="<name>-button"] .color-code` `` — `C:colorPicker.js:12`; `H:colorPicker.js:138`; `S:colorPicker/canvas.cy.js:50`; `S:colorPicker/userflow.cy.js:91` | `` `${dataCy}-color-code` `` | Open |
| DCY-ColorPicker-03 | SketchPicker root | `W:ColorPicker/ColorPicker.jsx:414` (third-party `SketchPicker`) | `` `[data-cy="<name>-popover"] .sketch-picker` `` — `C:colorPicker.js:16`; `H:colorPicker.js:59` | `` `${dataCy}-sketch-picker` `` (wrapper div around `SketchPicker`) | Open |
| DCY-ColorPicker-04 | Saturation square | `W:ColorPicker/ColorPicker.jsx:414` (react-color internal) | `` `[data-cy="<name>-popover"] .saturation-white` `` — `C:colorPicker.js:18`; `H:colorPicker.js:61,75` | `` `${dataCy}-saturation` `` | Open |
| DCY-ColorPicker-05 | Hue strip | `W:ColorPicker/ColorPicker.jsx:414` (react-color internal) | `` `[data-cy="<name>-popover"] .hue-horizontal` `` — `C:colorPicker.js:20`; `H:colorPicker.js:76` | `` `${dataCy}-hue` `` | Open |
| DCY-ColorPicker-06 | Alpha strip | `W:ColorPicker/ColorPicker.jsx:414` (react-color internal) | `hue.parentElement.parentElement.nextElementSibling.firstElementChild` — `H:colorPicker.js:79-81`; `alpha.parentElement` display read at `H:colorPicker.js:150` | `` `${dataCy}-alpha` `` | Open |
| DCY-ColorPicker-07 | Slider pointers (saturation / hue / alpha) | `W:ColorPicker/ColorPicker.jsx:414` (react-color internal) | `container.lastElementChild` — `H:colorPicker.js:151,152,153` | `` `${dataCy}-saturation-pointer` `` / `` `${dataCy}-hue-pointer` `` / `` `${dataCy}-alpha-pointer` `` | Open |

### CurrencyInput

Depends on DCY-X-04: the currency menu is portalled to `<body>` and keyed by component id (`W:PhoneCurrency/CountrySelect.jsx:160`), so `H:currencyInput.js:21` and `S:currencyInput/canvas.cy.js:174` walk `[component-type]` to get the id. Rows 03–05 remove that need. The country-select data-cy prefix is shared with PhoneInput (`W:PhoneCurrency/CountrySelect.jsx:125`).

| # | Element | Renders at (file:line) | Current fallback selector (spec/helper file:line) | Suggested data-cy | Status |
|---|---|---|---|---|---|
| DCY-CurrencyInput-01 | Currency select control (react-select `__control`) | `W:PhoneCurrency/CountrySelect.jsx:127` (react-select default Control; add a `Control` override in the `components` map at :139) | `` `[data-cy="<name>-country-select-dropdown"] [class*="__control"]` `` — `C:currencyInput.js:20`; `S:currencyInput/styles.cy.js:106`; `S:currencyInput/canvas.cy.js:203` | `` `${String(dataCy).toLowerCase()}-country-select-control` `` (e.g. `currencyinput1-country-select-control`) | Open |
| DCY-CurrencyInput-02 | Currency prefix text (`$`, `£`) | `W:PhoneCurrency/CustomValueContainer.jsx:30` (with flag) and `:48` (without flag) | `` `[data-cy="<name>-country-select-dropdown"] [class*="__value-container"] span` `` — `C:currencyInput.js:22`; `H:currencyInput.js:77`; `S:currencyInput/canvas.cy.js:183`; `S:currencyInput/userflow.cy.js:66` (+2 more) | `` `${String(dataCy).toLowerCase()}-currency-prefix` `` (pass `dataCy` via `selectProps`) | Open |
| DCY-CurrencyInput-03 | Currency menu (portalled to body) | `W:PhoneCurrency/CountrySelect.jsx:134` (`menuPortalTarget`), class from :160 | `` `.country-${componentId}__menu` `` — `C:currencyInput.js:33`; `H:currencyInput.js:32`; `S:currencyInput/canvas.cy.js:179`; `S:currencyInput/canvas.cy.js:200` (+2 more) | `` `${String(dataCy).toLowerCase()}-country-menu` `` (custom `Menu` component carrying `innerProps`) | Open |
| DCY-CurrencyInput-04 | Currency option | `W:PhoneCurrency/CustomOption.jsx:28` | `` `.country-${componentId}__option` `` — `C:currencyInput.js:34`; `H:currencyInput.js:54`; `H:currencyInput.js:68`; `S:currencyInput/userflow.cy.js:73` (+2 more) | `` `${String(dataCy).toLowerCase()}-country-option-<countryCode>` `` (e.g. `currencyinput1-country-option-GB`) + `aria-selected` | Open |
| DCY-CurrencyInput-05 | Currency search box | `W:PhoneCurrency/CustomMenuList.jsx:23` (class at :29) | `` `.country-${componentId}__menu .currency-select-search-box` `` — `C:currencyInput.js:36`; `H:currencyInput.js:33`; `H:currencyInput.js:43`; `H:currencyInput.js:44` (+1 more) | `` `${String(dataCy).toLowerCase()}-country-search-input` `` | Open |
| DCY-CurrencyInput-06 | Clear button | `W:PhoneCurrency/CurrencyInput.jsx:368` | `` `[data-cy="draggable-widget-<name>"] .tj-input-clear-btn` `` — `C:currencyInput.js:26`; `S:currencyInput/canvas.cy.js:254`; `S:currencyInput/canvas.cy.js:261` | `` `${String(dataCy).toLowerCase()}-clear-button` `` | Open |
| DCY-CurrencyInput-07 | Loading spinner (instance of DCY-X-06) | `W:PhoneCurrency/CurrencyInput.jsx:393` → `frontend/src/ToolJetUI/Loader/Loader.jsx:11` | `` `[data-cy="draggable-widget-<name>"] .tj-widget-loader` `` — `C:currencyInput.js:28`; `S:currencyInput/canvas.cy.js:262` | `` `${String(dataCy).toLowerCase()}-loader` `` (add a `dataCy` prop to `Loader`) | Open |
| DCY-CurrencyInput-08 | Label + field row | `W:PhoneCurrency/CurrencyInput.jsx:250` | `` `[data-cy="draggable-widget-<name>"] .text-input` `` — `C:currencyInput.js:30` (defined, no current usage) | `` `${String(dataCy).toLowerCase()}-row` `` | Open |

### CustomComponent

The card root carries the bare `<name>` data-cy and is class-qualified as `[data-cy=<name>].card` (`W:CustomComponent/CustomComponent.jsx:183`, DCY-X-03; `C:customComponent.js:4`). The Inspector's Styles tab is DCY-X-15 (`S:customComponent/styles.cy.js:47`). Rows 02–03 are inspector instances of DCY-X-14; the Code editor's CodeMirror parts are DCY-X-13.

| # | Element | Renders at (file:line) | Current fallback selector (spec/helper file:line) | Suggested data-cy | Status |
|---|---|---|---|---|---|
| DCY-CustomComponent-01 | Widget `<iframe>` running the author code | `W:CustomComponent/CustomComponent.jsx:185` | `` `[data-cy="x"].card > iframe` `` — `C:customComponent.js:12`; `H:customComponent.js:66,76,115`; `S:customComponent/properties.cy.js:67,80,83`; `S:customComponent/userflow.cy.js:67,86,93` (+3 more) | `` `${dataCy}-frame` `` | Open |
| DCY-CustomComponent-02 | Inspector Code editor (broken: renders `undefined-input-field`; instance of DCY-X-14) | `frontend/src/AppBuilder/RightSideBar/Inspector/Components/CustomComponent.jsx:35` (no `paramLabel` / `cyLabel`) → `frontend/src/AppBuilder/CodeEditor/MultiLineCodeEditor.jsx:363` | `` `.custom-component-inspector-multiline .cm-content` `` / `... .cm-line` — `C:customComponent.js:17,18`; `H:customComponent.js:93,94,102` | `code-input-field` (pass `cyLabel="code"`), with `code-content` on `.cm-content` per DCY-X-13 | Open |
| DCY-CustomComponent-03 | Inspector Data editor (broken: renders `-input-field`; instance of DCY-X-14) | `frontend/src/AppBuilder/RightSideBar/Inspector/Components/CustomComponent.jsx:22` → `frontend/src/AppBuilder/CodeEditor/SingleLineCodeEditor.jsx:577` | none: not selected by current specs; `-input-field` collides with every other unlabelled field | `data-input-field` (pass `cyLabel="data"`) | Open |

### DaterangePicker

`W:Date/DaterangePicker.jsx` destructures `dataCy` (:21) but **doesn't forward it** to `BaseDateComponent` (:377-394), so the label, input, icon and clear button render `undefined-label`, `undefined-input-field`, `undefined-icon` and `undefined-clear-button`, duplicated on every range picker on the page. Passing `dataCy={dataCy}` at :377 fixes rows 01–04 together. The label + field row and the validation message are DCY-X-10, and the range popup, header month/year selects and day cells are DCY-X-11.

| # | Element | Renders at (file:line) | Current fallback selector (spec/helper file:line) | Suggested data-cy | Status |
|---|---|---|---|---|---|
| DCY-DaterangePicker-01 | Range input (broken: `undefined-input-field`) | `W:Date/DatepickerInput.jsx:97` (via `W:Date/DaterangePicker.jsx:377`) | `` `[data-cy="draggable-widget-x"] input.table-column-datepicker-input` `` — `C:daterangePicker.js:13`; `H:daterangePicker.js:63`; `S:daterangePicker/userflow.cy.js:80,87,107` (+63 more) | `` `${String(dataCy).toLowerCase()}-input-field` `` | Open |
| DCY-DaterangePicker-02 | Calendar icon (broken: `undefined-icon`) | `W:Date/DatepickerInput.jsx:104` | — (not selected by current specs) | `` `${String(dataCy).toLowerCase()}-icon` `` | Open |
| DCY-DaterangePicker-03 | Clear button (broken: `undefined-clear-button`) | `W:Date/DatepickerInput.jsx:143` | `` `... .tj-input-clear-btn` `` — `C:daterangePicker.js:15`; `S:daterangePicker/properties.cy.js:94` | `` `${dataCy}-clear-button` `` (lower-cased per DCY-X-10) | Open |
| DCY-DaterangePicker-04 | Label (instance of DCY-X-02: `undefined-label`) | `W:Date/BaseDateComponent.jsx:181` → `frontend/src/_ui/Label.jsx:98` | — (not selected by current specs) | `` `${dataCy}-label` `` | Open |

### DatetimePickerV2

The input, icon, clear button and label are tagged (`W:Date/DatepickerInput.jsx:97,104,143`, `_ui/Label`). The label + field row and the validation message are DCY-X-10, and the popup, day / month / year cells, header arrows and month / year selectors are DCY-X-11. Rows 02–03 are DatetimePickerV2-specific inspector UI (`frontend/src/AppBuilder/RightSideBar/Inspector/Components/DatetimePickerV2.jsx`).

| # | Element | Renders at (file:line) | Current fallback selector (spec/helper file:line) | Suggested data-cy | Status |
|---|---|---|---|---|---|
| DCY-DatetimePickerV2-01 | Time panel, columns and items (`TimepickerInput` is also used by TimePicker and gets no `dataCy`) | `W:Date/TimepickerInput.jsx:159` (panel), `:96` (column), `:172`, `:188`, `:205`, `:222`, `:236` (items); rendered at `W:Date/BaseDateComponent.jsx:230` | `` `#component-portal .react-datepicker-popper .custom-time-input .time-col` `` + `.time-item` / `.selected-time` / `.time-header` — `C:dateTimeCommon.js:14,28-31`; `H:dateTimeCommon.js:194,202,203,216`; `S:datetimePickerV2/userflow.cy.js:82,154,194,200`; `S:datetimePickerV2/properties.cy.js:148`; TimePicker `H:timePicker.js:26,27,42`; `S:timePicker/userflow.cy.js:77,120,178` (+4 more) | `` `${dc}-time-panel` ``, `` `${dc}-time-hours` `` / `-minutes` / `-ampm` (columns), `` `${dc}-time-<column>-<value>` `` (items) | Open |
| DCY-DatetimePickerV2-02 | Inspector "Store in" timezone field (broken: duplicates "Display in"'s `input-display-time-zone` / `label-display-time-zone`) | `frontend/src/AppBuilder/RightSideBar/Inspector/Components/DatetimePickerV2.jsx:427` (label at :431; "Display in" at :405, :409) | `` `[data-cy="input-display-time-zone"]` `` + `.eq(0/1)` — `S:datetimePickerV2/properties.cy.js:219,222` | `` `input-store-time-zone` `` / `` `label-store-time-zone` `` | Open |
| DCY-DatetimePickerV2-03 | Inspector timezone option (instance of DCY-X-12) | `frontend/src/AppBuilder/RightSideBar/Inspector/Components/DatetimePickerV2.jsx:412,434` → `_ui/Select` menu | `` `.react-select__option` `` matched by text — `S:datetimePickerV2/properties.cy.js:221` | pass `dataCy="display-time-zone"` / `"store-time-zone"` → `` `display-time-zone-option-<zone>` `` | Open |

### Divider

Depends on DCY-X-03 (root reached as `` `[data-cy=draggable-widget-x] [data-cy=x]` ``, `C:divider.js:8`). Runtime is `W:Divider.jsx` (the `W:Divider/` folder holds only tests).

| # | Element | Renders at (file:line) | Current fallback selector (spec/helper file:line) | Suggested data-cy | Status |
|---|---|---|---|---|---|
| DCY-Divider-01 | Label `<span>` (left / center / right variants) | `W:Divider.jsx:86`, `:102`, `:110` | `` `[data-cy=x] span` `` — `C:divider.js:10`; `S:divider/styles.cy.js:162`; `S:divider/styles.cy.js:237`; `H:divider.js:67` (`root.querySelector("span")`) (+2 more) | `` `${dataCy}-label` `` (e.g. `horizontaldivider1-label`) | Open |
| DCY-Divider-02 | Line `<div>`(s) (1 without label, 1-2 with label) | `W:Divider.jsx:66`, `:87`, `:101`, `:103`, `:109` | leaf-div walk `` `root.querySelectorAll("div")` filtered by `children.length === 0` `` + `el.parentElement` — `H:divider.js:66`; `H:divider.js:78`; consumed via `dividerBoxes` at `S:divider/styles.cy.js:92`, `S:divider/canvas.cy.js:56` (+15 more calls) | `` `${dataCy}-line` `` (center label: `${dataCy}-line-start` / `${dataCy}-line-end`) | Open |

### DropdownV2

Depends on DCY-X-01, DCY-X-03 (root reached as `` `${box(name)} .dropdown-widget` ``, `C:dropdownV2.js:13`) and DCY-X-04 (component id via `closest("[component-type]")`, `H:dropdownV2.js:140`). The react-select `Select` has no `classNamePrefix`, so its Control / ValueContainer / IndicatorsContainer / Input are only reachable structurally. `CustomMenuList` / `CustomOption` are shared with MultiselectV2, so the menu data-cy needs `dataCy` passed through `selectProps`.

| # | Element | Renders at (file:line) | Current fallback selector (spec/helper file:line) | Suggested data-cy | Status |
|---|---|---|---|---|---|
| DCY-DropdownV2-01 | Portaled menu list | `W:DropdownV2/CustomMenuList.jsx:70` | `` `.dropdown-multiselect-widget-custom-menu-list` `` (global, assumes one menu open) — `C:dropdownV2.js:39`; `H:dropdownV2.js:148,209`; `S:dropdownV2/userflow.cy.js:79` (+8 more) | `` `${dataCy}-menu` `` | Open |
| DCY-DropdownV2-02 | Menu scroll body (virtualized) | `W:DropdownV2/CustomMenuList.jsx:113` | `` `.dropdown-multiselect-widget-custom-menu-list-body` `` — `C:dropdownV2.js:41`; `H:dropdownV2.js:210,308`; `S:dropdownV2/userflow.cy.js:89,103` | `` `${dataCy}-menu-list` `` | Open |
| DCY-DropdownV2-03 | Menu search input | `W:DropdownV2/CustomMenuList.jsx:86` | `` `.dropdown-multiselect-widget-search-box` `` — `C:dropdownV2.js:43`; `H:dropdownV2.js:181,183,211` | `` `${dataCy}-search-input` `` | Open |
| DCY-DropdownV2-04 | Menu option | `W:DropdownV2/CustomOption.jsx:15` | `` `.dropdown-multiselect-widget-custom-menu-list [id^="react-select-"][id*="-option-"]` `` (react-select instance id changes per render; index parsed from id) — `C:dropdownV2.js:45`; `H:dropdownV2.js:169,213` | `` `${dataCy}-option-<index>` `` (e.g. `dropdown1-option-0`) | Open |
| DCY-DropdownV2-05 | Option selected check mark | `W:DropdownV2/CustomOption.jsx:23` | `` `svg path` `` inside the option — `H:dropdownV2.js:214` | `` `${dataCy}-option-<index>-check` `` | Open |
| DCY-DropdownV2-06 | Option label text | `W:DropdownV2/CustomOption.jsx:28` | `` `span.tw-truncate` `` inside the option — `H:dropdownV2.js:215` | `` `${dataCy}-option-<index>-label` `` | Open |
| DCY-DropdownV2-07 | react-select container (`#component-<id>`) | `W:DropdownV2/DropdownV2.jsx:573` (`id` at :608) | `` `${box(name)} [id^="component-"]` `` — `C:dropdownV2.js:19`; `H:dropdownV2.js:204` | `` `${dataCy}-select` `` (custom `SelectContainer` innerProps) | Open |
| DCY-DropdownV2-08 | react-select Control | `W:DropdownV2/DropdownV2.jsx:573` (default `Control`, no custom component) | `` `[id^="component-"] > div` `` / `` `:scope > div` `` — `C:dropdownV2.js:21`; `H:dropdownV2.js:205` | `` `${dataCy}-control` `` (custom `Control` innerProps) | Open |
| DCY-DropdownV2-09 | Value container | `W:DropdownV2/CustomValueContainer.jsx:24` | `` `[id^="component-"] > div > div:first-child` `` / `control.firstElementChild` — `C:dropdownV2.js:23`; `H:dropdownV2.js:206` | `` `${dataCy}-value-container` `` | Open |
| DCY-DropdownV2-10 | Selected value / placeholder text | `W:DropdownV2/CustomValueContainer.jsx:45` (SingleValue), `:49` (Placeholder) | `` `… > div > div:first-child span.d-flex > div` `` — `C:dropdownV2.js:25`; `H:dropdownV2.js:192,207` | `` `${dataCy}-value` `` / `` `${dataCy}-placeholder` `` | Open |
| DCY-DropdownV2-11 | Indicators container | `W:DropdownV2/DropdownV2.jsx:573` (default `IndicatorsContainer`) | `` `[id^="component-"] > div > div:last-child` `` / `control.lastElementChild.children` — `C:dropdownV2.js:27`; `H:dropdownV2.js:255` | `` `${dataCy}-indicators` `` | Open |
| DCY-DropdownV2-12 | Clear button | `W:DropdownV2/DropdownV2.jsx:51` (class added at :55) | `` `${box(name)} .clear-indicator` `` — `C:dropdownV2.js:29`; `S:dropdownV2/styles.cy.js:172`; `S:dropdownV2/contexts.cy.js:149` | `` `${dataCy}-clear-button` `` | Open |
| DCY-DropdownV2-13 | Loading indicator (instance of DCY-X-06) | `W:DropdownV2/DropdownV2.jsx:623` → `frontend/src/ToolJetUI/Loader/Loader.jsx:11` | `` `${box(name)} .tj-widget-loader` `` — `C:dropdownV2.js:31`; `H:dropdownV2.js:254`; `S:dropdownV2/styles.cy.js:155,156` | `` `${dataCy}-loader` `` | Open |
| DCY-DropdownV2-14 | Combobox input (aria-invalid / aria-expanded) | `W:DropdownV2/DropdownV2.jsx:573` (default react-select `Input`) | `` `${box(name)} input[role="combobox"]` `` — `C:dropdownV2.js:33`; `H:dropdownV2.js:256`; `S:dropdownV2/contexts.cy.js:159,166` | `` `${dataCy}-input` `` | Open |
| DCY-DropdownV2-15 | Validation error message | `W:DropdownV2/DropdownV2.jsx:657` (`id` at :658) | `` `[id="<componentId>-validation-error"]` `` (needs DCY-X-04 id lookup) — `C:dropdownV2.js:35`; `H:dropdownV2.js:228`; `S:dropdownV2/contexts.cy.js:157,169` | `` `${dataCy}-invalid-feedback` `` (matches BaseInput convention) | Open |

### EmailInput

Depends on DCY-X-05 and DCY-X-07 (label text `[data-cy="<name>-label"] p` — `S:emailInput/styles.cy.js:107`) (clear button `.tj-input-clear-btn` — `C:emailInput.js:20`, `S:emailInput/canvas.cy.js:192-196`; `.text-input` row — `C:emailInput.js:22`, `H:baseInput.js:62,86`).

| # | Element | Renders at (file:line) | Current fallback selector (spec/helper file:line) | Suggested data-cy | Status |
|---|---|---|---|---|---|
| DCY-EmailInput-01 | Left icon identity (which Tabler icon is drawn) | `W:BaseComponents/BaseInput.jsx:257` (data-cy at :259) | `` `[data-cy="<name>-icon"]` `` + `.find('path[d^="M22 7.535v9.465"]')` / `.find('path[d^="M3 7a2 2 0 0 1 2 -2h14"]')` — `cypress-tests/cypress/constants/texts/appBuilder/components/emailInput.js:25-26`; `S:emailInput/contexts.cy.js:159`; `S:emailInput/contexts.cy.js:160` | keep `` `${dataCy}-icon` ``; add `data-icon-name={icon}` (e.g. `IconMailFilled`) so the icon is asserted by name, not SVG path data | Open |

### FileInput

The root (`W:FileInput/FileInput.jsx:243`) and the label, hidden input, Browse button, loader, clear button and validation message are tagged; children derive their prefix from `generateCypressDataCy(dataCy)` (`cyBase`). Only the drop-zone field and the selected-file summary are missing.

| # | Element | Renders at (file:line) | Current fallback selector (spec/helper file:line) | Suggested data-cy | Status |
|---|---|---|---|---|---|
| DCY-FileInput-01 | Drop-zone field (only `id="component-<id>"`; class from `getRootProps` at :213) | `W:FileInput/FileInput.jsx:276` | `` `[data-cy="x"] .tj-file-input-field` `` / `#component-<id>` — `C:fileInput.js:25,26`; `S:fileInput/userflow.cy.js:100` | `` `${cyBase}-field` `` | Open |
| DCY-FileInput-02 | Selected-file summary / placeholder text | `W:FileInput/FileInput.jsx:331` | `` `[data-cy="x"] .tj-file-input-field span.tw-truncate` `` — `C:fileInput.js:27`; `S:fileInput/canvas.cy.js:63`; `S:fileInput/contexts.cy.js:54`; `S:fileInput/userflow.cy.js:65,95,101,111` | `` `${cyBase}-file-summary` `` | Open |

### FilePicker

The runtime is `W:FilePicker/FilePicker.jsx` (`W:FilePicker.jsx` is a 35-line wrapper). The root carries the bare `<name>` data-cy and is class-qualified as `.file-picker-widget-wrapper` (`W:FilePicker/FilePicker.jsx:216`, DCY-X-03; `C:filePicker.js:16`; `H:filePicker.js:152`; `S:filePicker/styles.cy.js:69,71,79`). The title, hidden input, instruction and drag messages are tagged with the widget prefix. The file-row values (`FileListItem.jsx:20,27,45`) are built from the file's name, type and size, not the widget, so two pickers holding the same file collide. The file-size value (:27) is not selected by current specs.

| # | Element | Renders at (file:line) | Current fallback selector (spec/helper file:line) | Suggested data-cy | Status |
|---|---|---|---|---|---|
| DCY-FilePicker-01 | Dropzone root | `W:FilePicker/Components/UploadArea.jsx:54` (class at :43) | `` `[data-cy="x"] .file-picker-dropzone` `` — `C:filePicker.js:23`; `H:filePicker.js:102,105,125,153`; `S:filePicker/canvas.cy.js:195,250`; `S:filePicker/userflow.cy.js:80,91` (+11 more) | `` `${dataCy}-dropzone` `` | Open |
| DCY-FilePicker-02 | Files pane | `W:FilePicker/FilePicker.jsx:274` | `` `[data-cy="x"] .file-picker-files-pane` `` — `C:filePicker.js:24`; `H:filePicker.js:154` | `` `${dataCy}-files-pane` `` | Open |
| DCY-FilePicker-03 | File row | `W:FilePicker/Components/FileListItem.jsx:16` | `` `[data-cy="x"] .file-list-item` `` + `.eq(i)` — `C:filePicker.js:25`; `H:filePicker.js:166,199,200`; `S:filePicker/canvas.cy.js:241`; `S:filePicker/contexts.cy.js:100`; `S:filePicker/userflow.cy.js:111,123` (+4 more) | `` `${dataCy}-file-<index>` `` (thread `dataCy` through `FileList`) | Open |
| DCY-FilePicker-04 | File name (broken: `<file-name>-file-name`, not widget-scoped) | `W:FilePicker/Components/FileListItem.jsx:20` | `` `... .file-list-item .file-name` `` — `C:filePicker.js:26`; `S:filePicker/userflow.cy.js:112` | `` `${dataCy}-file-<index>-name` `` | Open |
| DCY-FilePicker-05 | File delete button (broken: `<file-name>-file-delete-button`, not widget-scoped) | `W:FilePicker/Components/FileListItem.jsx:45` | `` `... .file-list-item .delete-button` `` — `C:filePicker.js:27`; `H:filePicker.js:200` | `` `${dataCy}-file-<index>-delete-button` `` | Open |
| DCY-FilePicker-06 | Error message (broken: global, unprefixed `file-picker-error-message`) | `W:FilePicker/Components/ErrorMessage.jsx:11` | `` `[data-cy="x"] [data-cy="file-picker-error-message"]` `` — `C:filePicker.js:28`; `S:filePicker/userflow.cy.js:122` | `` `${dataCy}-error-message` `` | Open |

### Html

Depends on DCY-X-03 (root qualified as `` `[data-cy=x].html-widget-container` ``, `C:html.js:4`). Authored-markup picks by `#id` (`C:html.js:15`) are user content, not a gap; `textInput`/`flexCanvas` (`C:html.js:17`, `:19`) target other widgets and are out of scope here.

| # | Element | Renders at (file:line) | Current fallback selector (spec/helper file:line) | Suggested data-cy | Status |
|---|---|---|---|---|---|
| DCY-Html-01 | Content root (carries background + sanitized markup) | `W:Html.jsx:206` | `` `[data-cy=x].html-widget-container > div` `` — `C:html.js:13`; `S:html/canvas.cy.js:83`; `S:html/contexts.cy.js:71`; `H:html.js:80` (`c.firstElementChild`) (+1 more) | `` `${dataCy}-content` `` (e.g. `html1-content`) | Open |

### Icon

Depends on DCY-X-03 (root qualified with `.icon-widget`; `H:icon.js:149` finds it by class only).

| # | Element | Renders at (file:line) | Current fallback selector (spec/helper file:line) | Suggested data-cy | Status |
|---|---|---|---|---|---|
| DCY-Icon-01 | Icon `<svg>` (TablerIcon; spreads props onto the svg) | `W:Icon.jsx:119` | `` `[data-cy=x].icon-widget > svg` `` — `C:icon.js:9`; `S:icon/canvas.cy.js:56`; `S:icon/events.cy.js:66`; `H:icon.js:149-150` (`querySelector(".icon-widget")` → `querySelector("svg")`) (+20 more) | `` `${dataCy}-svg` `` (e.g. `icon1-svg`) | Open |

### Image

Depends on DCY-X-01: the widget root `W:Image/Image.jsx:353` repeats `draggable-widget-<name>`, so the root is reached as `` `[data-cy=draggable-widget-x] .image-widget-wrapper` `` (`C:image.js:9`, used at `S:image/userflow.cy.js:91`) and `doc.querySelector(draggableWidget)` relies on the outer box matching first (`S:image/canvas.cy.js:162`, `:228`).

| # | Element | Renders at (file:line) | Current fallback selector (spec/helper file:line) | Suggested data-cy | Status |
|---|---|---|---|---|---|
| DCY-Image-01 | Rendered `<img>` | `W:Image/Image.jsx:200` | `` `img.zoom-image-wrap` `` — `C:image.js:11`; `S:image/canvas.cy.js:75`; `S:image/contexts.cy.js:68`; `S:image/userflow.cy.js:33` (+12 more) | `` `${dataCy}-img` `` (e.g. `image1-img`) | Open |
| DCY-Image-02 | LazyLoad placeholder | `W:Image/Image.jsx:179` | `` `.skeleton-image` `` — `C:image.js:13`; `S:image/canvas.cy.js:181`; `S:image/canvas.cy.js:189`; `S:image/canvas.cy.js:196` | `` `${dataCy}-placeholder` `` | Open |
| DCY-Image-03 | Zoom pointer surface | `W:Image/Image.jsx:317` | `` `.transform-component-wrapper` `` — `C:image.js:15`; `H:image.js:75`; `H:image.js:89`; `S:image/userflow.cy.js:45` (+6 more) | `` `${dataCy}-zoom-surface` `` | Open |
| DCY-Image-04 | Zoom content (react-zoom-pan-pinch `TransformComponent`, carries the transform) | `W:Image/Image.jsx:327` (library div; add via `contentProps`, supported by react-zoom-pan-pinch 2.6.1) | `` `.react-transform-component` `` — `C:image.js:17`; `H:image.js:59`; `H:image.js:67`; `H:image.js:121` | `` `${dataCy}-zoom-content` `` | Open |

### JSONEditor

The widget renders **no data-cy at all**: `W:JSONEditor/JSONEditor.jsx` never reads the `dataCy` prop, so specs start from `draggable-widget-<name>` and its `.json-editor-widget` class. Everything inside is CodeMirror 6 (DCY-X-13). Fold and lint parts are the only ones CodeMirror lets us build ourselves (`foldGutter({ markerDOM })`, `codeFolding({ placeholderDOM })`, and a diagnostic's `renderMessage`). The loader (`:303`, shared `Loader`, DCY-X-06) is not selected by current specs.

| # | Element | Renders at (file:line) | Current fallback selector (spec/helper file:line) | Suggested data-cy | Status |
|---|---|---|---|---|---|
| DCY-JSONEditor-01 | Widget container (height / background / border / visibility) | `W:JSONEditor/JSONEditor.jsx:301` | `` `[data-cy="draggable-widget-x"] .json-editor-widget` `` — `C:jsonEditor.js:6,13`; `H:jsonEditor.js:54`; `S:jsonEditor/canvas.cy.js:334` | `data-cy={dataCy}` (destructure the unused prop; namespaced per DCY-X-03) | Open |
| DCY-JSONEditor-02 | CodeMirror root (`.cm-editor`, theme background) (library) | `W:JSONEditor/JSONEditor.jsx:305` | `` `... .cm-editor` `` — `C:jsonEditor.js:16`; `H:jsonEditor.js:82` | `` `${dataCy}-editor` `` (via `EditorView.editorAttributes`) | Open |
| DCY-JSONEditor-03 | Scroll area (library) | `W:JSONEditor/JSONEditor.jsx:305` | `` `... .cm-scroller` `` — `C:jsonEditor.js:17`; `H:jsonEditor.js:56`; `S:jsonEditor/canvas.cy.js:344,429,430,446` | `` `${dataCy}-scroller` `` | Open |
| DCY-JSONEditor-04 | Text area / lines (library) | `W:JSONEditor/JSONEditor.jsx:305` | `` `... .cm-content` `` / `` `... .cm-line` `` — `C:jsonEditor.js:21,22`; `H:jsonEditor.js:58,108,109,198`; `S:jsonEditor/canvas.cy.js:81,82,188,266` (+12 more) | `` `${dataCy}-content` `` (via `EditorView.contentAttributes`) | Open |
| DCY-JSONEditor-05 | Gutter / line numbers (library) | `W:JSONEditor/JSONEditor.jsx:305` | `` `... .cm-gutters` `` / `` `... .cm-lineNumbers` `` — `C:jsonEditor.js:18,19`; `H:jsonEditor.js:57,59,101` | `` `${dataCy}-gutter` `` | Open |
| DCY-JSONEditor-06 | Fold markers and folded-range placeholder (library) | `W:JSONEditor/JSONEditor.jsx:106` (`basicSetup.foldGutter`) | `` `... .cm-foldGutter span[title="Fold line"]` `` / `[title="Unfold line"]` / `` `... .cm-foldPlaceholder` `` — `C:jsonEditor.js:25,26,27`; `H:jsonEditor.js:110`; `S:jsonEditor/canvas.cy.js:282,291,297,300,315` | `` `${dataCy}-fold-marker` `` (with `data-open`) via `foldGutter({ markerDOM })` in place of `basicSetup.foldGutter`, and `` `${dataCy}-fold-placeholder` `` via `codeFolding({ placeholderDOM })` | Open |
| DCY-JSONEditor-07 | Lint error marker and its tooltip message (library) | `W:JSONEditor/JSONEditor.jsx:190` (`lintGutter`); diagnostics from `linter` at :182 | `` `... .cm-lint-marker-error` `` / `` `... .cm-tooltip-lint .cm-diagnostic-error` `` — `C:jsonEditor.js:29,30,31`; `S:jsonEditor/contexts.cy.js:165,166,167` | `` `${dataCy}-lint-message` `` via the diagnostic's `renderMessage`; the gutter marker has no hook and stays scoped under DCY-JSONEditor-05 | Open |

### JSONExplorer

The widget renders **no data-cy at all**: `W:JSONExplorer/JSONExplorer.jsx` never reads the `dataCy` prop, so specs start from `draggable-widget-<name>` and its `.json-explorer` class. The tree is `react-json-tree` (`<JSONTree>` at :178), which renders plain `ul` / `li` / `label` markup. Its only render hooks are `labelRenderer`, `valueRenderer` and `getItemString`, and the arrow and `li` have none. Specs find a node by matching its label text `<key>:`. The loader (`:176`, shared `Loader`, DCY-X-06) is not selected by current specs.

| # | Element | Renders at (file:line) | Current fallback selector (spec/helper file:line) | Suggested data-cy | Status |
|---|---|---|---|---|---|
| DCY-JSONExplorer-01 | Widget container (height / background / border / visibility) | `W:JSONExplorer/JSONExplorer.jsx:174` | `` `[data-cy="draggable-widget-x"] .json-explorer` `` — `C:jsonExplorer.js:6,13`; `H:jsonExplorer.js:34,100`; `S:jsonExplorer/styles.cy.js:93` | `data-cy={dataCy}` (destructure the unused prop; namespaced per DCY-X-03) | Open |
| DCY-JSONExplorer-02 | Tree root list (library) | `W:JSONExplorer/JSONExplorer.jsx:178` | `` `... .json-explorer > ul` `` — `C:jsonExplorer.js:15`; `S:jsonExplorer/canvas.cy.js:202`; `S:jsonExplorer/styles.cy.js:54,108,113`; `S:jsonExplorer/userflow.cy.js:68,131,174` | `` `${dataCy}-tree` `` (no library hook: set through a ref on the container, or scope as `[data-cy=${dataCy}] > ul` once DCY-JSONExplorer-01 lands) | Open |
| DCY-JSONExplorer-03 | Nested node parts: key label, arrow, item string (library) | `W:JSONExplorer/JSONExplorer.jsx:178` | `label` filtered by text `<key>:` → `.parent('li').children('div' \| 'label' \| 'span')` — `C:jsonExplorer.js:17,19,23`; `H:jsonExplorer.js:81-86` (`nodePart`, via `toggleNode` at `S:jsonExplorer/canvas.cy.js:219,225,236` and `S:jsonExplorer/userflow.cy.js:77,84,91` (+17 more)) | `` `${dataCy}-node-<keyPath>-label` `` via `labelRenderer` and `` `${dataCy}-node-<keyPath>-summary` `` via `getItemString`; the arrow stays scoped under the label's `li` | Open |

### KeyValuePair

Root is the bare `<name>` data-cy, class-qualified as `` `[data-cy=<name>].key-value-pair-container` `` (`C:keyValuePair.js:9`, DCY-X-03). Field rows are keyed by the field `key`, which is stable, so the suggestions use it instead of an index. The value renderers (`frontend/src/AppBuilder/Shared/DataTypes/renderers/*`) take no `dataCy`, so it has to be passed down from `KeyValueRow`. Rows 13–15 are KeyValuePair-specific inspector UI (`frontend/src/AppBuilder/RightSideBar/Inspector/Components/KeyValuePair/FieldManager/**`, with the hover menu from the shared `frontend/src/ToolJetUI/List/List.jsx`). The row validation message (`W:KeyValuePair/_components/KeyValueRow.jsx:228`) and the edit icon (:223) are not selected by current specs.

| # | Element | Renders at (file:line) | Current fallback selector (spec/helper file:line) | Suggested data-cy | Status |
|---|---|---|---|---|---|
| DCY-KeyValuePair-01 | Row label (instance of DCY-X-02: `undefined-label` on every row) | `W:KeyValuePair/_components/KeyValueRow.jsx:188` → `frontend/src/_ui/Label.jsx:98` | `` `[data-cy=x] .key-value-label` `` — `C:keyValuePair.js:15`; `S:keyValuePair/canvas.cy.js:86`; `S:keyValuePair/styles.cy.js:96` | pass `` dataCy={`${dataCy}-row-<key>`} `` → `` `${dataCy}-row-<key>-label` `` | Open |
| DCY-KeyValuePair-02 | Row container | `W:KeyValuePair/_components/KeyValueRow.jsx:186` | `` `[data-cy=x] .kv-row-container` `` — `C:keyValuePair.js:13`; `H:keyValuePair.js:146`; `S:keyValuePair/canvas.cy.js:197`; `S:keyValuePair/inspector.cy.js:42,59` (+7 more) | `` `${dataCy}-row-<key>` `` | Open |
| DCY-KeyValuePair-03 | Value cell (`kv-<fieldType>` modifier) | `W:KeyValuePair/_components/KeyValueRow.jsx:208` (class at :209) | `` `[data-cy=x] .key-value-render-value` `` / `` `.key-value-render-value.kv-<type>` `` — `C:keyValuePair.js:17,18`; `H:keyValuePair.js:106`; `S:keyValuePair/canvas.cy.js:87`; `S:keyValuePair/userflow.cy.js:114,129` (+6 more) | `` `${dataCy}-value-<key>` `` | Open |
| DCY-KeyValuePair-04 | Scrolling value list | `W:KeyValuePair/KeyValuePair.jsx:251` (class at :252) | `` `[data-cy=x] .key-value-pair-content` `` — `C:keyValuePair.js:11`; `H:keyValuePair.js:132,180`; `S:keyValuePair/canvas.cy.js:209` | `` `${dataCy}-content` `` | Open |
| DCY-KeyValuePair-05 | Changeset bar and its content | `W:KeyValuePair/KeyValuePair.jsx:280`, `:281` | `` `[data-cy=x] .kv-changeset-popover` `` / `` `.kv-changeset-content` `` — `C:keyValuePair.js:23,24`; `H:keyValuePair.js:112,133,134`; `S:keyValuePair/styles.cy.js:218` | `` `${dataCy}-changeset-bar` `` / `` `${dataCy}-changeset-content` `` | Open |
| DCY-KeyValuePair-06 | Cancel / Save changes buttons (broken: global `kv-button-cancel` / `kv-button-save-changes`, same on every widget) | `W:KeyValuePair/KeyValuePair.jsx:289`, `:300` | `` `[data-cy=x] [data-cy="kv-button-cancel"]` `` — `C:keyValuePair.js:25,26`; `H:keyValuePair.js:135,136`; `S:keyValuePair/canvas.cy.js:340,356,357` (+19 more) | `` `${dataCy}-button-cancel` `` / `` `${dataCy}-button-save-changes` `` | Open |
| DCY-KeyValuePair-07 | Icon-only CTA tooltip (react-tooltip) | `W:KeyValuePair/KeyValuePair.jsx:282` | `` `[data-cy=x] .react-tooltip` `` — `C:keyValuePair.js:28`; `H:keyValuePair.js:211`; `S:keyValuePair/userflow.cy.js:263,265` | `` `${dataCy}-changeset-tooltip` `` | Open |
| DCY-KeyValuePair-08 | String edit field (contentEditable) | `frontend/src/AppBuilder/Shared/DataTypes/renderers/StringRenderer.jsx:145` (`contentEditable` at :148) | `` `[data-cy=x] .kv-value-editing [contenteditable="true"]` `` / `` `.kv-value-editing` `` — `C:keyValuePair.js:20,21`; `H:keyValuePair.js:107,111` | `` `${dataCy}-edit-<key>` `` | Open |
| DCY-KeyValuePair-09 | Image field `<img>` | `frontend/src/AppBuilder/Shared/DataTypes/renderers/ImageRenderer.jsx:35` | `` `[data-cy=x] .kv-image img` `` — `C:keyValuePair.js:30`; `S:keyValuePair/styles.cy.js:139,140,155` | `` `${dataCy}-image-<key>` `` | Open |
| DCY-KeyValuePair-10 | Date field input (renderer's own `DatepickerInput`, no data-cy) | `frontend/src/AppBuilder/Shared/DataTypes/renderers/DatePickerRenderer.jsx:24` | `` `[data-cy=x] .kv-datepicker .table-column-datepicker-input` `` — `C:keyValuePair.js:36`; `S:keyValuePair/userflow.cy.js:185,202,205` | `` `${dataCy}-date-input-<key>` `` | Open |
| DCY-KeyValuePair-11 | Date field popup and day cells (instance of DCY-X-11; separate `DatePickerComponent`, so it needs its own change) | `frontend/src/AppBuilder/Shared/DataTypes/renderers/DatePickerRenderer.jsx:400` (`portalId` at :430) | `` `.react-datepicker-popper` `` / `` `.react-datepicker__day--0NN` `` / `--selected` / `--keyboard-selected` (global) — `C:keyValuePair.js:37-40`; `S:keyValuePair/userflow.cy.js:176,177,178` (+8 more) | `` `${dataCy}-date-popup` `` / `` `${dataCy}-day-<YYYY-MM-DD>` `` | Open |
| DCY-KeyValuePair-12 | Select / multiselect menu options (portalled to `<body>`) | `frontend/src/AppBuilder/Shared/DataTypes/renderers/SelectRenderer.jsx:118` (class at :121) | `` `.react-select__menu .option-wrapper` `` / `` `.option-wrapper.option-focused` `` (global) — `C:keyValuePair.js:42-44`; `S:keyValuePair/userflow.cy.js:92,116,117` (+10 more) | `` `${dataCy}-option-<index>` `` (via `selectProps`) | Open |
| DCY-KeyValuePair-13 | Inspector field drag handle | `frontend/src/AppBuilder/RightSideBar/Inspector/Components/KeyValuePair/FieldManager/FieldItem.jsx:67` (`dragHandleProps` at :69) | `` `[data-rbd-drag-handle-draggable-id="<field id>"]` `` — `C:keyValuePair.js:57`; `S:keyValuePair/inspector.cy.js:110` | `` `field-<slug>-drag-handle` `` | Open |
| DCY-KeyValuePair-14 | Inspector field delete / duplicate buttons (data-cy commented out) | `frontend/src/ToolJetUI/List/List.jsx:149` (commented data-cy at :153); duplicate at `:133` (:137) | `` `[data-cy="field-<name>"] .delete-icon-btn` `` — `C:keyValuePair.js:59`; `S:keyValuePair/inspector.cy.js:91,93` | `` `field-<slug>-delete-button` `` / `` `field-<slug>-duplicate-button` `` | Open |
| DCY-KeyValuePair-15 | Inspector field item (broken: `field-<name>` isn't slugified, so spaces and punctuation end up in the value) | `frontend/src/AppBuilder/RightSideBar/Inspector/Components/KeyValuePair/FieldManager/FieldItem.jsx:106` | `` `[data-cy="field-<raw name>"]` `` / `` `[data-cy^="field-"].list-group-item` `` — `C:keyValuePair.js:54,55`; `S:keyValuePair/inspector.cy.js:33,92` | `` `field-${generateCypressDataCy(name)}` `` (the helper `List.jsx:58` already uses) | Open |

### LibraryComponent

The widget puts the bare `<name>` data-cy on its `<iframe>` (configured) or on its "Slot" placeholder (unconfigured), so specs qualify it by tag (DCY-X-03). The inner box is reached as `.canvas-component[data-cy="draggable-widget-x"]` (DCY-X-01; `C:libraryComponent.js:10`; `H:libraryComponent.js:296`). The Components panel's Custom tab is DCY-X-15. Rows 01–03 are panel and inspector UI outside the widget.

| # | Element | Renders at (file:line) | Current fallback selector (spec/helper file:line) | Suggested data-cy | Status |
|---|---|---|---|---|---|
| DCY-LibraryComponent-01 | Widget `<iframe>` / unconfigured "Slot" placeholder (both carry the same bare `<name>`) | `W:LibraryComponent.jsx:278` (iframe), `:244` (placeholder) | `` `[data-cy="draggable-widget-x"] iframe[data-cy="x"]` `` — `C:libraryComponent.js:12`; `H:libraryComponent.js:292`; `S:libraryComponent/canvas.cy.js:96,108,155,188`; `S:libraryComponent/contexts.cy.js:63,110`; `S:libraryComponent/userflow.cy.js:104` | `` `${dataCy}-frame` `` on the iframe and `` `${dataCy}-placeholder` `` on the Slot div | Open |
| DCY-LibraryComponent-02 | Custom tab version-picker menu rows (revisions and dev previews) | `frontend/src/AppBuilder/RightSideBar/ComponentManagerTab/CustomComponentsTab.jsx:218` (revision), `:248` (dev preview); menu at :216 | `` `.custom-library-version-menu .version-menu-row` `` matched by text — `C:libraryComponent.js:19`; `H:libraryComponent.js:342` (`pickRevision`, called at `S:libraryComponent/inspector.cy.js:102`) | `` `custom-library-version-<slug>-option-<version>` `` and `` `custom-library-version-<slug>-dev-<userId>` `` | Open |
| DCY-LibraryComponent-03 | Inspector "Component" / "Revision" identity rows | `frontend/src/AppBuilder/RightSideBar/Inspector/Components/LibraryComponent/index.tsx:74` (row), `:75` (label), `:76` (value) | accordion item `innerText` — `H:libraryComponent.js:328` (`inspectorSections`), matched by `expectIdentityRows` (`S:libraryComponent/inspector.cy.js:34-36`, called at :90,114) | `` `library-component-<label>-value` `` (`library-component-component-value`, `library-component-revision-value`) | Open |
| DCY-LibraryComponent-04 | Inspector accordion item / body (shared `_ui/Accordion`; only the header is tagged) | `frontend/src/_ui/Accordion/AccordionItem.js:35` (item), `:86` (body); header tag at :39 | `` `[data-cy^="widget-accordion-"]` `` + `.closest(".accordion-item")` — `H:libraryComponent.js:322,324`; `S:libraryComponent/inspector.cy.js:99` | `` `widget-accordion-<title>-content` `` on the body | Open |

### Link

Depends on DCY-X-03 (root is bare `[data-cy="<name>"]`, qualified with `.link-widget`).

| # | Element | Renders at (file:line) | Current fallback selector (spec/helper file:line) | Suggested data-cy | Status |
|---|---|---|---|---|---|
| DCY-Link-01 | Anchor `<a>` | `W:Link/Link.jsx:158` | `` `[data-cy=x].link-widget > a` `` — `C:link.js:9`; `S:link/canvas.cy.js:83`; `S:link/events.cy.js:58`; `H:link.js:137` (`querySelector("a")`) (+4 more) | `` `${dataCy}-anchor` `` (e.g. `link1-anchor`) | Open |
| DCY-Link-02 | Text block `<span>` wrapping icon + text | `W:Link/Link.jsx:185` | `` `> a > span` `` — `C:link.js:11` (constant defined; no spec usage yet) | `` `${dataCy}-content` `` | Open |
| DCY-Link-03 | Icon box `<span>` | `W:Link/Link.jsx:197` | `` `> a > span > span:not(.link-text)` `` — `C:link.js:13` (constant defined; no spec usage yet) | `` `${dataCy}-icon-box` `` | Open |
| DCY-Link-04 | Icon `<svg>` (TablerIcon; spreads props onto the svg) | `W:Link/Link.jsx:199` | `` `... > span > span:not(.link-text) svg` `` — `C:link.js:15`; `S:link/events.cy.js:107`; `S:link/styles.cy.js:166`; `H:link.js:133` (+3 more) | `` `${dataCy}-icon` `` | Open |
| DCY-Link-05 | Link text `<span class="link-text">` | `W:Link/Link.jsx:211` | `` `.link-text` `` — `C:link.js:17`; `S:link/canvas.cy.js:82`; `S:link/contexts.cy.js:41`; `H:link.js:132` (+26 more) | `` `${dataCy}-text` `` | Open |

### Map

Depends on DCY-X-03 (root is the bare `<name>` data-cy at `W:Map/Map.jsx:246`, qualified as `` `[data-cy=x].map-widget` ``, `C:map.js:4`). Everything inside `<GoogleMap>` (tiles, markers, polygon, map controls) and the Places dropdown is rendered by the Google Maps JS SDK through `@react-google-maps/api`, so only the elements ToolJet renders itself can carry a data-cy; DCY-Map-04 and DCY-Map-05 record the SDK selectors as not practical. The loading placeholder (`W:Map/Map.jsx:302`) and the centre overlay div on its own (`C:map.js:12`) are not selected by current specs.

| # | Element | Renders at (file:line) | Current fallback selector (spec/helper file:line) | Suggested data-cy | Status |
|---|---|---|---|---|---|
| DCY-Map-01 | Centre overlay pin `<img>` | `W:Map/Map.jsx:248` (overlay div; img at :255) | `` `[data-cy=x].map-widget > .map-center img` `` — `C:map.js:13`; `H:map.js:255` | `` `${dataCy}-center-overlay` `` on the div and `` `${dataCy}-center-marker` `` on the img | Open |
| DCY-Map-02 | GoogleMap viewport div (the drag / click surface) | `W:Map/Map.jsx:258` (`mapContainerStyle` at :260) | `` `[data-cy=x].map-widget > div:not(.map-center)` `` — `C:map.js:15`; `H:map.js:272,289,290,292` (+1 more); `S:map/userflow.cy.js:187` | `` `${dataCy}-viewport` ``: `GoogleMap` forwards no `data-*` props, so set it in `onLoad` with `map.getDiv().setAttribute(...)` | Open |
| DCY-Map-03 | Places search input | `W:Map/Map.jsx:274` (class at :278) | `` `... .place-search-input` `` — `C:map.js:23`; `H:map.js:277`; `S:map/contexts.cy.js:82,92`; `S:map/userflow.cy.js:231,234,235` | `` `${dataCy}-search-input` `` | Open |
| DCY-Map-04 | Google Maps SDK DOM inside the viewport: `.gm-style` root, raster tiles, legacy `Marker` icons, camera-control buttons | rendered by the SDK under `W:Map/Map.jsx:258`; markers from `:283` | `` `.gm-style` `` / `` `img[src*="/maps/vt"]` `` / `` `img[src*="spotlight-poi"]` `` / `` `button[aria-label="Map camera controls"|"Zoom in"…]` `` — `C:map.js:17,19,21,25,26`; `H:map.js:142,144,267`; `S:map/userflow.cy.js:73,79,121,122` (+2 more) | Not practical (third-party). Scope these SDK selectors under `${dataCy}-viewport` (DCY-Map-02) once it lands | Open |
| DCY-Map-05 | Google Maps SDK DOM portalled to `<body>`: Places Autocomplete dropdown and rows, invalid-key dialog OK button | rendered by the SDK from `W:Map/Map.jsx:273` (`Autocomplete`) and on map load | `` `.pac-container` `` / `` `.pac-item` `` / `` `.dismissButton` `` (global) — `C:map.js:28,29,31`; `H:map.js:163,166`; `S:map/userflow.cy.js:247,249` | Not practical (third-party; the SDK creates these nodes outside the widget, so no widget prefix can be applied) | Open |

### Navigation

Depends on DCY-X-01 (`.first()` on `draggable-widget-<name>`, `H:navigation.js:97,105`) and DCY-X-03 (root reached as `` `.navigation-widget[data-cy=<name>]` ``, `C:navigation.js:8`; `H:navigation.js:62` finds it by class only, which is a test-side switch to `[data-cy=<name>]`). The item, group, icon and label data-cy values (`nav-item-<id>`, `nav-group-<id>`, `nav-icon-<id>` at `W:Navigation/Navigation.jsx:58`, `nav-label-<id>` at :77) are **global** (no widget prefix). Two Navigations with the default item ids collide, and portalled popup items can't be tied to their widget. `RenderNavItem` / `RenderNavGroup` take no `dataCy`, so it has to be threaded down from `Navigation.jsx:271`. The `nav-icon-<id>` is not selected by current specs; it should become `${dataCy}-item-<id>-icon`. The loading spinner (`W:Navigation/Navigation.jsx:617`) isn't selected either. Inspector rows below are Navigation-specific inspector UI (`frontend/src/AppBuilder/RightSideBar/Inspector/Components/Navigation/**`). The Caption field is reached through CodeMirror's `.cm-content` / `.cm-line` (`H:navigation.js:345,354`), which is shared CodeHinter chrome and not counted. Its `label` pick (`H:navigation.js:355`) is test-side only, because `inspector-nav-item-details-caption-label` already exists (`NavItemPopover.jsx:169`).

| # | Element | Renders at (file:line) | Current fallback selector (spec/helper file:line) | Suggested data-cy | Status |
|---|---|---|---|---|---|
| DCY-Navigation-01 | Item button (broken: global `nav-item-<id>`; id read back by string-stripping the prefix) | `W:Navigation/Navigation.jsx:47` (data-cy at :55) | `` `[data-cy=draggable-widget-x] [data-cy="nav-item-<id>"]` `` / `` `nav button[data-cy^="nav-item-"]` `` — `C:navigation.js:12`; `H:navigation.js:80,90`; `S:navigation/styles.cy.js:64`; `S:navigation/contexts.cy.js:216` (+7 more) | `` `${dataCy}-item-<id>` `` (e.g. `navigation1-item-item1`) | Open |
| DCY-Navigation-02 | Item label (`.page-name`, carries the global `nav-label-<id>`) | `W:Navigation/Navigation.jsx:74` (data-cy at :77) → `frontend/src/_components/OverflowTooltip.jsx:81` | `` `.page-name` `` inside the item — `H:navigation.js:310` | `` `${dataCy}-item-<id>-label` `` | Open |
| DCY-Navigation-03 | Group trigger (horizontal) / group wrapper (vertical) (broken: global `nav-group-<id>`) | `W:Navigation/Navigation.jsx:160` (data-cy at :169); vertical `:221` | `` `[data-cy=draggable-widget-x] [data-cy="nav-group-<id>"]` `` / `` `nav button[data-cy^="nav-group-"]` `` — `C:navigation.js:13`; `H:navigation.js:80,90,170,250`; `S:navigation/styles.cy.js:129`; `S:navigation/contexts.cy.js:221,224` | `` `${dataCy}-group-<id>` `` | Open |
| DCY-Navigation-04 | Horizontal row (Radix `NavigationMenu` `<nav>`, forwards props) | `W:Navigation/Navigation.jsx:629` | `` `nav.navigation-horizontal-menu` `` — `C:navigation.js:10` (defined, unused); `` `nav button[...]` `` tag scope — `H:navigation.js:80` | `` `${dataCy}-horizontal-menu` `` | Open |
| DCY-Navigation-05 | "More" overflow button | `W:Navigation/Navigation.jsx:675` (class at :677) | `` `[data-cy=draggable-widget-x] button.more-pages-btn` `` — `C:navigation.js:15`; `H:navigation.js:81,164,167`; `S:navigation/styles.cy.js:138` | `` `${dataCy}-more-button` `` | Open |
| DCY-Navigation-06 | Portalled dropdown content ("More" menu and horizontal group sub-menu; global, assumes one open) | `W:Navigation/Navigation.jsx:685` (More), `:191` (group) | `` `.page-menu-popup` `` / `` `.page-menu-popup [data-cy="nav-item-<id>"]` `` — `C:navigation.js:19,20`; `H:navigation.js:168,170,251,253`; `S:navigation/styles.cy.js:130,132` (+5 more) | `` `${dataCy}-more-menu` `` / `` `${dataCy}-group-<id>-menu` `` | Open |
| DCY-Navigation-07 | Hidden measurement copy (off-screen, one div per top-level item) | `W:Navigation/Navigation.jsx:803` (container), `:817` (item, `data-id` at :819) | `` `[data-id]` `` — `C:navigation.js:17` (defined, unused); `H:navigation.js:77` | `` `${dataCy}-measure` `` on the container and `` `${dataCy}-measure-<id>` `` on each item | Open |
| DCY-Navigation-08 | Inline caption (vertical, nested and overflowed items) | `W:Navigation/Navigation.jsx:82` → `frontend/src/_components/OverflowTooltip.jsx:81` | `` `.nav-item-caption` `` — `C:navigation.js:22`; `H:navigation.js:272,306` | `` `${dataCy}-item-<id>-caption` `` | Open |
| DCY-Navigation-09 | Caption tooltip (horizontal top-level items; portalled to body, global, and also matches any OverflowTooltip that is open) | `W:Navigation/Navigation.jsx:94` → `frontend/src/_components/ToolTip.jsx:26` (`ToolTip` takes no data-cy prop) | `` `.tooltip.show` `` — `C:navigation.js:24`; `H:navigation.js:276,278,285,293` (+2 more) | `` `${dataCy}-item-<id>-tooltip` `` (same `ToolTip` `dataCy` prop as DCY-Steps-06) | Open |
| DCY-Navigation-10 | Inspector tree row `<li>` (depth read from the inline `--spacing` var) | `frontend/src/_ui/SortableTree/TreeItemWrapper.jsx:49` (`data-draggable` at :51, `--spacing` at :64) | `` `[data-cy="inspector-navigation-menu-items-list"] li[data-draggable="true"]` `` + `` `--spacing` / 15 `` — `C:navigation.js:28`; `H:navigation.js:186,191,211` | `` `inspector-navigation-menu-item-<id>-row` `` + `data-depth={depth}` (pass through `TreeItemWrapper`) | Open |
| DCY-Navigation-11 | Inspector row body (click opens the item popover; drag handle) | `frontend/src/AppBuilder/RightSideBar/Inspector/Components/Navigation/components/MenuItem.jsx:42`, `.../GroupMenuItem.jsx:43` (`data-list-item-id`) | `` `[data-list-item-id="<id>"]` `` — `C:navigation.js:30`; `H:navigation.js:188,190,214,220,343` | `` `inspector-navigation-menu-item-<id>` `` | Open |

### Pagination

Depends on DCY-X-01 (`.first()` on `draggable-widget-<name>`, `H:pagination.js:125,136,221`) and DCY-X-03 (root reached as `` `[data-cy=draggable-widget-x] [data-cy=<name>]` ``, `C:pagination.js:9`; `H:pagination.js:64`). `Operator` and `PageLinks` take no `dataCy`, so it has to be passed down from `W:Pagination/Pagination.jsx:175-210`. The loader (`W:Pagination/Pagination.jsx:157`, DCY-X-06) is not selected by current specs. `S:pagination/userflow.cy.js:167` selects a helper Button widget and is out of scope.

| # | Element | Renders at (file:line) | Current fallback selector (spec/helper file:line) | Suggested data-cy | Status |
|---|---|---|---|---|---|
| DCY-Pagination-01 | Control row `ul.pagination` (clips overflow; unmounted while loading) | `W:Pagination/Pagination.jsx:165` | `` `[data-cy=draggable-widget-x] ul.pagination` `` — `C:pagination.js:11` (constant unused by specs); `H:pagination.js:65` (`root.querySelector("ul.pagination")`); `li.parentElement` at `H:pagination.js:184` | `` `${dataCy}-list` `` (e.g. `pagination1-list`) | Open |
| DCY-Pagination-02 | Operator item `<li>` (`<<`, `<`, `>`, `>>`), found by its aria-label | `W:Pagination/Pagination.jsx:331` (aria-label at :333) | `` `ul.pagination > li[aria-label="Go to next page"]` `` — `C:pagination.js:15`; `H:pagination.js:175`; kind read from `aria-label` at `H:pagination.js:69,73`; `S:pagination/userflow.cy.js:315` | `` `${dataCy}-operator-<first\|previous\|next\|last>` `` | Open |
| DCY-Pagination-03 | Page-number item `<li>` (+ active state) | `W:Pagination/Pagination.jsx:395`; first-page copy `:431`, last-page copy `:414` | `` `ul.pagination > li` `` + exact-text filter — `C:pagination.js:13`; `H:pagination.js:177-178`; `S:pagination/contexts.cy.js:90`; `S:pagination/userflow.cy.js:314` (+15 more `items(...)` uses); active state `` `li.active` `` — `C:pagination.js:17` (defined, unused), `H:pagination.js:74` | `` `${dataCy}-page-<n>` `` (page number as the slug, since the rendered window shifts; e.g. `pagination1-page-4`) + `aria-current="page"` on the active one | Open |
| DCY-Pagination-04 | Ellipsis item `<li>` (left and right, can render together) | `W:Pagination/Pagination.jsx:426` (left), `:408` (right) | text `...` match — `H:pagination.js:73`; by row index `` `ul.pagination > li` `` + `.eq(at.index)` — `S:pagination/userflow.cy.js:321` | `` `${dataCy}-ellipsis-start` `` / `` `${dataCy}-ellipsis-end` `` | Open |
| DCY-Pagination-05 | Item link (`a.page-link`; `span.page-link` on an ellipsis) carrying the click handler and pointer state | `W:Pagination/Pagination.jsx:335` (operator), `:396` (page), `:409` / `:427` (ellipsis) | `li.firstElementChild` — `H:pagination.js:68,230`; `S:pagination/userflow.cy.js:328`; `` `.find('a')` `` — `S:pagination/userflow.cy.js:299` | `` `${dataCy}-operator-<op>-link` `` / `` `${dataCy}-page-<n>-link` `` / `` `${dataCy}-ellipsis-<start\|end>-link` `` | Open |

### PDF

Depends on DCY-X-03 (root is the bare `<name>` data-cy at `W:PDF.jsx:215`, `C:pdf.js:6`). Nothing inside the root carries a stable data-cy: the only attribute present, on the Retry button, is a hard-coded value copied from a canvas button (DCY-PDF-06). Pages, page canvases and text layers are rendered by react-pdf 10, so their hooks have to go through the props it exposes (`inputRef`, `error`, `noData`). The download label (`W:PDF.jsx:285`, `C:pdf.js:33`) is read as the download button's text (`H:pdf.js:177`) and needs no hook of its own.

| # | Element | Renders at (file:line) | Current fallback selector (spec/helper file:line) | Suggested data-cy | Status |
|---|---|---|---|---|---|
| DCY-PDF-01 | Bordered card (border / radius / box-shadow) | `W:PDF.jsx:216` (class at :217) | `` `[data-cy=x] > .flex-column` `` — `C:pdf.js:8`; `H:pdf.js:155`; `S:pdf/contexts.cy.js:34` | `` `${dataCy}-card` `` | Open |
| DCY-PDF-02 | Scroll wrapper (also renders `id="pdf-wrapper"`, duplicated by every PDF instance on the page) | `W:PDF.jsx:228` (id at :230) | `` `[data-cy=x] > .flex-column > .scrollable` `` — `C:pdf.js:10`; `H:pdf.js:135,189,193,196`; `S:pdf/canvas.cy.js:246,275,355,358`; `S:pdf/properties.cy.js:105` | `` `${dataCy}-scroll-wrapper` `` (and make the id unique or drop it) | Open |
| DCY-PDF-03 | Page (react-pdf `Page`; its `<canvas>` and `.textLayer` are library-rendered) | `W:PDF.jsx:182` (`inputRef` at :187) | `` `... .scrollable .react-pdf__Page[data-page-number=n]` `` + `canvas` / `.textLayer` — `C:pdf.js:23`; `H:pdf.js:137,138,139`; `S:pdf/contexts.cy.js:38,44`; `S:pdf/styles.cy.js:31`; inline `.react-pdf__Page` — `S:pdf/properties.cy.js:108`; `S:pdf/canvas.cy.js:318` | `` `${dataCy}-page-<n>` `` set through the existing `inputRef` (`el?.setAttribute(...)`); canvas and text layer stay scoped under it | Open |
| DCY-PDF-04 | Load-error / no-file message | `W:PDF.jsx:174` (`Document`, react-pdf's default error message); bare-text messages at `:237` | `` `... .scrollable .react-pdf__message--error` `` — `C:pdf.js:25`; `H:pdf.js:150`; the scroller's `textContent` when no `.react-pdf__Document` is mounted — `H:pdf.js:167` | `` `${dataCy}-error-message` ``: pass `error` / `noData` elements carrying it to `Document`, and wrap the `:237` strings in a `<span>` with the same value | Open |
| DCY-PDF-05 | "Password prompt closed" text | `W:PDF.jsx:156` | the scroller's `textContent` — `H:pdf.js:167`; asserted at `S:pdf/userflow.cy.js:109` | `` `${dataCy}-password-closed-message` `` | Open |
| DCY-PDF-06 | Password Retry button (broken: hard-coded `data-cy="draggable-widget-button3"`, which also matches the RenderWidget box of any real widget named `button3`, cf. DCY-X-01) | `W:PDF.jsx:157` (data-cy at :159) | `` `... .scrollable .pdf-retry-button` `` — `C:pdf.js:36`; `H:pdf.js:168`; `S:pdf/userflow.cy.js:130,143` | `` `${dataCy}-password-retry-button` `` | Open |
| DCY-PDF-07 | Footer row (page controls + download) | `W:PDF.jsx:240` (class at :241) | `` `[data-cy=x] > .flex-column > .border-top` `` — `C:pdf.js:12`; `H:pdf.js:136`; `S:pdf/contexts.cy.js:36` | `` `${dataCy}-footer` `` | Open |
| DCY-PDF-08 | Page-controls group | `W:PDF.jsx:248` | `` `.pdf-page-controls` `` — `C:pdf.js:27` (constant unused by specs); `H:pdf.js:172` (`footer.querySelector(".pdf-page-controls")`) | `` `${dataCy}-page-controls` `` | Open |
| DCY-PDF-09 | Previous / Next page buttons | `W:PDF.jsx:249` (aria-label at :253), `:261` (aria-label at :265) | `` `... .border-top button[aria-label="Previous page"]` `` / `` `"Next page"` `` — `C:pdf.js:28,29`; `H:pdf.js:174,175`; `S:pdf/properties.cy.js:102,110,112,113` (+2 more); `S:pdf/userflow.cy.js:54,55` | `` `${dataCy}-prev-page-button` `` / `` `${dataCy}-next-page-button` `` | Open |
| DCY-PDF-10 | Page indicator (`n of N`) | `W:PDF.jsx:258` | `` `... .pdf-page-controls > span` `` — `C:pdf.js:30`; `H:pdf.js:173`; `S:pdf/canvas.cy.js:351` | `` `${dataCy}-page-indicator` `` | Open |
| DCY-PDF-11 | Download button (a clickable `<div>`, not a `<button>`) | `W:PDF.jsx:274` (class at :275) | `` `... .border-top .download-icon-outer-wrapper` `` — `C:pdf.js:32`; `H:pdf.js:151`; `S:pdf/events.cy.js:70`; `S:pdf/styles.cy.js:24,60` | `` `${dataCy}-download-button` `` | Open |

### PhoneInput

Depends on DCY-X-04: the country menu is portalled to `<body>` and keyed by component id (`` classNamePrefix={`country-${componentId}`} ``, `W:PhoneCurrency/CountrySelect.jsx:160`), so `H:phoneInput.js:17` and `S:phoneInput/canvas.cy.js:164` walk `closest('[component-type]')` to get the id. Rows 03–06 remove that need.

| # | Element | Renders at (file:line) | Current fallback selector (spec/helper file:line) | Suggested data-cy | Status |
|---|---|---|---|---|---|
| DCY-PhoneInput-01 | Country select control (react-select `__control`) | `W:PhoneCurrency/CountrySelect.jsx:127` (react-select default Control; add a `Control` override in the `components` map at :139) | `` `[data-cy="<name>-country-select-dropdown"] [class*="__control"]` `` — `C:phoneInput.js:21`; `H:phoneInput.js:109`; `S:phoneInput/styles.cy.js:94`; `S:phoneInput/styles.cy.js:101` | `` `${String(dataCy).toLowerCase()}-country-select-control` `` (e.g. `phoneinput1-country-select-control`) | Open |
| DCY-PhoneInput-02 | Dial code text (`+91`) | `W:PhoneCurrency/CustomValueContainer.jsx:30` | `` `[data-cy="<name>-country-select-dropdown"] [class*="__value-container"] span` `` — `C:phoneInput.js:23`; `H:phoneInput.js:47`; `S:phoneInput/canvas.cy.js:232`; `S:phoneInput/userflow.cy.js:86` (+1 more) | `` `${String(dataCy).toLowerCase()}-dial-code` `` (pass `dataCy` via `selectProps`) | Open |
| DCY-PhoneInput-03 | Country menu (portalled to body) | `W:PhoneCurrency/CountrySelect.jsx:134` (`menuPortalTarget`), class from :160 | `` `.country-${componentId}__menu` `` — `C:phoneInput.js:37`; `H:phoneInput.js:28`; `H:phoneInput.js:107`; `S:phoneInput/canvas.cy.js:176` (+4 more); "any menu open" variant `` `[class*="country-"][class*="__menu"]` `` — `C:phoneInput.js:42`; `S:phoneInput/userflow.cy.js:181` | `` `${String(dataCy).toLowerCase()}-country-menu` `` (custom `Menu` component carrying `innerProps`) | Open |
| DCY-PhoneInput-04 | Country menu scroll list | `W:PhoneCurrency/CustomMenuList.jsx:47` | `` `.country-${componentId}__menu-list` `` — `C:phoneInput.js:38`; `S:phoneInput/userflow.cy.js:105`; `S:phoneInput/userflow.cy.js:111`; `S:phoneInput/userflow.cy.js:112` | `` `${String(dataCy).toLowerCase()}-country-menu-list` `` | Open |
| DCY-PhoneInput-05 | Country option (+ selected state) | `W:PhoneCurrency/CustomOption.jsx:28` (selected tick at :32) | `` `.country-${componentId}__option` `` — `C:phoneInput.js:39`; `H:phoneInput.js:38`; `S:phoneInput/userflow.cy.js:82`; `S:phoneInput/userflow.cy.js:104` (+3 more); `` `.country-${componentId}__option--is-selected` `` — `C:phoneInput.js:40` (defined, unused) | `` `${String(dataCy).toLowerCase()}-country-option-<countryCode>` `` (e.g. `phoneinput1-country-option-IN`) + `aria-selected` | Open |
| DCY-PhoneInput-06 | Country search box | `W:PhoneCurrency/CustomMenuList.jsx:23` (class at :29) | `` `.country-${componentId}__menu .currency-select-search-box` `` — `C:phoneInput.js:44`; `S:phoneInput/canvas.cy.js:222`; `S:phoneInput/userflow.cy.js:79`; `S:phoneInput/userflow.cy.js:80` (+4 more) | `` `${String(dataCy).toLowerCase()}-country-search-input` `` | Open |
| DCY-PhoneInput-07 | Clear button | `W:PhoneCurrency/PhoneInput.jsx:349` | `` `[data-cy="draggable-widget-<name>"] .tj-input-clear-btn` `` — `C:phoneInput.js:27`; `S:phoneInput/canvas.cy.js:277`; `S:phoneInput/canvas.cy.js:278`; `S:phoneInput/canvas.cy.js:287` | `` `${String(dataCy).toLowerCase()}-clear-button` `` | Open |
| DCY-PhoneInput-08 | Loading spinner (instance of DCY-X-06) | `W:PhoneCurrency/PhoneInput.jsx:374` → `frontend/src/ToolJetUI/Loader/Loader.jsx:11` | `` `[data-cy="draggable-widget-<name>"] .tj-widget-loader` `` — `C:phoneInput.js:29`; `S:phoneInput/canvas.cy.js:286`; `S:phoneInput/canvas.cy.js:288` | `` `${String(dataCy).toLowerCase()}-loader` `` (add a `dataCy` prop to `Loader`) | Open |
| DCY-PhoneInput-09 | Label + field row | `W:PhoneCurrency/PhoneInput.jsx:244` | `` `[data-cy="draggable-widget-<name>"] .text-input` `` — `C:phoneInput.js:31` (defined, no current usage) | `` `${String(dataCy).toLowerCase()}-row` `` | Open |

### PopoverMenu

Depends on DCY-X-03 (root reached as `` `[data-cy=draggable-widget-x] [data-cy=<name>]` ``, `C:popoverMenu.js:13`) and DCY-X-04 (the open menu is found by the trigger's `aria-controls` = `popover-menu-<component id>`). The data-cy values on the button container, portal, content, listbox and options are **global** (no widget prefix), so two Popover Menus collide and the specs rely on "only one menu open at a time". The unprefixed loading / empty states (`W:PopoverMenu/components/CustomOptions.jsx:103`, `:118`) and option content / header wrappers (`:195`, `:196`) are not selected by current specs; they should take the prefix too.

| # | Element | Renders at (file:line) | Current fallback selector (spec/helper file:line) | Suggested data-cy | Status |
|---|---|---|---|---|---|
| DCY-PopoverMenu-01 | Trigger `<button>` (`aria-expanded` / `aria-controls`) | `W:PopoverMenu/components/CustomButton.jsx:157` | `` `[data-cy="draggable-widget-x"] button` `` — `C:popoverMenu.js:17`; `H:popoverMenu.js:73-76,127`; `S:popoverMenu/canvas.cy.js:195,285` (+19 more) | `` `${dataCy}-trigger` `` | Open |
| DCY-PopoverMenu-02 | Button container / Popover.Trigger (broken: global `popover-menu-button-container`) | `W:PopoverMenu/components/CustomButton.jsx:145` (data-cy at :146) | `` `[data-cy="draggable-widget-x"] [data-cy="popover-menu-button-container"]` `` — `C:popoverMenu.js:15` | `` `${dataCy}-button-container` `` | Open |
| DCY-PopoverMenu-03 | Trigger label `<p>` | `W:PopoverMenu/components/CustomButton.jsx:210` | `` `... button p` `` — `C:popoverMenu.js:19`; `H:popoverMenu.js:128`; `S:popoverMenu/canvas.cy.js:92` | `` `${dataCy}-label` `` | Open |
| DCY-PopoverMenu-04 | Loading indicator (instance of DCY-X-06) | `W:PopoverMenu/components/CustomButton.jsx:243` → `frontend/src/ToolJetUI/Loader/Loader.jsx:10` | `` `... button .tj-widget-loader svg` `` — `C:popoverMenu.js:21`; `H:popoverMenu.js:129`; `S:popoverMenu/styles.cy.js:279` | `` `${dataCy}-loader` `` | Open |
| DCY-PopoverMenu-05 | Trigger icon container (broken: global `popover-menu-button-icon-container`) | `W:PopoverMenu/components/CustomButton.jsx:226` | — (not selected by current specs) | `` `${dataCy}-button-icon` `` | Open |
| DCY-PopoverMenu-06 | Portal container (broken: global `popover-menu-portal-container`) | `W:PopoverMenu/PopoverMenu.jsx:207` | `` `[data-cy="popover-menu-portal-container"]` `` counted page-wide — `C:popoverMenu.js:24`; `H:popoverMenu.js:191` | `` `${dataCy}-portal` `` | Open |
| DCY-PopoverMenu-07 | Portalled menu content (broken: global `popover-menu-content`; own menu reached by id, DCY-X-04) | `W:PopoverMenu/PopoverMenu.jsx:208` (id at :209, data-cy at :211) | `` `[data-cy="popover-menu-content"]` `` / `` `[id="<trigger aria-controls>"]` `` — `C:popoverMenu.js:25,27`; `H:popoverMenu.js:60,72,76-78,89,130` | `` `${dataCy}-menu` `` | Open |
| DCY-PopoverMenu-08 | Options listbox (broken: global `popover-menu-options-listbox`) | `W:PopoverMenu/components/CustomOptions.jsx:131` | `` `[data-cy="popover-menu-content"] [data-cy="popover-menu-options-listbox"]` `` — `C:popoverMenu.js:29`; `H:popoverMenu.js:132`; `S:popoverMenu/canvas.cy.js:211` | `` `${dataCy}-options-listbox` `` | Open |
| DCY-PopoverMenu-09 | Option row (broken: global `popover-menu-option-<i>`; index read back by string-stripping the prefix) | `W:PopoverMenu/components/CustomOptions.jsx:176` | `` `[data-cy="popover-menu-content"] [data-cy="popover-menu-option-<i>"]` `` / `` `[role="option"]` `` — `C:popoverMenu.js:31,32`; `H:popoverMenu.js:180,181`; `S:popoverMenu/canvas.cy.js:219,310` | `` `${dataCy}-option-<index>` `` | Open |
| DCY-PopoverMenu-10 | Option icon / label / description (broken: the same global value on every option) | `W:PopoverMenu/components/CustomOptions.jsx:198`, `:203`, `:212` | `[data-cy="popover-menu-option-label"]` / `-description` inside each row — `H:popoverMenu.js:185,186` | `` `${dataCy}-option-<index>-icon` `` / `-label` / `-description` | Open |

### ProgressBar

Root is the bare `<name>` data-cy (DCY-X-03). The bar parts are reached by `lastElementChild` / `firstElementChild` walks from the root, so any wrapper change breaks them.

| # | Element | Renders at (file:line) | Current fallback selector (spec/helper file:line) | Suggested data-cy | Status |
|---|---|---|---|---|---|
| DCY-ProgressBar-01 | label (instance of DCY-X-02: `<Label>` gets no `dataCy`, renders `data-cy="undefined-label"`) | `W:Progressbar/Progressbar.jsx:168` → `frontend/src/_ui/Label.jsx:98` | `` `[data-cy=<name>] label` `` — `C:progressBar.js:9`; `H:progressBar.js:88`; `S:progressBar/contexts.cy.js:63`; `S:progressBar/canvas.cy.js:191` | `` `${dataCy}-label` `` (pass `dataCy={dataCy}`; e.g. `progressbar1-label`) | Open |
| DCY-ProgressBar-02 | bar container | `W:Progressbar/Progressbar.jsx:185` | `root.lastElementChild` — `H:progressBar.js:89`; `H:progressBar.js:226`; `H:progressBar.js:233` | `` `${dataCy}-bar-container` `` | Open |
| DCY-ProgressBar-03 | track | `W:Progressbar/Progressbar.jsx:186` | `barCont.firstElementChild` — `H:progressBar.js:90`; `S:progressBar/canvas.cy.js:183`; `S:progressBar/contexts.cy.js:64`; `S:progressBar/styles.cy.js:106` | `` `${dataCy}-track` `` | Open |
| DCY-ProgressBar-04 | fill | `W:Progressbar/Progressbar.jsx:208` | `track.firstElementChild` (when it has no child) — `H:progressBar.js:91`; `H:progressBar.js:93`; `S:progressBar/contexts.cy.js:65`; `S:progressBar/styles.cy.js:167` | `` `${dataCy}-fill` `` | Open |
| DCY-ProgressBar-05 | loading strip (inside the loading clip box at line 188) | `W:Progressbar/Progressbar.jsx:196` | `first.firstElementChild` — `H:progressBar.js:92`; `S:progressBar/styles.cy.js:168` | `` `${dataCy}-loading-strip` `` | Open |

### QrScanner

Depends on DCY-X-03 (root is the bare `<name>` data-cy at `W:QrScanner/QrScanner.jsx:23`; `C:qrScanner.js:8`; `H:qrScanner.js:132`; `S:qrScanner/contexts.cy.js:130`; `S:qrScanner/userflow.cy.js:77`). `ErrorModal` takes no props (`W:QrScanner/ErrorModal.jsx:3`), so `W:QrScanner/QrScanner.jsx:24` has to pass `dataCy` into it before DCY-QrScanner-02..06 can be fixed. The error dialog renders inline (no portal), so the current class selectors are already scoped to the widget.

| # | Element | Renders at (file:line) | Current fallback selector (spec/helper file:line) | Suggested data-cy | Status |
|---|---|---|---|---|---|
| DCY-QrScanner-01 | Camera preview `<video>` (react-qr-reader: `<section><section><div/><video/>`) | `W:QrScanner/QrScanner.jsx:24` (`<QrReader>`; DOM from react-qr-reader 2.2.1) | `` `[data-cy=x] video` `` — `C:qrScanner.js:10`; `S:qrScanner/contexts.cy.js:117`; `S:qrScanner/events.cy.js:62,107,125` | Not practical on the `<video>` (third-party; react-qr-reader forwards only `className` / `style`). Wrap `<QrReader>` in a `<div>` with `` `${dataCy}-preview` `` and scope `video` under it | Open |
| DCY-QrScanner-02 | Error dialog | `W:QrScanner/ErrorModal.jsx:13` | `` `[data-cy=x] .modal-dialog` `` — `C:qrScanner.js:12`; `S:qrScanner/userflow.cy.js:36,73,86,105` | `` `${dataCy}-error-modal` `` | Open |
| DCY-QrScanner-03 | Error title | `W:QrScanner/ErrorModal.jsx:16` | `` `[data-cy=x] .modal-title` `` — `C:qrScanner.js:13`; `S:qrScanner/contexts.cy.js:132`; `S:qrScanner/userflow.cy.js:43,93` | `` `${dataCy}-error-title` `` | Open |
| DCY-QrScanner-04 | Error body | `W:QrScanner/ErrorModal.jsx:25` | `` `[data-cy=x] .modal-body` `` — `C:qrScanner.js:14`; `S:qrScanner/userflow.cy.js:44` | `` `${dataCy}-error-body` `` | Open |
| DCY-QrScanner-05 | Header close (×) button | `W:QrScanner/ErrorModal.jsx:17` | `` `[data-cy=x] .modal-header .btn-close` `` — `C:qrScanner.js:15`; `S:qrScanner/userflow.cy.js:45,48,85,96` (+2 more) | `` `${dataCy}-error-close-icon` `` | Open |
| DCY-QrScanner-06 | Footer Close button | `W:QrScanner/ErrorModal.jsx:30` | `` `[data-cy=x] .modal-footer button` `` — `C:qrScanner.js:16`; `S:qrScanner/userflow.cy.js:46,48,72,99` (+1 more) | `` `${dataCy}-error-close-button` `` | Open |

### RadioButtonV2

Depends on DCY-X-07 (label text `[data-cy="<name>-label"] p`, `C:radioButtonV2.js:10`), DCY-X-01 (helpers scope everything under `draggable-widget-<name>`) and walks `box.parentElement` to the WidgetWrapper (`H:radioButtonV2.js:90`). The hover tooltip is read via the global, unscoped `[data-cy="widget-tooltip"]` plus `.first()` and class-picked bodies (`C:radioButtonV2.js:22-26`, rendered by the shared `frontend/src/AppBuilder/AppCanvas/WidgetTooltip.jsx:28,32,36,71`); tracked centrally as DCY-X-08.

| # | Element | Renders at (file:line) | Current fallback selector (spec/helper file:line) | Suggested data-cy | Status |
|---|---|---|---|---|---|
| DCY-RadioButtonV2-01 | Radio group root (`role="radiogroup"`) | `W:RadioButtonV2/RadioButtonV2.jsx:238` (role at :259) | `` `[data-cy="draggable-widget-<name>"] [role="radiogroup"]` `` — `C:radioButtonV2.js:7`; `H:radioButtonV2.js:59`; `S:radioButtonV2/styles.cy.js:134,168,235` | `` `${dataCy}-radio-group` `` (e.g. `radiobutton1-radio-group`) | Open |
| DCY-RadioButtonV2-02 | Options scroller (`.radio-button-options`) | `W:RadioButtonV2/RadioButtonV2.jsx:289` | `` `[data-cy="draggable-widget-<name>"] .radio-button-options` `` — `C:radioButtonV2.js:12`; `H:radioButtonV2.js:60,197`; `S:radioButtonV2/canvas.cy.js:231` (+18 more `S.options(...)` uses) | `` `${dataCy}-options` `` | Open |
| DCY-RadioButtonV2-03 | Per-option container (`label.radio-button-container`) | `W:RadioButtonV2/RadioButtonV2.jsx:302` | `` `label.radio-button-container` `` — `C:radioButtonV2.js:14`; `H:radioButtonV2.js:63` (then `label.querySelector("input")` / `"span"` at :64,:66) | `` `${dataCy}-option-${index}` `` | Open |
| DCY-RadioButtonV2-04 | Option checkmark (`span.checkmark`, painted ring / handle) | `W:RadioButtonV2/RadioButtonV2.jsx:337` | `` `[data-cy="<name>-option-input-<i>"] + .checkmark` `` — `C:radioButtonV2.js:20`; `H:radioButtonV2.js:65`; `input.nextElementSibling` + `parentElement` walk at `H:radioButtonV2.js:156,169,175` | `` `${dataCy}-option-checkmark-${index}` `` | Open |

### RichTextEditor

The wrapper carries the bare `<name>` data-cy (`W:RichTextEditor.jsx:82`, DCY-X-03; `C:richTextEditor.js:11`; `S:richTextEditor/userflow.cy.js:251,262,272`). Nothing inside `W:DraftEditor.jsx` is tagged, and `DraftEditor` doesn't receive `dataCy` (`W:RichTextEditor.jsx:90`). Every toolbar button is the same `StyleButton` span (`W:DraftEditor.jsx:46`), so one `dataCy` prop on it covers rows 04–06. Icon buttons are found by their SVG file name. The contentEditable and its blocks are rendered by `draft-js`. `.RichEditor-activeButton` is a state class and not counted. The loader (`:290`, shared `Loader`, DCY-X-06) is not selected by current specs.

| # | Element | Renders at (file:line) | Current fallback selector (spec/helper file:line) | Suggested data-cy | Status |
|---|---|---|---|---|---|
| DCY-RichTextEditor-01 | Editor root (holds toolbar + editor) | `W:DraftEditor.jsx:294` | `` `[data-cy="draggable-widget-x"] .RichEditor-root` `` — `C:richTextEditor.js:13`; `H:richTextEditor.js:196` | `` `${dataCy}-editor-root` `` | Open |
| DCY-RichTextEditor-02 | Toolbar | `W:DraftEditor.jsx:295` | `` `... .RichEditor-controls` `` — `C:richTextEditor.js:15`; `H:richTextEditor.js:170,203`; `S:richTextEditor/canvas.cy.js:83`; `S:richTextEditor/userflow.cy.js:171` | `` `${dataCy}-toolbar` `` | Open |
| DCY-RichTextEditor-03 | "Heading" menu button and its hover menu | `W:DraftEditor.jsx:89` (button), `:92` (menu); wrapper `.dropmenu` at :88 | `` `... .dropmenu .dropdownbtn` `` / `` `... .dropmenu .dropdown-content` `` — `C:richTextEditor.js:17,18,19`; `H:richTextEditor.js:149,150,151` (`applyHeading`, called at `S:richTextEditor/userflow.cy.js:163,168`); `S:richTextEditor/userflow.cy.js:166` | `` `${dataCy}-heading-button` `` / `` `${dataCy}-heading-menu` `` | Open |
| DCY-RichTextEditor-04 | H1–H6 menu items | `W:DraftEditor.jsx:95` (`StyleButton` → :46) | `` `... .dropdown-content .RichEditor-styleButton` `` + exact text — `C:richTextEditor.js:21`; `H:richTextEditor.js:152`; `S:richTextEditor/userflow.cy.js:166` | `` `${dataCy}-heading-h1` `` … `` `${dataCy}-heading-h6` `` | Open |
| DCY-RichTextEditor-05 | Block-type buttons (blockquote, bulleted list, numbered list, code block) | `W:DraftEditor.jsx:107` (`StyleButton` → :46); icons at :64-77 | `` `... .RichEditor-styleButton:has(img[src$="/<icon>.svg"])` `` — `C:richTextEditor.js:24`; `H:richTextEditor.js:162` (`clickToolbarIcon`, called at `S:richTextEditor/userflow.cy.js:181,187,194`) | `` `${dataCy}-blockquote-button` `` / `-ul-button` / `-ol-button` / `-codeblock-button` | Open |
| DCY-RichTextEditor-06 | Inline style buttons (bold, italic, underline) | `W:DraftEditor.jsx:140` (`StyleButton` → :46); icons at :121-129 | same `:has(img[src$=...])` — `C:richTextEditor.js:24`; `H:richTextEditor.js:162` (`clickToolbarIcon`, called at `S:richTextEditor/userflow.cy.js:129,133,143,281`) | `` `${dataCy}-bold-button` `` / `-italic-button` / `-underline-button` | Open |
| DCY-RichTextEditor-07 | Editor area (fixed or dynamic height) | `W:DraftEditor.jsx:299` | `` `... .RichEditor-editor` `` — `C:richTextEditor.js:26`; `H:richTextEditor.js:197` | `` `${dataCy}-editor-area` `` | Open |
| DCY-RichTextEditor-08 | contentEditable and its blocks (library) | `W:DraftEditor.jsx:308` (`draft-js` `Editor`) | `` `... .public-DraftEditor-content` `` / `... [data-block="true"]` — `C:richTextEditor.js:28,29`; `H:richTextEditor.js:90,92,104,133,139,198`; `S:richTextEditor/canvas.cy.js:198,249,286,311` (+17 more) | `` `${dataCy}-input` `` (draft-js has no data attribute prop: set it through the editor ref, or scope under DCY-RichTextEditor-07) | Open |
| DCY-RichTextEditor-09 | Placeholder | `W:DraftEditor.jsx:316` (our `<div>`, inside draft-js's `.public-DraftEditorPlaceholder-root`) | `` `... .public-DraftEditorPlaceholder-root` `` — `C:richTextEditor.js:30`; `S:richTextEditor/canvas.cy.js:82,287`; `S:richTextEditor/userflow.cy.js:80,85` | `` `${dataCy}-placeholder` `` on the `<div>` at :316 | Open |

### Spinner

Root is the bare `<name>` data-cy, class-qualified with `.spinner-container` (DCY-X-03).

| # | Element | Renders at (file:line) | Current fallback selector (spec/helper file:line) | Suggested data-cy | Status |
|---|---|---|---|---|---|
| DCY-Spinner-01 | spinner ring (`role="status"`) | `W:Spinner.jsx:14` | `` `[data-cy=<name>] .spinner-border` `` — `C:spinner.js:9`; `H:spinner.js:37`; `S:spinner/canvas.cy.js:76`; `S:spinner/contexts.cy.js:87` (+4 more) | `` `${dataCy}-ring` `` (e.g. `spinner1-ring`) | Open |

### Steps

Root is the bare `<name>` data-cy (DCY-X-03). Steps are found by class and then picked by position with `.eq(i)` / `:eq(i)`.

| # | Element | Renders at (file:line) | Current fallback selector (spec/helper file:line) | Suggested data-cy | Status |
|---|---|---|---|---|---|
| DCY-Steps-01 | progress line container | `W:Steps.jsx:182` | `` `.progress-line-container` `` — `C:steps.js:9`; `H:steps.js:74`; `S:steps/canvas.cy.js:220` | `` `${dataCy}-progress-line` `` | Open |
| DCY-Steps-02 | step (milestone button) | `W:Steps.jsx:200` | `` `button.milestone` `` + `.eq(i)` — `C:steps.js:11`; `H:steps.js:75`; `S:steps/userflow.cy.js:31`; `S:steps/styles.cy.js:102` (inline `closest('button.milestone')`) (+31 more) | `` `${dataCy}-step-<index>` `` (e.g. `steps1-step-0`) | Open |
| DCY-Steps-03 | step dot (dot themes) | `W:Steps.jsx:219` | `` `.dot` `` inside the milestone — `H:steps.js:97`; `H:steps.js:315` | `` `${dataCy}-step-<index>-dot` `` | Open |
| DCY-Steps-04 | step label (titles theme) | `W:Steps.jsx:232` | `` `[data-cy=draggable-widget-<name>] .label` `` — `C:steps.js:15`; `H:steps.js:98`; `S:steps/canvas.cy.js:246` | `` `${dataCy}-step-<index>-label` `` | Open |
| DCY-Steps-05 | connector between steps | `W:Steps.jsx:245` | `` `.step-connector` `` — `C:steps.js:13`; `H:steps.js:76`; `S:steps/contexts.cy.js:193`; `S:steps/canvas.cy.js:245` | `` `${dataCy}-connector-<index>` `` | Open |
| DCY-Steps-06 | step tooltip and its arrow (portaled to body, not scoped to the widget) | `W:Steps.jsx:196` → `frontend/src/_components/ToolTip.jsx:27` (`ToolTip` takes no data-cy prop) | `` `.tooltip.show` `` / `` `.tooltip-arrow` `` — `C:steps.js:17`, `C:steps.js:19`; `S:steps/styles.cy.js:191`; `S:steps/styles.cy.js:197`; `S:steps/styles.cy.js:222` (+3 more) | `` `${dataCy}-step-<index>-tooltip` `` (add a `dataCy` prop to `ToolTip` and forward it to `<Tooltip>`) | Open |

### SvgImage

Root is the bare `<name>` data-cy scoped under `draggable-widget-<name>` (DCY-X-03); helpers take `.first()` of the container (DCY-X-01). The `<svg>` itself is sanitized author markup, so only its wrapper can carry a data-cy.

| # | Element | Renders at (file:line) | Current fallback selector (spec/helper file:line) | Suggested data-cy | Status |
|---|---|---|---|---|---|
| DCY-SvgImage-01 | image wrapper (`role="img"`, parent of the authored `<svg>`) | `W:SvgImage.jsx:9` | `` `[data-cy=<name>] > [role="img"]` `` / `` `> [role="img"] > svg` `` — `C:svgImage.js:12`, `C:svgImage.js:14`; `H:svgImage.js:53`; `H:svgImage.js:72`; `S:svgImage/canvas.cy.js:75` (+3 more) | `` `${dataCy}-image` `` (e.g. `svgimage1-image`; then `[data-cy=svgimage1-image] > svg`) | Open |

### Tabs

Depends on DCY-X-01 (box class-qualified as `` `.canvas-component[data-cy=draggable-widget-x]` `` to skip nested child boxes, `C:tabs.js:3`; `.first()` at `H:tabs.js:205,212`), DCY-X-03 (root reached as `` `.tabs-component[data-cy=<name>]` ``, `C:tabs.js:9`; `H:tabs.js:124`) and DCY-X-09 (pane sub-canvases repeat `real-canvas`, so two specs overwrite the canvas commands). The header bar wrapper (`W:Tabs/Tabs.jsx:322`) is only walked through (`:scope > div > ...`); rows 01 and 05 remove that walk. `TabContent` (`W:Tabs/Tabs.jsx:553`) takes no `dataCy`, so it has to be passed down for rows 06 and 09. The loading shimmer and spinners (`W:Tabs/Tabs.jsx:20`, `:472`, `:604`) are not selected by current specs.

| # | Element | Renders at (file:line) | Current fallback selector (spec/helper file:line) | Suggested data-cy | Status |
|---|---|---|---|---|---|
| DCY-Tabs-01 | Header row `ul.nav` (scroll container) | `W:Tabs/Tabs.jsx:344` | `` `.tabs-component[data-cy=<name>] > div > ul.nav` `` — `C:tabs.js:11`; `H:tabs.js:125`; consumed as `b.nav` at `S:tabs/canvas.cy.js:214`, `S:tabs/styles.cy.js:85` (+14 more) | `` `${dataCy}-nav` `` (e.g. `tabs1-nav`) | Open |
| DCY-Tabs-02 | Tab header `li.nav-item` (+ active state), picked by position | `W:Tabs/Tabs.jsx:367` | `` `... > ul.nav > li.nav-item` `` + `.eq(i)` — `C:tabs.js:13`; `H:tabs.js:126`; `closest("li.nav-item")` at `H:tabs.js:248`; `S:tabs/canvas.cy.js:104`; `S:tabs/userflow.cy.js:92`; `S:tabs/styles.cy.js:153` (+29 more); active state `` `li.nav-item.active` `` — `C:tabs.js:14` (defined, unused), `H:tabs.js:158` | `` `${dataCy}-tab-<tabId>` `` (tab id as the slug, since hidden tabs shift the index; e.g. `tabs1-tab-t0`) + `aria-selected` | Open |
| DCY-Tabs-03 | Header hover surface (the inner div that paints the hover background) | `W:Tabs/Tabs.jsx:408` | `li.firstElementChild` — `H:tabs.js:153`; consumed as `surfaceBg` at `S:tabs/styles.cy.js:304` | `` `${dataCy}-tab-<tabId>-surface` `` | Open |
| DCY-Tabs-04 | Header title (`OverflowTooltip` div in split width, `<span>` otherwise) | `W:Tabs/Tabs.jsx:434` → `frontend/src/_components/OverflowTooltip.jsx:81` (split); `W:Tabs/Tabs.jsx:439` (auto) | `` `:scope > span, .text-truncate, div` `` inside the surface — `H:tabs.js:154`; consumed as `labelRect` at `S:tabs/styles.cy.js:104` | `` `${dataCy}-tab-<tabId>-label` `` | Open |
| DCY-Tabs-05 | Nav scroll arrows (left / right; only rendered on overflow) | `W:Tabs/Tabs.jsx:332` (left), `:450` (right) | `` `.tabs-component[data-cy=<name>] > div > div.px-2` `` + `.eq(i)` — `C:tabs.js:16`; `H:tabs.js:127`; `S:tabs/canvas.cy.js:237`; consumed as `b.arrows` at `S:tabs/canvas.cy.js:214-221,296` | `` `${dataCy}-scroll-left` `` / `` `${dataCy}-scroll-right` `` | Open |
| DCY-Tabs-06 | Tab pane `.tab-pane[activetab]` | `W:Tabs/Tabs.jsx:577` (`activetab` at :579) | `` `.tab-pane[activetab="<tabId>"]` `` — `C:tabs.js:18`; `H:tabs.js:128,221`; `S:tabs/canvas.cy.js:102`; `S:tabs/styles.cy.js:157,167` | `` `${dataCy}-pane-<tabId>` `` | Open |
| DCY-Tabs-07 | Pane wrapper (per-tab div that carries display / slide transform / opacity / visibility) | `W:Tabs/Tabs.jsx:488` | `pane.parentElement` — `H:tabs.js:172`; `S:tabs/styles.cy.js:157`; every wrapper via `` `:scope > div:last-child > div` `` — `H:tabs.js:191`; consumed at `S:tabs/canvas.cy.js:93`, `S:tabs/styles.cy.js:238-244` | `` `${dataCy}-pane-wrapper-<tabId>` `` | Open |
| DCY-Tabs-08 | Panel (overflow-hidden container of all pane wrappers) | `W:Tabs/Tabs.jsx:475` | `.parentElement.parentElement` from a pane — `S:tabs/styles.cy.js:167`; `wrapper.parentElement` — `S:tabs/styles.cy.js:188,189`; `` `:scope > div:last-child` `` — `H:tabs.js:191` | `` `${dataCy}-panel` `` | Open |
| DCY-Tabs-09 | Pane sub-canvas (instance of DCY-X-09: renders the shared `real-canvas` data-cy; reachable only by `#canvas-<componentId>-<tabId>`) | `W:Tabs/Tabs.jsx:607` → `frontend/src/AppBuilder/AppCanvas/Container.jsx:304-305` | `` `#canvas-<componentId>-<tabId>` `` — `C:tabs.js:20`; `S:tabs/canvas.cy.js:100,328`; `` `[id^="canvas-"]` `` — `H:tabs.js:173`; `S:tabs/styles.cy.js:171`; component id parsed out of the canvas id by `tabsComponentId` — `H:tabs.js:219-226` | `` `${dataCy}-pane-<tabId>-canvas` `` (pass `dataCy` to `SubContainer`) | Open |

### Tags

Depends on DCY-X-01: `W:Tags/Tags.jsx:302` repeats `draggable-widget-<name>` on the inner `.tag-comp-wrapper`, so specs qualify by class — `` `.canvas-component[data-cy=draggable-widget-x]` `` (`C:tags.js:15`, e.g. `S:tags/canvas.cy.js:85`) vs `` `.tag-comp-wrapper[data-cy=draggable-widget-x]` `` (`C:tags.js:19`, `H:tags.js:40`, `S:tags/canvas.cy.js:202`). Inspector rows below are Tags-specific inspector UI (`frontend/src/AppBuilder/RightSideBar/Inspector/Components/Tags.jsx`).

| # | Element | Renders at (file:line) | Current fallback selector (spec/helper file:line) | Suggested data-cy | Status |
|---|---|---|---|---|---|
| DCY-Tags-01 | Outer region div (carries box-shadow) | `W:Tags/Tags.jsx:291` | `` `.canvas-component[data-cy=draggable-widget-x] [role="region"]` `` — `C:tags.js:17`; `S:tags/styles.cy.js:64` | `` `${dataCy}-region` `` (e.g. `tags1-region`) | Open |
| DCY-Tags-02 | Badge list (all badges, in DOM order) | `W:Tags/Tags.jsx:275` (per-badge `${dataCy}-tag-<slug>` built at `:224`) | `` `[data-cy=x-tags-container] .badge` `` — `C:tags.js:23`; `S:tags/styles.cy.js:44`; `S:tags/inspector.cy.js:140` (`querySelectorAll('.badge')`); `H:tags.js:44` (+2 more) | keep `${dataCy}-tag-<slug>`, but rename the badge icon (`W:Tags/Tags.jsx:205`, `${dataCy}-tag-<slug>-icon`) to `${dataCy}-icon-<slug>` so `[data-cy^="${dataCy}-tag-"]` selects exactly the badges | Open |
| DCY-Tags-03 | Inspector option item (rbd draggable) | `frontend/src/AppBuilder/RightSideBar/Inspector/Components/Tags.jsx:328` | `` `[data-list-item-id]` `` / `` `[data-list-item-id="<title>"]` `` — `C:tags.js:35`; `C:tags.js:36`; `H:tags.js:77`; `S:tags/inspector.cy.js:131` | `` `tag-option-<slug(title)>` `` | Open |
| DCY-Tags-04 | Inspector option row (`ListGroup.Item`, hover target) | `frontend/src/AppBuilder/RightSideBar/Inspector/Components/Tags.jsx:348` | `` `[data-list-item-id=t] .list-group-item` `` — `C:tags.js:38`; `S:tags/inspector.cy.js:86`; `S:tags/inspector.cy.js:107` | `` `tag-option-<slug>-row` `` | Open |
| DCY-Tags-05 | Inspector option title cell (click opens popover) | `frontend/src/AppBuilder/RightSideBar/Inspector/Components/Tags.jsx:357` | `` `[data-list-item-id=t] .cursor-pointer` `` — `C:tags.js:39`; `H:tags.js:87` | `` `tag-option-<slug>-label` `` | Open |
| DCY-Tags-06 | Inspector option delete button (hover-only) | `frontend/src/AppBuilder/RightSideBar/Inspector/Components/Tags.jsx:362` | `` `[data-list-item-id=t] .delete-icon-btn` `` — `C:tags.js:41`; `S:tags/inspector.cy.js:87`; `S:tags/inspector.cy.js:106`; `S:tags/inspector.cy.js:108` | `` `tag-option-<slug>-delete-button` `` | Open |
| DCY-Tags-07 | Option details popover | `frontend/src/AppBuilder/RightSideBar/Inspector/Components/Tags.jsx:211` | `` `.popover` `` — `C:tags.js:43`; `H:tags.js:88`; `H:tags.js:98`; also prefixes `C:tags.js:45-55` | `` `tag-option-popover` `` | Open |
| DCY-Tags-08 | Icon picker trigger (shared CodeBuilder icon element, reached from the tag popover) | `frontend/src/AppBuilder/CodeBuilder/Elements/Icon.jsx:104` | `` `.popover [data-cy="input-and-label-tag-icon"] [role="button"]` `` — `C:tags.js:46`; `H:tags.js:108` | `` `icon-picker-trigger` `` | Open |
| DCY-Tags-09 | Icon picker search input — broken data-cy: `Icon.jsx:47` renders `<SearchBox>` without `dataCy`, so `SearchBox.jsx:88` emits `-search-bar` | `frontend/src/_components/SearchBox.jsx:76` (via `frontend/src/AppBuilder/CodeBuilder/Elements/Icon.jsx:47`) | `` `.icon-widget-popover input` `` — `C:tags.js:50`; `H:tags.js:109` | pass `dataCy="icon-picker"` → `icon-picker-search-bar` | Open |
| DCY-Tags-10 | Icon picker grid cell | `frontend/src/AppBuilder/CodeBuilder/Elements/Icon.jsx:63` | `` `.icon-widget-popover .icon-element` `` — `C:tags.js:51`; `H:tags.js:110` | `` `icon-picker-option-<iconName>` `` | Open |

### TextArea

None found. Every widget part the specs touch (`-actionable-section`, `-input`) has a data-cy. Spec-only cleanup: `S:textArea/canvas.cy.js:355` reaches the field through `$el[0].parentElement` even though the parent already has `` `${dataCy}-actionable-section` `` (`W:BaseComponents/BaseInput.jsx:212`), so switch it to `textAreaSelector.field`. `H:textArea.js:28` picks `[data-cy="draggable-widget-<name>"]` by index for ListView rows (see DCY-X-01).

### Timeline

Root is the bare `<name>` data-cy, class-qualified as `.card[data-cy=<name>]` (DCY-X-03). The subtitle `<p>` (`W:Timeline.jsx:64`) is not selected by the current specs.

| # | Element | Renders at (file:line) | Current fallback selector (spec/helper file:line) | Suggested data-cy | Status |
|---|---|---|---|---|---|
| DCY-Timeline-01 | card body | `W:Timeline.jsx:54` | `` `.card-body` `` — `H:timeline.js:85` | `` `${dataCy}-body` `` | Open |
| DCY-Timeline-02 | timeline list | `W:Timeline.jsx:55` | `` `ul.list-timeline` `` — `C:timeline.js:9`; `H:timeline.js:82`; `S:timeline/canvas.cy.js:236` | `` `${dataCy}-list` `` | Open |
| DCY-Timeline-03 | timeline item | `W:Timeline.jsx:57` | `` `ul.list-timeline > li` `` / `[...list.children]` — `C:timeline.js:11`; `H:timeline.js:83`; `S:timeline/canvas.cy.js:86`; `S:timeline/canvas.cy.js:344` (+8 more) | `` `${dataCy}-item-<index>` `` (e.g. `timeline1-item-0`) | Open |
| DCY-Timeline-04 | item date | `W:Timeline.jsx:61` | `` `.list-timeline-time` `` — `C:timeline.js:13`; `H:timeline.js:117`; `S:timeline/canvas.cy.js:87`; `S:timeline/canvas.cy.js:237` | `` `${dataCy}-item-<index>-date` `` | Open |
| DCY-Timeline-05 | item title | `W:Timeline.jsx:63` | `` `.list-timeline-title` `` — `C:timeline.js:14`; `H:timeline.js:118` | `` `${dataCy}-item-<index>-title` `` | Open |

### TimePicker

The input, icon and clear button are tagged (`W:Date/DatepickerInput.jsx:97,104,143`), and `W:Date/TimePicker.jsx:229` forwards `dataCy` to `BaseDateComponent`. The label + field row and the validation message are DCY-X-10. The time-only popup (`popperClassName` at `W:Date/TimePicker.jsx:166`) is DCY-X-11. The time panel, columns, headers and items come from the shared `TimepickerInput` and are DCY-DatetimePickerV2-01. `.disabled-time` (`C:timePicker.js:30`) is a state class and not counted.

| # | Element | Renders at (file:line) | Current fallback selector (spec/helper file:line) | Suggested data-cy | Status |
|---|---|---|---|---|---|
| DCY-TimePicker-01 | Column wrapper and its overlay scrollbar / thumb | `W:Date/TimepickerInput.jsx:95` (wrapper), `:100` (scrollbar), `:102` (thumb) | `` `#component-portal .react-datepicker-popper .custom-time-input .time-colwrap` `` / `.time-scrollbar` / `.time-scrollbar-thumb` — `C:timePicker.js:26,27,28`; `H:timePicker.js:43,44,45` | `` `${dc}-time-<column>-scrollbar` `` / `` `${dc}-time-<column>-scrollbar-thumb` `` (`column` = `hours` / `minutes` / `ampm`, as in DCY-DatetimePickerV2-01) | Open |

### TreeSelect

Depends on DCY-X-01 (`.first()` on `draggable-widget-<name>`, `H:treeSelect.js:129,259`; `box.parentElement` wrapper walk at `H:treeSelect.js:86`) and DCY-X-03 (root reached as `.custom-checkbox-tree[data-cy="<name>"]`, `C:treeSelect.js:7`; `H:treeSelect.js:65,239`). Nodes, toggles and the `<li>` come from third-party `react-checkbox-tree` (`W:TreeSelect/TreeSelect.jsx:344`). Per-node hooks have to go on the label element we inject (`processedItem.label`, :263), the `icons` we pass (:376-385), and `TreeSelectCheckbox`. Specs find nodes by matching title text against `:scope > .rct-text .rct-title`.

| # | Element | Renders at (file:line) | Current fallback selector (spec/helper file:line) | Suggested data-cy | Status |
|---|---|---|---|---|---|
| DCY-TreeSelect-01 | Widget label (broken: renders `data-cy="undefined-label"`; instance of DCY-X-02) | `W:TreeSelect/TreeSelect.jsx:461` (`<Label>` without `dataCy`) → `frontend/src/_ui/Label.jsx:98` | none: no spec can target the label; `undefined-label` collides across widgets | `` `${dataCy}-label` `` (pass `dataCy={dataCy}`) | Open |
| DCY-TreeSelect-02 | Tree node (`li.rct-node`, carries leaf / expanded state classes) | `W:TreeSelect/TreeSelect.jsx:344` (react-checkbox-tree) | `` `[data-cy="draggable-widget-<name>"] li.rct-node` `` + text filter — `C:treeSelect.js:9`; `H:treeSelect.js:68,170,183`; `S:treeSelect/contexts.cy.js:218`; `S:treeSelect/userflow.cy.js:186,207` | `` `${dataCy}-node-<value>` `` on the injected row (:263) plus `data-expanded` / `data-leaf` | Open |
| DCY-TreeSelect-03 | Node title / click target (`.rct-title`, `.rct-title > div`) | `W:TreeSelect/TreeSelect.jsx:263` | `` `:scope > .rct-text .rct-title` `` / `` `.rct-title > div` `` — `H:treeSelect.js:58`; `S:treeSelect/contexts.cy.js:219,220`; `S:treeSelect/userflow.cy.js:187,188`; `S:treeSelect/canvas.cy.js:411` (+1 more) | `` `${dataCy}-node-<value>-label` `` | Open |
| DCY-TreeSelect-04 | Expand / collapse toggle (`button.rct-collapse-btn`) | `W:TreeSelect/TreeSelect.jsx:378` (expandOpen icon), `:383` (expandClose icon); button is react-checkbox-tree's | `` `[data-cy="draggable-widget-<name>"] button.rct-collapse-btn` `` / `` `> .rct-text > button.rct-collapse-btn` `` — `C:treeSelect.js:11`; `H:treeSelect.js:173,193` | `` `${dataCy}-node-toggle` `` on the icon spans (scoped by the node) | Open |
| DCY-TreeSelect-05 | Node checkbox input (broken: global, non-unique `checkbox-input`) | `W:TreeSelect/TreeSelectCheckbox.jsx:45` (data-cy at :55) | `` `.rct-title input[data-cy="checkbox-input"]` `` — `C:treeSelect.js:13`; `H:treeSelect.js:69,186,195`; `S:treeSelect/userflow.cy.js:210` | `` `${dataCy}-node-<value>-checkbox` `` (pass `dataCy` into `TreeSelectCheckbox` from `TreeSelect.jsx:274`) | Open |
| DCY-TreeSelect-06 | Checkbox tick icon (painted state) | `W:TreeSelect/TreeSelectCheckbox.jsx:82` | `input.nextElementSibling` — `H:treeSelect.js:70`; `S:treeSelect/userflow.cy.js:213` | `` `${dataCy}-node-<value>-checkbox-tick` `` | Open |

### VerticalDivider

Depends on DCY-X-03 (root reached as `` `[data-cy=draggable-widget-x] [data-cy=x]` ``, `C:verticalDivider.js:7`). Runtime is `W:VerticalDivider.jsx` (the `W:VerticalDivider/` folder holds only tests).

| # | Element | Renders at (file:line) | Current fallback selector (spec/helper file:line) | Suggested data-cy | Status |
|---|---|---|---|---|---|
| DCY-VerticalDivider-01 | Line `<div>` | `W:VerticalDivider.jsx:16` | `` `[data-cy=x] > div` `` — `C:verticalDivider.js:9`; `H:verticalDivider.js:33` (inline literal, then `parentElement` walk at `:48`); shared leaf-div walk `H:divider.js:66` via `dividerBoxes` at `S:verticalDivider/styles.cy.js:73`, `S:verticalDivider/canvas.cy.js:64`, `S:verticalDivider/contexts.cy.js:58` (+13 more calls) | `` `${dataCy}-line` `` (e.g. `verticaldivider1-line`) | Open |
