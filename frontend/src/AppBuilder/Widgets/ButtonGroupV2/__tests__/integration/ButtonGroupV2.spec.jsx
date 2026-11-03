/**
 * ButtonGroupV2's approved Engineering contract.
 *
 * Contract: frontend/ee/test/app-builder/widgets/ButtonGroupV2/TESTING.md
 * Characterization branch: production_changes is forbidden, including the
 * D-01 decision that preserves the mount-loading disabled state.
 */
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { componentDefinition } from '@/test/app-builder';
import {
  MODULE_ID,
  binding,
  createWidgetHarness,
  option,
  store,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'bg1';
const NAME = 'buttongroup1';

const staticOption = (label, value, options = {}) => ({
  ...option(label, value, options),
  icon: { value: options.icon ?? 'IconBolt' },
  iconVisibility: options.iconVisibility ?? false,
});

const STATIC_OPTIONS = [
  staticOption('Button1', '1', { isDefault: true }),
  staticOption('Button2', '2'),
  staticOption('Button3', '3'),
];
const NO_DEFAULT_OPTIONS = [staticOption('Button1', '1'), staticOption('Button2', '2'), staticOption('Button3', '3')];

const DEFAULT_PROPERTIES = {
  label: binding('Status'),
  advanced: binding('{{false}}'),
  schema: binding(
    "{{[{label:'Mapped A',value:'a',icon:'IconBolt',iconVisibility:false,disable:false,default:true}," +
      "{label:'Mapped B',value:'b',icon:'IconBulb',iconVisibility:false,disable:false,default:false}]}}"
  ),
  options: { value: STATIC_OPTIONS },
  multiSelection: binding('{{false}}'),
  layout: binding('row'),
  visibility: binding('{{true}}'),
  dynamicHeight: binding('{{false}}'),
  collapseWhenHidden: binding('{{false}}'),
  disabledState: binding('{{false}}'),
  loadingState: binding('{{false}}'),
  tooltip: binding(''),
  tooltipFormat: binding('plainText'),
};

const DEFAULT_STYLES = {
  labelColor: binding('#101112'),
  labelFontSize: binding('{{12}}'),
  labelWidth: binding('33'),
  auto: binding('{{true}}'),
  direction: binding('left'),
  alignment: binding('side'),
  backgroundColor: binding('#f0f1f2'),
  borderColor: binding('#303132'),
  textColor: binding('#202122'),
  textSize: binding('{{14}}'),
  fontWeight: binding('normal'),
  hoverBackgroundMode: binding('auto'),
  hoverBackgroundColor: binding('#404142'),
  iconColor: binding('#505152'),
  errTextColor: binding('#d72c0d'),
  selectedBackgroundColor: binding('#4368e3'),
  selectedTextColor: binding('#ffffff'),
  selectedIconColor: binding('#eeeeee'),
  borderRadius: binding('{{6}}'),
  btnAlignment: binding('left'),
  boxShadow: binding('0px 1px 2px 0px #00000040'),
  padding: binding('default'),
};

const DEFAULT_VALIDATION = { mandatory: binding('{{false}}'), customRule: binding(null) };

const widget = createWidgetHarness({
  componentType: 'ButtonGroupV2',
  handle: NAME,
  id: ID,
  defaultProperties: DEFAULT_PROPERTIES,
  defaultStyles: DEFAULT_STYLES,
  defaultValidation: DEFAULT_VALIDATION,
  widgetHeight: 80,
  widgetWidth: 420,
});

const root = (container = document) => container.querySelector('.button-group-widget');
const content = (container = document) => container.querySelector('.button-group-content');
const wrapper = (container = document) => container.querySelector('.button-group-content-wrapper');
const buttons = (container = document) => within(root(container)).queryAllByRole('button');
const button = (name, container = document) => within(root(container)).getByRole('button', { name });
const error = () => screen.queryByText(/Field cannot be empty|Pick Button2/);
const outer = (container = document, name = NAME) => container.querySelector(`[data-cy="draggable-widget-${name}"]`);

async function setProperty(name, value, paramType = 'properties', componentId = ID) {
  await widget.session.store.act(() => widget.setComponentProperty(componentId, name, value, paramType));
}

const clickEvents = (sourceId = ID, componentName = NAME, prefix = '') => [
  {
    id: `${prefix}evt-count`,
    index: 0,
    sourceId,
    name: `${prefix}count click`,
    target: 'component',
    event: {
      eventId: 'onClick',
      actionId: 'set-custom-variable',
      key: `${prefix}clickCount`,
      value: `{{(variables.${prefix}clickCount ?? 0) + 1}}`,
    },
  },
  {
    id: `${prefix}evt-selection`,
    index: 1,
    sourceId,
    name: `${prefix}capture selection`,
    target: 'component',
    event: {
      eventId: 'onClick',
      actionId: 'set-custom-variable',
      key: `${prefix}selectedAtClick`,
      value: `{{components.${componentName}.selected}}`,
    },
  },
];

function secondDefinition({ selectedByDefault = true } = {}) {
  const definition = componentDefinition('bg2', 'buttongroup2', 'ButtonGroupV2', {
    ...DEFAULT_PROPERTIES,
    label: binding('Priority'),
    options: {
      value: [staticOption('Low', 'low', { isDefault: selectedByDefault }), staticOption('High', 'high')],
    },
  });
  definition.component.definition.styles = { ...DEFAULT_STYLES };
  definition.component.definition.validation = { ...DEFAULT_VALIDATION };
  return definition;
}

describe('ButtonGroupV2', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[ButtonGroupV2-DEF-001] shipped static buttons render with the exact default selection', async () => {
    // Break this catches: reading schema in static mode or coercing the shipped string value to number.
    const { container } = widget.render();

    expect(await screen.findByRole('group', { name: 'Status' })).toBeInTheDocument();
    expect(buttons(container).map((item) => item.textContent)).toEqual(['Button1', 'Button2', 'Button3']);
    await waitFor(() => expect(widget.exposed().selected).toEqual(['1']));
  });

  test('[ButtonGroupV2-SEL-001] single selection toggles one button by pointer and keyboard', async () => {
    // Break this catches: appending in single mode or refusing to clear an already-selected button.
    const { container } = widget.render();

    await widget.session.user.click(button('Button2', container));
    await waitFor(() => expect(widget.exposed().selected).toEqual(['2']));

    await widget.session.user.click(button('Button2', container));
    await waitFor(() => expect(widget.exposed().selected).toEqual([]));

    await widget.session.user.tab();
    expect(button('Button3', container)).toHaveFocus();
    await widget.session.user.keyboard('{Enter}');
    await waitFor(() => expect(widget.exposed().selected).toEqual(['3']));
  });

  test('[ButtonGroupV2-SEL-002] multiple selection adds in order and removes only the toggled value', async () => {
    // Break this catches: reusing the single-select replacement branch when multiSelection is enabled.
    const { container } = widget.render({ properties: { multiSelection: binding('{{true}}') } });
    await waitFor(() => expect(widget.exposed().selected).toEqual(['1']));

    await widget.session.user.click(button('Button2', container));
    await widget.session.user.click(button('Button3', container));
    await waitFor(() => expect(widget.exposed().selected).toEqual(['1', '2', '3']));

    await widget.session.user.click(button('Button2', container));
    await waitFor(() => expect(widget.exposed().selected).toEqual(['1', '3']));
  });

  test('[ButtonGroupV2-OPT-001] source, options, and selection mode changes restore matching defaults', async () => {
    // Break this catches: a stale memo/effect dependency leaving selection from the previous source or mode.
    const { container } = widget.render();
    await waitFor(() => expect(widget.exposed().selected).toEqual(['1']));

    await setProperty('advanced', '{{true}}');
    await waitFor(() => expect(buttons(container).map((item) => item.textContent)).toEqual(['Mapped A', 'Mapped B']));
    expect(widget.exposed().selected).toEqual(['a']);

    await setProperty(
      'schema',
      "{{[{label:'Mapped C',value:'c',disable:false,default:true},{label:'Mapped D',value:'d',disable:false,default:true}]}}"
    );
    await waitFor(() => expect(widget.exposed().selected).toEqual(['c']));

    await setProperty('multiSelection', '{{true}}');
    await waitFor(() => expect(widget.exposed().selected).toEqual(['c', 'd']));

    await setProperty('schema', '{{null}}');
    await waitFor(() => expect(buttons(container)).toHaveLength(0));
    expect(widget.exposed().selected).toEqual([]);
  });

  test('[ButtonGroupV2-OPT-002] a disabled option blocks only itself', async () => {
    // Break this catches: applying the option disable flag to the whole group or ignoring it entirely.
    const { container } = widget.render({
      properties: {
        options: {
          value: [staticOption('Blocked', 'blocked', { disable: true }), staticOption('Allowed', 'allowed')],
        },
      },
      events: clickEvents(),
    });

    expect(button('Blocked', container)).toBeDisabled();
    fireEvent.click(button('Blocked', container));
    expect(widget.exposed().selected).toEqual([]);
    expect(widget.variables().clickCount).toBeUndefined();

    await widget.session.user.click(button('Allowed', container));
    await waitFor(() => expect(widget.exposed().selected).toEqual(['allowed']));
    expect(widget.variables().clickCount).toBe(1);
  });

  test('[ButtonGroupV2-EVT-001] onClick fires exactly once after publishing the new selection', async () => {
    // Break this catches: firing before the exposed write or dispatching twice from one activation.
    const { container } = widget.render({
      properties: { options: { value: NO_DEFAULT_OPTIONS } },
      events: clickEvents(),
    });

    await widget.session.user.click(button('Button2', container));

    await waitFor(() => expect(widget.variables().clickCount).toBe(1));
    expect(widget.variables().selectedAtClick).toEqual(['2']);
  });

  test('[ButtonGroupV2-CSA-001] setSelected filters by membership, type, and selection mode without onClick', async () => {
    // Break this catches: accepting unknown values, coercing types, or routing CSA writes through click events.
    widget.render({ properties: { options: { value: NO_DEFAULT_OPTIONS } }, events: clickEvents() });

    await widget.act('setSelected', ['unknown', '3', '1']);
    expect(widget.exposed().selected).toEqual(['3']);

    await setProperty('multiSelection', '{{true}}');
    await widget.act('setSelected', ['unknown', '3', '1']);
    expect(widget.exposed().selected).toEqual(['3', '1']);

    await widget.act('setSelected', 1);
    expect(widget.exposed().selected).toEqual(['3', '1']);
    await widget.act('setSelected', false);
    expect(widget.exposed().selected).toEqual(['3', '1']);
    expect(widget.variables().clickCount).toBeUndefined();
  });

  test('[ButtonGroupV2-CSA-002] clear empties selection, revalidates, and never fires onClick', async () => {
    // Break this catches: clear restoring defaults, skipping validation, or impersonating a user click.
    widget.render({
      validation: { mandatory: binding('{{true}}') },
      events: clickEvents(),
    });
    await waitFor(() => expect(widget.exposed().selected).toEqual(['1']));

    await widget.act('clear');

    await waitFor(() => expect(widget.exposed().selected).toEqual([]));
    expect(widget.exposed().isValid).toBe(false);
    expect(screen.getByText('Field cannot be empty')).toBeInTheDocument();
    expect(widget.variables().clickCount).toBeUndefined();
  });

  test('[ButtonGroupV2-STATE-001] properties and setters update public flags and semantic DOM', async () => {
    // Break this catches: a state setter updating the store but not the rendered state, or vice versa.
    const { container } = widget.render();

    await widget.act('setDisable', 'yes');
    expect(widget.exposed().isDisabled).toBe(true);
    expect(root(container)).toHaveAttribute('aria-disabled', 'true');
    expect(outer(container)).toHaveClass('disabled');

    await widget.act('setVisibility', 0);
    expect(widget.exposed().isVisible).toBe(false);
    expect(root(container)).toHaveClass('d-none');
    expect(root(container)).toHaveAttribute('aria-hidden', 'true');

    await widget.act('setVisibility', 1);
    await widget.act('setLoading', {});
    expect(widget.exposed().isLoading).toBe(true);
    expect(root(container)).toHaveAttribute('aria-busy', 'true');
    expect(container.querySelector('.tj-widget-loader')).toBeInTheDocument();
    expect(buttons(container)).toHaveLength(0);
  });

  test.each([
    ['setDisable', 'disabledState', 'isDisabled', false, true],
    ['setLoading', 'loadingState', 'isLoading', false, true],
    ['setVisibility', 'visibility', 'isVisible', true, false],
  ])(
    '[ButtonGroupV2-STATE-002] %s survives non-changes and yields to a changed paired property',
    async (action, property, exposedKey, originalProperty, changedProperty) => {
      // Break this catches: a broad rerender effect wiping CSA state, or a changed paired property failing to win.
      const { container } = widget.render();
      const expectRendered = (value) => {
        if (action === 'setDisable') expect(root(container)).toHaveAttribute('aria-disabled', String(value));
        if (action === 'setLoading') expect(root(container)).toHaveAttribute('aria-busy', String(value));
        if (action === 'setVisibility') {
          if (value) expect(root(container)).not.toHaveClass('d-none');
          else expect(root(container)).toHaveClass('d-none');
        }
      };
      const actionValue = !originalProperty;
      await widget.act(action, actionValue);
      expect(widget.exposed()[exposedKey]).toBe(actionValue);
      expectRendered(actionValue);

      await setProperty(property, `{{${originalProperty}}}`);
      await setProperty('label', 'Updated label');
      await screen.findByText('Updated label');
      expect(widget.exposed()[exposedKey]).toBe(actionValue);
      expectRendered(actionValue);

      await widget.act(action, originalProperty);
      await setProperty(property, `{{${changedProperty}}}`);
      await waitFor(() => expect(widget.exposed()[exposedKey]).toBe(changedProperty));
      expectRendered(changedProperty);
    }
  );

  test('[ButtonGroupV2-STATE-003] mount-loading leaves the current widget disabled after loading ends', async () => {
    // Break this catches: changing the D-01-approved current behavior without updating its contract.
    const { container } = widget.render({ properties: { loadingState: binding('{{true}}') } });
    await waitFor(() => expect(widget.exposed().isDisabled).toBe(true));
    expect(container.querySelector('.tj-widget-loader')).toBeInTheDocument();

    await setProperty('loadingState', '{{false}}');

    await waitFor(() => expect(container.querySelector('.tj-widget-loader')).not.toBeInTheDocument());
    expect(widget.exposed().isLoading).toBe(false);
    expect(widget.exposed().isDisabled).toBe(true);
    expect(outer(container)).toHaveClass('disabled');
  });

  test('[ButtonGroupV2-VAL-001] selection writers refresh validity and reveal the configured error after interaction', async () => {
    // Break this catches: regression of 16534d07537, where options changed but isValid stayed stale.
    const { container } = widget.render({
      properties: { options: { value: NO_DEFAULT_OPTIONS } },
      validation: { mandatory: binding('{{true}}') },
      styles: { errTextColor: binding('#112233') },
    });
    await waitFor(() => expect(widget.exposed().isValid).toBe(false));
    expect(error()).not.toBeInTheDocument();

    await widget.session.user.click(button('Button2', container));
    await waitFor(() => expect(widget.exposed().isValid).toBe(true));

    await widget.session.user.click(button('Button2', container));
    await waitFor(() => expect(widget.exposed().isValid).toBe(false));
    expect(error()).toHaveStyle({ color: 'rgb(17, 34, 51)' });

    await setProperty('options', [staticOption('Defaulted', 'd', { isDefault: true })]);
    await waitFor(() => expect(widget.exposed().isValid).toBe(true));
    expect(screen.queryByText('Field cannot be empty')).not.toBeInTheDocument();
  });

  test('[ButtonGroupV2-VAL-001] custom validation publishes its message and clears when satisfied', async () => {
    // Break this catches: validating only mandatory and dropping the customRule result.
    const { container } = widget.render({
      validation: {
        customRule: binding("{{!components.buttongroup1.selected.includes('2') && 'Pick Button2'}}"),
      },
    });
    await waitFor(() => expect(widget.exposed().isValid).toBe(false));

    await widget.session.user.click(button('Button1', container));
    expect(await screen.findByText('Pick Button2')).toBeInTheDocument();

    await widget.session.user.click(button('Button2', container));
    await waitFor(() => expect(widget.exposed().isValid).toBe(true));
    expect(screen.queryByText('Pick Button2')).not.toBeInTheDocument();
  });

  test('[ButtonGroupV2-FORM-001] Form submit reveals validation and Form clear empties without restoring defaults', async () => {
    // Break this catches: dropping either Form signal subscription or clearing back to option defaults.
    widget.renderInsideForm({
      properties: { options: { value: NO_DEFAULT_OPTIONS } },
      validation: { mandatory: binding('{{true}}') },
    });
    await waitFor(() => expect(widget.exposed().selected).toEqual([]));
    expect(screen.queryByText('Field cannot be empty')).not.toBeInTheDocument();

    await widget.session.store.act(async () => widget.exposed('form1').submitForm());
    expect(await screen.findByText('Field cannot be empty')).toBeInTheDocument();

    await widget.act('setSelected', '1');
    await waitFor(() => expect(widget.exposed().selected).toEqual(['1']));
    await widget.session.store.act(async () => widget.exposed('form1').clearForm());
    await waitFor(() => expect(widget.exposed().selected).toEqual([]));
    expect(widget.exposed().isValid).toBe(false);
  });

  test('[ButtonGroupV2-VAR-001] mount publishes the complete public variable and action surface', async () => {
    // Break this catches: a renamed/missing handle or a runtime-only isValid publication disappearing.
    widget.render();
    await waitFor(() => expect(widget.exposed().setSelected).toBeInstanceOf(Function));

    expect(widget.exposed()).toEqual(
      expect.objectContaining({
        selected: ['1'],
        isVisible: true,
        isDisabled: false,
        isLoading: false,
        isValid: true,
        setSelected: expect.any(Function),
        clear: expect.any(Function),
        setDisable: expect.any(Function),
        setLoading: expect.any(Function),
        setVisibility: expect.any(Function),
      })
    );
  });

  test('[ButtonGroupV2-BND-001] typed values stay exact and authored labels render safely', async () => {
    // Break this catches: truthiness filtering, value coercion, or passing raw objects to React children.
    const boundaryOptions = [
      staticOption('<b>Zero</b>', 0),
      staticOption('Empty', ''),
      staticOption('Boolean', false),
      staticOption({ label: 'object' }, 'object'),
    ];
    const { container } = widget.render({
      properties: { options: { value: boundaryOptions }, multiSelection: binding('{{true}}') },
    });

    expect(screen.getByText('<b>Zero</b>')).toBeInTheDocument();
    expect(container.querySelector('b')).not.toBeInTheDocument();
    expect(screen.getByText('[object Object]')).toBeInTheDocument();

    await widget.session.user.click(button('<b>Zero</b>', container));
    await widget.session.user.click(button('Empty', container));
    await widget.session.user.click(button('Boolean', container));
    await waitFor(() => expect(widget.exposed().selected).toEqual([0, '', false]));

    await widget.act('setSelected', false);
    expect(widget.exposed().selected).toEqual([0, '', false]);
  });

  test('[ButtonGroupV2-LABEL-001] label content, direction, alignment, width, and mandatory marker map to DOM', async () => {
    // Break this catches: reintroducing the removed width-type branch or wiring direction/alignment backwards.
    const { container } = widget.render({
      styles: {
        labelColor: binding('#123456'),
        labelFontSize: binding('{{15}}'),
        alignment: binding('side'),
        direction: binding('right'),
        auto: binding('{{false}}'),
        labelWidth: binding('{{40}}'),
      },
      validation: { mandatory: binding('{{true}}') },
    });
    const label = container.querySelector('label');

    expect(label).toHaveTextContent('Status');
    expect(label).toHaveTextContent('*');
    expect(label).toHaveStyle({ fontSize: '15px' });
    expect(label.querySelector('p')).toHaveStyle({ color: 'rgb(18, 52, 86)' });
    expect(root(container)).toHaveClass('tw-flex-row-reverse');
    expect(wrapper(container).style.width).toBe('60%');

    await setProperty('alignment', 'top', 'styles');
    await waitFor(() => expect(root(container)).toHaveClass('flex-column'));
  });

  test('[ButtonGroupV2-STYLE-001] base, selected, icon, font, radius, and shadow styles reach the right elements', async () => {
    // Break this catches: selected styles leaking to every button or font/icon normalization being dropped.
    const { container } = widget.render({
      properties: {
        options: {
          value: [
            staticOption('Selected', 'selected', { isDefault: true, iconVisibility: true }),
            staticOption('Plain', 'plain', { iconVisibility: true }),
          ],
        },
      },
      styles: {
        backgroundColor: binding('#010203'),
        borderColor: binding('#111213'),
        textColor: binding('#212223'),
        textSize: binding('{{20}}'),
        fontWeight: binding('medium'),
        iconColor: binding('#313233'),
        selectedBackgroundColor: binding('#414243'),
        selectedTextColor: binding('#f1f2f3'),
        selectedIconColor: binding('#e1e2e3'),
        borderRadius: binding('{{9}}'),
        boxShadow: binding('1px 2px 3px 0px #000000'),
      },
    });
    const selected = button('Selected', container);
    const plain = button('Plain', container);

    expect(selected).toHaveStyle({
      backgroundColor: 'rgb(65, 66, 67)',
      color: 'rgb(241, 242, 243)',
      borderRadius: '9px',
      fontSize: '20px',
      lineHeight: '28.4px',
      fontWeight: '500',
      boxShadow: '1px 2px 3px 0px #000000',
    });
    expect(plain).toHaveStyle({
      backgroundColor: 'rgb(1, 2, 3)',
      color: 'rgb(33, 34, 35)',
      border: '1px solid #111213',
    });
    expect(selected.querySelector('div')).toHaveStyle({ width: '22.72px', height: '22.72px' });

    await waitFor(() => expect(selected.querySelector('svg')).toBeInTheDocument());
    expect(selected.querySelector('svg')).toHaveStyle({ color: 'rgb(225, 226, 227)' });
    expect(plain.querySelector('svg')).toHaveStyle({ color: 'rgb(49, 50, 51)' });
  });

  test('[ButtonGroupV2-STYLE-002] manual hover affects only an unselected button and restores on leave', async () => {
    // Break this catches: hover overriding the selected branch or not restoring the base background.
    const { container } = widget.render({
      styles: {
        backgroundColor: binding('#010203'),
        hoverBackgroundMode: binding('manual'),
        hoverBackgroundColor: binding('#a1a2a3'),
        selectedBackgroundColor: binding('#414243'),
      },
    });
    const selected = button('Button1', container);
    const plain = button('Button2', container);

    fireEvent.mouseEnter(plain);
    expect(plain).toHaveStyle({ backgroundColor: 'rgb(161, 162, 163)' });
    fireEvent.mouseLeave(plain);
    expect(plain).toHaveStyle({ backgroundColor: 'rgb(1, 2, 3)' });

    fireEvent.mouseEnter(selected);
    expect(selected).toHaveStyle({ backgroundColor: 'rgb(65, 66, 67)' });
  });

  test('[ButtonGroupV2-LAYOUT-001] row, column, wrap, alignment, and padding select the inline layout contract', async () => {
    // Break this catches: mixing row/column overflow or dropping the wrap/alignment branch.
    const { container } = widget.render();
    expect(content(container)).toHaveStyle({ width: 'max-content', flexDirection: 'row' });
    expect(wrapper(container).style.overflow).toBe('auto hidden');
    expect(wrapper(container)).toHaveStyle({ height: '76px' });

    await setProperty('layout', 'column');
    await setProperty('btnAlignment', 'right', 'styles');
    await waitFor(() => expect(content(container)).toHaveStyle({ flexDirection: 'column' }));
    expect(wrapper(container).style.overflow).toBe('hidden auto');
    expect(wrapper(container)).toHaveStyle({ justifyContent: 'end' });

    await setProperty('layout', 'wrap');
    await setProperty('btnAlignment', 'center', 'styles');
    await setProperty('padding', 'none', 'styles');
    await waitFor(() => expect(content(container)).toHaveStyle({ width: '100%', flexWrap: 'wrap' }));
    expect(content(container)).toHaveStyle({ justifyContent: 'center' });
    expect(wrapper(container)).toHaveStyle({ height: '80px' });
  });

  test('[ButtonGroupV2-A11Y-001] the labelled group and native buttons expose state semantics', async () => {
    // Break this catches: disconnecting aria-labelledby or replacing disabled native buttons with styled divs.
    const { container } = widget.render({
      properties: {
        options: {
          value: [staticOption('Blocked', 'blocked', { disable: true }), staticOption('Allowed', 'allowed')],
        },
      },
      validation: { mandatory: binding('{{true}}') },
    });
    const group = await screen.findByRole('group', { name: /Status/ });

    expect(group).toHaveAttribute('aria-hidden', 'false');
    expect(group).toHaveAttribute('aria-disabled', 'false');
    expect(group).toHaveAttribute('aria-busy', 'false');
    expect(group).toHaveAttribute('aria-invalid', 'true');
    expect(button('Blocked', container)).toBeDisabled();
    expect(button('Allowed', container).tagName).toBe('BUTTON');
  });

  test('[ButtonGroupV2-ISO-001] two instances keep selection, actions, events, and removal isolated', async () => {
    // Break this catches: a shared state closure or non-id-scoped exposed write leaking across instances.
    const { container } = widget.render({
      extraComponents: { bg2: secondDefinition() },
      also: [{ id: 'bg2', componentType: 'ButtonGroupV2' }],
      events: [...clickEvents(ID, NAME, 'first'), ...clickEvents('bg2', 'buttongroup2', 'second')],
    });
    const first = outer(container, NAME);
    const second = outer(container, 'buttongroup2');
    await waitFor(() => expect(widget.exposed('bg2').selected).toEqual(['low']));

    await widget.session.user.click(within(first).getByRole('button', { name: 'Button2' }));
    await waitFor(() => expect(widget.exposed().selected).toEqual(['2']));
    expect(widget.exposed('bg2').selected).toEqual(['low']);
    expect(widget.variables().firstclickCount).toBe(1);
    expect(widget.variables().secondclickCount).toBeUndefined();

    await widget.session.store.act(async () => widget.exposed('bg2').clear());
    await waitFor(() => expect(widget.exposed('bg2').selected).toEqual([]));
    expect(widget.exposed().selected).toEqual(['2']);

    await widget.act('setVisibility', false);
    expect(first.querySelector('.button-group-widget')).toHaveClass('d-none');
    expect(second.querySelector('.button-group-widget')).not.toHaveClass('d-none');

    await widget.session.store.act(() =>
      store().deleteComponents([ID], MODULE_ID, { saveAfterAction: false, skipUndoRedo: true })
    );
    await waitFor(() => expect(outer(container, NAME)).not.toBeInTheDocument());
    expect(outer(container, 'buttongroup2')).toBeInTheDocument();
    expect(widget.exposed('bg2').selected).toEqual([]);
  });
});
