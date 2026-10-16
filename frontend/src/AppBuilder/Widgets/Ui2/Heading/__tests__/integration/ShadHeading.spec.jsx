/**
 * UI 2.0 Heading: a page or section title at a chosen level.
 *
 * Real store, real RenderWidget, real widget; nothing about the widget is mocked. Standard control behaviour
 * (visibility, disabled, loading, tooltip) is covered for every UI 2.0 widget in Ui2/__tests__/controlState.spec.jsx;
 * this file covers what the Heading itself does. Titles carry [ShadHeading-<AREA>-<NNN>] scenario ids.
 */
import { act, screen, waitFor, fireEvent } from '@testing-library/react';
import {
  createWidgetHarness,
  binding,
  setVariableOn,
  countInvocationsOn,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { FONT_STACKS } from '@/AppBuilder/Widgets/Ui2/_shared/looks/typeLook';

const ID = 'head1';
const widget = createWidgetHarness({
  componentType: 'ShadHeading',
  handle: 'heading1',
  id: ID,
  widgetHeight: 48,
  widgetWidth: 360,
  defaultProperties: { text: binding('Booking desk') },
});

const render = (options = {}) => widget.render({ currentMode: 'view', ...options });
const heading = () => screen.getByRole('heading');
const exposed = () => widget.exposed() ?? {};

describe('UI 2.0 Heading', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadHeading-DEF-001] shows its text as an h2 and exposes it as text', async () => {
    render();

    const h = await screen.findByRole('heading', { level: 2 });
    expect(h).toHaveTextContent('Booking desk');
    await waitFor(() => expect(exposed().text).toBe('Booking desk'));
  });

  test('[ShadHeading-PROP-001] level picks the heading element, and an unknown level falls back to h2', async () => {
    render({ properties: { level: binding('h1') } });
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('Booking desk');

    render({ properties: { level: binding('h4') } });
    expect(await screen.findByRole('heading', { level: 4 })).toBeInTheDocument();

    render({ properties: { level: binding('h9') } });
    expect(await screen.findByRole('heading', { level: 2 })).toBeInTheDocument();
  });

  test('[ShadHeading-EVT-001] clicking the heading fires onClick, and pointing at it fires onHover', async () => {
    const { container } = render();
    widget.setEvents([...countInvocationsOn(ID, 'onClick'), ...setVariableOn(ID, 'onHover', { key: 'hovered' })]);
    const h2 = container.querySelector('h2');

    await act(async () => fireEvent.click(h2));
    await waitFor(() => expect(widget.variables().calls).toBe(1));
    await act(async () => fireEvent.mouseEnter(h2));
    await waitFor(() => expect(widget.variables().hovered).toBe('YES'));
  });

  test('[ShadHeading-KBD-001] with onClick wired the heading is a focusable button that Enter presses', async () => {
    render();
    expect(heading()).not.toHaveAttribute('role', 'button');

    widget.setEvents(countInvocationsOn(ID, 'onClick'));
    const button = await screen.findByRole('button', { name: 'Booking desk' });
    expect(button).toHaveAttribute('tabindex', '0');
    expect(button).toHaveClass('cursor-pointer');

    await act(async () => fireEvent.keyDown(button, { key: 'Enter' }));
    await waitFor(() => expect(widget.variables().calls).toBe(1));
  });

  test('[ShadHeading-EVT-002] a disabled heading ignores clicks', async () => {
    render({ properties: { disabledState: binding('{{true}}') } });
    widget.setEvents(countInvocationsOn(ID, 'onClick'));

    await act(async () => fireEvent.click(heading()));

    expect(widget.variables().calls).toBeUndefined();
    expect(heading()).not.toHaveAttribute('role', 'button');
  });

  test('[ShadHeading-ACT-001] setText changes the text until the Text property changes; clear empties it', async () => {
    render();

    await widget.act('setText', 'Arrivals');
    await waitFor(() => expect(heading()).toHaveTextContent('Arrivals'));
    expect(exposed().text).toBe('Arrivals');

    await widget.act('clear');
    await waitFor(() => expect(exposed().text).toBe(''));
    expect(heading()).toHaveTextContent('');

    render({ properties: { text: binding('Departures') } });
    await waitFor(() => expect(heading()).toHaveTextContent('Departures'));
    expect(exposed().text).toBe('Departures');
  });

  test('[ShadHeading-STY-001] by default the heading keeps the theme font, with no typeface classes', async () => {
    const { container } = render();

    await screen.findByRole('heading');
    expect(heading().className).not.toMatch(/lk-font|lk-case|lk-tracking|lk-weight|lk-size/);
    expect(container.querySelector('.tj-shadcn').style.getPropertyValue('--lk-font')).toBe('');
  });

  test('[ShadHeading-STY-002] colour, alignment and typeface styles reach the heading', async () => {
    const { container } = render({
      properties: { level: binding('h1') },
      styles: {
        textColor: binding('#1e3a8a'),
        textAlign: binding('center'),
        fontFamily: binding('serif'),
        fontWeight: binding('500'),
        letterSpacing: binding('{{2}}'),
        textTransform: binding('uppercase'),
        fontSize: binding('{{40}}'),
      },
    });

    const h1 = await screen.findByRole('heading', { level: 1 });
    const root = container.querySelector('.tj-shadcn');
    expect(root.style.getPropertyValue('--lk-fg')).toBe('#1e3a8a');
    expect(root.style.getPropertyValue('--lk-font')).toBe(FONT_STACKS.serif);
    expect(root.style.getPropertyValue('--lk-weight')).toBe('500');
    expect(root.style.getPropertyValue('--lk-tracking')).toBe('2px');
    expect(root.style.getPropertyValue('--lk-case')).toBe('uppercase');
    expect(root.style.getPropertyValue('--lk-size')).toBe('40px');
    expect(h1).toHaveClass('lk-font', 'lk-weight', 'lk-tracking', 'lk-case', 'lk-size');
    expect(h1.style.textAlign).toBe('center');
  });
});
