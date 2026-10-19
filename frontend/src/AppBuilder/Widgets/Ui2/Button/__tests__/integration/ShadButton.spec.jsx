/**
 * UI 2.0 Button: a pressable button with a label.
 *
 * Real store, real RenderWidget, real widget; nothing about the widget is mocked. Standard control behaviour
 * (visibility, disabled, loading, tooltip) is covered for every UI 2.0 widget in Ui2/__tests__/controlState.spec.jsx;
 * this file covers what the Button itself does. Titles carry [ShadButton-<AREA>-<NNN>] scenario ids.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, screen, waitFor, fireEvent } from '@testing-library/react';
import { binding, setVariableOn, countInvocationsOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'btn1';
const widget = createWidgetHarness({
  componentType: 'ShadButton',
  handle: 'button1',
  id: ID,
  widgetHeight: 36,
  widgetWidth: 160,
  defaultProperties: { text: binding('Save') },
});

const render = (options = {}) => widget.render({ currentMode: 'view', ...options });
const button = () => screen.getByRole('button');
const exposed = () => widget.exposed() ?? {};

describe('UI 2.0 Button', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadButton-DEF-001] shows its text and exposes it as buttonText', async () => {
    render();

    expect(await screen.findByRole('button', { name: 'Save' })).toBeInTheDocument();
    await waitFor(() => expect(exposed().buttonText).toBe('Save'));
  });

  test('[ShadButton-PROP-001] variant and size choose the shadcn look of the button', async () => {
    render({ properties: { variant: binding('destructive'), size: binding('sm') } });

    await waitFor(() => expect(button()).toHaveClass('tw-bg-ui2-destructive'));
    expect(button()).toHaveClass('tw-px-3', 'tw-text-xs');
    expect(button()).not.toHaveClass('tw-bg-ui2-primary-strong');
  });

  // On the grid, or as a fixed-width flex child, a button fills the box drawn for it (boxFit 'grid' or 'fixed', from
  // WidgetWrapper). As a fill child of a flex row it keeps its own width, and fullWidth makes it span the row.
  test('[ShadButton-PROP-002] a button fills a box sized for it; in a flex fill slot only fullWidth widens it', async () => {
    render({ boxFit: 'grid' });
    await waitFor(() => expect(button()).toHaveTextContent('Save'));
    expect(button()).toHaveClass('tw-w-full');

    render({ boxFit: 'fixed' });
    await waitFor(() => expect(button()).toHaveClass('tw-w-full'));

    render({ boxFit: 'fill', properties: { fullWidth: binding('{{false}}') } });
    await waitFor(() => expect(button()).not.toHaveClass('tw-w-full'));

    render({ boxFit: 'fill', properties: { fullWidth: binding('{{true}}') } });
    await waitFor(() => expect(button()).toHaveClass('tw-w-full'));
  });

  test('[ShadButton-EVT-001] pressing the button fires onClick once', async () => {
    render();
    widget.setEvents(countInvocationsOn(ID, 'onClick'));

    await act(async () => fireEvent.click(button()));

    await waitFor(() => expect(widget.variables().calls).toBe(1));
  });

  test('[ShadButton-EVT-002] pointing at the button fires onHover', async () => {
    render();
    widget.setEvents(setVariableOn(ID, 'onHover'));

    await act(async () => fireEvent.mouseEnter(button()));

    await waitFor(() => expect(widget.variables().seen).toBe('YES'));
  });

  test('[ShadButton-EVT-003] a disabled button cannot be pressed', async () => {
    render({ properties: { disabledState: binding('{{true}}') } });
    widget.setEvents(countInvocationsOn(ID, 'onClick'));

    await waitFor(() => expect(button()).toBeDisabled());
    await act(async () => fireEvent.click(button()));

    expect(widget.variables().calls).toBeUndefined();
  });

  test('[ShadButton-ACT-001] click fires onClick as a press does, and does nothing while disabled', async () => {
    render();
    widget.setEvents(countInvocationsOn(ID, 'onClick'));

    await widget.act('click');
    await waitFor(() => expect(widget.variables().calls).toBe(1));

    await widget.act('setDisable', true);
    await widget.act('click');
    expect(widget.variables().calls).toBe(1);
  });

  test('[ShadButton-ACT-002] setText changes the label and buttonText until the Text property changes', async () => {
    render();

    await widget.act('setText', 'Save draft');
    await waitFor(() => expect(button()).toHaveTextContent('Save draft'));
    expect(exposed().buttonText).toBe('Save draft');

    render({ properties: { text: binding('Publish') } });
    await waitFor(() => expect(button()).toHaveTextContent('Publish'));
    expect(exposed().buttonText).toBe('Publish');
  });

  test('[ShadButton-ACT-003] setText with an object shows nothing rather than [object Object]', async () => {
    render();

    await widget.act('setText', { a: 1 });

    await waitFor(() => expect(exposed().buttonText).toBe(''));
    expect(button()).not.toHaveTextContent('[object Object]');
  });

  test('[ShadButton-STY-001] colour and radius styles reach the button as CSS variables it reads', async () => {
    const { container } = render({
      styles: {
        backgroundColor: binding('#0f766e'),
        hoverBackgroundColor: binding('#115e59'),
        textColor: binding('#ffffff'),
        borderColor: binding('#134e4a'),
        borderRadius: binding('{{12}}'),
      },
    });

    await waitFor(() => expect(button()).toBeInTheDocument());
    const root = container.querySelector('.tj-shadcn');
    expect(root.style.getPropertyValue('--lk-bg')).toBe('#0f766e');
    expect(root.style.getPropertyValue('--lk-hover')).toBe('#115e59');
    expect(root.style.getPropertyValue('--lk-fg')).toBe('#ffffff');
    expect(root.style.getPropertyValue('--lk-border')).toBe('#134e4a');
    expect(root.style.getPropertyValue('--lk-radius')).toBe('12px');
    expect(button().className).toContain('tw-bg-[color:var(--lk-bg)]');
    expect(button().className).toContain('hover:tw-bg-[color:var(--lk-hover)]');
  });
});
