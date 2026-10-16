/**
 * UI 2.0 Password input: a hidden text box with a show/hide button and an optional strength meter.
 *
 * Real store, real RenderWidget, real widget; nothing about the widget is mocked. Standard control behaviour
 * (visibility, disabled, loading, tooltip) is covered for every UI 2.0 widget in Ui2/__tests__/controlState.spec.jsx;
 * this file covers what the Password input itself does. Titles carry [ShadPasswordInput-<AREA>-<NNN>] scenario ids.
 */
import { act, screen, waitFor, fireEvent } from '@testing-library/react';
import {
  createWidgetHarness,
  binding,
  setVariableOn,
  countInvocationsOn,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'pw1';
const widget = createWidgetHarness({
  componentType: 'ShadPasswordInput',
  handle: 'password1',
  id: ID,
  widgetHeight: 64,
  widgetWidth: 320,
});

const render = (options = {}) => widget.render({ currentMode: 'view', ...options });
// The label (with its mandatory mark) names the box.
const box = () => screen.getByLabelText(/^Password/);
const exposed = () => widget.exposed() ?? {};
const type = (text) => act(async () => fireEvent.change(box(), { target: { value: text } }));
const leave = async () => {
  await act(async () => box().focus());
  await act(async () => box().blur());
};

describe('UI 2.0 Password input', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadPasswordInput-DEF-001] shows its label, help text and placeholder over a hidden box, and exposes an empty value', async () => {
    render({
      properties: { description: binding('At least 12 characters'), placeholder: binding('Choose a password') },
    });

    expect(await screen.findByText('At least 12 characters')).toBeInTheDocument();
    expect(box()).toHaveAttribute('type', 'password');
    expect(box()).toHaveAttribute('placeholder', 'Choose a password');
    await waitFor(() => expect(exposed().value).toBe(''));
    expect(exposed()).toMatchObject({ label: 'Password', strength: '', isValid: true, isMandatory: false });
  });

  test('[ShadPasswordInput-PROP-001] defaultValue fills the box and the exposed value', async () => {
    render({ properties: { defaultValue: binding('hunter2') } });

    await waitFor(() => expect(box()).toHaveValue('hunter2'));
    expect(exposed().value).toBe('hunter2');
  });

  test('[ShadPasswordInput-PROP-002] showToggle offers a button that shows and hides the password', async () => {
    render();
    const show = await screen.findByRole('button', { name: 'Show password' });

    await act(async () => fireEvent.click(show));
    expect(box()).toHaveAttribute('type', 'text');
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Hide password' })));
    expect(box()).toHaveAttribute('type', 'password');

    render({ properties: { showToggle: binding('{{false}}') } });
    await waitFor(() => expect(screen.queryByRole('button', { name: /password/ })).toBeNull());
  });

  test('[ShadPasswordInput-PROP-003] showStrength rates the password as it is typed and exposes the strength', async () => {
    render({ properties: { showStrength: binding('{{true}}') } });

    await type('abc');
    await waitFor(() => expect(exposed().strength).toBe('weak'));
    expect(screen.getByText('Weak')).toBeInTheDocument();

    await type('Tr0ub4dor&3-horse');
    await waitFor(() => expect(exposed().strength).toBe('strong'));
    expect(screen.getByText('Strong')).toBeInTheDocument();
  });

  test('[ShadPasswordInput-EXP-001] strength is exposed even with the meter hidden', async () => {
    render();

    await type('abcdefgh1');

    await waitFor(() => expect(exposed().strength).toBe('weak'));
    expect(screen.queryByText('Weak')).toBeNull();
  });

  test('[ShadPasswordInput-EVT-001] typing fires onChange, and its handler reads the new value', async () => {
    render();
    widget.setEvents(setVariableOn(ID, 'onChange', { value: '{{components.password1.value}}' }));

    await type('s3cret!');

    await waitFor(() => expect(widget.variables().seen).toBe('s3cret!'));
  });

  test('[ShadPasswordInput-EVT-002] Enter fires onEnterPressed, and focusing and leaving fire onFocus and onBlur', async () => {
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
    await act(async () => box().blur());
    await waitFor(() => expect(widget.variables().blurred).toBe('YES'));
  });

  test('[ShadPasswordInput-ACT-001] setText fills the box and clear empties it (and the strength)', async () => {
    render();

    await widget.act('setText', 'Tr0ub4dor&3-horse');
    await waitFor(() => expect(box()).toHaveValue('Tr0ub4dor&3-horse'));
    expect(exposed().value).toBe('Tr0ub4dor&3-horse');
    await waitFor(() => expect(exposed().strength).toBe('strong'));

    await widget.act('clear');
    await waitFor(() => expect(box()).toHaveValue(''));
    expect(exposed().value).toBe('');
    await waitFor(() => expect(exposed().strength).toBe(''));
  });

  test('[ShadPasswordInput-ACT-002] setFocus and setBlur move focus to and from the box', async () => {
    render();

    await widget.act('setFocus');
    expect(document.activeElement).toBe(box());
    await widget.act('setBlur');
    expect(document.activeElement).not.toBe(box());
  });

  test('[ShadPasswordInput-VAL-001] mandatory, regex, minLength and maxLength check the password once the box is left', async () => {
    render({
      validation: {
        mandatory: binding('{{true}}'),
        regex: binding('\\d'),
        minLength: binding('{{8}}'),
        maxLength: binding('{{12}}'),
      },
    });
    await waitFor(() => expect(exposed()).toMatchObject({ isValid: false, isMandatory: true }));

    await type('password');
    await leave();
    expect(await screen.findByRole('alert')).toHaveTextContent('The input should match pattern');
    await type('pass1');
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Minimum 8 characters is needed'));
    await type('password1234567');
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Maximum 12 characters is allowed'));
    await type('password12');
    await waitFor(() => expect(exposed().isValid).toBe(true));
  });

  test('[ShadPasswordInput-VAL-002] a customRule message makes the password invalid and is shown under the box', async () => {
    render({
      validation: { customRule: binding("{{components.password1.value === 'password' ? 'Too common' : ''}}") },
    });

    await type('password');
    await leave();

    await waitFor(() => expect(exposed().isValid).toBe(false));
    expect(await screen.findByText('Too common')).toBeInTheDocument();
  });

  test('[ShadPasswordInput-STY-001] icon and strength meter colours reach the widget as CSS variables', async () => {
    const { container } = render({
      styles: {
        textColor: binding('#333333'),
        iconColor: binding('#71717a'),
        weakColor: binding('#dc2626'),
        fairColor: binding('#d97706'),
        strongColor: binding('#16a34a'),
        meterTrackColor: binding('#e5e7eb'),
      },
    });

    await waitFor(() => expect(box()).toBeInTheDocument());
    const root = container.querySelector('.tj-shadcn').style;
    expect(root.getPropertyValue('--lk-fg')).toBe('#333333');
    expect(root.getPropertyValue('--lk-icon')).toBe('#71717a');
    expect(root.getPropertyValue('--lk-weak')).toBe('#dc2626');
    expect(root.getPropertyValue('--lk-fair')).toBe('#d97706');
    expect(root.getPropertyValue('--lk-strong')).toBe('#16a34a');
    expect(root.getPropertyValue('--lk-track')).toBe('#e5e7eb');
  });
});
