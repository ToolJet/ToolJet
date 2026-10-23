/**
 * UI 2.0 Number input: a number box with stepper buttons, rounding and grouping.
 *
 * Real store, real RenderWidget, real widget; nothing about the widget is mocked. Standard control behaviour
 * (visibility, disabled, loading, tooltip) is covered for every UI 2.0 widget in Ui2/__tests__/controlState.spec.jsx;
 * this file covers what the Number input itself does. Titles carry [ShadNumberInput-<AREA>-<NNN>] scenario ids.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, screen, waitFor, fireEvent } from '@testing-library/react';
import { binding, setVariableOn, countInvocationsOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'num1';
const widget = createWidgetHarness({
  componentType: 'ShadNumberInput',
  handle: 'numberinput1',
  id: ID,
  widgetHeight: 64,
  widgetWidth: 320,
});

const render = (options = {}) => widget.render({ currentMode: 'view', ...options });
const box = () => screen.getByRole('spinbutton');
const exposed = () => widget.exposed() ?? {};
const button = (name) => screen.getByRole('button', { name });
const type = async (text) => {
  await act(async () => box().focus());
  await act(async () => fireEvent.change(box(), { target: { value: text } }));
};
const leave = () => act(async () => box().blur());

describe('UI 2.0 Number input', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadNumberInput-DEF-001] shows its label, the default 1, and a minus and plus button either side', async () => {
    render({ properties: { description: binding('Units per box'), placeholder: binding('How many?') } });

    expect(await screen.findByText('Quantity')).toBeInTheDocument();
    expect(screen.getByText('Units per box')).toBeInTheDocument();
    expect(box()).toHaveValue('1');
    expect(box()).toHaveAttribute('placeholder', 'How many?');
    expect(button('Decrease').compareDocumentPosition(box()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(box().compareDocumentPosition(button('Increase')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    await waitFor(() => expect(exposed().value).toBe(1));
    expect(exposed()).toMatchObject({ label: 'Quantity', isValid: true, isMandatory: false });
  });

  test('[ShadNumberInput-PROP-001] a typed number is rounded to decimalPlaces and grouped on blur (thousandSeparator)', async () => {
    render();

    await type('1,234.567');
    await waitFor(() => expect(exposed().value).toBe(1234.57));
    await leave();
    expect(box()).toHaveValue('1,234.57');

    render({
      properties: {
        decimalPlaces: binding('{{0}}'),
        thousandSeparator: binding('{{false}}'),
        defaultValue: binding('{{4321.6}}'),
      },
    });
    await waitFor(() => expect(box()).toHaveValue('4322'));
    expect(exposed().value).toBe(4322);
  });

  test('[ShadNumberInput-PROP-002] the buttons and arrow keys move the value by step', async () => {
    render({ properties: { step: binding('{{5}}'), defaultValue: binding('{{10}}') } });
    await waitFor(() => expect(exposed().value).toBe(10));

    await act(async () => fireEvent.click(button('Increase')));
    await waitFor(() => expect(exposed().value).toBe(15));
    await act(async () => fireEvent.keyDown(box(), { key: 'ArrowDown' }));
    await waitFor(() => expect(exposed().value).toBe(10));
    await act(async () => fireEvent.click(button('Decrease')));
    await waitFor(() => expect(exposed().value).toBe(5));
  });

  test('[ShadNumberInput-PROP-003] stepper stacked puts both buttons after the box, none removes them', async () => {
    render({ properties: { stepper: binding('stacked') } });
    await waitFor(() => expect(button('Increase')).toBeInTheDocument());
    expect(box().compareDocumentPosition(button('Decrease')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    render({ properties: { stepper: binding('none') } });
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Increase' })).toBeNull());
    expect(screen.queryByRole('button', { name: 'Decrease' })).toBeNull();
  });

  test('[ShadNumberInput-PROP-004] prefix and suffix are drawn in the box beside the number', async () => {
    render({ properties: { prefix: binding('~'), suffix: binding('kg') } });

    expect(await screen.findByText('~')).toBeInTheDocument();
    expect(screen.getByText('kg')).toBeInTheDocument();
  });

  test('[ShadNumberInput-PROP-005] a long prefix takes at most 40% of the box and ends in an ellipsis', async () => {
    // A long prefix kept its full width and pushed the stepper button out of the box.
    const long = 'A very long unit name that would not fit beside the number';
    render({ properties: { prefix: binding(long) } });

    const text = await screen.findByText(long);
    expect(text).toHaveClass('tw-truncate');
    expect(text.parentElement.className).toMatch(/max-w-\[40%\]/);
    expect(text.parentElement).not.toHaveClass('tw-shrink-0');
    expect(button('Increase')).toBeInTheDocument();
  });

  test('[ShadNumberInput-EVT-001] typing fires onChange, and its handler reads the new number', async () => {
    render();
    widget.setEvents(setVariableOn(ID, 'onChange', { value: '{{components.numberinput1.value}}' }));

    await type('42');

    await waitFor(() => expect(widget.variables().seen).toBe(42));
  });

  test('[ShadNumberInput-EVT-002] Enter fires onEnterPressed, and focusing and leaving fire onFocus and onBlur', async () => {
    render();
    widget.setEvents([
      ...countInvocationsOn(ID, 'onEnterPressed', { key: 'enters' }),
      ...setVariableOn(ID, 'onFocus', { key: 'focused' }),
      ...setVariableOn(ID, 'onBlur', { key: 'blurred' }),
    ]);

    await act(async () => box().focus());
    await waitFor(() => expect(widget.variables().focused).toBe('YES'));
    await act(async () => fireEvent.keyDown(box(), { key: 'Enter' }));
    await waitFor(() => expect(widget.variables().enters).toBe(1));
    await leave();
    await waitFor(() => expect(widget.variables().blurred).toBe('YES'));
  });

  test('[ShadNumberInput-ACT-001] setText sets the number (rounded) and clear empties the box', async () => {
    render();

    await widget.act('setText', '78.129');
    await waitFor(() => expect(box()).toHaveValue('78.13'));
    expect(exposed().value).toBe(78.13);

    await widget.act('clear');
    await waitFor(() => expect(box()).toHaveValue(''));
    expect(exposed().value).toBeNull();
  });

  test('[ShadNumberInput-ACT-002] setFocus and setBlur move focus to and from the box', async () => {
    render();

    await widget.act('setFocus');
    expect(document.activeElement).toBe(box());
    await widget.act('setBlur');
    expect(document.activeElement).not.toBe(box());
  });

  test('[ShadNumberInput-VAL-001] minValue and maxValue stop the stepper and reject a number outside them', async () => {
    render({
      properties: { defaultValue: binding('{{4}}') },
      validation: { minValue: binding('{{2}}'), maxValue: binding('{{5}}') },
    });
    await waitFor(() => expect(box()).toHaveAttribute('aria-valuemax', '5'));

    await act(async () => fireEvent.click(button('Increase')));
    await waitFor(() => expect(exposed().value).toBe(5));
    expect(button('Increase')).toBeDisabled();

    await type('9');
    await leave();
    expect(await screen.findByRole('alert')).toHaveTextContent('Maximum value is 5');
    await type('1');
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Minimum value is 2'));
    expect(exposed().isValid).toBe(false);
  });

  test('[ShadNumberInput-VAL-002] a mandatory box is invalid once emptied and says so after it is left', async () => {
    render({ validation: { mandatory: binding('{{true}}') } });
    await waitFor(() => expect(exposed()).toMatchObject({ isValid: true, isMandatory: true }));

    await type('');
    await leave();

    await waitFor(() => expect(exposed().isValid).toBe(false));
    expect(await screen.findByRole('alert')).toHaveTextContent('Field cannot be empty');
  });

  test('[ShadNumberInput-VAL-003] a customRule message makes the number invalid and is shown under the box', async () => {
    render({
      validation: { customRule: binding("{{components.numberinput1.value % 2 ? 'Use an even number' : ''}}") },
    });

    await type('3');
    await leave();

    await waitFor(() => expect(exposed().isValid).toBe(false));
    expect(await screen.findByText('Use an even number')).toBeInTheDocument();
  });

  test('[ShadNumberInput-STY-001] field and stepper styles reach the widget as CSS variables', async () => {
    const { container } = render({
      styles: {
        labelColor: binding('#111111'),
        borderColor: binding('#555555'),
        accentColor: binding('#e11d48'),
        borderRadius: binding('{{8}}'),
        stepperBackgroundColor: binding('#f4f4f5'),
        stepperIconColor: binding('#52525b'),
        stepperHoverColor: binding('#e4e4e7'),
        affixColor: binding('#71717a'),
      },
    });

    await waitFor(() => expect(box()).toBeInTheDocument());
    const root = container.querySelector('.tj-shadcn').style;
    expect(root.getPropertyValue('--lk-label')).toBe('#111111');
    expect(root.getPropertyValue('--lk-border')).toBe('#555555');
    expect(root.getPropertyValue('--sc-primary')).toBe('#e11d48');
    expect(root.getPropertyValue('--lk-radius')).toBe('8px');
    expect(root.getPropertyValue('--lk-step-bg')).toBe('#f4f4f5');
    expect(root.getPropertyValue('--lk-step-fg')).toBe('#52525b');
    expect(root.getPropertyValue('--lk-step-hover')).toBe('#e4e4e7');
    expect(root.getPropertyValue('--lk-affix')).toBe('#71717a');
  });

  test('[ShadNumberInput-PROP-006] Show clear button: an x while the box has a number clears it, firing onChange once', async () => {
    const { shadNumberInputConfig } = jest.requireActual('@/AppBuilder/WidgetManager/widgets/shadNumberInput');
    expect(shadNumberInputConfig.properties.showClearBtn).toMatchObject({
      type: 'toggle',
      displayName: 'Show clear button',
    });
    expect(shadNumberInputConfig.definition.properties.showClearBtn.value).toBe('{{false}}');

    render({ properties: { showClearBtn: binding('{{true}}'), disabledState: binding('{{false}}') } });
    widget.setEvents(countInvocationsOn(ID, 'onChange'));
    await waitFor(() => expect(exposed().value).toBe(1));
    await act(async () => fireEvent.click(button('Clear')));
    await waitFor(() => expect(exposed().value).toBeNull());
    expect(box()).toHaveValue('');
    expect(screen.queryByRole('button', { name: 'Clear' })).toBeNull();
    await waitFor(() => expect(widget.variables().calls).toBe(1));

    // Off: no x.
    render({ properties: { showClearBtn: binding('{{false}}') } });
    await type('7');
    expect(screen.queryByRole('button', { name: 'Clear' })).toBeNull();
  });
});
