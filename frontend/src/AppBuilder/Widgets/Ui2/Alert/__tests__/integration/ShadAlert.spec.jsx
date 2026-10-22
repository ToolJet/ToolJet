/**
 * UI 2.0 Alert: a callout with a title and an optional description.
 *
 * Real store, real RenderWidget, real widget; nothing about the widget is mocked. Standard control behaviour
 * (visibility, disabled, loading, tooltip) is covered for every UI 2.0 widget in Ui2/__tests__/controlState.spec.jsx;
 * this file covers what the Alert itself does. Titles carry [ShadAlert-<AREA>-<NNN>] scenario ids.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { screen, waitFor } from '@testing-library/react';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const widget = createWidgetHarness({
  componentType: 'ShadAlert',
  handle: 'alert1',
  id: 'alert1',
  widgetHeight: 80,
  widgetWidth: 360,
  defaultProperties: { title: binding('Payment overdue') },
});

const render = (options = {}) => widget.render({ currentMode: 'view', ...options });

describe('UI 2.0 Alert', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadAlert-DEF-001] shows the title as an alert, with no description by default', async () => {
    render();

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Payment overdue');
    expect(alert.querySelectorAll('h5 ~ div')).toHaveLength(0);
  });

  test('[ShadAlert-PROP-001] title and description are both shown', async () => {
    render({ properties: { description: binding('Invoice #1024 is 12 days late.') } });

    expect(await screen.findByText('Payment overdue')).toBeInTheDocument();
    expect(screen.getByText('Invoice #1024 is 12 days late.')).toBeInTheDocument();
  });

  test('[ShadAlert-PROP-002] the destructive variant draws the alert in the error colour', async () => {
    render({ properties: { variant: binding('destructive') } });

    await waitFor(() => expect(screen.getByRole('alert')).toHaveClass('tw-text-ui2-destructive'));

    render({ properties: { variant: binding('default') } });
    await waitFor(() => expect(screen.getByRole('alert')).not.toHaveClass('tw-text-ui2-destructive'));
  });

  test('[ShadAlert-STY-001] colour and radius styles reach the alert as CSS variables it reads', async () => {
    const { container } = render({
      properties: { description: binding('Details') },
      styles: {
        backgroundColor: binding('#fef2f2'),
        borderColor: binding('#fecaca'),
        titleColor: binding('#991b1b'),
        textColor: binding('#7f1d1d'),
        borderRadius: binding('{{10}}'),
      },
    });

    const alert = await screen.findByRole('alert');
    const root = container.querySelector('.tj-shadcn');
    expect(root.style.getPropertyValue('--lk-bg')).toBe('#fef2f2');
    expect(root.style.getPropertyValue('--lk-border')).toBe('#fecaca');
    expect(root.style.getPropertyValue('--lk-title')).toBe('#991b1b');
    expect(root.style.getPropertyValue('--lk-fg')).toBe('#7f1d1d');
    expect(root.style.getPropertyValue('--lk-radius')).toBe('10px');
    expect(alert.className).toContain('tw-bg-[color:var(--lk-bg)]');
    expect(screen.getByText('Payment overdue').className).toContain('tw-text-[color:var(--lk-title)]');
    expect(screen.getByText('Details').className).toContain('tw-text-[color:var(--lk-fg)]');
  });

  test('[ShadAlert-STY-002] the title is the larger, stronger line over its description', async () => {
    // An h5 took the builder's global heading size (12px), under the 14px description.
    render({ properties: { description: binding('Invoice #1024 is 12 days late.') } });

    const title = await screen.findByText('Payment overdue');
    const description = screen.getByText('Invoice #1024 is 12 days late.');
    expect(title).toHaveClass('tw-text-ui2-base', 'tw-font-semibold');
    expect(description).toHaveClass('tw-text-ui2-sm');
    expect(description.className).not.toMatch(/font-(semibold|bold)/);
  });

  test('[ShadAlert-LAY-001] in a fixed box the card fills the box; with Dynamic height it fits its content', async () => {
    // Changing the Alert's height in the editor left the card at its content's height.
    const { container } = render({ properties: { dynamicHeight: binding('{{false}}') } });
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveClass('tw-h-full', 'tw-overflow-y-auto');
    expect(container.querySelector('.tj-shadcn')).toHaveClass('tw-h-full');

    render({ currentMode: 'edit' });
    await waitFor(() => expect(screen.getByRole('alert')).toHaveClass('tw-h-full'));

    render({ properties: { dynamicHeight: binding('{{true}}') } });
    await waitFor(() => expect(screen.getByRole('alert')).not.toHaveClass('tw-h-full'));
  });
});
