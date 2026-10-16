/**
 * UI 2.0 Empty: an empty state with a title, a description and an optional action button.
 *
 * Real store, real RenderWidget, real widget; nothing about the widget is mocked. Standard control behaviour
 * (visibility, disabled, loading, tooltip) is covered for every UI 2.0 widget in Ui2/__tests__/controlState.spec.jsx;
 * this file covers what the Empty itself does. Titles carry [ShadEmpty-<AREA>-<NNN>] scenario ids.
 */
import { act, screen, waitFor, fireEvent } from '@testing-library/react';
import {
  createWidgetHarness,
  binding,
  countInvocationsOn,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'empty1';
const widget = createWidgetHarness({
  componentType: 'ShadEmpty',
  handle: 'empty1',
  id: ID,
  widgetHeight: 200,
  widgetWidth: 360,
  defaultProperties: { title: binding('No orders yet') },
});

const render = (options = {}) => widget.render({ currentMode: 'view', ...options });

describe('UI 2.0 Empty', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadEmpty-DEF-001] shows its title in a box the height of the widget, with no button by default', async () => {
    const { container } = render();

    expect(await screen.findByText('No orders yet')).toBeInTheDocument();
    expect(screen.queryByRole('button')).toBeNull();
    // The height RenderWidget gives it: the widget's 200px less the wrapper's 2px padding on each side.
    expect(container.querySelector('.tj-shadcn > div').style.minHeight).toBe('196px');
  });

  test('[ShadEmpty-PROP-001] description and actionLabel add help text and an action button', async () => {
    render({
      properties: { description: binding('Orders show here once placed.'), actionLabel: binding('New order') },
    });

    expect(await screen.findByText('Orders show here once placed.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'New order' })).toBeInTheDocument();
  });

  test('[ShadEmpty-EVT-001] pressing the action button fires onActionClicked once', async () => {
    render({ properties: { actionLabel: binding('New order') } });
    widget.setEvents(countInvocationsOn(ID, 'onActionClicked'));

    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'New order' })));

    await waitFor(() => expect(widget.variables().calls).toBe(1));
  });

  test('[ShadEmpty-STY-001] box, icon, title and text colours and the radius reach the widget as CSS variables', async () => {
    const { container } = render({
      properties: { description: binding('Nothing here') },
      styles: {
        backgroundColor: binding('#f8fafc'),
        borderColor: binding('#cbd5e1'),
        borderRadius: binding('{{16}}'),
        iconBackgroundColor: binding('#e0f2fe'),
        iconColor: binding('#0369a1'),
        titleColor: binding('#0f172a'),
        textColor: binding('#475569'),
      },
    });

    await screen.findByText('Nothing here');
    const root = container.querySelector('.tj-shadcn');
    expect(root.style.getPropertyValue('--lk-bg')).toBe('#f8fafc');
    expect(root.style.getPropertyValue('--lk-border')).toBe('#cbd5e1');
    expect(root.style.getPropertyValue('--lk-radius')).toBe('16px');
    expect(root.style.getPropertyValue('--lk-icon-bg')).toBe('#e0f2fe');
    expect(root.style.getPropertyValue('--lk-icon')).toBe('#0369a1');
    expect(root.style.getPropertyValue('--lk-title')).toBe('#0f172a');
    expect(root.style.getPropertyValue('--lk-fg')).toBe('#475569');
    expect(screen.getByText('No orders yet').className).toContain('var(--lk-title');
  });
});
