/**
 * Cascader RTL integration spec. Scenario IDs and guarantees live in
 * `ee/test/app-builder/widgets/Cascader/TESTING.md`. Characterization of the
 * current runtime (D-01, D-03, D-04, D-07), not a wish-list.
 */
import { fireEvent, screen, waitFor } from '@testing-library/react';
import {
  binding,
  createWidgetHarness,
  drain,
  setVariableOn,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'casc1';
const HANDLE = 'cascader1';
const MOUNT_MS = 15000;

function node(label, value, { children, visible = true, disable = false, isDefault } = {}) {
  return {
    label,
    value,
    visible: { value: `{{${visible}}}` },
    disable: { value: `{{${disable}}}` },
    ...(isDefault !== undefined ? { default: { value: `{{${isDefault}}}` } } : {}),
    ...(children ? { children } : {}),
  };
}

function dyn(label, value, extra = {}) {
  const item = { label, value };
  if (extra.visible !== undefined) item.visible = extra.visible;
  if (extra.disable !== undefined) item.disable = extra.disable;
  if (extra.isDefault !== undefined) item.default = extra.isDefault;
  if (extra.children) item.children = extra.children;
  return item;
}

const TREE = [
  node('Asia', 'asia', {
    children: [
      node('China', 'china', { children: [node('Beijing', 'beijing'), node('Shanghai', 'shanghai')] }),
      node('Japan', 'japan'),
    ],
  }),
  node('Africa', 'africa'),
];

const widget = createWidgetHarness({
  componentType: 'Cascader',
  handle: HANDLE,
  id: ID,
  offsetHeight: 40,
  defaultProperties: {
    label: binding('Select'),
    placeholder: binding('Select an option'),
    value: binding(''),
    pathSeparator: binding('/'),
    advanced: binding('{{false}}'),
    options: { value: TREE },
    optionsLoadingState: binding('{{false}}'),
    showClearBtn: binding('{{true}}'),
    loadingState: binding('{{false}}'),
    visibility: binding('{{true}}'),
    disabledState: binding('{{false}}'),
  },
  defaultStyles: {
    labelColor: { value: 'var(--cc-primary-text)' },
    labelFontSize: binding('{{12}}'),
    alignment: { value: 'side' },
    direction: { value: 'left' },
    auto: binding('{{true}}'),
    labelWidth: { value: '33' },
    widthType: { value: 'ofComponent' },
    fieldBackgroundColor: { value: 'var(--cc-surface1-surface)' },
    fieldBorderColor: { value: 'var(--cc-default-border)' },
    accentColor: { value: 'var(--cc-primary-brand)' },
    selectedTextColor: { value: 'var(--cc-primary-text)' },
    placeholderTextColor: { value: 'var(--cc-placeholder-text)' },
    errTextColor: { value: 'var(--cc-error-systemStatus)' },
    icon: { value: 'IconHome2' },
    iconVisibility: { value: false },
    iconColor: { value: 'var(--cc-default-icon)' },
    fieldBorderRadius: { value: '6' },
    boxShadow: { value: '0px 0px 0px 0px #00000040' },
    menuWidthMode: { value: 'matchField' },
    menuCustomWidth: { value: '256' },
    padding: { value: 'default' },
  },
  defaultValidation: {
    mandatory: binding('{{false}}'),
    customRule: { value: null },
  },
});

async function mounted() {
  return screen.findByRole('combobox', { timeout: MOUNT_MS });
}

function display() {
  return document.querySelector('.cascader-display');
}

function root() {
  return document.querySelector('.cascader-widget');
}

function optionRow(value) {
  return document.querySelector(`[data-cy="cascader-option-${String(value)}"]`);
}

function selection() {
  const exposed = widget.exposed();
  return {
    value: exposed.value,
    selectedOption: exposed.selectedOption,
    pathArray: exposed.pathArray,
    pathLabels: exposed.pathLabels,
    pathString: exposed.pathString,
  };
}

async function writeProp(property, value, paramType = 'properties') {
  await widget.session.store.act(() => {
    widget.setComponentProperty(ID, property, value, paramType);
  });
}

async function openMenu(control) {
  fireEvent.click(control);
  await waitFor(() => expect(control).toHaveAttribute('aria-expanded', 'true'));
}

async function closeWithEscape(control) {
  fireEvent.keyDown(control, { key: 'Escape' });
  await waitFor(() => expect(control).toHaveAttribute('aria-expanded', 'false'));
}

function countOn(eventId, key) {
  return [
    {
      id: `evt-${eventId}`,
      index: 0,
      sourceId: ID,
      name: `evt-${eventId}`,
      target: 'component',
      event: {
        eventId,
        actionId: 'set-custom-variable',
        key,
        value: `{{Number(variables.${key} || 0) + 1}}`,
      },
    },
  ];
}

function varCount(key) {
  return Number(widget.variables()?.[key] || 0);
}

describe('Cascader widget', () => {
  beforeEach(() => widget.setup());
  afterEach(() => widget.teardown());

  test('[Cascader-INIT-001] The label property is shown and exposed as label', async () => {
    // Break this catches: dropping Label render or the label expose/effect leaves the field unlabeled.
    widget.render({ properties: { label: binding('Region') } });
    const control = await mounted();
    const label = await screen.findByText('Region');
    expect(label).toBeInTheDocument();
    expect(widget.exposed().label).toBe('Region');

    await writeProp('label', 'Place');
    await waitFor(() => expect(screen.getByText('Place')).toBeInTheDocument());
    await waitFor(() => expect(widget.exposed().label).toBe('Place'));
    expect(control).toBeInTheDocument();
  });

  test('[Cascader-INIT-002] An empty selection shows the placeholder', async () => {
    // Break this catches: showing a path (or blank) when no leaf is selected hides the placeholder.
    widget.render({ properties: { placeholder: binding('Pick a city') } });
    await mounted();
    expect(display()).toHaveTextContent('Pick a city');
    expect(widget.exposed().value).toBeNull();
  });

  test('[Cascader-INIT-003] Static Default value selects a matching leaf and ignores schema default', async () => {
    // Break this catches: using schema `default` while Dynamic options is off, or failing to match Default value.
    widget.render({
      properties: {
        value: binding('beijing'),
        options: {
          value: [
            node('Asia', 'asia', {
              children: [
                node('China', 'china', { children: [node('Beijing', 'beijing'), node('Shanghai', 'shanghai')] }),
                node('Japan', 'japan', { isDefault: true }),
              ],
            }),
          ],
        },
      },
    });
    await mounted();
    await waitFor(() => expect(widget.exposed().value).toBe('beijing'));
    expect(selection()).toEqual({
      value: 'beijing',
      selectedOption: { label: 'Beijing', value: 'beijing' },
      pathArray: ['asia', 'china', 'beijing'],
      pathLabels: ['Asia', 'China', 'Beijing'],
      pathString: 'Asia/China/Beijing',
    });
    expect(display()).toHaveTextContent('Asia/China/Beijing');
  });

  test('[Cascader-INIT-004] A Default value that is a parent node leaves the selection empty', async () => {
    // Break this catches: selecting a parent from Default value.
    widget.render({ properties: { value: binding('asia'), placeholder: binding('Pick a city') } });
    await mounted();
    await waitFor(() => expect(widget.exposed().value).toBeNull());
    expect(display()).toHaveTextContent('Pick a city');
  });

  test('[Cascader-SEL-001] A selected leaf exposes value, selectedOption, pathArray, and pathLabels', async () => {
    // Break this catches: exposing only the leaf value and dropping path/selectedOption.
    widget.render({ properties: { value: binding('beijing') } });
    await mounted();
    await waitFor(() => expect(widget.exposed().value).toBe('beijing'));
    expect(selection()).toEqual({
      value: 'beijing',
      selectedOption: { label: 'Beijing', value: 'beijing' },
      pathArray: ['asia', 'china', 'beijing'],
      pathLabels: ['Asia', 'China', 'Beijing'],
      pathString: 'Asia/China/Beijing',
    });
  });

  test('[Cascader-SEL-002] Path separator joins pathLabels in the field and in pathString', async () => {
    // Break this catches: hardcoding `/` or rewriting `value` when the separator changes.
    widget.render({ properties: { value: binding('beijing'), pathSeparator: binding(' > ') } });
    await mounted();
    await waitFor(() => expect(widget.exposed().pathString).toBe('Asia > China > Beijing'));
    expect(display()).toHaveTextContent('Asia > China > Beijing');
    expect(widget.exposed().value).toBe('beijing');

    await writeProp('pathSeparator', ' | ');
    await waitFor(() => expect(widget.exposed().pathString).toBe('Asia | China | Beijing'));
    expect(display()).toHaveTextContent('Asia | China | Beijing');
    expect(widget.exposed().value).toBe('beijing');
  });

  test('[Cascader-SEL-003] Show clear selection button is the only UI clear affordance', async () => {
    // Break this catches: clear control appearing when Show clear is off, or staying after a click.
    widget.render({ properties: { value: binding('africa'), showClearBtn: binding('{{false}}') } });
    await mounted();
    await waitFor(() => expect(widget.exposed().value).toBe('africa'));
    expect(document.querySelector('[data-cy="cascader-clear"]')).toBeNull();
    await writeProp('showClearBtn', true);
    await waitFor(() => expect(document.querySelector('[data-cy="cascader-clear"]')).not.toBeNull());
    fireEvent.click(document.querySelector('[data-cy="cascader-clear"]'));
    await waitFor(() => expect(widget.exposed().value).toBeNull());
  });

  test('[Cascader-SEL-004] Only leaves are selectable; a parent click drills down', async () => {
    // Break this catches: selecting a parent on click, or failing to close after a leaf click.
    widget.render();
    const control = await mounted();
    await openMenu(control);
    fireEvent.click(optionRow('asia'));
    await waitFor(() => expect(optionRow('china')).not.toBeNull());
    expect(widget.exposed().value).toBeNull();
    expect(control).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(optionRow('japan'));
    await waitFor(() => expect(widget.exposed().value).toBe('japan'));
    await waitFor(() => expect(control).toHaveAttribute('aria-expanded', 'false'));
  });

  test('[Cascader-SEL-005] Object, number, and boolean leaf values round-trip through setValue and the path maps', async () => {
    // Break this catches: stringifying object/0/false keys so setValue cannot reselect them.
    const objectLeaf = { id: 1 };
    widget.render({
      properties: {
        options: {
          value: [node('Obj', objectLeaf), node('Zero', 0), node('No', false)],
        },
      },
    });
    await mounted();
    await waitFor(() => expect(widget.exposed().setValue).toBeInstanceOf(Function));

    await widget.act('setValue', objectLeaf);
    await waitFor(() => expect(widget.exposed().value).toEqual({ id: 1 }));
    expect(widget.exposed().pathArray).toEqual([{ id: 1 }]);

    await widget.act('setValue', 0);
    await waitFor(() => expect(widget.exposed().value).toBe(0));
    expect(widget.exposed().pathArray).toEqual([0]);

    await widget.act('setValue', false);
    await waitFor(() => expect(widget.exposed().value).toBe(false));
    expect(widget.exposed().pathArray).toEqual([false]);
  });

  test('[Cascader-OPT-001] Options loading is ignored unless Dynamic options is on', async () => {
    // Break this catches: showing the options loader / blanking the path while Dynamic options is off.
    widget.render({
      properties: {
        value: binding('africa'),
        advanced: binding('{{false}}'),
        optionsLoadingState: binding('{{true}}'),
      },
    });
    const control = await mounted();
    await waitFor(() => expect(display()).toHaveTextContent('Africa'));
    await openMenu(control);
    expect(optionRow('africa')).not.toBeNull();
    expect(document.querySelector('.cascader-popover .tj-widget-loader')).toBeNull();

    await closeWithEscape(control);
    await writeProp('data', [dyn('Africa', 'africa', { isDefault: true })]);
    await writeProp('advanced', true);
    await waitFor(() => expect(widget.exposed().isOptionsLoading).toBe(true));
    expect(display()).toBeEmptyDOMElement();
    await openMenu(control);
    await waitFor(() => expect(document.querySelector('.cascader-popover .tj-widget-loader')).not.toBeNull());
  });

  test('[Cascader-OPT-002] Dynamic options use the first visible default true leaf and ignore Default value', async () => {
    // Break this catches: honoring static Default value while Dynamic options is on, or taking the
    // first `default: true` leaf without skipping hidden ones.
    widget.render({
      properties: {
        advanced: binding('{{true}}'),
        value: binding('shanghai'),
        data: {
          value: [
            dyn('Asia', 'asia', {
              children: [
                // First `default: true` leaf is hidden, so "first visible" must skip it.
                dyn('Beijing', 'beijing', { isDefault: true, visible: false }),
                dyn('Shanghai', 'shanghai', { isDefault: true }),
                dyn('Osaka', 'osaka', { isDefault: true }),
              ],
            }),
          ],
        },
      },
    });
    await mounted();
    await waitFor(() => expect(widget.exposed().value).toBe('shanghai'));
    expect(display()).toHaveTextContent('Asia/Shanghai');

    // A schema with no `default: true` leaf leaves the selection empty, and the static Default value
    // ('shanghai') still does not fill it.
    widget.render({
      properties: {
        advanced: binding('{{true}}'),
        value: binding('shanghai'),
        data: {
          value: [dyn('Europe', 'europe', { children: [dyn('Oslo', 'oslo'), dyn('Paris', 'paris')] })],
        },
      },
    });
    await mounted();
    await waitFor(() => expect(widget.exposed().value).toBeNull());
  });

  test('[Cascader-OPT-003] Static inspector options tree is the selectable hierarchy when Dynamic options is off', async () => {
    // Break this catches: reading `data` while Dynamic options is off.
    widget.render({
      properties: {
        advanced: binding('{{false}}'),
        options: { value: [node('North', 'north', { children: [node('Oslo', 'oslo')] })] },
        data: { value: [dyn('Decoy', 'decoy')] },
      },
    });
    const control = await mounted();
    await openMenu(control);
    expect(optionRow('north')).not.toBeNull();
    expect(optionRow('decoy')).toBeNull();
    fireEvent.click(optionRow('north'));
    await waitFor(() => expect(optionRow('oslo')).not.toBeNull());
  });

  test('[Cascader-OPT-004] A tree rewrite that keeps the selected leaf refreshes the path and does not fire onSelect', async () => {
    // Break this catches: firing onSelect on a label refresh, or keeping stale pathLabels.
    widget.render({
      properties: { value: binding('beijing') },
      events: setVariableOn(ID, 'onSelect', { key: 'selected', value: 'YES' }),
    });
    await mounted();
    await waitFor(() => expect(widget.exposed().value).toBe('beijing'));
    await writeProp('options', [
      node('Continent', 'asia', {
        children: [
          node('Country', 'china', { children: [node('Peking', 'beijing'), node('Shanghai', 'shanghai')] }),
          node('Japan', 'japan'),
        ],
      }),
      node('Africa', 'africa'),
    ]);
    await waitFor(() => expect(widget.exposed().pathLabels).toEqual(['Continent', 'Country', 'Peking']));
    expect(widget.exposed().value).toBe('beijing');
    expect(widget.exposed().pathString).toBe('Continent/Country/Peking');
    await drain();
    expect(widget.variables()?.selected).toBeUndefined();
  });

  test('[Cascader-OPT-005] An empty or non-array option source shows No options', async () => {
    // Break this catches: crashing or selecting from an empty / invalid source.
    widget.render({ properties: { options: { value: [] } } });
    const control = await mounted();
    await openMenu(control);
    expect(document.querySelector('[data-cy="cascader-no-options"]')).toHaveTextContent('No options');
    expect(widget.exposed().value).toBeNull();

    await closeWithEscape(control);
    await writeProp('data', { not: 'an-array' });
    await writeProp('advanced', true);
    await openMenu(control);
    expect(document.querySelector('[data-cy="cascader-no-options"]')).toHaveTextContent('No options');
  });

  test('[Cascader-OPT-006] Hiding a parent hides its branch and clears a selected descendant', async () => {
    // Break this catches: leaving hidden-branch children selectable, or firing onSelect when the branch disappears.
    widget.render({
      properties: { value: binding('beijing') },
      events: setVariableOn(ID, 'onSelect', { key: 'selected', value: 'YES' }),
    });
    const control = await mounted();
    await waitFor(() => expect(widget.exposed().value).toBe('beijing'));
    await writeProp('options', [
      node('Asia', 'asia', {
        visible: false,
        children: [
          node('China', 'china', { children: [node('Beijing', 'beijing'), node('Shanghai', 'shanghai')] }),
          node('Japan', 'japan'),
        ],
      }),
      node('Africa', 'africa'),
    ]);
    await waitFor(() => expect(widget.exposed().value).toBeNull());
    await drain();
    expect(widget.variables()?.selected).toBeUndefined();
    await openMenu(control);
    expect(optionRow('asia')).toBeNull();
    expect(optionRow('africa')).not.toBeNull();
  });

  test('[Cascader-OPT-007] Menu highlight resets when the current level nodes or the selection change', async () => {
    // Break this catches: leaving a stale highlightedIndex after the level's nodes change, or after
    // the selection changes, by dropping either dependency of the highlight-reset effect.
    widget.render();
    const control = await mounted();
    await openMenu(control);
    fireEvent.keyDown(control, { key: 'ArrowDown' });
    await writeProp('options', [node('Europe', 'europe'), node('Asia', 'asia'), node('Africa', 'africa')]);
    await waitFor(() => expect(optionRow('europe')).not.toBeNull());
    fireEvent.keyDown(control, { key: 'Enter' });
    await waitFor(() => expect(widget.exposed().value).toBe('europe'));

    // Selection change branch: highlight lands on the selected row, so ArrowDown wraps from the
    // last row to the first. A highlight left at row 0 would select 'asia' instead.
    await closeWithEscape(control);
    await openMenu(control);
    await widget.act('setValue', 'africa');
    await waitFor(() => expect(widget.exposed().value).toBe('africa'));
    fireEvent.keyDown(control, { key: 'ArrowDown' });
    fireEvent.keyDown(control, { key: 'Enter' });
    await waitFor(() => expect(widget.exposed().value).toBe('europe'));
  });

  test('[Cascader-OPT-008] Removing or replacing the selected leaf clears selection without onSelect', async () => {
    // Break this catches: keeping a removed leaf selected, or firing onSelect on the clear.
    widget.render({
      properties: { value: binding('beijing') },
      events: setVariableOn(ID, 'onSelect', { key: 'selected', value: 'YES' }),
    });
    await mounted();
    await waitFor(() => expect(widget.exposed().value).toBe('beijing'));
    await writeProp('options', [node('Africa', 'africa')]);
    await waitFor(() => expect(widget.exposed().value).toBeNull());
    expect(widget.exposed().pathArray).toEqual([]);
    await drain();
    expect(widget.variables()?.selected).toBeUndefined();
  });

  test('[Cascader-OPT-009] A disabled parent cannot be expanded', async () => {
    // Break this catches: drilling into a disabled parent.
    widget.render({
      properties: {
        options: {
          value: [
            node('Asia', 'asia', {
              disable: true,
              children: [node('Japan', 'japan')],
            }),
            node('Africa', 'africa'),
          ],
        },
      },
    });
    const control = await mounted();
    await openMenu(control);
    fireEvent.click(optionRow('asia'));
    expect(optionRow('japan')).toBeNull();
    fireEvent.keyDown(control, { key: 'Enter' });
    expect(optionRow('japan')).toBeNull();
  });

  test('[Cascader-OPT-010] A disabled leaf cannot be selected', async () => {
    // Break this catches: activateRow ignoring the disabled guard.
    widget.render({
      properties: {
        value: binding('africa'),
        options: { value: [node('Japan', 'japan', { disable: true }), node('Africa', 'africa')] },
      },
    });
    const control = await mounted();
    await waitFor(() => expect(widget.exposed().value).toBe('africa'));
    await openMenu(control);
    fireEvent.click(optionRow('japan'));
    expect(widget.exposed().value).toBe('africa');
  });

  test('[Cascader-OPT-011] Duplicate option values keep the first node only', async () => {
    // Break this catches: dropping the first-wins guard in buildPathMaps, which would map the
    // duplicate onto the later node and make that branch's child selectable (D-07).
    widget.render({
      properties: {
        options: {
          value: [
            node('First', 'dup', { children: [node('Leaf A', 'a')] }),
            node('Second', 'dup', { children: [node('Leaf B', 'b')] }),
          ],
        },
      },
    });
    await mounted();
    await widget.act('setValue', 'a');
    await waitFor(() => expect(widget.exposed().value).toBe('a'));
    expect(widget.exposed().pathArray).toEqual(['dup', 'a']);
    expect(widget.exposed().selectedOption).toEqual({ label: 'Leaf A', value: 'a' });

    // The skipped duplicate takes its whole branch with it: 'b' never enters the leaf set, so
    // setValue('b') clears instead of selecting ['dup', 'b'].
    await widget.act('setValue', 'b');
    await waitFor(() => expect(widget.exposed().value).toBeNull());

    await widget.act('setValue', 'a');
    await waitFor(() => expect(widget.exposed().value).toBe('a'));
    await widget.act('setValue', 'dup');
    await waitFor(() => expect(widget.exposed().value).toBeNull());
  });

  test('[Cascader-EVT-001] UI select and UI clear fire onSelect', async () => {
    // Break this catches: UI select/clear skipping onSelect.
    widget.render({
      properties: { showClearBtn: binding('{{true}}') },
      events: countOn('onSelect', 'selects'),
    });
    const control = await mounted();
    await openMenu(control);
    fireEvent.click(optionRow('africa'));
    await waitFor(() => expect(widget.exposed().value).toBe('africa'));
    await drain();
    expect(varCount('selects')).toBe(1);
    fireEvent.click(document.querySelector('[data-cy="cascader-clear"]'));
    await waitFor(() => expect(widget.exposed().value).toBeNull());
    await drain();
    expect(varCount('selects')).toBe(2);
  });

  test('[Cascader-EVT-002] Opening the control fires onFocus once per interaction', async () => {
    // Break this catches: onFocus on every key while open, never firing, or the interaction guard
    // (isInteractingRef) never resetting so a second open is silent.
    widget.render({ events: countOn('onFocus', 'focuses') });
    const control = await mounted();
    await openMenu(control);
    await drain();
    expect(varCount('focuses')).toBe(1);
    fireEvent.keyDown(control, { key: 'ArrowDown' });
    await drain();
    expect(varCount('focuses')).toBe(1);

    // A second interaction is a second onFocus - "once per interaction", not once ever.
    await closeWithEscape(control);
    await openMenu(control);
    await drain();
    expect(varCount('focuses')).toBe(2);
  });

  test('[Cascader-EVT-003] Dismissing without selecting fires onBlur', async () => {
    // Break this catches: either dismiss path skipping onBlur, or a dismiss clearing value.
    // Two independent paths reach closeInteraction - the Escape branch of handleKeyDown and the
    // Popover onOpenChange(false) that outside-dismiss goes through - so both are driven and
    // counted; dropping either one leaves the other's count short.
    widget.render({
      properties: { value: binding('africa') },
      events: countOn('onBlur', 'blurs'),
    });
    const control = await mounted();
    await waitFor(() => expect(widget.exposed().value).toBe('africa'));

    await openMenu(control);
    await closeWithEscape(control);
    await drain();
    expect(varCount('blurs')).toBe(1);

    await openMenu(control);
    fireEvent.pointerDown(document.body);
    await waitFor(() => expect(control).toHaveAttribute('aria-expanded', 'false'));
    await drain();
    expect(varCount('blurs')).toBe(2);
    expect(widget.exposed().value).toBe('africa');
  });

  test('[Cascader-EVT-004] UI leaf select does not fire onBlur', async () => {
    // Break this catches: closeAfterSelection calling onBlur (git 6e7d87a5f25).
    widget.render({
      events: [...countOn('onSelect', 'selects'), ...countOn('onBlur', 'blurs')],
    });
    const control = await mounted();
    await openMenu(control);
    fireEvent.click(optionRow('africa'));
    await waitFor(() => expect(widget.exposed().value).toBe('africa'));
    await drain();
    expect(varCount('selects')).toBe(1);
    expect(varCount('blurs')).toBe(0);
  });

  test('[Cascader-EVT-005] CSA setValue of a valid leaf fires onSelect', async () => {
    // Break this catches: CSA setValue(valid) skipping onSelect, or invalid setValue firing it (D-03).
    widget.render({ events: countOn('onSelect', 'selects') });
    await mounted();
    await widget.act('setValue', 'africa');
    await waitFor(() => expect(widget.exposed().value).toBe('africa'));
    await drain();
    expect(varCount('selects')).toBe(1);
    await widget.act('setValue', 'asia');
    await waitFor(() => expect(widget.exposed().value).toBeNull());
    await drain();
    expect(varCount('selects')).toBe(1);
    await widget.act('setValue', 'unknown');
    await drain();
    expect(varCount('selects')).toBe(1);
  });

  test('[Cascader-EVT-006] CSA clearValue does not fire onSelect', async () => {
    // Break this catches: CSA clearValue firing onSelect (D-03).
    widget.render({
      properties: { value: binding('africa') },
      events: countOn('onSelect', 'selects'),
    });
    await mounted();
    await waitFor(() => expect(widget.exposed().value).toBe('africa'));
    await widget.act('clearValue');
    await waitFor(() => expect(widget.exposed().value).toBeNull());
    await drain();
    expect(varCount('selects')).toBe(0);
  });

  test('[Cascader-CSA-001] setValue selects a matching leaf or clears', async () => {
    // Break this catches: setValue accepting a parent, or ignoring a parent/unknown/null/undefined
    // input (`else setSelection(null)` -> `else return`) so a stale selection survives.
    widget.render({ properties: { placeholder: binding('Pick a city') } });
    await mounted();
    await widget.act('setValue', 'beijing');
    await waitFor(() => expect(selection().value).toBe('beijing'));
    expect(selection().pathArray).toEqual(['asia', 'china', 'beijing']);

    // Every invalid input starts from a real selection, so "cleared" cannot be
    // satisfied by an already-empty selection.
    for (const invalid of ['asia', 'nope', null, undefined]) {
      await widget.act('setValue', 'japan');
      await waitFor(() => expect(widget.exposed().value).toBe('japan'));
      await widget.act('setValue', invalid);
      await waitFor(() => expect(widget.exposed().value).toBeNull());
      expect(widget.exposed().pathArray).toEqual([]);
    }
    expect(display()).toHaveTextContent('Pick a city');
  });

  test('[Cascader-CSA-002] clearValue empties the selection', async () => {
    // Break this catches: clearValue leaving path fragments or the old value.
    widget.render({
      properties: { value: binding('beijing'), placeholder: binding('Pick a city') },
    });
    await mounted();
    await waitFor(() => expect(widget.exposed().value).toBe('beijing'));
    await widget.act('clearValue');
    await waitFor(() => expect(widget.exposed().value).toBeNull());
    expect(selection()).toEqual({
      value: null,
      selectedOption: null,
      pathArray: [],
      pathLabels: [],
      pathString: '',
    });
    expect(display()).toHaveTextContent('Pick a city');
  });

  test('[Cascader-CSA-003] setLoading toggles the loading spinner and blocks interaction', async () => {
    // Break this catches: setLoading not blocking open or hiding the control loader.
    widget.render();
    const control = await mounted();
    await widget.act('setLoading', true);
    await waitFor(() => expect(widget.exposed().isLoading).toBe(true));
    expect(control.querySelector('.tj-widget-loader')).not.toBeNull();
    expect(control.tabIndex).toBe(-1);
    fireEvent.click(control);
    expect(control).toHaveAttribute('aria-expanded', 'false');
    await widget.act('setLoading', false);
    await waitFor(() => expect(widget.exposed().isLoading).toBe(false));
    expect(control.tabIndex).toBe(0);
    await openMenu(control);
    expect(control).toHaveAttribute('aria-expanded', 'true');
  });

  test('[Cascader-CSA-004] setOptionsLoading toggles options loading', async () => {
    // Break this catches: setOptionsLoading not blanking the path while Dynamic options is on.
    widget.render({
      properties: {
        advanced: binding('{{true}}'),
        data: { value: [dyn('Africa', 'africa', { isDefault: true })] },
      },
    });
    const control = await mounted();
    await waitFor(() => expect(widget.exposed().value).toBe('africa'));
    await widget.act('setOptionsLoading', true);
    await waitFor(() => expect(widget.exposed().isOptionsLoading).toBe(true));
    expect(display()).toBeEmptyDOMElement();
    await openMenu(control);
    await waitFor(() => expect(document.querySelector('.cascader-popover .tj-widget-loader')).not.toBeNull());
  });

  test('[Cascader-CSA-005] setVisibility toggles isVisible and the widget hidden class', async () => {
    // Break this catches: setVisibility not flipping isVisible / the invisible class.
    widget.render();
    await mounted();
    await widget.act('setVisibility', false);
    await waitFor(() => expect(widget.exposed().isVisible).toBe(false));
    expect(root()).toHaveClass('invisible');
    expect(root()).toHaveStyle({ visibility: 'hidden' });
    await widget.act('setVisibility', true);
    await waitFor(() => expect(widget.exposed().isVisible).toBe(true));
    expect(root()).not.toHaveClass('invisible');
  });

  test('[Cascader-CSA-006] setDisable toggles isDisabled and blocks interaction', async () => {
    // Break this catches: setDisable leaving the combobox operable.
    widget.render();
    const control = await mounted();
    await widget.act('setDisable', true);
    await waitFor(() => expect(widget.exposed().isDisabled).toBe(true));
    expect(control).toHaveAttribute('aria-disabled', 'true');
    expect(control.tabIndex).toBe(-1);
    fireEvent.click(control);
    expect(control).toHaveAttribute('aria-expanded', 'false');
    await widget.act('setDisable', false);
    await waitFor(() => expect(widget.exposed().isDisabled).toBe(false));
    expect(control).toHaveAttribute('aria-disabled', 'false');
    expect(control.tabIndex).toBe(0);
  });

  test('[Cascader-VAL-001] Mandatory empty is invalid after the user interacts', async () => {
    // Break this catches: showing the error before interact, or marking empty mandatory as valid.
    widget.render({ validation: { mandatory: binding('{{true}}') } });
    const control = await mounted();
    await waitFor(() => expect(widget.exposed().isValid).toBe(false));
    expect(widget.exposed().isMandatory).toBe(true);
    expect(screen.queryByText('Field cannot be empty')).toBeNull();
    await openMenu(control);
    await closeWithEscape(control);
    await waitFor(() => expect(screen.getByText('Field cannot be empty')).toBeInTheDocument());
  });

  test('[Cascader-VAL-002] A customRule string is the validation error', async () => {
    // Break this catches: customRule losing to mandatory-ok once a leaf is selected.
    widget.render({
      properties: { value: binding('africa') },
      validation: { mandatory: binding('{{true}}'), customRule: { value: 'must be a capital' } },
    });
    const control = await mounted();
    await waitFor(() => expect(widget.exposed().value).toBe('africa'));
    await waitFor(() => expect(widget.exposed().isValid).toBe(false));
    await openMenu(control);
    await closeWithEscape(control);
    await waitFor(() => expect(screen.getByText('must be a capital')).toBeInTheDocument());
  });

  test('[Cascader-VAL-003] Mandatory with a selected leaf is valid', async () => {
    // Break this catches: treating a selected leaf as empty under mandatory.
    widget.render({
      properties: { value: binding('africa') },
      validation: { mandatory: binding('{{true}}') },
    });
    const control = await mounted();
    await waitFor(() => expect(widget.exposed().isValid).toBe(true));
    await openMenu(control);
    await closeWithEscape(control);
    expect(screen.queryByText('Field cannot be empty')).toBeNull();
  });

  test('[Cascader-VAL-004] A selected false leaf counts as filled under mandatory', async () => {
    // Break this catches: `false` failing mandatory for Cascader.
    widget.render({
      properties: { options: { value: [node('No', false)] } },
      validation: { mandatory: binding('{{true}}') },
    });
    await mounted();
    await widget.act('setValue', false);
    await waitFor(() => expect(widget.exposed().value).toBe(false));
    await waitFor(() => expect(widget.exposed().isValid).toBe(true));
  });

  test('[Cascader-VAL-005] A selected 0 leaf counts as filled under mandatory', async () => {
    // Break this catches: `0` failing mandatory for Cascader.
    widget.render({
      properties: { options: { value: [node('Zero', 0)] } },
      validation: { mandatory: binding('{{true}}') },
    });
    await mounted();
    await widget.act('setValue', 0);
    await waitFor(() => expect(widget.exposed().value).toBe(0));
    await waitFor(() => expect(widget.exposed().isValid).toBe(true));
  });

  test('[Cascader-VAL-006] A selected empty-string leaf counts as empty under mandatory', async () => {
    // Break this catches: treating Cascader `''` as FILLED like DropdownV2 (D-04).
    widget.render({
      properties: { options: { value: [node('Blank', '')] } },
      validation: { mandatory: binding('{{true}}') },
    });
    const control = await mounted();
    await widget.act('setValue', '');
    await waitFor(() => expect(widget.exposed().value).toBe(''));
    await waitFor(() => expect(widget.exposed().isValid).toBe(false));
    await openMenu(control);
    await closeWithEscape(control);
    await waitFor(() => expect(screen.getByText('Field cannot be empty')).toBeInTheDocument());
  });

  test('[Cascader-STATE-001] Dynamic options loading blanks the path and shows the options loader', async () => {
    // Break this catches: showing the selected path while options are loading.
    widget.render({
      properties: {
        advanced: binding('{{true}}'),
        optionsLoadingState: binding('{{true}}'),
        data: { value: [dyn('Africa', 'africa', { isDefault: true })] },
      },
    });
    const control = await mounted();
    await waitFor(() => expect(widget.exposed().isOptionsLoading).toBe(true));
    expect(display()).toBeEmptyDOMElement();
    await openMenu(control);
    await waitFor(() => expect(document.querySelector('.cascader-popover .tj-widget-loader')).not.toBeNull());
  });

  test('[Cascader-STATE-002] Loading state blocks open and shows the control spinner', async () => {
    // Break this catches: opening the menu or keeping tabIndex 0 while loading.
    widget.render({ properties: { loadingState: binding('{{true}}') } });
    const control = await mounted();
    await waitFor(() => expect(widget.exposed().isLoading).toBe(true));
    expect(control.querySelector('.tj-widget-loader')).not.toBeNull();
    expect(control.tabIndex).toBe(-1);
    fireEvent.click(control);
    fireEvent.keyDown(control, { key: 'Enter' });
    expect(control).toHaveAttribute('aria-expanded', 'false');
  });

  test('[Cascader-STATE-003] Hidden widget is not visible and does not show a validation error', async () => {
    // Break this catches: painting a validation error on a hidden Cascader - including one whose
    // error was already revealed by an interaction before it was hidden (dropping the isVisible
    // term of the error's render condition).
    widget.render({
      properties: { visibility: binding('{{false}}') },
      validation: { mandatory: binding('{{true}}') },
    });
    await waitFor(() => expect(widget.exposed().isVisible).toBe(false), { timeout: MOUNT_MS });
    expect(root()).toHaveClass('invisible');
    expect(screen.queryByText('Field cannot be empty')).toBeNull();

    // Reveal the error first, then hide: the message must go, not just stay unrevealed.
    widget.render({ validation: { mandatory: binding('{{true}}') } });
    const control = await mounted();
    await openMenu(control);
    await closeWithEscape(control);
    await waitFor(() => expect(screen.getByText('Field cannot be empty')).toBeInTheDocument());
    await writeProp('visibility', false);
    await waitFor(() => expect(widget.exposed().isVisible).toBe(false));
    expect(screen.queryByText('Field cannot be empty')).toBeNull();
  });

  test('[Cascader-STATE-004] Disabled state blocks open, select, and clear', async () => {
    // Break this catches: allowing open/clear while disabled.
    widget.render({
      properties: { value: binding('africa'), disabledState: binding('{{true}}'), showClearBtn: binding('{{true}}') },
    });
    const control = await mounted();
    await waitFor(() => expect(widget.exposed().isDisabled).toBe(true));
    expect(control).toHaveAttribute('aria-disabled', 'true');
    expect(control.tabIndex).toBe(-1);
    expect(document.querySelector('[data-cy="cascader-clear"]')).toBeNull();
    fireEvent.click(control);
    expect(control).toHaveAttribute('aria-expanded', 'false');
    expect(widget.exposed().value).toBe('africa');
  });

  test('[Cascader-STATE-005] Clear is hidden while loading or disabled even if Show clear is on', async () => {
    // Break this catches: showing clear while interactionBlocked.
    widget.render({
      properties: { value: binding('africa'), showClearBtn: binding('{{true}}'), loadingState: binding('{{true}}') },
    });
    await mounted();
    await waitFor(() => expect(widget.exposed().value).toBe('africa'));
    expect(document.querySelector('[data-cy="cascader-clear"]')).toBeNull();

    widget.render({
      properties: { value: binding('africa'), showClearBtn: binding('{{true}}'), disabledState: binding('{{true}}') },
    });
    await mounted();
    // Without this the assertion below can pass on an unresolved (still empty) selection.
    await waitFor(() => expect(widget.exposed().value).toBe('africa'));
    expect(document.querySelector('[data-cy="cascader-clear"]')).toBeNull();
  });

  test('[Cascader-FORM-001] Form clear empties Cascader selection', async () => {
    // Break this catches: Form clear leaving Cascader selection in place (git 36034d81e17).
    widget.teardown();
    widget.renderInsideForm({
      properties: { value: binding('africa'), options: { value: TREE } },
    });
    await waitFor(() => expect(widget.exposed().value).toBe('africa'), { timeout: MOUNT_MS });
    await waitFor(() => expect(widget.exposed('form1').clearForm).toBeInstanceOf(Function));
    await widget.session.store.act(async () => {
      await widget.exposed('form1').clearForm();
    });
    await waitFor(() => expect(widget.exposed().value).toBeNull());
    expect(widget.exposed().pathArray).toEqual([]);
  }, 20000);

  test('[Cascader-FORM-002] Form submit reveals mandatory error without opening the menu', async () => {
    // Break this catches: Form submit not revealing Cascader validation, or opening the menu.
    widget.teardown();
    widget.renderInsideForm({
      validation: { mandatory: binding('{{true}}') },
      properties: { options: { value: TREE } },
    });
    await waitFor(() => expect(widget.exposed().setValue).toBeInstanceOf(Function), { timeout: MOUNT_MS });
    await waitFor(() => expect(widget.exposed().isMandatory).toBe(true));
    const control = document.querySelector('[role="combobox"]');
    expect(control).not.toBeNull();
    expect(screen.queryByText('Field cannot be empty')).toBeNull();
    await waitFor(() => expect(widget.exposed('form1').submitForm).toBeInstanceOf(Function));
    await widget.session.store.act(async () => {
      await widget.exposed('form1').submitForm();
    });
    await waitFor(() => expect(screen.getByText('Field cannot be empty')).toBeInTheDocument());
    expect(control).toHaveAttribute('aria-expanded', 'false');
  }, 20000);

  test('[Cascader-PREC-001] setValue vs Default value follows current runtime', async () => {
    // Break this catches: re-applying Default value on an unrelated or no-op property tick (dropping
    // useUpdateEffect's mount guard or widening its deps), or a changed Default value not winning (D-01).
    widget.render({ properties: { value: binding('africa'), label: binding('Region') } });
    await mounted();
    await waitFor(() => expect(widget.exposed().value).toBe('africa'));
    await widget.act('setValue', 'japan');
    await waitFor(() => expect(widget.exposed().value).toBe('japan'));

    await writeProp('label', 'Place');
    await waitFor(() => expect(widget.exposed().label).toBe('Place'));
    expect(widget.exposed().value).toBe('japan');

    // A real no-op: Default value is rewritten to the value it already resolved to, so a snap-back
    // shows up as 'africa' replacing the CSA's 'japan'.
    await writeProp('value', 'africa');
    await drain();
    expect(widget.exposed().value).toBe('japan');

    await writeProp('value', 'beijing');
    await waitFor(() => expect(widget.exposed().value).toBe('beijing'));
  });

  test('[Cascader-PREC-002] setLoading vs loadingState follows current runtime', async () => {
    // Break this catches: unrelated or no-op property ticks clearing CSA loading, or a changed
    // loadingState not overwriting it (D-01). The CSA always moves state away from the property's
    // current value, so neither half can pass on a coincidence.
    widget.render({ properties: { label: binding('Region') } });
    await mounted();
    await widget.act('setLoading', true);
    await waitFor(() => expect(widget.exposed().isLoading).toBe(true));

    await writeProp('label', 'Place');
    expect(widget.exposed().isLoading).toBe(true);
    // No-op: loadingState rewritten to the false it already held; CSA true must survive.
    await writeProp('loadingState', false);
    await drain();
    expect(widget.exposed().isLoading).toBe(true);

    // Changed property overwrites the CSA: CSA says false, the property moves false -> true.
    await widget.act('setLoading', false);
    await waitFor(() => expect(widget.exposed().isLoading).toBe(false));
    await writeProp('loadingState', true);
    await waitFor(() => expect(widget.exposed().isLoading).toBe(true));
  });

  test('[Cascader-PREC-003] setOptionsLoading vs optionsLoadingState follows current runtime', async () => {
    // Break this catches: unrelated or no-op property ticks clearing CSA options loading, or a
    // changed optionsLoadingState not overwriting it (D-01).
    widget.render({
      properties: {
        advanced: binding('{{true}}'),
        label: binding('Region'),
        data: { value: [dyn('Africa', 'africa')] },
      },
    });
    await mounted();
    await widget.act('setOptionsLoading', true);
    await waitFor(() => expect(widget.exposed().isOptionsLoading).toBe(true));

    await writeProp('label', 'Place');
    expect(widget.exposed().isOptionsLoading).toBe(true);
    // No-op: optionsLoadingState rewritten to the false it already held.
    await writeProp('optionsLoadingState', false);
    await drain();
    expect(widget.exposed().isOptionsLoading).toBe(true);

    await widget.act('setOptionsLoading', false);
    await waitFor(() => expect(widget.exposed().isOptionsLoading).toBe(false));
    await writeProp('optionsLoadingState', true);
    await waitFor(() => expect(widget.exposed().isOptionsLoading).toBe(true));
  });

  test('[Cascader-PREC-004] setVisibility vs visibility follows current runtime', async () => {
    // Break this catches: unrelated or no-op property ticks restoring visibility after
    // setVisibility(false), or a changed visibility not overwriting the CSA (D-01).
    widget.render({ properties: { label: binding('Region') } });
    await mounted();
    await widget.act('setVisibility', false);
    await waitFor(() => expect(widget.exposed().isVisible).toBe(false));

    await writeProp('label', 'Place');
    expect(widget.exposed().isVisible).toBe(false);
    // No-op: visibility rewritten to the true it already held; CSA false must survive.
    await writeProp('visibility', true);
    await drain();
    expect(widget.exposed().isVisible).toBe(false);

    await widget.act('setVisibility', true);
    await waitFor(() => expect(widget.exposed().isVisible).toBe(true));
    await writeProp('visibility', false);
    await waitFor(() => expect(widget.exposed().isVisible).toBe(false));
  });

  test('[Cascader-PREC-005] setDisable vs disabledState follows current runtime', async () => {
    // Break this catches: unrelated or no-op property ticks clearing CSA disable, or a changed
    // disabledState not overwriting it (D-01).
    widget.render({ properties: { label: binding('Region') } });
    await mounted();
    await widget.act('setDisable', true);
    await waitFor(() => expect(widget.exposed().isDisabled).toBe(true));

    await writeProp('label', 'Place');
    expect(widget.exposed().isDisabled).toBe(true);
    // No-op: disabledState rewritten to the false it already held; CSA true must survive.
    await writeProp('disabledState', false);
    await drain();
    expect(widget.exposed().isDisabled).toBe(true);

    await widget.act('setDisable', false);
    await waitFor(() => expect(widget.exposed().isDisabled).toBe(false));
    await writeProp('disabledState', true);
    await waitFor(() => expect(widget.exposed().isDisabled).toBe(true));
  });

  test('[Cascader-STYLE-001] Label color is applied as an inline color on the label', async () => {
    // Break this catches: dropping labelColor from the Label `color` prop.
    widget.render({ styles: { labelColor: { value: '#123456' } }, properties: { label: binding('Region') } });
    await mounted();
    const label = document.querySelector('[data-cy="cascader1-label"] p');
    expect(label).toHaveStyle({ color: '#123456' });
  });

  test('[Cascader-STYLE-002] Label font size is applied on the label', async () => {
    // Break this catches: ignoring labelFontSize (undocumented but registered).
    widget.render({ styles: { labelFontSize: binding('{{18}}') }, properties: { label: binding('Region') } });
    await mounted();
    const label = document.querySelector('[data-cy="cascader1-label"]');
    expect(label).toHaveStyle({ fontSize: '18px' });
  });

  test('[Cascader-STYLE-003] Side vs top alignment changes the label/field layout class', async () => {
    // Break this catches: always using column layout, or never.
    widget.render({ styles: { alignment: { value: 'top' } }, properties: { label: binding('Region') } });
    await mounted();
    expect(root()).toHaveClass('flex-column');
    widget.render({ styles: { alignment: { value: 'side' } }, properties: { label: binding('Region') } });
    await mounted();
    expect(root()).not.toHaveClass('flex-column');
    expect(root()).toHaveClass('align-items-center');
  });

  test('[Cascader-STYLE-004] Direction right reverses side layout and right-aligns top layout', async () => {
    // Break this catches: ignoring direction (undocumented but registered).
    widget.render({
      styles: { alignment: { value: 'side' }, direction: { value: 'right' } },
      properties: { label: binding('Region') },
    });
    await mounted();
    expect(root()).toHaveClass('flex-row-reverse');
    widget.render({
      styles: { alignment: { value: 'top' }, direction: { value: 'right' } },
      properties: { label: binding('Region') },
    });
    await mounted();
    expect(root()).toHaveClass('text-right');
  });

  test('[Cascader-STYLE-005] Auto, labelWidth, and widthType jointly size the label/field split', async () => {
    // Break this catches: applying the manual slider while Auto is on, or ignoring widthType.
    widget.render({
      styles: {
        alignment: { value: 'side' },
        auto: binding('{{true}}'),
        labelWidth: { value: '40' },
        widthType: { value: 'ofComponent' },
      },
      properties: { label: binding('Region') },
    });
    await mounted();
    expect(document.querySelector('[data-cy="cascader1-label"]')).toHaveStyle({ width: 'auto' });
    expect(document.querySelector('[data-cy="cascader1-actionable-section"]')).toHaveStyle({ width: '100%' });

    widget.render({
      styles: {
        alignment: { value: 'side' },
        auto: binding('{{false}}'),
        labelWidth: { value: '40' },
        widthType: { value: 'ofComponent' },
      },
      properties: { label: binding('Region') },
    });
    await mounted();
    expect(document.querySelector('[data-cy="cascader1-label"]')).toHaveStyle({ width: '40%' });
    expect(document.querySelector('[data-cy="cascader1-actionable-section"]')).toHaveStyle({
      width: '60%',
      minWidth: '20%',
    });

    widget.render({
      styles: {
        alignment: { value: 'side' },
        auto: binding('{{false}}'),
        labelWidth: { value: '40' },
        widthType: { value: 'ofField' },
      },
      properties: { label: binding('Region') },
    });
    await mounted();
    expect(document.querySelector('[data-cy="cascader1-label"]')).toHaveStyle({ width: '28%' });
    expect(document.querySelector('[data-cy="cascader1-actionable-section"]')).toHaveStyle({ width: '100%' });
  });

  test('[Cascader-STYLE-006] Field background is the control inline backgroundColor', async () => {
    // Break this catches: not passing fieldBackgroundColor through getInputBackgroundColor.
    widget.render({ styles: { fieldBackgroundColor: { value: '#abcdef' } } });
    const control = await mounted();
    expect(control).toHaveStyle({ backgroundColor: '#abcdef' });
  });

  test('[Cascader-STYLE-007] Field border color is used when the control is idle and valid', async () => {
    // Break this catches: idle valid border ignoring fieldBorderColor.
    widget.render({ styles: { fieldBorderColor: { value: '#112233' } } });
    const control = await mounted();
    expect(control.style.border).toContain('#112233');
  });

  test('[Cascader-STYLE-008] Accent color is the focused border and the selected-leaf check', async () => {
    // Break this catches: focused border or selected check ignoring accentColor.
    widget.render({
      properties: { value: binding('africa') },
      styles: { accentColor: { value: '#ff00aa' } },
    });
    const control = await mounted();
    await openMenu(control);
    expect(control.style.border).toContain('#ff00aa');
    const check = optionRow('africa')?.querySelector('svg');
    expect(check).not.toBeNull();
    expect(check.getAttribute('color') || check.style.color || check.getAttribute('stroke')).toMatch(
      /#ff00aa|rgb\(255,\s*0,\s*170\)/
    );
  });

  test('[Cascader-STYLE-009] Selected text color is the path text color', async () => {
    // Break this catches: selected path using placeholder color.
    widget.render({
      properties: { value: binding('africa') },
      styles: { selectedTextColor: { value: '#00aa11' } },
    });
    await mounted();
    await waitFor(() => expect(display()).toHaveTextContent('Africa'));
    expect(display()).toHaveStyle({ color: '#00aa11' });
  });

  test('[Cascader-STYLE-010] Placeholder text color applies only when the placeholder is shown', async () => {
    // Break this catches: placeholder color leaking onto a selected path.
    widget.render({
      properties: { placeholder: binding('Pick a city') },
      styles: { placeholderTextColor: { value: '#998877' }, selectedTextColor: { value: '#00aa11' } },
    });
    await mounted();
    expect(display()).toHaveStyle({ color: '#998877' });
    await widget.act('setValue', 'africa');
    await waitFor(() => expect(display()).toHaveTextContent('Africa'));
    expect(display()).toHaveStyle({ color: '#00aa11' });
  });

  test('[Cascader-STYLE-011] Error text uses errTextColor', async () => {
    // Break this catches: error message not using errTextColor.
    widget.render({
      validation: { mandatory: binding('{{true}}') },
      styles: { errTextColor: { value: '#cc0000' } },
    });
    const control = await mounted();
    await openMenu(control);
    await closeWithEscape(control);
    const error = await screen.findByText('Field cannot be empty');
    expect(error).toHaveStyle({ color: '#cc0000' });
  });

  test('[Cascader-STYLE-012] Icon renders only when iconVisibility is on', async () => {
    // Break this catches: rendering the icon while iconVisibility is off, or skipping iconColor.
    widget.render({ styles: { iconVisibility: { value: false }, icon: { value: 'IconHome2' } } });
    const control = await mounted();
    // Count, not a width proxy: exactly one svg (the chevron) with the icon off, one more with it on.
    const chevronOnly = control.querySelectorAll('svg').length;
    expect(chevronOnly).toBe(1);

    await writeProp('iconVisibility', true, 'styles');
    await writeProp('iconColor', '#334455', 'styles');
    await waitFor(() => expect(control.querySelectorAll('svg').length).toBe(chevronOnly + 1));
    const icon = [...control.querySelectorAll('svg')].find((el) => el.style.width === '16px');
    expect(icon).toBeTruthy();
    expect(icon).toHaveStyle({ color: '#334455' });
  });

  test('[Cascader-STYLE-013] Field border radius is the control borderRadius', async () => {
    // Break this catches: not parsing fieldBorderRadius onto the combobox.
    widget.render({ styles: { fieldBorderRadius: { value: '12' } } });
    const control = await mounted();
    expect(control).toHaveStyle({ borderRadius: '12px' });
  });

  test('[Cascader-STYLE-014] Box shadow is the control boxShadow', async () => {
    // Break this catches: applying generalStyles.boxShadow instead of styles.boxShadow.
    widget.render({ styles: { boxShadow: { value: '1px 2px 3px 0px #123456' } } });
    const control = await mounted();
    expect(control.style.boxShadow).toBe('1px 2px 3px 0px #123456');
  });

  test('[Cascader-STYLE-015] Menu width mode sets the popover inline width', async () => {
    // Break this catches: ignoring menuWidthMode / menuCustomWidth (git 49806605dff).
    widget.render({ styles: { menuWidthMode: { value: 'matchField' } } });
    let control = await mounted();
    await openMenu(control);
    expect(document.querySelector('.cascader-popover').getAttribute('style')).toContain(
      'width: var(--radix-popover-trigger-width)'
    );

    await closeWithEscape(control);
    await writeProp('menuWidthMode', 'matchContent', 'styles');
    await openMenu(control);
    expect(document.querySelector('.cascader-popover').style.width).toBe('auto');

    await closeWithEscape(control);
    await writeProp('menuWidthMode', 'custom', 'styles');
    await writeProp('menuCustomWidth', '320', 'styles');
    await openMenu(control);
    expect(document.querySelector('.cascader-popover').style.width).toBe('320px');
  });

  test('[Cascader-STYLE-016] Padding default vs none changes the control height calculation', async () => {
    // Break this catches: padding none using height instead of height+4.
    // RenderWidget passes height={widgetHeight - 4}; harness widgetHeight is 40 → 36.
    widget.render({ styles: { padding: { value: 'default' } } });
    let control = await mounted();
    expect(control).toHaveStyle({ height: '36px', minHeight: '36px' });

    await writeProp('padding', 'none', 'styles');
    await waitFor(() => expect(control).toHaveStyle({ height: '40px', minHeight: '40px' }));
  });

  test('[Cascader-KB-001] Keyboard opens, drills down, and selects a leaf', async () => {
    // Break this catches: keyboard open/drill/select not updating value or leaving the menu open.
    widget.render();
    const control = await mounted();
    control.focus();
    fireEvent.keyDown(control, { key: 'Enter' });
    await waitFor(() => expect(control).toHaveAttribute('aria-expanded', 'true'));
    fireEvent.keyDown(control, { key: 'ArrowRight' });
    await waitFor(() => expect(optionRow('china')).not.toBeNull());
    fireEvent.keyDown(control, { key: 'ArrowDown' });
    fireEvent.keyDown(control, { key: 'Enter' });
    await waitFor(() => expect(widget.exposed().value).toBe('japan'));
    await waitFor(() => expect(control).toHaveAttribute('aria-expanded', 'false'));
  });

  test('[Cascader-KB-002] Keyboard highlight skips disabled rows', async () => {
    // Break this catches: ArrowDown landing on a disabled row.
    widget.render({
      properties: {
        options: {
          value: [node('Able', 'able'), node('Nope', 'nope', { disable: true }), node('Also', 'also')],
        },
      },
    });
    const control = await mounted();
    await openMenu(control);
    fireEvent.keyDown(control, { key: 'ArrowDown' });
    fireEvent.keyDown(control, { key: 'Enter' });
    await waitFor(() => expect(widget.exposed().value).toBe('also'));
  });

  test('[Cascader-A11Y-001] Combobox reflects expanded, disabled, invalid, and required', async () => {
    // Break this catches: dropping aria-expanded/disabled/invalid/required on the combobox.
    widget.render({
      properties: { disabledState: binding('{{false}}') },
      validation: { mandatory: binding('{{true}}') },
    });
    const control = await mounted();
    expect(control).toHaveAttribute('role', 'combobox');
    expect(control).toHaveAttribute('aria-expanded', 'false');
    expect(control).toHaveAttribute('aria-disabled', 'false');
    expect(control).toHaveAttribute('aria-invalid', 'true');
    expect(control).toHaveAttribute('aria-required', 'true');
    await openMenu(control);
    expect(control).toHaveAttribute('aria-expanded', 'true');
    await writeProp('disabledState', true);
    await waitFor(() => expect(widget.exposed().isDisabled).toBe(true));
    expect(control).toHaveAttribute('aria-disabled', 'true');
  });
});
