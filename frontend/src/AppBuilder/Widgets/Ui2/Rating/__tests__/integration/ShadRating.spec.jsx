/**
 * UI 2.0 Rating: a score picked on a row of stars, hearts or dots.
 *
 * Real store, real RenderWidget, real widget; nothing about the widget is mocked. Standard control behaviour
 * (visibility, disabled, loading, tooltip) is covered for every UI 2.0 widget in Ui2/__tests__/controlState.spec.jsx;
 * this file covers what the Rating itself does. Titles carry [ShadRating-<AREA>-<NNN>] scenario ids.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, screen, waitFor, fireEvent } from '@testing-library/react';
import { binding, setVariableOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'rt1';
const widget = createWidgetHarness({
  componentType: 'ShadRating',
  handle: 'rating1',
  id: ID,
  widgetHeight: 64,
  widgetWidth: 320,
  defaultProperties: { label: binding('Your rating') },
});

const render = (options = {}) => widget.render({ currentMode: 'view', ...options });
const radios = () => screen.getAllByRole('radio');
const checked = () => radios().findIndex((r) => r.getAttribute('aria-checked') === 'true') + 1;
const exposed = () => widget.exposed() ?? {};
const click = (position) => act(async () => fireEvent.click(radios()[position - 1]));
const press = (key, position = checked() || 1) => act(async () => fireEvent.keyDown(radios()[position - 1], { key }));

describe('UI 2.0 Rating', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadRating-DEF-001] draws five stars with the default four chosen, under its label and help text', async () => {
    render({ properties: { description: binding('One star is poor') } });

    expect(await screen.findByRole('radiogroup', { name: 'Your rating' })).toBeInTheDocument();
    expect(screen.getByText('One star is poor')).toBeInTheDocument();
    expect(radios()).toHaveLength(5);
    expect(radios()[0]).toHaveAccessibleName('1 of 5');
    expect(checked()).toBe(4);
    // The chosen icon is the one the keyboard reaches.
    expect(radios()[3].tabIndex).toBe(0);
    expect(radios()[0].querySelector('svg')).toHaveClass('lucide-star');
    await waitFor(() => expect(exposed().value).toBe(4));
    expect(exposed()).toMatchObject({ label: 'Your rating', isValid: true, isMandatory: false });
  });

  test('[ShadRating-PROP-001] max sets the number of icons (kept between 1 and 10) and defaultValue the score', async () => {
    render({ properties: { max: binding('{{50}}'), defaultValue: binding('{{3}}') } });

    await waitFor(() => expect(radios()).toHaveLength(10));
    expect(checked()).toBe(3);
    expect(exposed().value).toBe(3);
  });

  test('[ShadRating-PROP-002] icon draws hearts or dots, and size sets the icon size', async () => {
    render({ properties: { icon: binding('heart'), size: binding('lg') } });
    await waitFor(() => expect(radios()[0].querySelector('svg')).toHaveClass('lucide-heart'));
    expect(radios()[0].style.width).toBe('28px');

    render({ properties: { icon: binding('circle'), size: binding('sm') } });
    await waitFor(() => expect(radios()[0].querySelector('svg')).toHaveClass('lucide-circle'));
    expect(radios()[0].style.width).toBe('16px');
  });

  test('[ShadRating-PROP-003] allowHalf keeps a half score and draws the half icon', async () => {
    render({
      properties: { allowHalf: binding('{{true}}'), defaultValue: binding('{{3.5}}'), showValue: binding('{{true}}') },
    });

    await waitFor(() => expect(exposed().value).toBe(3.5));
    expect(screen.getByText('3.5 / 5')).toBeInTheDocument();
    expect(checked()).toBe(4);

    render({ properties: { allowHalf: binding('{{false}}'), defaultValue: binding('{{3.5}}') } });
    await waitFor(() => expect(exposed().value).toBe(4));
  });

  test('[ShadRating-PROP-004] clicking the chosen icon again clears the score', async () => {
    render();
    await waitFor(() => expect(checked()).toBe(4));

    await click(4);

    await waitFor(() => expect(exposed().value).toBe(0));
    expect(checked()).toBe(0);
  });

  test('[ShadRating-PROP-005] with allowClear off, neither a second click nor Delete clears the score', async () => {
    render({ properties: { allowClear: binding('{{false}}') } });
    await waitFor(() => expect(checked()).toBe(4));

    await click(4);
    await press('Delete', 4);

    expect(exposed().value).toBe(4);
    expect(checked()).toBe(4);
  });

  test('[ShadRating-PROP-006] readOnly shows the score but ignores clicks and keys', async () => {
    render({ properties: { readOnly: binding('{{true}}'), defaultValue: binding('{{3}}') } });

    expect(await screen.findByRole('radiogroup')).toHaveAttribute('aria-readonly', 'true');
    await click(1);
    await press('End', 3);
    expect(exposed().value).toBe(3);
    expect(checked()).toBe(3);
  });

  test('[ShadRating-PROP-007] showValue writes the score beside the icons, and valueLabels names each score', async () => {
    render({ properties: { showValue: binding('{{true}}') } });
    expect(await screen.findByText('4 / 5')).toBeInTheDocument();

    render({
      properties: {
        showValue: binding('{{true}}'),
        valueLabels: binding("{{['Poor', 'Fair', 'Good', 'Great', 'Superb']}}"),
      },
    });
    expect(await screen.findByText('Great')).toBeInTheDocument();
    expect(radios()[0]).toHaveAccessibleName('Poor');
  });

  test('[ShadRating-EVT-001] clicking an icon fires onChange, and its handler reads the new score', async () => {
    render();
    widget.setEvents(setVariableOn(ID, 'onChange', { value: '{{components.rating1.value}}' }));

    await click(2);

    await waitFor(() => expect(widget.variables().seen).toBe(2));
    expect(checked()).toBe(2);
  });

  test('[ShadRating-KBD-001] arrows step the score, Home and End jump, a digit picks, and focus follows', async () => {
    render();

    await press('End');
    await waitFor(() => expect(exposed().value).toBe(5));
    await press('ArrowLeft');
    await waitFor(() => expect(exposed().value).toBe(4));
    expect(document.activeElement).toBe(radios()[3]);
    await press('Home');
    await waitFor(() => expect(exposed().value).toBe(1));
    await press('3');
    await waitFor(() => expect(exposed().value).toBe(3));
    await press('Backspace');
    await waitFor(() => expect(exposed().value).toBe(0));
  });

  test('[ShadRating-ACT-001] setValue sets the score (kept within max), clear empties it, resetValue restores the default', async () => {
    render();

    await widget.act('setValue', 2);
    await waitFor(() => expect(checked()).toBe(2));
    await widget.act('setValue', 99);
    await waitFor(() => expect(exposed().value).toBe(5));

    await widget.act('clear');
    await waitFor(() => expect(exposed().value).toBe(0));

    await widget.act('resetValue');
    await waitFor(() => expect(exposed().value).toBe(4));
    expect(checked()).toBe(4);
  });

  test('[ShadRating-VAL-001] a mandatory rating with no score is invalid, and a score makes it valid', async () => {
    render({ properties: { defaultValue: binding('{{0}}') }, validation: { mandatory: binding('{{true}}') } });

    await waitFor(() => expect(exposed()).toMatchObject({ isValid: false, isMandatory: true }));
    await click(3);
    await waitFor(() => expect(exposed().isValid).toBe(true));
  });

  test('[ShadRating-VAL-002] a customRule message makes the score invalid and is shown under the icons', async () => {
    render({
      validation: { customRule: binding("{{components.rating1.value < 2 ? 'Tell us what went wrong' : ''}}") },
    });

    await click(1);

    await waitFor(() => expect(exposed().isValid).toBe(false));
    expect(await screen.findByRole('alert')).toHaveTextContent('Tell us what went wrong');
  });

  test('[ShadRating-STY-001] icon, value, label, help, focus and error colours reach the widget as CSS variables', async () => {
    const { container } = render({
      styles: {
        filledColor: binding('#f59e0b'),
        emptyColor: binding('#e5e7eb'),
        valueTextColor: binding('#333333'),
        labelColor: binding('#111111'),
        helpTextColor: binding('#222222'),
        accentColor: binding('#2563eb'),
        errorColor: binding('#b91c1c'),
      },
    });

    await waitFor(() => expect(radios()).toHaveLength(5));
    const root = container.querySelector('.tj-shadcn').style;
    expect(root.getPropertyValue('--lk-on')).toBe('#f59e0b');
    expect(root.getPropertyValue('--lk-off')).toBe('#e5e7eb');
    expect(root.getPropertyValue('--lk-value')).toBe('#333333');
    expect(root.getPropertyValue('--lk-label')).toBe('#111111');
    expect(root.getPropertyValue('--lk-help')).toBe('#222222');
    expect(root.getPropertyValue('--sc-ring')).toBe('#2563eb');
    expect(root.getPropertyValue('--lk-error')).toBe('#b91c1c');
  });
});
