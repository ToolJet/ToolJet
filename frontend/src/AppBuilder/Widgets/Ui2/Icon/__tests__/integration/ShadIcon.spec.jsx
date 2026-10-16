/**
 * UI 2.0 Icon: one lucide icon by name, in a tone, optionally on a tinted chip.
 *
 * Real store, real RenderWidget, real widget; nothing about the widget is mocked. Standard control behaviour
 * (visibility, disabled, loading, tooltip) is covered for every UI 2.0 widget in Ui2/__tests__/controlState.spec.jsx;
 * this file covers what the Icon itself does. Titles carry [ShadIcon-<AREA>-<NNN>] scenario ids.
 */
import { act, screen, waitFor, fireEvent } from '@testing-library/react';
import {
  createWidgetHarness,
  binding,
  setVariableOn,
  countInvocationsOn,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'icon1';
const widget = createWidgetHarness({
  componentType: 'ShadIcon',
  handle: 'icon1',
  id: ID,
  widgetHeight: 48,
  widgetWidth: 120,
  defaultProperties: { icon: binding('users') },
});

const render = (options = {}) => widget.render({ currentMode: 'view', ...options });
/** The icon's box: an img, or a button once onClick is wired. */
const box = () => screen.getByLabelText('users');
const glyph = () => box().querySelector('svg');

describe('UI 2.0 Icon', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadIcon-DEF-001] draws the named icon at 20px on a square chip twice its size, in the primary tone', async () => {
    render();

    await waitFor(() => expect(screen.getByRole('img', { name: 'users' })).toBeInTheDocument());
    expect(glyph()).toHaveClass('lucide-users');
    expect(glyph()).toHaveAttribute('width', '20');
    expect(box().style.width).toBe('40px');
    expect(box().className).toContain('rounded-[var(--lk-radius,var(--sc-radius))]');
    expect(box().style.getPropertyValue('--ic-tone')).toBe('var(--sc-primary)');
  });

  test('[ShadIcon-PROP-001] icon takes a lucide name, and an unknown name draws a neutral placeholder', async () => {
    render({ properties: { icon: binding('shopping-cart') } });
    await waitFor(() =>
      expect(screen.getByLabelText('shopping-cart').querySelector('svg')).toHaveClass('lucide-shopping-cart')
    );

    render({ properties: { icon: binding('definitely-not-an-icon') } });
    const placeholder = await screen.findByLabelText('definitely-not-an-icon');
    expect(placeholder.querySelector('svg')).toHaveClass('lucide-circle-dashed');
  });

  test('[ShadIcon-PROP-002] size and strokeWidth set the glyph, clamped to their ranges', async () => {
    render({ properties: { size: binding('{{32}}'), strokeWidth: binding('{{1.5}}') } });
    await waitFor(() => expect(glyph()).toHaveAttribute('width', '32'));
    expect(glyph()).toHaveAttribute('stroke-width', '1.5');

    render({ properties: { size: binding('{{9999}}'), strokeWidth: binding('{{40}}') } });
    await waitFor(() => expect(glyph()).toHaveAttribute('width', '512'));
    expect(glyph()).toHaveAttribute('stroke-width', '4');
  });

  test('[ShadIcon-PROP-003] tone picks the theme colour of the icon', async () => {
    render({ properties: { tone: binding('destructive') } });
    await waitFor(() => expect(box().style.getPropertyValue('--ic-tone')).toBe('var(--sc-destructive)'));

    render({ properties: { tone: binding('constructor') } });
    await waitFor(() => expect(box().style.getPropertyValue('--ic-tone')).toBe('var(--sc-foreground)'));
  });

  test('[ShadIcon-PROP-004] chip circle rounds the chip, none drops it, and chipSize sets its size', async () => {
    render({ properties: { chip: binding('circle'), chipSize: binding('{{72}}') } });
    await waitFor(() => expect(box()).toHaveClass('rounded-full'));
    expect(box().style.width).toBe('72px');

    render({ properties: { chip: binding('none') } });
    await waitFor(() => expect(box().style.width).toBe('20px'));
    expect(box().className).not.toContain('var(--lk-chip');
  });

  test('[ShadIcon-EVT-001] with onClick wired the icon is a button; a press fires onClick and pointing fires onHover', async () => {
    render();
    widget.setEvents([...countInvocationsOn(ID, 'onClick'), ...setVariableOn(ID, 'onHover', { key: 'hovered' })]);

    const button = await screen.findByRole('button', { name: 'users' });
    await act(async () => fireEvent.click(button));
    await waitFor(() => expect(widget.variables().calls).toBe(1));
    await act(async () => fireEvent.keyDown(button, { key: ' ' }));
    await waitFor(() => expect(widget.variables().calls).toBe(2));
    await act(async () => fireEvent.mouseEnter(button));
    await waitFor(() => expect(widget.variables().hovered).toBe('YES'));
  });

  test('[ShadIcon-ACT-001] click fires onClick as a press does, and does nothing while disabled', async () => {
    render();
    widget.setEvents(countInvocationsOn(ID, 'onClick'));

    await widget.act('click');
    await waitFor(() => expect(widget.variables().calls).toBe(1));

    await widget.act('setDisable', true);
    await waitFor(() => expect(box()).toHaveClass('opacity-50'));
    await widget.act('click');
    await act(async () => fireEvent.click(box()));
    expect(widget.variables().calls).toBe(1);
  });

  test('[ShadIcon-STY-001] icon and chip colours, chip radius and alignment reach the icon', async () => {
    const { container } = render({
      styles: {
        iconColor: binding('#0891b2'),
        chipColor: binding('#cffafe'),
        chipRadius: binding('{{6}}'),
        alignment: binding('center'),
      },
    });

    await waitFor(() => expect(box()).toBeInTheDocument());
    const root = container.querySelector('.tj-shadcn');
    expect(root.style.getPropertyValue('--lk-icon')).toBe('#0891b2');
    expect(root.style.getPropertyValue('--lk-chip')).toBe('#cffafe');
    expect(root.style.getPropertyValue('--lk-radius')).toBe('6px');
    expect(box().parentElement).toHaveClass('justify-center');
  });
});
