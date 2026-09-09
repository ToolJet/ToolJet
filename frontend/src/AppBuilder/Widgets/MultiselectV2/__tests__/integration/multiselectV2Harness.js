/**
 * MultiselectV2's own layer on top of the shared widget harness.
 *
 * Two things live here rather than in each facet spec:
 *
 *   1. The registered definition's defaults, transcribed from
 *      `WidgetManager/widgets/multiselectV2.js:409-497`. A spec that seeds only
 *      the keys it cares about is testing a widget nobody ships: every property
 *      it left out arrives as `undefined`, and the runtime's `??`/truthiness
 *      branches then take the path a real app never takes. So every spec starts
 *      from the shipped definition and overrides the one key under test.
 *
 *   2. `offsetHeight: 300`. Load-bearing, and the single least obvious fact
 *      about testing this widget: the option menu is virtualized
 *      (`DropdownV2/CustomMenuList.jsx:29-34` -> `useVirtualizer`), and
 *      virtual-core derives its viewport from the scroll element's
 *      `offsetHeight` (`@tanstack/virtual-core:4-7`), then renders NOTHING at
 *      all while that size is 0 (`:455` — `outerSize > 0`). jsdom reports 0 for
 *      every element, so without this stub the menu opens with zero option rows
 *      and every selection assertion in this directory quietly has nothing to
 *      click. The shared harness already owns the stub; this just turns it on.
 */
import { createWidgetHarness, binding, option } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

/** The three string-valued options the registered definition ships. */
export const DEFAULT_OPTIONS = [option('option1', '1'), option('option2', '2'), option('option3', '3')];

/**
 * Options in the shape the *resolver* hands the widget, for `schema` — advanced
 * mode's source is a `{{ }}` expression, so its `visible`/`disable`/`default`
 * are plain booleans, not the `{ value }` wrappers the inspector persists for
 * the static `options` list.
 */
export function schemaOption(
  label,
  value,
  { visible = true, disable = false, isDefault = false, caption = null } = {}
) {
  return { label, value, caption, visible, disable, default: isDefault };
}

export const DEFAULT_PROPERTIES = {
  label: binding('Select'),
  placeholder: binding('Select the options'),
  advanced: binding('{{false}}'),
  values: binding("{{['1','2']}}"),
  options: { value: DEFAULT_OPTIONS },
  showAllOption: binding('{{false}}'),
  maxLimit: binding(''),
  optionsLoadingState: binding('{{false}}'),
  sort: binding('none'),
  showAllSelectedLabel: binding('{{true}}'),
  showClearBtn: binding('{{true}}'),
  showSearchInput: binding('{{true}}'),
  serverSideSearch: binding('{{false}}'),
  visibility: binding('{{true}}'),
  collapseWhenHidden: binding('{{false}}'),
  disabledState: binding('{{false}}'),
  loadingState: binding('{{false}}'),
  tooltip: binding(''),
  tooltipFormat: binding('plainText'),
  schema: binding(
    "{{[{label: 'option1', value: 1, caption: null, disable: false, visible: true, default: true}," +
      "{label: 'option2', value: 2, caption: null, disable: false, visible: true}," +
      "{label: 'option3', value: 3, caption: null, disable: false, visible: true}]}}"
  ),
};

export const DEFAULT_STYLES = {
  labelColor: binding('var(--cc-primary-text)'),
  labelFontSize: binding('{{12}}'),
  labelWidth: binding('33'),
  auto: binding('{{true}}'),
  alignment: binding('side'),
  direction: binding('left'),
  widthType: binding('ofComponent'),
  padding: binding('default'),
  fieldBorderRadius: binding('6'),
  boxShadow: binding('0px 0px 0px 0px #00000040'),
  fieldBackgroundColor: binding('var(--cc-surface1-surface)'),
  fieldBorderColor: binding('var(--cc-default-border)'),
  accentColor: binding('var(--cc-primary-brand)'),
  selectedTextColor: binding('var(--cc-primary-text)'),
  errTextColor: binding('var(--cc-error-systemStatus)'),
  icon: binding('IconHome2'),
  iconVisibility: binding('{{false}}'),
  iconColor: binding('var(--cc-default-icon)'),
};

export const DEFAULT_VALIDATION = { mandatory: binding(false), customRule: binding(null) };

export function createMultiselectHarness(overrides = {}) {
  return createWidgetHarness({
    componentType: 'MultiselectV2',
    handle: 'multiselect1',
    id: 'ms1',
    defaultProperties: DEFAULT_PROPERTIES,
    defaultStyles: DEFAULT_STYLES,
    defaultValidation: DEFAULT_VALIDATION,
    offsetHeight: 300,
    ...overrides,
  });
}
