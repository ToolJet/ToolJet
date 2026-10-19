/**
 * UI 2.0 Badge: a short status label.
 *
 * Real store, real RenderWidget, real widget; nothing about the widget is mocked. Standard control behaviour
 * (visibility, disabled, loading, tooltip) is covered for every UI 2.0 widget in Ui2/__tests__/controlState.spec.jsx;
 * this file covers what the Badge itself does. Titles carry [ShadBadge-<AREA>-<NNN>] scenario ids.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { screen, waitFor } from '@testing-library/react';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const widget = createWidgetHarness({
  componentType: 'ShadBadge',
  handle: 'badge1',
  id: 'badge1',
  widgetHeight: 24,
  widgetWidth: 120,
  defaultProperties: { text: binding('Paid') },
});

const render = (options = {}) => widget.render({ currentMode: 'view', ...options });
const badge = () => screen.getByText('Paid').closest('.tj-shadcn > div');

describe('UI 2.0 Badge', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadBadge-DEF-001] shows its text in the default (primary) look', async () => {
    render();

    expect(await screen.findByText('Paid')).toBeInTheDocument();
    expect(badge()).toHaveClass('tw-bg-ui2-primary-strong');
  });

  test('[ShadBadge-PROP-001] text follows its binding', async () => {
    render({ properties: { text: binding("{{'Over' + 'due'}}") } });

    expect(await screen.findByText('Overdue')).toBeInTheDocument();
  });

  test('[ShadBadge-PROP-002] each variant has its own colours', async () => {
    render({ properties: { variant: binding('success') } });
    await waitFor(() => expect(badge()).toHaveClass('tw-text-ui2-success'));

    render({ properties: { variant: binding('destructive') } });
    await waitFor(() => expect(badge()).toHaveClass('tw-text-ui2-destructive'));

    render({ properties: { variant: binding('outline') } });
    await waitFor(() => expect(badge()).toHaveClass('tw-text-ui2-foreground'));
    expect(badge()).not.toHaveClass('tw-bg-ui2-primary-strong');
  });

  test('[ShadBadge-STY-001] colour and radius styles reach the badge as CSS variables it reads', async () => {
    const { container } = render({
      styles: {
        backgroundColor: binding('#dcfce7'),
        textColor: binding('#166534'),
        borderColor: binding('#86efac'),
        borderRadius: binding('{{999}}'),
      },
    });

    await screen.findByText('Paid');
    const root = container.querySelector('.tj-shadcn');
    expect(root.style.getPropertyValue('--lk-bg')).toBe('#dcfce7');
    expect(root.style.getPropertyValue('--lk-fg')).toBe('#166534');
    expect(root.style.getPropertyValue('--lk-border')).toBe('#86efac');
    expect(root.style.getPropertyValue('--lk-radius')).toBe('999px');
    expect(badge().className).toContain('tw-bg-[color:var(--lk-bg)]');
    expect(badge().className).toContain('tw-text-[color:var(--lk-fg)]');
  });
});
