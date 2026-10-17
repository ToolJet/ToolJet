/**
 * UI 2.0 Link: a text link to a URL (or a text button when it has no target).
 *
 * Real store, real RenderWidget, real widget; nothing about the widget is mocked. Standard control behaviour
 * (visibility, disabled, loading, tooltip) is covered for every UI 2.0 widget in Ui2/__tests__/controlState.spec.jsx;
 * this file covers what the Link itself does. Titles carry [ShadLink-<AREA>-<NNN>] scenario ids.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, screen, waitFor, fireEvent } from '@testing-library/react';
import { binding, setVariableOn, countInvocationsOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'link1';
const widget = createWidgetHarness({
  componentType: 'ShadLink',
  handle: 'link1',
  id: ID,
  widgetHeight: 32,
  widgetWidth: 200,
  defaultProperties: { linkText: binding('View order'), linkTarget: binding('https://example.com/orders/1') },
});

const render = (options = {}) => widget.render({ currentMode: 'view', ...options });
const link = () => screen.getByRole('link');
const exposed = () => widget.exposed() ?? {};

describe('UI 2.0 Link', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadLink-DEF-001] is a link that opens its target in a new tab, underlined on hover; exposes text and target', async () => {
    render();

    await waitFor(() => expect(link()).toHaveAttribute('href', 'https://example.com/orders/1'));
    expect(link()).toHaveTextContent('View order');
    expect(link()).toHaveAttribute('target', '_blank');
    expect(link()).toHaveAttribute('rel', 'noopener noreferrer');
    expect(link()).toHaveClass('tw-no-underline', 'hover:tw-underline', 'tw-font-medium');
    expect(link().style.fontSize).toBe('14px');
    expect(exposed()).toMatchObject({ linkText: 'View order', linkTarget: 'https://example.com/orders/1' });
  });

  test('[ShadLink-PROP-001] targetType same opens the target in the same tab', async () => {
    render({ properties: { targetType: binding('same') } });

    await waitFor(() => expect(link()).toHaveAttribute('target', '_self'));
    expect(link()).not.toHaveAttribute('rel');
  });

  test('[ShadLink-PROP-002] without a linkTarget it is a button that still fires onClick', async () => {
    render({ properties: { linkTarget: binding('') } });
    widget.setEvents(countInvocationsOn(ID, 'onClick'));

    const button = await screen.findByRole('button', { name: 'View order' });
    expect(screen.queryByRole('link')).toBeNull();
    await act(async () => fireEvent.click(button));
    await waitFor(() => expect(widget.variables().calls).toBe(1));
  });

  test('[ShadLink-PROP-003] underline always underlines, no-underline never does', async () => {
    render({ properties: { underline: binding('underline') } });
    await waitFor(() => expect(link()).toHaveClass('tw-underline'));

    render({ properties: { underline: binding('no-underline') } });
    await waitFor(() => expect(link()).toHaveClass('hover:tw-no-underline'));
    expect(link()).not.toHaveClass('tw-underline');
  });

  test('[ShadLink-PROP-004] showIcon adds an external-link icon after the text', async () => {
    render({ properties: { showIcon: binding('{{true}}') } });

    await waitFor(() => expect(link().querySelector('svg')).toHaveClass('lucide-external-link'));
  });

  test('[ShadLink-PROP-005] fontSize and fontWeight set the text size and weight', async () => {
    render({ properties: { fontSize: binding('{{18}}'), fontWeight: binding('bold') } });

    await waitFor(() => expect(link().style.fontSize).toBe('18px'));
    expect(link()).toHaveClass('tw-font-bold');
  });

  test('[ShadLink-EVT-001] clicking the link fires onClick, and pointing at it fires onHover', async () => {
    render();
    widget.setEvents([...countInvocationsOn(ID, 'onClick'), ...setVariableOn(ID, 'onHover', { key: 'hovered' })]);

    await act(async () => fireEvent.click(link()));
    await waitFor(() => expect(widget.variables().calls).toBe(1));
    await act(async () => fireEvent.mouseEnter(link()));
    await waitFor(() => expect(widget.variables().hovered).toBe('YES'));
  });

  test('[ShadLink-EVT-002] a disabled link cannot be followed or focused, and fires nothing', async () => {
    render({ properties: { disabledState: binding('{{true}}') } });
    widget.setEvents(countInvocationsOn(ID, 'onClick'));

    await waitFor(() => expect(link()).toHaveAttribute('aria-disabled', 'true'));
    expect(link()).toHaveAttribute('tabindex', '-1');
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    await act(async () => link().dispatchEvent(click));
    expect(click.defaultPrevented).toBe(true);
    expect(widget.variables().calls).toBeUndefined();
  });

  test('[ShadLink-ACT-001] click follows the link as a press does, firing onClick', async () => {
    render();
    widget.setEvents(countInvocationsOn(ID, 'onClick'));

    await widget.act('click');

    await waitFor(() => expect(widget.variables().calls).toBe(1));
  });

  test('[ShadLink-ACT-002] setLinkTarget and setLinkText change the link until those properties change', async () => {
    render();

    await widget.act('setLinkTarget', 'https://example.com/orders/2');
    await widget.act('setLinkText', 'Next order');
    await waitFor(() => expect(link()).toHaveAttribute('href', 'https://example.com/orders/2'));
    expect(link()).toHaveTextContent('Next order');
    expect(exposed()).toMatchObject({ linkText: 'Next order', linkTarget: 'https://example.com/orders/2' });

    render({ properties: { linkText: binding('All orders'), linkTarget: binding('https://example.com/orders') } });
    await waitFor(() => expect(exposed().linkTarget).toBe('https://example.com/orders'));
    expect(exposed().linkText).toBe('All orders');
  });

  test('[ShadLink-STY-001] text and hover colours and the alignment reach the link', async () => {
    const { container } = render({
      styles: { textColor: binding('#1d4ed8'), hoverColor: binding('#1e40af'), alignment: binding('right') },
    });

    await waitFor(() => expect(link()).toBeInTheDocument());
    const root = container.querySelector('.tj-shadcn');
    expect(root.style.getPropertyValue('--lk-fg')).toBe('#1d4ed8');
    expect(root.style.getPropertyValue('--lk-hover')).toBe('#1e40af');
    expect(link().parentElement).toHaveClass('tw-justify-end');
  });
});
