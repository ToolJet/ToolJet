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

106 widget-specific gaps across 23 widgets, plus 8 cross-cutting items.

| Widget | Open gaps | Fixed |
|---|---|---|
| [Cross-cutting](#cross-cutting) | 8 | 0 |
| [ButtonGroupV2](#buttongroupv2) | 2 | 0 |
| [Cascader](#cascader) | 8 | 0 |
| [CircularProgressBar](#circularprogressbar) | 4 | 0 |
| [ColorPicker](#colorpicker) | 7 | 0 |
| [CurrencyInput](#currencyinput) | 8 | 0 |
| [Divider](#divider) | 2 | 0 |
| [DropdownV2](#dropdownv2) | 15 | 0 |
| [EmailInput](#emailinput) | 1 | 0 |
| [Html](#html) | 1 | 0 |
| [Icon](#icon) | 1 | 0 |
| [Image](#image) | 4 | 0 |
| [Link](#link) | 5 | 0 |
| [PhoneInput](#phoneinput) | 9 | 0 |
| [ProgressBar](#progressbar) | 5 | 0 |
| [RadioButtonV2](#radiobuttonv2) | 4 | 0 |
| [Spinner](#spinner) | 1 | 0 |
| [Steps](#steps) | 6 | 0 |
| [SvgImage](#svgimage) | 1 | 0 |
| [Tags](#tags) | 10 | 0 |
| [TextArea](#textarea) | 0 (none found) | 0 |
| [Timeline](#timeline) | 5 | 0 |
| [TreeSelect](#treeselect) | 6 | 0 |
| [VerticalDivider](#verticaldivider) | 1 | 0 |
| **Total** | **114** | **0** |

## Cross-cutting

These items cover several widgets and should be fixed once in shared code. Per-widget sections reference them
in their notes and don't list them again. Exceptions are per-widget instances that need their own product-code
change, such as a call site that has to pass `dataCy`; those are listed in the widget's table.

| # | Problem | Renders at (file:line) | Current fallback selector (spec/helper file:line) | Suggested fix | Status |
|---|---|---|---|---|---|
| DCY-X-01 | `draggable-widget-<name>` is **duplicated**: the canvas box in `RenderWidget` carries it, and Tags and Image stamp the same value on their own inner root. `[data-cy="draggable-widget-x"]` matches 2 nodes, so tests use `.first()` (24 lines across the scanned files) or class-qualify it. | `frontend/src/AppBuilder/AppCanvas/RenderWidget.jsx:346`; inner copies `W:Tags/Tags.jsx:302`, `W:Image/Image.jsx:353` | `` `.canvas-component[data-cy="draggable-widget-x"]` `` / `` `.tag-comp-wrapper[data-cy=...]` `` — `C:tags.js:15`; `C:tags.js:19`; `H:tags.js:136`; `H:image.js:11` (+ `.first()` e.g. `H:icon.js:147`, `H:divider.js:56`, `H:dropdownV2.js:140`) | Keep `draggable-widget-<name>` only on the RenderWidget box. Rename the inner roots to `${dataCy}-container` (Tags) and `${dataCy}-wrapper` (Image). | Open |
| DCY-X-02 | `_ui/Label` renders `` data-cy={`${dataCy}-label`} `` unconditionally, so a caller that omits `dataCy` gets **`undefined-label`**. Two scanned call sites omit it: TreeSelect and ProgressBar. | `frontend/src/_ui/Label.jsx:98`; call sites `W:TreeSelect/TreeSelect.jsx:461`, `W:Progressbar/Progressbar.jsx:168` | DCY-TreeSelect-01 (no spec can target it), DCY-ProgressBar-01 (`` `[data-cy=x] label` ``, `C:progressBar.js:9`) | Pass `dataCy={dataCy}` at both call sites. Make `Label` omit the attribute (or throw in dev) when `dataCy` is falsy. | Open |
| DCY-X-03 | The widget root data-cy is the **bare component name** (`dataCy={componentName}`). It isn't namespaced, so tests have to qualify it with a class or scope it under `draggable-widget-<name>` to be sure they hit the widget root. | `frontend/src/AppBuilder/AppCanvas/RenderWidget.jsx:367` (prop); consumed by each widget root | `` `[data-cy=x].icon-widget` `` `C:icon.js:7`; `` `.link-widget` `` `C:link.js:7`; `` `.html-widget-container` `` `C:html.js:4`; `` `.button-group-widget[data-cy=x]` `` `C:buttonGroupV2.js:7`; `` `.custom-checkbox-tree[data-cy=x]` `` `C:treeSelect.js:7`; `` `.card[data-cy=x]` `` `C:timeline.js:7`; `` `[data-cy=x].spinner-container` `` `C:spinner.js:7`; `` `.dropdown-widget` `` `C:dropdownV2.js:13`; `` `.cascader-widget` `` `C:cascader.js:11` | Add a namespaced root `data-cy="${dataCy}-root"` (or `widget-<name>`) on every widget root. Keep the bare value only for back-compat until old specs are migrated. | Open |
| DCY-X-04 | Portaled menus and validation ids are keyed by the **component id**, not the name. Helpers walk `closest('[component-type]')` on the WidgetWrapper to read the id before they can select the menu. | `frontend/src/AppBuilder/AppCanvas/WidgetWrapper.jsx:267` (`component-type`, `id`) | `` `[component-type]` `` — `C:phoneInput.js:11`; `C:currencyInput.js:10`; `C:dropdownV2.js:11`; `H:phoneInput.js:17`; `H:currencyInput.js:21`; `H:dropdownV2.js:140`; `S:phoneInput/canvas.cy.js:164` | Put `${dataCy}`-prefixed data-cy on every portaled menu, option and validation message (see per-widget rows), so tests never need the id. | Open |
| DCY-X-05 | BaseInput (EmailInput, TextArea, etc.) renders the clear button and the label+field row with **no data-cy**. | `W:BaseComponents/BaseInput.jsx:146` (`.tj-input-clear-btn`); `W:BaseComponents/BaseInput.jsx:171` (`.text-input` row) | `` `[data-cy="draggable-widget-x"] .tj-input-clear-btn` `` — `C:emailInput.js:20`; `S:emailInput/canvas.cy.js:192`; `` `... .text-input` `` — `C:emailInput.js:22`; `H:baseInput.js:62`; `H:baseInput.js:86` | `${String(dataCy).toLowerCase()}-clear-button` on the button and `${String(dataCy).toLowerCase()}-row` on the row div | Open |
| DCY-X-06 | The shared `Loader` has **no data-cy** and takes no `dataCy` prop. PhoneInput, CurrencyInput and DropdownV2 find it by class. | `frontend/src/ToolJetUI/Loader/Loader.jsx:10` (div `.tj-widget-loader`); call sites `W:BaseComponents/BaseInput.jsx:299`, `W:PhoneCurrency/PhoneInput.jsx:374`, `W:PhoneCurrency/CurrencyInput.jsx:393`, `W:DropdownV2/DropdownV2.jsx:623` | `` `[data-cy="draggable-widget-x"] .tj-widget-loader` `` — `C:phoneInput.js:29`; `C:currencyInput.js:28`; `C:dropdownV2.js:31`; `H:dropdownV2.js:254`; `S:phoneInput/canvas.cy.js:286`; `S:dropdownV2/styles.cy.js:155` | Add an optional `dataCy` prop that renders `${dataCy}-loader`, and pass it from each call site | Open |
| DCY-X-07 | The `_ui/Label` text `<p>` (which carries the label colour and the mandatory `*`) has **no data-cy**, so colour checks reach it with a descendant tag selector. | `frontend/src/_ui/Label.jsx:36` | `` `[data-cy="<name>-label"] p` `` — `C:radioButtonV2.js:10`; `H:radioButtonV2.js:61`; `S:emailInput/styles.cy.js:107` | `${dataCy}-label-text` on the `<p>` (fix once in `_ui/Label.jsx`) | Open |
| DCY-X-08 | The canvas hover tooltip carries one **global, unprefixed** `widget-tooltip` data-cy for every widget, and its per-format body has none. Tests take `.first()` and pick the body by class. | `frontend/src/AppBuilder/AppCanvas/WidgetTooltip.jsx:71` (`data-cy="widget-tooltip"`); bodies at `:28` (html), `:32` (markdown), `:36` (plain) | `` `[data-cy="widget-tooltip"]` `` + `span.tw-whitespace-pre-wrap` / `.widget-tooltip-markdown` / `.widget-tooltip-html` — `C:radioButtonV2.js:22`; `C:radioButtonV2.js:24-26`; `S:radioButtonV2/properties.cy.js:34`; `S:radioButtonV2/properties.cy.js:74` | `${dataCy}-tooltip` on the content and `${dataCy}-tooltip-body` on the body. Keep `widget-tooltip` as a secondary attribute if other suites rely on it. | Open |

## Per-widget gaps

### ButtonGroupV2

Root is the bare `<name>` data-cy, class-qualified as `.button-group-widget` (DCY-X-03); the helper takes `.first()` of the draggable (DCY-X-01). The button list is still collected by class `button.button-group-button` (`C:buttonGroupV2.js:16`, `H:buttonGroupV2.js:54`) even though each button has `${dataCy}-button-${index}` (`W:ButtonGroupV2/ButtonGroupV2.jsx:383`), so this is a test-side change only. The icon data-cy `${dataCy}-icon` (`W:ButtonGroupV2/ButtonGroupV2.jsx:436`) repeats on every button and is not unique; current specs do not select it, and it should become `${dataCy}-button-${index}-icon`.

| # | Element | Renders at (file:line) | Current fallback selector (spec/helper file:line) | Suggested data-cy | Status |
|---|---|---|---|---|---|
| DCY-ButtonGroupV2-01 | content wrapper (scroll and overflow container) | `W:ButtonGroupV2/ButtonGroupV2.jsx:372` | `` `.button-group-content-wrapper` `` — `C:buttonGroupV2.js:11`; `H:buttonGroupV2.js:52`; `S:buttonGroupV2/canvas.cy.js:262`; `S:buttonGroupV2/canvas.cy.js:388`; `S:buttonGroupV2/contexts.cy.js:335` | `` `${dataCy}-content-wrapper` `` | Open |
| DCY-ButtonGroupV2-02 | button row/column container | `W:ButtonGroupV2/ButtonGroupV2.jsx:380` | `` `.button-group-content` `` — `C:buttonGroupV2.js:13`; `H:buttonGroupV2.js:53`; `S:buttonGroupV2/canvas.cy.js:245`; `S:buttonGroupV2/canvas.cy.js:315` | `` `${dataCy}-content` `` | Open |

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

### Link

Depends on DCY-X-03 (root is bare `[data-cy="<name>"]`, qualified with `.link-widget`).

| # | Element | Renders at (file:line) | Current fallback selector (spec/helper file:line) | Suggested data-cy | Status |
|---|---|---|---|---|---|
| DCY-Link-01 | Anchor `<a>` | `W:Link/Link.jsx:158` | `` `[data-cy=x].link-widget > a` `` — `C:link.js:9`; `S:link/canvas.cy.js:83`; `S:link/events.cy.js:58`; `H:link.js:137` (`querySelector("a")`) (+4 more) | `` `${dataCy}-anchor` `` (e.g. `link1-anchor`) | Open |
| DCY-Link-02 | Text block `<span>` wrapping icon + text | `W:Link/Link.jsx:185` | `` `> a > span` `` — `C:link.js:11` (constant defined; no spec usage yet) | `` `${dataCy}-content` `` | Open |
| DCY-Link-03 | Icon box `<span>` | `W:Link/Link.jsx:197` | `` `> a > span > span:not(.link-text)` `` — `C:link.js:13` (constant defined; no spec usage yet) | `` `${dataCy}-icon-box` `` | Open |
| DCY-Link-04 | Icon `<svg>` (TablerIcon; spreads props onto the svg) | `W:Link/Link.jsx:199` | `` `... > span > span:not(.link-text) svg` `` — `C:link.js:15`; `S:link/events.cy.js:107`; `S:link/styles.cy.js:166`; `H:link.js:133` (+3 more) | `` `${dataCy}-icon` `` | Open |
| DCY-Link-05 | Link text `<span class="link-text">` | `W:Link/Link.jsx:211` | `` `.link-text` `` — `C:link.js:17`; `S:link/canvas.cy.js:82`; `S:link/contexts.cy.js:41`; `H:link.js:132` (+26 more) | `` `${dataCy}-text` `` | Open |

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

### ProgressBar

Root is the bare `<name>` data-cy (DCY-X-03). The bar parts are reached by `lastElementChild` / `firstElementChild` walks from the root, so any wrapper change breaks them.

| # | Element | Renders at (file:line) | Current fallback selector (spec/helper file:line) | Suggested data-cy | Status |
|---|---|---|---|---|---|
| DCY-ProgressBar-01 | label (instance of DCY-X-02: `<Label>` gets no `dataCy`, renders `data-cy="undefined-label"`) | `W:Progressbar/Progressbar.jsx:168` → `frontend/src/_ui/Label.jsx:98` | `` `[data-cy=<name>] label` `` — `C:progressBar.js:9`; `H:progressBar.js:88`; `S:progressBar/contexts.cy.js:63`; `S:progressBar/canvas.cy.js:191` | `` `${dataCy}-label` `` (pass `dataCy={dataCy}`; e.g. `progressbar1-label`) | Open |
| DCY-ProgressBar-02 | bar container | `W:Progressbar/Progressbar.jsx:185` | `root.lastElementChild` — `H:progressBar.js:89`; `H:progressBar.js:226`; `H:progressBar.js:233` | `` `${dataCy}-bar-container` `` | Open |
| DCY-ProgressBar-03 | track | `W:Progressbar/Progressbar.jsx:186` | `barCont.firstElementChild` — `H:progressBar.js:90`; `S:progressBar/canvas.cy.js:183`; `S:progressBar/contexts.cy.js:64`; `S:progressBar/styles.cy.js:106` | `` `${dataCy}-track` `` | Open |
| DCY-ProgressBar-04 | fill | `W:Progressbar/Progressbar.jsx:208` | `track.firstElementChild` (when it has no child) — `H:progressBar.js:91`; `H:progressBar.js:93`; `S:progressBar/contexts.cy.js:65`; `S:progressBar/styles.cy.js:167` | `` `${dataCy}-fill` `` | Open |
| DCY-ProgressBar-05 | loading strip (inside the loading clip box at line 188) | `W:Progressbar/Progressbar.jsx:196` | `first.firstElementChild` — `H:progressBar.js:92`; `S:progressBar/styles.cy.js:168` | `` `${dataCy}-loading-strip` `` | Open |

### RadioButtonV2

Depends on DCY-X-07 (label text `[data-cy="<name>-label"] p`, `C:radioButtonV2.js:10`), DCY-X-01 (helpers scope everything under `draggable-widget-<name>`) and walks `box.parentElement` to the WidgetWrapper (`H:radioButtonV2.js:90`). The hover tooltip is read via the global, unscoped `[data-cy="widget-tooltip"]` plus `.first()` and class-picked bodies (`C:radioButtonV2.js:22-26`, rendered by the shared `frontend/src/AppBuilder/AppCanvas/WidgetTooltip.jsx:28,32,36,71`); tracked centrally as DCY-X-08.

| # | Element | Renders at (file:line) | Current fallback selector (spec/helper file:line) | Suggested data-cy | Status |
|---|---|---|---|---|---|
| DCY-RadioButtonV2-01 | Radio group root (`role="radiogroup"`) | `W:RadioButtonV2/RadioButtonV2.jsx:238` (role at :259) | `` `[data-cy="draggable-widget-<name>"] [role="radiogroup"]` `` — `C:radioButtonV2.js:7`; `H:radioButtonV2.js:59`; `S:radioButtonV2/styles.cy.js:134,168,235` | `` `${dataCy}-radio-group` `` (e.g. `radiobutton1-radio-group`) | Open |
| DCY-RadioButtonV2-02 | Options scroller (`.radio-button-options`) | `W:RadioButtonV2/RadioButtonV2.jsx:289` | `` `[data-cy="draggable-widget-<name>"] .radio-button-options` `` — `C:radioButtonV2.js:12`; `H:radioButtonV2.js:60,197`; `S:radioButtonV2/canvas.cy.js:231` (+18 more `S.options(...)` uses) | `` `${dataCy}-options` `` | Open |
| DCY-RadioButtonV2-03 | Per-option container (`label.radio-button-container`) | `W:RadioButtonV2/RadioButtonV2.jsx:302` | `` `label.radio-button-container` `` — `C:radioButtonV2.js:14`; `H:radioButtonV2.js:63` (then `label.querySelector("input")` / `"span"` at :64,:66) | `` `${dataCy}-option-${index}` `` | Open |
| DCY-RadioButtonV2-04 | Option checkmark (`span.checkmark`, painted ring / handle) | `W:RadioButtonV2/RadioButtonV2.jsx:337` | `` `[data-cy="<name>-option-input-<i>"] + .checkmark` `` — `C:radioButtonV2.js:20`; `H:radioButtonV2.js:65`; `input.nextElementSibling` + `parentElement` walk at `H:radioButtonV2.js:156,169,175` | `` `${dataCy}-option-checkmark-${index}` `` | Open |

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
