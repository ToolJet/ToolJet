/**
 * UI 2.0 OTP input: a one-time code typed or pasted into a row of boxes.
 *
 * Real store, real RenderWidget, real widget; nothing about the widget is mocked. Standard control behaviour
 * (visibility, disabled, loading, tooltip) is covered for every UI 2.0 widget in Ui2/__tests__/controlState.spec.jsx;
 * this file covers what the OTP input itself does. Titles carry [ShadOtpInput-<AREA>-<NNN>] scenario ids.
 */
import { act, screen, waitFor, fireEvent } from '@testing-library/react';
import {
  createWidgetHarness,
  binding,
  setVariableOn,
  countInvocationsOn,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'otp1';
const widget = createWidgetHarness({
  componentType: 'ShadOtpInput',
  handle: 'otp1',
  id: ID,
  widgetHeight: 72,
  widgetWidth: 360,
});

const render = (options = {}) => widget.render({ currentMode: 'view', ...options });
// One hidden input takes the typing; the boxes draw its characters.
const input = () => screen.getByRole('textbox', { name: 'Verification code' });
const slots = (container) => [...container.querySelectorAll('[data-slot="otp"]')];
const shown = (container) =>
  slots(container)
    .map((s) => s.textContent)
    .join('');
const exposed = () => widget.exposed() ?? {};
const type = (text) => act(async () => fireEvent.change(input(), { target: { value: text } }));
const leave = async () => {
  await act(async () => input().focus());
  await act(async () => input().blur());
};

describe('UI 2.0 OTP input', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadOtpInput-DEF-001] shows its label, help text and six empty boxes, and exposes an incomplete empty code', async () => {
    const { container } = render({ properties: { description: binding('Sent to your phone') } });

    expect(await screen.findByText('Sent to your phone')).toBeInTheDocument();
    expect(slots(container)).toHaveLength(6);
    expect(shown(container)).toBe('');
    await waitFor(() => expect(exposed().value).toBe(''));
    expect(exposed()).toMatchObject({
      isComplete: false,
      label: 'Verification code',
      isValid: true,
      isMandatory: false,
    });
  });

  test('[ShadOtpInput-PROP-001] length sets the number of boxes (4 to 8), and defaultValue fills them', async () => {
    const { container } = render({ properties: { length: binding('{{4}}'), defaultValue: binding('1234') } });

    await waitFor(() => expect(shown(container)).toBe('1234'));
    expect(slots(container)).toHaveLength(4);
    expect(exposed()).toMatchObject({ value: '1234', isComplete: true });

    render({ properties: { length: binding('{{20}}') } });
    await waitFor(() => expect(slots(container)).toHaveLength(8));
  });

  test('[ShadOtpInput-PROP-002] characters numeric keeps digits only; alphanumeric keeps letters too, in capitals', async () => {
    const { container } = render();
    await type('a1b2-c3');
    await waitFor(() => expect(exposed().value).toBe('123'));

    render({ properties: { characters: binding('alphanumeric') } });
    await type('a1b2-c3');
    await waitFor(() => expect(exposed().value).toBe('A1B2C3'));
    expect(shown(container)).toBe('A1B2C3');
  });

  test('[ShadOtpInput-PROP-003] separator splits the boxes in two halves, and masked hides the characters', async () => {
    const { container } = render({
      properties: {
        length: binding('{{4}}'),
        separator: binding('{{true}}'),
        masked: binding('{{true}}'),
        defaultValue: binding('1234'),
      },
    });

    expect(await screen.findByRole('separator')).toBeInTheDocument();
    expect(screen.getAllByText('•')).toHaveLength(4);
    expect(shown(container)).not.toMatch(/\d/);
  });

  test('[ShadOtpInput-PROP-004] slotStyle separate draws each box with its own border; joined draws them as one strip', async () => {
    const { container } = render({ properties: { slotStyle: binding('separate') } });
    await waitFor(() => expect(slots(container)[1]).toHaveClass('tw-border'));
    expect(slots(container)[1]).not.toHaveClass('tw-border-y');

    render({ properties: { slotStyle: binding('joined') } });
    await waitFor(() => expect(slots(container)[1]).toHaveClass('tw-border-y'));
  });

  test('[ShadOtpInput-PROP-005] placeholder shows its first character in each empty box', async () => {
    const { container } = render({ properties: { length: binding('{{4}}'), placeholder: binding('o-') } });

    await waitFor(() => expect(shown(container)).toBe('oooo'));
    await type('12');
    await waitFor(() => expect(shown(container)).toBe('12oo'));
  });

  test('[ShadOtpInput-EVT-001] typing fires onChange; the last character fires onComplete, whose handler reads isComplete', async () => {
    render();
    widget.setEvents([
      ...countInvocationsOn(ID, 'onChange', { key: 'changes' }),
      ...setVariableOn(ID, 'onComplete', { key: 'complete', value: '{{components.otp1.isComplete}}' }),
    ]);

    await type('12');
    await waitFor(() => expect(widget.variables().changes).toBe(1));
    expect(widget.variables().complete).toBeUndefined();
    expect(exposed()).toMatchObject({ value: '12', isComplete: false });

    await type('123-456');
    await waitFor(() => expect(widget.variables().complete).toBe(true));
    expect(widget.variables().changes).toBe(2);
    expect(exposed().value).toBe('123456');
  });

  test('[ShadOtpInput-EVT-002] focusing and leaving the boxes fire onFocus and onBlur', async () => {
    render();
    widget.setEvents([
      ...setVariableOn(ID, 'onFocus', { key: 'focused' }),
      ...setVariableOn(ID, 'onBlur', { key: 'blurred' }),
    ]);

    await act(async () => input().focus());
    await waitFor(() => expect(widget.variables().focused).toBe('YES'));
    await act(async () => input().blur());
    await waitFor(() => expect(widget.variables().blurred).toBe('YES'));
  });

  test('[ShadOtpInput-ACT-001] setText fills the boxes as a paste does, and clear empties them', async () => {
    const { container } = render();

    await widget.act('setText', '98 76 54 32');
    await waitFor(() => expect(shown(container)).toBe('987654'));
    expect(exposed()).toMatchObject({ value: '987654', isComplete: true });

    await widget.act('clear');
    await waitFor(() => expect(shown(container)).toBe(''));
    expect(exposed()).toMatchObject({ value: '', isComplete: false });
  });

  test('[ShadOtpInput-ACT-002] setFocus and setBlur move focus to and from the boxes', async () => {
    render();

    await widget.act('setFocus');
    expect(document.activeElement).toBe(input());
    await widget.act('setBlur');
    expect(document.activeElement).not.toBe(input());
  });

  test('[ShadOtpInput-VAL-001] a part-typed code is invalid and asks for every character once the boxes are left', async () => {
    render();

    await type('12');
    await leave();

    await waitFor(() => expect(exposed().isValid).toBe(false));
    expect(await screen.findByRole('alert')).toHaveTextContent('Enter all 6 characters');
    await type('123456');
    await waitFor(() => expect(exposed().isValid).toBe(true));
  });

  test('[ShadOtpInput-VAL-002] a mandatory code is invalid while empty', async () => {
    render({ validation: { mandatory: binding('{{true}}') } });

    await waitFor(() => expect(exposed()).toMatchObject({ isValid: false, isMandatory: true }));
    await leave();
    expect(await screen.findByRole('alert')).toHaveTextContent('Field cannot be empty');
  });

  test('[ShadOtpInput-VAL-003] regex, minLength and maxLength check the whole code', async () => {
    render({ validation: { regex: binding('^9'), minLength: binding('{{6}}'), maxLength: binding('{{5}}') } });

    await type('123456');
    await leave();
    expect(await screen.findByRole('alert')).toHaveTextContent('The input should match pattern');
    await type('923456');
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Maximum 5 characters is allowed'));

    render({
      properties: { length: binding('{{4}}') },
      validation: { minLength: binding('{{6}}'), regex: binding(''), maxLength: binding('') },
    });
    await type('1234');
    await leave();
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Minimum 6 characters is needed'));
  });

  test('[ShadOtpInput-VAL-004] a customRule message makes the code invalid and is shown under the boxes', async () => {
    render({ validation: { customRule: binding("{{components.otp1.value === '000000' ? 'Code expired' : ''}}") } });

    await type('000000');
    await leave();

    await waitFor(() => expect(exposed().isValid).toBe(false));
    expect(await screen.findByText('Code expired')).toBeInTheDocument();
  });

  test('[ShadOtpInput-STY-001] box, separator and size styles reach the widget as CSS variables', async () => {
    const { container } = render({
      styles: {
        backgroundColor: binding('#fefefe'),
        textColor: binding('#333333'),
        borderColor: binding('#555555'),
        separatorColor: binding('#a1a1aa'),
        slotSize: binding('{{48}}'),
      },
    });

    await waitFor(() => expect(slots(container)).toHaveLength(6));
    const root = container.querySelector('.tj-shadcn').style;
    expect(root.getPropertyValue('--lk-bg')).toBe('#fefefe');
    expect(root.getPropertyValue('--lk-fg')).toBe('#333333');
    expect(root.getPropertyValue('--lk-border')).toBe('#555555');
    expect(root.getPropertyValue('--lk-sep')).toBe('#a1a1aa');
    expect(root.getPropertyValue('--lk-slot')).toBe('48px');
  });
});
