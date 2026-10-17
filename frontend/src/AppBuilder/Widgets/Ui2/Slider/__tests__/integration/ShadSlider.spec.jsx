/**
 * UI 2.0 Slider: a number (or a range, when the default is a list) picked on a track.
 *
 * Real store, real RenderWidget, real widget; nothing about the widget is mocked. Standard control behaviour
 * (visibility, disabled, loading, tooltip) is covered for every UI 2.0 widget in Ui2/__tests__/controlState.spec.jsx;
 * this file covers what the Slider itself does. Titles carry [ShadSlider-<AREA>-<NNN>] scenario ids.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, screen, waitFor, fireEvent } from '@testing-library/react';
import { binding, setVariableOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'sl1';
const widget = createWidgetHarness({
  componentType: 'ShadSlider',
  handle: 'slider1',
  id: ID,
  widgetHeight: 64,
  widgetWidth: 320,
  defaultProperties: { label: binding('Volume') },
});

const render = (options = {}) => widget.render({ currentMode: 'view', ...options });
const thumbs = () => screen.getAllByRole('slider');
const exposed = () => widget.exposed() ?? {};
const press = (key, thumb = thumbs()[0]) =>
  act(async () => {
    thumb.focus();
    fireEvent.keyDown(thumb, { key });
  });

describe('UI 2.0 Slider', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadSlider-DEF-001] shows the label with the current value, the help text and one thumb at the default', async () => {
    render({ properties: { description: binding('Applies to every speaker') } });

    expect(await screen.findByText('Volume: 50')).toBeInTheDocument();
    expect(screen.getByText('Applies to every speaker')).toBeInTheDocument();
    expect(thumbs()).toHaveLength(1);
    expect(thumbs()[0]).toHaveAttribute('aria-valuenow', '50');
    expect(thumbs()[0]).toHaveAccessibleName('Volume');
    await waitFor(() => expect(exposed().value).toBe(50));
    expect(exposed().label).toBe('Volume');
  });

  test('[ShadSlider-PROP-001] min, max and defaultValue place the thumb, and a default outside them is kept inside', async () => {
    render({ properties: { min: binding('{{10}}'), max: binding('{{20}}'), defaultValue: binding('{{99}}') } });

    await waitFor(() => expect(thumbs()[0]).toHaveAttribute('aria-valuenow', '20'));
    expect(thumbs()[0]).toHaveAttribute('aria-valuemin', '10');
    expect(thumbs()[0]).toHaveAttribute('aria-valuemax', '20');
    expect(exposed().value).toBe(20);
  });

  test('[ShadSlider-PROP-002] step sets how far one key press moves the thumb', async () => {
    render({ properties: { step: binding('{{25}}') } });
    await waitFor(() => expect(exposed().value).toBe(50));

    await press('ArrowRight');

    await waitFor(() => expect(exposed().value).toBe(75));
    expect(screen.getByText('Volume: 75')).toBeInTheDocument();
  });

  test('[ShadSlider-PROP-003] a list as defaultValue makes a range: two thumbs, and the value is the pair', async () => {
    render({ properties: { defaultValue: binding('{{[10, 40]}}') } });

    expect(await screen.findByText('Volume: 10 to 40')).toBeInTheDocument();
    expect(thumbs()).toHaveLength(2);
    await waitFor(() => expect(exposed().value).toEqual([10, 40]));
  });

  test('[ShadSlider-DEF-002] a bound list of 10k values draws at most 10 thumbs', async () => {
    render({ properties: { defaultValue: binding('{{Array.from({ length: 10000 }, (_, i) => i)}}') } });

    await waitFor(() => expect(thumbs().length).toBeGreaterThan(0));
    expect(thumbs().length).toBeLessThanOrEqual(10);
  });

  test('[ShadSlider-EVT-001] moving the thumb fires onChange, and its handler reads the new value', async () => {
    render();
    widget.setEvents(setVariableOn(ID, 'onChange', { value: '{{components.slider1.value}}' }));

    await press('ArrowRight');

    await waitFor(() => expect(widget.variables().seen).toBe(51));
  });

  test('[ShadSlider-KBD-001] Home and End move the thumb to the ends of the track', async () => {
    render();

    await press('End');
    await waitFor(() => expect(exposed().value).toBe(100));
    await press('Home');
    await waitFor(() => expect(exposed().value).toBe(0));
  });

  test('[ShadSlider-ACT-001] setValue moves the thumb (kept inside min and max; a non-number changes nothing)', async () => {
    render();

    await widget.act('setValue', 80);
    await waitFor(() => expect(thumbs()[0]).toHaveAttribute('aria-valuenow', '80'));
    expect(exposed().value).toBe(80);

    await widget.act('setValue', 500);
    await waitFor(() => expect(exposed().value).toBe(100));
    await widget.act('setValue', 'loud');
    expect(exposed().value).toBe(100);
  });

  test('[ShadSlider-ACT-002] setRangeValue sets both ends of a range', async () => {
    render({ properties: { defaultValue: binding('{{[10, 40]}}') } });
    await waitFor(() => expect(exposed().value).toEqual([10, 40]));

    await widget.act('setRangeValue', 20, 70);

    await waitFor(() => expect(exposed().value).toEqual([20, 70]));
    expect(screen.getByText('Volume: 20 to 70')).toBeInTheDocument();
  });

  test('[ShadSlider-ACT-003] reset puts the thumb back at the default', async () => {
    render();
    await widget.act('setValue', 90);
    await waitFor(() => expect(exposed().value).toBe(90));

    await widget.act('reset');

    await waitFor(() => expect(exposed().value).toBe(50));
    expect(thumbs()[0]).toHaveAttribute('aria-valuenow', '50');
  });

  test('[ShadSlider-STY-001] accent, label, help and track colours reach the widget as CSS variables', async () => {
    const { container } = render({
      styles: {
        accentColor: binding('#16a34a'),
        labelColor: binding('#111111'),
        helpTextColor: binding('#222222'),
        trackColor: binding('#e5e7eb'),
      },
    });

    await waitFor(() => expect(thumbs()).toHaveLength(1));
    const root = container.querySelector('.tj-shadcn').style;
    expect(root.getPropertyValue('--sc-primary')).toBe('#16a34a');
    expect(root.getPropertyValue('--lk-label')).toBe('#111111');
    expect(root.getPropertyValue('--lk-help')).toBe('#222222');
    expect(root.getPropertyValue('--lk-track')).toBe('#e5e7eb');
  });
});
