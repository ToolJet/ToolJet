/**
 * UI 2.0 Textarea: a multi-line text box.
 *
 * Real store, real RenderWidget, real widget; nothing about the widget is mocked. Standard control behaviour
 * (visibility, disabled, loading, tooltip) is covered for every UI 2.0 widget in Ui2/__tests__/controlState.spec.jsx;
 * this file covers what the Textarea itself does. Titles carry [ShadTextarea-<AREA>-<NNN>] scenario ids.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, screen, waitFor, fireEvent } from '@testing-library/react';
import { binding, setVariableOn, countInvocationsOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'ta1';
const widget = createWidgetHarness({
  componentType: 'ShadTextarea',
  handle: 'textarea1',
  id: ID,
  widgetHeight: 140,
  widgetWidth: 320,
  defaultProperties: { label: binding('Notes') },
});

const render = (options = {}) => widget.render({ currentMode: 'view', ...options });
const area = () => screen.getByRole('textbox');
const exposed = () => widget.exposed() ?? {};
const type = (text) => act(async () => fireEvent.change(area(), { target: { value: text } }));
const leave = async () => {
  await act(async () => area().focus());
  await act(async () => area().blur());
};

describe('UI 2.0 Textarea', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadTextarea-DEF-001] shows the label, help text and placeholder in a multi-line box, and exposes the label', async () => {
    render({ properties: { description: binding('Visible to the customer'), placeholder: binding('Write a note') } });

    expect(await screen.findByText('Notes')).toBeInTheDocument();
    expect(screen.getByText('Visible to the customer')).toBeInTheDocument();
    expect(area().tagName).toBe('TEXTAREA');
    expect(area()).toHaveAttribute('placeholder', 'Write a note');
    expect(screen.getByLabelText('Notes')).toBe(area());
    await waitFor(() => expect(exposed().value).toBe(''));
    expect(exposed().label).toBe('Notes');
    expect(exposed()).toMatchObject({ isValid: true, isMandatory: false });
  });

  test('[ShadTextarea-DEF-002] the text area keeps at least 60px of height, whatever the widget height', async () => {
    widget.render({ currentMode: 'view' });
    await waitFor(() => expect(area()).toBeInTheDocument());

    expect(parseFloat(area().style.height)).toBeGreaterThanOrEqual(60);
  });

  test('[ShadTextarea-PROP-001] defaultValue fills the box, line breaks included', async () => {
    render({ properties: { defaultValue: binding('Line one\nLine two') } });

    await waitFor(() => expect(area()).toHaveValue('Line one\nLine two'));
    expect(exposed().value).toBe('Line one\nLine two');
  });

  test('[ShadTextarea-EVT-001] typing fires onChange, and its handler reads the new value', async () => {
    render();
    widget.setEvents(setVariableOn(ID, 'onChange', { value: '{{components.textarea1.value}}' }));

    await type('hello');

    await waitFor(() => expect(widget.variables().seen).toBe('hello'));
  });

  test('[ShadTextarea-EVT-002] Enter fires onEnterPressed, Shift+Enter (a new line) does not', async () => {
    render();
    widget.setEvents(countInvocationsOn(ID, 'onEnterPressed'));

    await act(async () => fireEvent.keyDown(area(), { key: 'Enter', shiftKey: true }));
    await act(async () => fireEvent.keyDown(area(), { key: 'Enter' }));

    await waitFor(() => expect(widget.variables().calls).toBe(1));
  });

  test('[ShadTextarea-EVT-003] focusing and leaving the box fire onFocus and onBlur', async () => {
    render();
    widget.setEvents([
      ...setVariableOn(ID, 'onFocus', { key: 'focused' }),
      ...setVariableOn(ID, 'onBlur', { key: 'blurred' }),
    ]);

    await act(async () => area().focus());
    await waitFor(() => expect(widget.variables().focused).toBe('YES'));
    await act(async () => area().blur());
    await waitFor(() => expect(widget.variables().blurred).toBe('YES'));
  });

  test('[ShadTextarea-ACT-001] setText fills the box and clear empties it', async () => {
    render();

    await widget.act('setText', 'From a query');
    await waitFor(() => expect(area()).toHaveValue('From a query'));
    expect(exposed().value).toBe('From a query');

    await widget.act('clear');
    await waitFor(() => expect(area()).toHaveValue(''));
    expect(exposed().value).toBe('');
  });

  test('[ShadTextarea-ACT-002] setFocus and setBlur move focus to and from the box', async () => {
    render();

    await widget.act('setFocus');
    expect(document.activeElement).toBe(area());
    await widget.act('setBlur');
    expect(document.activeElement).not.toBe(area());
  });

  test('[ShadTextarea-VAL-001] mandatory marks the label, and the message shows only once the box is left', async () => {
    render({ validation: { mandatory: binding('{{true}}') } });

    await waitFor(() => expect(exposed()).toMatchObject({ isValid: false, isMandatory: true }));
    expect(screen.getByText('*')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).toBeNull();

    await leave();
    expect(await screen.findByRole('alert')).toHaveTextContent('Field cannot be empty');

    await type('Done');
    await waitFor(() => expect(exposed().isValid).toBe(true));
  });

  test('[ShadTextarea-VAL-002] regex, minLength and maxLength check the text', async () => {
    render({
      validation: { regex: binding('^[a-z ]*$'), minLength: binding('{{2}}'), maxLength: binding('{{6}}') },
    });

    await type('ABC');
    await leave();
    expect(await screen.findByRole('alert')).toHaveTextContent('The input should match pattern');

    await type('a');
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Minimum 2 characters is needed'));

    await type('abcdefg');
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Maximum 6 characters is allowed'));

    await type('abc');
    await waitFor(() => expect(exposed().isValid).toBe(true));
  });

  test('[ShadTextarea-VAL-003] a customRule message makes the text invalid and is shown under the box', async () => {
    render({
      validation: { customRule: binding("{{components.textarea1.value.includes('TODO') ? 'Finish the note' : ''}}") },
    });

    await type('TODO later');
    await leave();

    await waitFor(() => expect(exposed().isValid).toBe(false));
    expect(await screen.findByText('Finish the note')).toBeInTheDocument();
  });

  test('[ShadTextarea-STY-001] colour and radius styles reach the widget as CSS variables', async () => {
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
        borderRadius: binding('{{12}}'),
      },
    });

    await waitFor(() => expect(area()).toBeInTheDocument());
    const root = container.querySelector('.tj-shadcn').style;
    expect(root.getPropertyValue('--lk-label')).toBe('#111111');
    expect(root.getPropertyValue('--lk-help')).toBe('#222222');
    expect(root.getPropertyValue('--lk-bg')).toBe('#fefefe');
    expect(root.getPropertyValue('--lk-fg')).toBe('#333333');
    expect(root.getPropertyValue('--lk-placeholder')).toBe('#444444');
    expect(root.getPropertyValue('--lk-border')).toBe('#555555');
    expect(root.getPropertyValue('--sc-primary')).toBe('#e11d48');
    expect(root.getPropertyValue('--lk-error')).toBe('#b91c1c');
    expect(root.getPropertyValue('--lk-radius')).toBe('12px');
  });
});
