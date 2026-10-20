/**
 * UI 2.0 Color picker: a colour field opening a picker (saturation area, hue and opacity sliders, hex box, swatches).
 *
 * Real store, real RenderWidget, real widget; nothing about the widget is mocked. Standard control behaviour
 * (visibility, disabled, loading, tooltip) is covered for every UI 2.0 widget in Ui2/__tests__/controlState.spec.jsx;
 * this file covers what the Color picker itself does. Titles carry [ShadColorPicker-<AREA>-<NNN>] scenario ids.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, screen, waitFor, fireEvent } from '@testing-library/react';
import { binding, setVariableOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'color1';
const widget = createWidgetHarness({
  componentType: 'ShadColorPicker',
  handle: 'colorpicker1',
  id: ID,
  widgetHeight: 64,
  widgetWidth: 320,
  defaultProperties: {
    label: binding('Brand color'),
    defaultValue: binding('#6366f1'),
    swatches: binding("{{['#0f172a', '#ef4444', '#22c55e', '#6366f1']}}"),
  },
});

// Interactions are tested as an app user meets them: in view mode, where the editor's canvas does not take presses.
const render = (options = {}) => widget.render({ currentMode: 'view', ...options });
const exposed = () => widget.exposed() ?? {};
const trigger = () => document.querySelector(`[id^="shad-${ID}-"]`);
const open = async () => {
  await act(async () => fireEvent.click(trigger()));
  await screen.findByLabelText('Hex color');
};
const typeHex = async (text) => {
  const hex = screen.getByLabelText('Hex color');
  await act(async () => {
    fireEvent.change(hex, { target: { value: text } });
    fireEvent.keyDown(hex, { key: 'Enter' });
  });
};

describe('UI 2.0 Color picker', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadColorPicker-DEF-001] shows the label, help text and defaultValue, and exposes it as hex, rgb and rgba', async () => {
    render({ properties: { description: binding('Used on buttons and links') } });

    expect(await screen.findByText('Brand color')).toBeInTheDocument();
    expect(screen.getByText('Used on buttons and links')).toBeInTheDocument();
    expect(trigger()).toHaveTextContent('#6366f1');
    await waitFor(() => expect(exposed().value).toBe('#6366f1'));
    expect(exposed()).toMatchObject({
      selectedColorRGB: 'rgb(99, 102, 241)',
      selectedColorRGBA: 'rgba(99, 102, 241, 1)',
      colorFormat: 'hex',
      allowOpacity: false,
      isValid: true,
      label: 'Brand color',
    });
  });

  test('[ShadColorPicker-PROP-001] with no colour set the field shows the placeholder', async () => {
    render({ properties: { defaultValue: binding(''), placeholder: binding('Choose a colour') } });

    await waitFor(() => expect(trigger()).toHaveTextContent('Choose a colour'));
    expect(exposed().value).toBe('');
  });

  test('[ShadColorPicker-EVT-001] picking a swatch fires onChange, and its handler reads the new value', async () => {
    render();
    widget.setEvents(setVariableOn(ID, 'onChange', { value: '{{components.colorpicker1.value}}' }));
    await open();

    expect(screen.getByRole('button', { name: '#6366f1' })).toHaveAttribute('aria-pressed', 'true');
    await act(async () => fireEvent.click(screen.getByRole('button', { name: '#22c55e' })));

    await waitFor(() => expect(widget.variables().seen).toBe('#22c55e'));
    expect(exposed().selectedColorRGB).toBe('rgb(34, 197, 94)');
  });

  test('[ShadColorPicker-PROP-002] a typed hex is read (short forms too) and an unreadable one is put back', async () => {
    render();
    await open();

    await typeHex('abc');
    await waitFor(() => expect(exposed().value).toBe('#aabbcc'));
    await typeHex('not a colour');
    expect(exposed().value).toBe('#aabbcc');
    expect(screen.getByLabelText('Hex color')).toHaveValue('#aabbcc');
  });

  test('[ShadColorPicker-KBD-001] arrow keys on the hue slider change the colour', async () => {
    render({ properties: { defaultValue: binding('#aabbcc') } });
    await open();

    await act(async () =>
      fireEvent.keyDown(screen.getByRole('slider', { name: 'Hue' }), { key: 'ArrowRight', shiftKey: true })
    );

    await waitFor(() => expect(exposed().value).not.toBe('#aabbcc'));
    expect(exposed().value).toMatch(/^#[0-9a-f]{6}$/);
  });

  test('[ShadColorPicker-PROP-003] swatches lists the given colours; showSwatches off hides them', async () => {
    render();
    await open();
    expect(screen.getAllByRole('button', { name: /^#/ })).toHaveLength(4);
    await act(async () => fireEvent.keyDown(document.activeElement, { key: 'Escape' }));

    render({ properties: { showSwatches: binding('{{false}}') } });
    await open();
    expect(screen.queryByRole('button', { name: '#22c55e' })).toBeNull();
  });

  test('[ShadColorPicker-PROP-004] showPicker off leaves only the hex box and swatches', async () => {
    render({ properties: { showPicker: binding('{{false}}') } });
    await open();

    expect(screen.queryByRole('slider', { name: 'Hue' })).toBeNull();
    expect(screen.queryByRole('slider', { name: 'Saturation and brightness' })).toBeNull();
    expect(screen.getByLabelText('Hex color')).toBeInTheDocument();
  });

  test('[ShadColorPicker-PROP-005] allowAlpha keeps transparency and adds an opacity slider', async () => {
    render({ properties: { allowAlpha: binding('{{true}}'), defaultValue: binding('#ff000080') } });

    await waitFor(() => expect(exposed().value).toBe('#ff000080'));
    expect(exposed().selectedColorRGBA).toBe('rgba(255, 0, 0, 0.5)');
    expect(exposed().allowOpacity).toBe(true);
    await open();
    expect(screen.getByRole('slider', { name: 'Opacity' })).toHaveAttribute('aria-valuenow', '50');
  });

  test('[ShadColorPicker-PROP-006] triggerStyle swatch draws only a swatch, named for screen readers', async () => {
    render({ properties: { triggerStyle: binding('swatch') } });

    expect(await screen.findByRole('button', { name: 'Color #6366f1' })).toBeInTheDocument();
    expect(trigger()).not.toHaveTextContent('#6366f1');
  });

  test('[ShadColorPicker-EVT-002] focusing and leaving the field fire onFocus and onBlur', async () => {
    render();
    widget.setEvents([
      ...setVariableOn(ID, 'onFocus', { key: 'focused' }),
      ...setVariableOn(ID, 'onBlur', { key: 'blurred' }),
    ]);

    await act(async () => trigger().focus());
    await waitFor(() => expect(widget.variables().focused).toBe('YES'));
    await act(async () => trigger().blur());
    await waitFor(() => expect(widget.variables().blurred).toBe('YES'));
  });

  test('[ShadColorPicker-ACT-001] setColor reads hex or rgb text, and ignores text that is not a colour', async () => {
    render();

    await widget.act('setColor', 'rgb(255, 0, 0)');
    await waitFor(() => expect(exposed().value).toBe('#ff0000'));
    expect(trigger()).toHaveTextContent('#ff0000');
    await widget.act('setColor', 'not a colour');
    expect(exposed().value).toBe('#ff0000');
  });

  test('[ShadColorPicker-ACT-002] setFocus and setBlur move focus to and from the field', async () => {
    render();

    await widget.act('setFocus');
    expect(document.activeElement).toBe(trigger());
    await widget.act('setBlur');
    expect(document.activeElement).not.toBe(trigger());
  });

  test('[ShadColorPicker-STY-001] field and menu styles reach the field and its picker as CSS variables', async () => {
    const { container } = render({
      styles: { accentColor: binding('#e11d48'), menuBackgroundColor: binding('#fef3c7') },
    });

    await waitFor(() => expect(trigger()).toBeInTheDocument());
    expect(container.querySelector('.tj-shadcn').style.getPropertyValue('--sc-primary')).toBe('#e11d48');
    await open();
    const panel = screen.getByLabelText('Hex color').closest('[data-radix-popper-content-wrapper] > *');
    expect(panel.style.getPropertyValue('--lk-menu-bg')).toBe('#fef3c7');
  });
});
