/**
 * UI 2.0 Text: a paragraph of text in a chosen tone.
 *
 * Real store, real RenderWidget, real widget; nothing about the widget is mocked. Standard control behaviour
 * (visibility, disabled, loading, tooltip) is covered for every UI 2.0 widget in Ui2/__tests__/controlState.spec.jsx;
 * this file covers what the Text itself does. Titles carry [ShadText-<AREA>-<NNN>] scenario ids.
 */
import { act, screen, waitFor, fireEvent } from '@testing-library/react';
import {
  createWidgetHarness,
  binding,
  setVariableOn,
  countInvocationsOn,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { FONT_STACKS } from '@/AppBuilder/Widgets/Ui2/_shared/looks/typeLook';

const ID = 'txt1';
const widget = createWidgetHarness({
  componentType: 'ShadText',
  handle: 'text1',
  id: ID,
  widgetHeight: 40,
  widgetWidth: 360,
  defaultProperties: { text: binding('Charters leave at nine.') },
});

const render = (options = {}) => widget.render({ currentMode: 'view', ...options });
const paragraph = (container) => container.querySelector('.tj-shadcn p');
const exposed = () => widget.exposed() ?? {};

describe('UI 2.0 Text', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadText-DEF-001] shows its text as a paragraph and exposes it as text', async () => {
    const { container } = render();

    expect(await screen.findByText('Charters leave at nine.')).toBeInTheDocument();
    expect(paragraph(container).tagName).toBe('P');
    expect(paragraph(container)).toHaveClass('tw-leading-7');
    await waitFor(() => expect(exposed().text).toBe('Charters leave at nine.'));
  });

  test('[ShadText-PROP-001] text keeps its line breaks', async () => {
    const { container } = render({ properties: { text: binding('{{"Line one\\nLine two"}}') } });

    await waitFor(() => expect(paragraph(container).textContent).toBe('Line one\nLine two'));
    expect(paragraph(container)).toHaveClass('tw-whitespace-pre-line');
  });

  test('[ShadText-PROP-002] tone sets the size and colour of the text', async () => {
    const { container } = render({ properties: { tone: binding('muted') } });
    await waitFor(() => expect(paragraph(container)).toHaveClass('tw-text-ui2-sm', 'tw-text-ui2-muted-foreground'));

    render({ properties: { tone: binding('large') } });
    await waitFor(() => expect(paragraph(container)).toHaveClass('tw-text-ui2-lg', 'tw-font-semibold'));

    render({ properties: { tone: binding('lead') } });
    await waitFor(() => expect(paragraph(container)).toHaveClass('tw-text-ui2-xl'));
  });

  test('[ShadText-EVT-001] clicking the text fires onClick, and pointing at it fires onHover', async () => {
    const { container } = render();
    widget.setEvents([...countInvocationsOn(ID, 'onClick'), ...setVariableOn(ID, 'onHover', { key: 'hovered' })]);

    await act(async () => fireEvent.click(paragraph(container)));
    await waitFor(() => expect(widget.variables().calls).toBe(1));
    await act(async () => fireEvent.mouseEnter(paragraph(container)));
    await waitFor(() => expect(widget.variables().hovered).toBe('YES'));
  });

  test('[ShadText-KBD-001] with onClick wired the text is a focusable button that Enter presses', async () => {
    render();
    widget.setEvents(countInvocationsOn(ID, 'onClick'));

    const button = await screen.findByRole('button', { name: 'Charters leave at nine.' });
    expect(button).toHaveAttribute('tabindex', '0');
    await act(async () => fireEvent.keyDown(button, { key: 'Enter' }));
    await waitFor(() => expect(widget.variables().calls).toBe(1));
  });

  test('[ShadText-ACT-001] setText changes the text until the Text property changes; clear empties it', async () => {
    const { container } = render();

    await widget.act('setText', 'Charters leave at ten.');
    await waitFor(() => expect(paragraph(container)).toHaveTextContent('Charters leave at ten.'));
    expect(exposed().text).toBe('Charters leave at ten.');

    await widget.act('clear');
    await waitFor(() => expect(exposed().text).toBe(''));
    expect(paragraph(container).textContent).toBe('');

    render({ properties: { text: binding('Sold out') } });
    await waitFor(() => expect(paragraph(container)).toHaveTextContent('Sold out'));
    expect(exposed().text).toBe('Sold out');
  });

  test('[ShadText-STY-001] colour, alignment and typeface styles reach the paragraph', async () => {
    const { container } = render({
      properties: { tone: binding('small') },
      styles: {
        textColor: binding('#475569'),
        textAlign: binding('right'),
        fontFamily: binding('mono'),
        fontWeight: binding('bold'),
        letterSpacing: binding('0.1em'),
        textTransform: binding('capitalize'),
        fontSize: binding('{{11}}'),
      },
    });

    await screen.findByText('Charters leave at nine.');
    const root = container.querySelector('.tj-shadcn');
    expect(root.style.getPropertyValue('--lk-fg')).toBe('#475569');
    expect(root.style.getPropertyValue('--lk-font')).toBe(FONT_STACKS.mono);
    expect(root.style.getPropertyValue('--lk-weight')).toBe('bold');
    expect(root.style.getPropertyValue('--lk-case')).toBe('capitalize');
    expect(root.style.getPropertyValue('--lk-size')).toBe('11px');
    expect(paragraph(container)).toHaveClass('lk-font', 'lk-weight', 'lk-tracking', 'lk-case', 'lk-size');
    expect(paragraph(container).className).toContain('tw-text-[color:var(--lk-fg)]');
    expect(paragraph(container).style.textAlign).toBe('right');
  });

  test('[ShadText-STY-002] junk typeface styles add no classes and do not break the text', async () => {
    const { container } = render({
      styles: { fontFamily: binding('{{42}}'), fontWeight: binding('heavy'), textTransform: binding('{{[]}}') },
    });

    expect(await screen.findByText('Charters leave at nine.')).toBeInTheDocument();
    expect(paragraph(container).className).not.toMatch(/lk-font|lk-weight|lk-case/);
    expect(container.innerHTML).not.toMatch(/undefined|NaN/);
  });
});
