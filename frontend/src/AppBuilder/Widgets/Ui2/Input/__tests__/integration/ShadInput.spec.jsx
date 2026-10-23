/**
 * UI 2.0 Input: a one-line text box.
 *
 * Real store, real RenderWidget, real widget; nothing about the widget is mocked. Standard control behaviour
 * (visibility, disabled, loading, tooltip) is covered for every UI 2.0 widget in Ui2/__tests__/controlState.spec.jsx;
 * this file covers what the Input itself does. Titles carry [ShadInput-<AREA>-<NNN>] scenario ids.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, screen, waitFor, fireEvent } from '@testing-library/react';
import { binding, setVariableOn, countInvocationsOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'inp1';
const widget = createWidgetHarness({
  componentType: 'ShadInput',
  handle: 'input1',
  id: ID,
  widgetHeight: 64,
  widgetWidth: 320,
  defaultProperties: { label: binding('Full name') },
});

const render = (options = {}) => widget.render({ currentMode: 'view', ...options });
const box = () => screen.getByRole('textbox');
const exposed = () => widget.exposed() ?? {};
const type = (text) => act(async () => fireEvent.change(box(), { target: { value: text } }));
const leave = async () => {
  await act(async () => box().focus());
  await act(async () => box().blur());
};

describe('UI 2.0 Input', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadInput-DEF-001] shows the label, help text and placeholder, and exposes the label and an empty value', async () => {
    render({ properties: { description: binding('As on your passport'), placeholder: binding('Ada Lovelace') } });

    expect(await screen.findByText('Full name')).toBeInTheDocument();
    expect(screen.getByText('As on your passport')).toBeInTheDocument();
    expect(box()).toHaveAttribute('placeholder', 'Ada Lovelace');
    // The label names the box through <label for>.
    expect(screen.getByLabelText('Full name')).toBe(box());
    await waitFor(() => expect(exposed().value).toBe(''));
    expect(exposed().label).toBe('Full name');
    expect(exposed()).toMatchObject({ isValid: true, isMandatory: false });
  });

  test('[ShadInput-DEF-002] without a label the placeholder names the box for screen readers', async () => {
    render({ properties: { label: binding(''), placeholder: binding('Search orders') } });

    expect(await screen.findByRole('textbox', { name: 'Search orders' })).toBeInTheDocument();
  });

  test('[ShadInput-PROP-001] defaultValue fills the box and the exposed value', async () => {
    render({ properties: { defaultValue: binding('Grace') } });

    await waitFor(() => expect(box()).toHaveValue('Grace'));
    expect(exposed().value).toBe('Grace');
  });

  test('[ShadInput-PROP-002] inputType sets the kind of box, e.g. email or password', async () => {
    render({ properties: { inputType: binding('email') } });
    await waitFor(() => expect(box()).toHaveAttribute('type', 'email'));

    const { container } = render({ properties: { inputType: binding('password') } });
    await waitFor(() => expect(container.querySelector('input')).toHaveAttribute('type', 'password'));
  });

  test('[ShadInput-EVT-001] typing fires onChange, and its handler reads the new value', async () => {
    render();
    widget.setEvents(setVariableOn(ID, 'onChange', { value: '{{components.input1.value}}' }));

    await type('hello');

    await waitFor(() => expect(widget.variables().seen).toBe('hello'));
    expect(box()).toHaveValue('hello');
  });

  test('[ShadInput-EVT-002] Enter fires onEnterPressed once', async () => {
    render();
    widget.setEvents(countInvocationsOn(ID, 'onEnterPressed'));

    await act(async () => fireEvent.keyDown(box(), { key: 'Enter' }));
    await act(async () => fireEvent.keyDown(box(), { key: 'a' }));

    await waitFor(() => expect(widget.variables().calls).toBe(1));
  });

  test('[ShadInput-EVT-003] focusing and leaving the box fire onFocus and onBlur', async () => {
    render();
    widget.setEvents([
      ...setVariableOn(ID, 'onFocus', { key: 'focused' }),
      ...setVariableOn(ID, 'onBlur', { key: 'blurred' }),
    ]);

    await act(async () => box().focus());
    await waitFor(() => expect(widget.variables().focused).toBe('YES'));
    await act(async () => box().blur());
    await waitFor(() => expect(widget.variables().blurred).toBe('YES'));
  });

  test('[ShadInput-ACT-001] setText fills the box and clear empties it', async () => {
    render();

    await widget.act('setText', 'Typed by a query');
    await waitFor(() => expect(box()).toHaveValue('Typed by a query'));
    expect(exposed().value).toBe('Typed by a query');

    await widget.act('clear');
    await waitFor(() => expect(box()).toHaveValue(''));
    expect(exposed().value).toBe('');
  });

  // A query reads the value on its next line: `await components.input1.setText('after')` then `.value` read
  // "before" while the value was published in a later effect, and setText fired no onChange (review, 2026-10-17).
  test('[ShadInput-ACT-003] setText and clear publish the value and validation before they resolve, and fire onChange', async () => {
    render({ properties: { defaultValue: binding('before') }, validation: { mandatory: binding('{{true}}') } });
    widget.setEvents(countInvocationsOn(ID, 'onChange', { key: 'changes' }));
    await waitFor(() => expect(exposed().value).toBe('before'));

    expect(await widget.actNow('setText', 'after')).toMatchObject({ value: 'after', isValid: true });
    expect(widget.variables().changes).toBe(1);
    expect(await widget.actNow('clear')).toMatchObject({ value: '', isValid: false });
    expect(widget.variables().changes).toBe(2);
  });

  test('[ShadInput-ACT-002] setFocus and setBlur move focus to and from the box', async () => {
    render({ properties: { defaultValue: binding('x') } });

    await widget.act('setFocus');
    expect(document.activeElement).toBe(box());
    await widget.act('setBlur');
    expect(document.activeElement).not.toBe(box());
  });

  test('[ShadInput-VAL-001] mandatory marks the label, and the message shows only once the box is left', async () => {
    render({ validation: { mandatory: binding('{{true}}') } });

    await waitFor(() => expect(exposed()).toMatchObject({ isValid: false, isMandatory: true }));
    expect(screen.getByText('*')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).toBeNull();

    await leave();
    expect(await screen.findByRole('alert')).toHaveTextContent('Field cannot be empty');
    expect(box()).toHaveAttribute('aria-invalid', 'true');

    await type('Ada');
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
    expect(exposed().isValid).toBe(true);
  });

  test('[ShadInput-VAL-002] regex rejects text that does not match the pattern', async () => {
    render({ validation: { regex: binding('^[A-Z]{3}$') } });

    await type('ab1');
    await leave();
    await waitFor(() => expect(exposed().isValid).toBe(false));
    expect(await screen.findByRole('alert')).toHaveTextContent('The input should match pattern');

    await type('ABC');
    await waitFor(() => expect(exposed().isValid).toBe(true));
  });

  test('[ShadInput-VAL-003] minLength and maxLength bound the text length', async () => {
    render({ validation: { minLength: binding('{{3}}'), maxLength: binding('{{5}}') } });

    await type('ab');
    await leave();
    expect(await screen.findByRole('alert')).toHaveTextContent('Minimum 3 characters is needed');

    await type('abcdef');
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Maximum 5 characters is allowed'));

    await type('abcd');
    await waitFor(() => expect(exposed().isValid).toBe(true));
  });

  test('[ShadInput-VAL-004] a customRule message makes the text invalid and is shown under the box', async () => {
    render({ validation: { customRule: binding("{{components.input1.value === 'admin' ? 'Name is taken' : ''}}") } });

    await type('admin');
    await leave();

    await waitFor(() => expect(exposed().isValid).toBe(false));
    expect(await screen.findByText('Name is taken')).toBeInTheDocument();
  });

  test('[ShadInput-STY-001] colour and radius styles reach the widget as CSS variables', async () => {
    const { container } = render({
      styles: {
        labelColor: binding('#111111'),
        helpTextColor: binding('#222222'),
        backgroundColor: binding('#fefefe'),
        textColor: binding('#333333'),
        placeholderColor: binding('#444444'),
        borderColor: binding('#555555'),
        accentColor: binding('#e11d48'),
        errorColor: binding('#b91c1c'),
        borderRadius: binding('{{10}}'),
      },
    });

    await waitFor(() => expect(box()).toBeInTheDocument());
    const root = container.querySelector('.tj-shadcn').style;
    expect(root.getPropertyValue('--lk-label')).toBe('#111111');
    expect(root.getPropertyValue('--lk-help')).toBe('#222222');
    expect(root.getPropertyValue('--lk-bg')).toBe('#fefefe');
    expect(root.getPropertyValue('--lk-fg')).toBe('#333333');
    expect(root.getPropertyValue('--lk-placeholder')).toBe('#444444');
    expect(root.getPropertyValue('--lk-border')).toBe('#555555');
    expect(root.getPropertyValue('--sc-primary')).toBe('#e11d48');
    expect(root.getPropertyValue('--lk-error')).toBe('#b91c1c');
    expect(root.getPropertyValue('--lk-radius')).toBe('10px');
  });

  test('[ShadInput-VAL-005] type email is invalid until the text is an email address', async () => {
    // Any text passed as valid.
    render({ properties: { inputType: binding('email') } });
    await type('not an email');
    await leave();
    await waitFor(() => expect(exposed().isValid).toBe(false));
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid email address');

    await type('ada@example.com');
    await waitFor(() => expect(exposed().isValid).toBe(true));
    expect(screen.queryByRole('alert')).toBeNull();

    // Empty is left to Mandatory; a text box is not checked as an address.
    await type('');
    await waitFor(() => expect(exposed().isValid).toBe(true));
    render({ properties: { inputType: binding('text') } });
    await type('not an email');
    await waitFor(() => expect(exposed().isValid).toBe(true));
  });

  test('[ShadInput-PROP-003] type number exposes a number (null when empty) and has arrows that step it', async () => {
    // It exposed the typed text as a string and had no arrows.
    render({ properties: { inputType: binding('number') } });
    const spin = await screen.findByRole('spinbutton');
    await act(async () => fireEvent.change(spin, { target: { value: '42' } }));
    await act(async () => fireEvent.blur(spin));
    await waitFor(() => expect(exposed().value).toBe(42));

    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Increase' })));
    await waitFor(() => expect(exposed().value).toBe(43));
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Decrease' })));
    await waitFor(() => expect(exposed().value).toBe(42));

    await act(async () => fireEvent.change(spin, { target: { value: '' } }));
    await act(async () => fireEvent.blur(spin));
    await waitFor(() => expect(exposed().value).toBeNull());
    expect(screen.getByText('Full name')).toBeInTheDocument();
  });

  test('[ShadInput-PROP-004] Type takes a binding: a show/hide toggle switches password and text and keeps the text', async () => {
    // Type was a fixed choice, so a password field could not show its text on a toggle.
    const { shadInputConfig } = jest.requireActual('@/AppBuilder/WidgetManager/widgets/shadInput');
    expect(shadInputConfig.properties.inputType.isFxNotRequired).toBeUndefined();

    const { container } = render({ properties: { inputType: binding("{{'Password'}}") } });
    const input = () => container.querySelector('input');
    await waitFor(() => expect(input()).toHaveAttribute('type', 'password'));
    await act(async () => fireEvent.change(input(), { target: { value: 's3cret' } }));
    widget.setComponentProperty(ID, 'inputType', "{{'text'}}", 'properties');
    await waitFor(() => expect(input()).toHaveAttribute('type', 'text'));
    expect(input()).toHaveValue('s3cret');
    widget.setComponentProperty(ID, 'inputType', "{{'checkbox'}}", 'properties');
    await waitFor(() => expect(input()).toHaveAttribute('type', 'text'));
  });

  test('[ShadInput-PROP-006] a bound Type switching text and number keeps what was typed, converted as a browser does', async () => {
    // Switching to number dropped the draft: "123" became null, and back to text it was "".
    const { container } = render({ properties: { inputType: binding('text') } });
    const input = () => container.querySelector('input');
    await type('123');
    widget.setComponentProperty(ID, 'inputType', "{{'number'}}", 'properties');
    await waitFor(() => expect(screen.getByRole('spinbutton')).toHaveValue('123'));
    await waitFor(() => expect(exposed().value).toBe(123));

    widget.setComponentProperty(ID, 'inputType', "{{'text'}}", 'properties');
    await waitFor(() => expect(input()).toHaveAttribute('type', 'text'));
    expect(input()).toHaveValue('123');
    await waitFor(() => expect(exposed().value).toBe('123'));

    // Text that is not a number empties a number box (as a browser's does), and stays empty back in text.
    await type('abc');
    widget.setComponentProperty(ID, 'inputType', "{{'number'}}", 'properties');
    await waitFor(() => expect(screen.getByRole('spinbutton')).toHaveValue(''));
    await waitFor(() => expect(exposed().value).toBeNull());
    widget.setComponentProperty(ID, 'inputType', "{{'text'}}", 'properties');
    await waitFor(() => expect(input()).toHaveAttribute('type', 'text'));
    expect(input()).toHaveValue('');
    await waitFor(() => expect(exposed().value).toBe(''));

    // An empty box stays empty both ways; a number typed in the number box comes back as its text.
    widget.setComponentProperty(ID, 'inputType', "{{'number'}}", 'properties');
    const spin = await screen.findByRole('spinbutton');
    await waitFor(() => expect(exposed().value).toBeNull());
    await act(async () => fireEvent.change(spin, { target: { value: '4.5' } }));
    await act(async () => fireEvent.blur(spin));
    await waitFor(() => expect(exposed().value).toBe(4.5));
    widget.setComponentProperty(ID, 'inputType', "{{'password'}}", 'properties');
    await waitFor(() => expect(input()).toHaveAttribute('type', 'password'));
    expect(input()).toHaveValue('4.5');
    await waitFor(() => expect(exposed().value).toBe('4.5'));
  });

  test('[ShadInput-PROP-007] a new Default value still starts the box again after a Type switch', async () => {
    const { container } = render({ properties: { inputType: binding('text'), defaultValue: binding('7') } });
    const input = () => container.querySelector('input');
    await type('123');
    widget.setComponentProperty(ID, 'inputType', "{{'number'}}", 'properties');
    await waitFor(() => expect(exposed().value).toBe(123));
    widget.setComponentProperty(ID, 'defaultValue', '9', 'properties');
    await waitFor(() => expect(exposed().value).toBe(9));
    widget.setComponentProperty(ID, 'inputType', "{{'text'}}", 'properties');
    await waitFor(() => expect(input()).toHaveAttribute('type', 'text'));
    expect(input()).toHaveValue('9');
  });

  test('[ShadInput-PROP-005] type search clears with its x or Escape, firing onChange', async () => {
    // It had no clear button and Escape did nothing.
    render({ properties: { inputType: binding('search') } });
    widget.setEvents(countInvocationsOn(ID, 'onChange'));
    const search = await screen.findByRole('searchbox');
    expect(screen.queryByRole('button', { name: 'Clear' })).toBeNull();
    await act(async () => fireEvent.change(search, { target: { value: 'invoices' } }));
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Clear' })));
    expect(search).toHaveValue('');
    await waitFor(() => expect(exposed().value).toBe(''));
    expect(screen.queryByRole('button', { name: 'Clear' })).toBeNull();

    await act(async () => fireEvent.change(search, { target: { value: 'orders' } }));
    await act(async () => fireEvent.keyDown(search, { key: 'Escape' }));
    expect(search).toHaveValue('');
    // Two typings and two clears.
    await waitFor(() => expect(widget.variables().calls).toBe(4));
  });

  test('[ShadInput-LOAD-001] loading draws a calm skeleton the size of the box, keeping the box and what was typed', async () => {
    // A spinner spun inside the box (beside a Select's chevron, an Input's text). The box now keeps its place and size
    // under a skeleton block, and stays mounted.
    const { container } = render();
    await type('draft');
    const before = box();
    widget.setComponentProperty(ID, 'loadingState', '{{true}}', 'properties');
    const skeleton = await waitFor(() => {
      const el = container.querySelector('[data-loading-skeleton]');
      expect(el).not.toBeNull();
      return el;
    });
    expect(container.querySelector('.tw-animate-spin')).toBeNull();
    expect(skeleton.querySelector('.tw-animate-pulse')).toHaveClass('tw-absolute', 'tw-inset-0');
    expect(skeleton.firstChild).toHaveClass('tw-invisible');
    expect(skeleton.contains(before)).toBe(true);

    widget.setComponentProperty(ID, 'loadingState', '{{false}}', 'properties');
    await waitFor(() => expect(container.querySelector('[data-loading-skeleton]')).toBeNull());
    expect(box()).toBe(before);
    expect(box()).toHaveValue('draft');
  });
});
