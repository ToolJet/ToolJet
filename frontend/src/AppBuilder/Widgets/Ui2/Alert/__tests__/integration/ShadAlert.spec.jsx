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

    await waitFor(() =>
      expect(screen.getByRole('alert').style.getPropertyValue('--al-ink')).toBe('var(--sc-destructive-ink)')
    );

    render({ properties: { variant: binding('default') } });
    await waitFor(() => expect(screen.getByRole('alert').style.getPropertyValue('--al-ink')).toBe(''));
  });

  test('[ShadAlert-STY-003] a set style overrides its own part; every blank part keeps the variant', async () => {
    // Destructive drew only a border and a text colour: with the background, border and title set (as in the team's
    // app) it showed only in the description. Each part now reads its style, then the variant, then the theme.
    render({
      properties: { variant: binding('destructive'), description: binding('Details') },
      styles: { backgroundColor: binding('#f1f3f5'), titleColor: binding('#2563eb') },
    });

    const alert = await screen.findByRole('alert');
    // The variant's tint, border and ink, for the parts left blank.
    expect(alert.style.getPropertyValue('--al-bg')).toBe(
      'color-mix(in srgb, var(--sc-destructive) 6%, var(--sc-background))'
    );
    expect(alert.style.getPropertyValue('--al-border')).toBe(
      'color-mix(in srgb, var(--sc-destructive) 50%, transparent)'
    );
    expect(alert.className).toContain('tw-bg-[color:var(--lk-bg,var(--al-bg,var(--sc-background)))]');
    expect(alert.className).toContain('tw-border-[color:var(--lk-border,var(--al-border,var(--sc-border)))]');
    expect(screen.getByText('Payment overdue').className).toContain('var(--lk-title,var(--al-ink,');
    expect(screen.getByText('Details').className).toContain('var(--lk-fg,var(--al-ink,');
    // The set styles reach the variables the parts read first.
    const root = alert.closest('.tj-shadcn');
    expect(root.style.getPropertyValue('--lk-bg')).toBe('#f1f3f5');
    expect(root.style.getPropertyValue('--lk-title')).toBe('#2563eb');
    expect(root.style.getPropertyValue('--lk-border')).toBe('');
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
    expect(alert.className).toContain('tw-bg-[color:var(--lk-bg,');
    expect(screen.getByText('Payment overdue').className).toContain('tw-text-[color:var(--lk-title,');
    expect(screen.getByText('Details').className).toContain('tw-text-[color:var(--lk-fg,');
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

  test.each([
    ['info', 'primary', 'lucide-info'],
    ['success', 'success', 'lucide-circle-check'],
    ['warning', 'warning', 'lucide-triangle-alert'],
    ['destructive', 'destructive', 'lucide-circle-alert'],
  ])('[ShadAlert-PROP-003] the %s variant draws the theme %s colour with its icon', async (variant, token, icon) => {
    render({ properties: { variant: binding(variant) } });

    const alert = await screen.findByRole('alert');
    await waitFor(() => expect(alert.style.getPropertyValue('--al-ink')).toBe(`var(--sc-${token}-ink)`));
    expect(alert.style.getPropertyValue('--al-bg')).toContain(`var(--sc-${token})`);
    expect(alert.querySelector(`svg.${icon}`)).not.toBeNull();
  });

  test('[ShadAlert-PROP-004] the default variant has no tint and no icon; the config offers all five', async () => {
    render();
    const alert = await screen.findByRole('alert');
    expect(alert.style.getPropertyValue('--al-bg')).toBe('');
    expect(alert.querySelector('svg')).toBeNull();
    const { shadAlertConfig } = jest.requireActual('@/AppBuilder/WidgetManager/widgets/shadAlert');
    expect(shadAlertConfig.properties.variant.options.map((option) => option.value)).toEqual(
      expect.arrayContaining(['default', 'info', 'success', 'warning', 'destructive'])
    );
  });

  test('[ShadAlert-PROP-005] the Variant takes a binding: any case, danger or error as destructive, else default', async () => {
    // The Variant was a fixed choice, so an alert could not follow query data.
    const { shadAlertConfig } = jest.requireActual('@/AppBuilder/WidgetManager/widgets/shadAlert');
    expect(shadAlertConfig.properties.variant.isFxNotRequired).toBeUndefined();

    render({ properties: { variant: binding("{{'Warning'}}") } });
    await waitFor(() =>
      expect(screen.getByRole('alert').style.getPropertyValue('--al-ink')).toBe('var(--sc-warning-ink)')
    );
    render({ properties: { variant: binding("{{'danger'}}") } });
    await waitFor(() =>
      expect(screen.getByRole('alert').style.getPropertyValue('--al-ink')).toBe('var(--sc-destructive-ink)')
    );
    render({ properties: { variant: binding("{{'Overdue'}}") } });
    await waitFor(() => expect(screen.getByRole('alert').style.getPropertyValue('--al-ink')).toBe(''));
    expect(screen.getByRole('alert').querySelector('svg')).toBeNull();
  });

  test('[ShadAlert-PROP-006] the Custom variant draws its look from the Custom accent style', async () => {
    // A variant of the author's own: one colour gives the tint, the border and the ink, as a theme colour does for
    // Info or Warning; blank, it is the theme's primary.
    const { container } = render({
      properties: { variant: binding('custom') },
      styles: { accentColor: binding('#7c3aed') },
    });
    const alert = await screen.findByRole('alert');
    await waitFor(() =>
      expect(alert.style.getPropertyValue('--al-bg')).toContain('var(--lk-accent,var(--sc-primary))')
    );
    expect(alert.style.getPropertyValue('--al-border')).toContain('var(--lk-accent,var(--sc-primary))');
    expect(alert.style.getPropertyValue('--al-ink')).toBe(
      'color-mix(in srgb, var(--lk-accent,var(--sc-primary)) 60%, var(--sc-foreground))'
    );
    expect(container.querySelector('.tj-shadcn').style.getPropertyValue('--lk-accent')).toBe('#7c3aed');
    const { shadAlertConfig } = jest.requireActual('@/AppBuilder/WidgetManager/widgets/shadAlert');
    expect(shadAlertConfig.properties.variant.options.map((option) => option.value)).toContain('custom');
    expect(shadAlertConfig.styles.accentColor.type).toBe('colorSwatches');
  });
});
