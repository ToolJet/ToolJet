/**
 * UI 2.0 Hero: the page header with an eyebrow, title, subtitle, meta chips, an aside and up to two actions.
 *
 * Real store, real RenderWidget, real widget; nothing about the widget is mocked. Standard control behaviour
 * (visibility, disabled, loading, tooltip) is covered for every UI 2.0 widget in Ui2/__tests__/controlState.spec.jsx;
 * this file covers what the Hero itself does. Titles carry [ShadHero-<AREA>-<NNN>] scenario ids.
 */
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { createWidgetHarness, binding, setVariableOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'hero1';
const widget = createWidgetHarness({
  componentType: 'ShadHero',
  handle: 'hero1',
  id: ID,
  widgetHeight: 200,
  widgetWidth: 900,
});

const render = (options = {}) => widget.render({ currentMode: 'view', ...options });
const root = (container) => container.querySelector('.tj-shadcn');
const panel = () => document.querySelector('section.sc-hero');
const title = () => screen.getByRole('heading', { level: 1 });
const classes = (el) => (el?.className ?? '').split(/\s+/);
const LONG = 'A deliberately long piece of text that keeps going well past what this space was designed to hold';

describe('UI 2.0 Hero', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadHero-DEF-001] shows the sample greeting on a tinted panel with its meta chips and one action', async () => {
    render();

    await waitFor(() => expect(title()).toHaveTextContent('Good morning, Ada'));
    expect(screen.getByText('Operations')).toBeInTheDocument();
    expect(screen.getByText('Here is what needs you today.')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual([
      'Sun, 11 Oct',
      '14 bookings',
      '3 need a reply',
    ]);
    expect(screen.getAllByRole('button').map((b) => b.textContent)).toEqual(['New booking']);
    expect(panel()).toHaveAttribute('data-background', 'tint');
    expect(document.querySelector('[data-aside]')).toBeNull();
  });

  test('[ShadHero-PROP-001] eyebrow, title, subtitle and meta show what is bound; empty ones draw nothing', async () => {
    render({
      properties: {
        eyebrow: binding('Front desk'),
        title: binding('Welcome back'),
        subtitle: binding(''),
        meta: binding("{{[{ label: 'Guests', value: 42 }, 'Rooms 18', '']}}"),
      },
    });

    await waitFor(() => expect(title()).toHaveTextContent('Welcome back'));
    expect(screen.getByText('Front desk')).toBeInTheDocument();
    expect(document.querySelector('section.sc-hero p')).toBeNull();
    expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual(['Guests42', 'Rooms 18']);
  });

  test('[ShadHero-PROP-002] meta as text splits on the middle dot', async () => {
    render({ properties: { meta: binding('Mon · 3 shifts · 2 open') } });

    await waitFor(() =>
      expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual(['Mon', '3 shifts', '2 open'])
    );
  });

  test('[ShadHero-PROP-003] asideValue as a number is one formatted figure with asideLabel as its caption', async () => {
    render({ properties: { asideValue: binding('{{12480}}'), asideLabel: binding('Revenue today') } });

    await waitFor(() => expect(document.querySelector('[data-aside]')).toHaveAttribute('data-aside', 'figure'));
    const aside = document.querySelector('[data-aside]');
    expect(aside).toHaveTextContent('Revenue today');
    expect(aside).toHaveTextContent('12,480');
    // With an aside the text, aside and actions sit in a grid.
    expect(panel()).toHaveClass('sc-hero-grid');
  });

  test('[ShadHero-PROP-004] asideValue as a list shows at most four facts under the asideLabel heading', async () => {
    render({
      properties: {
        asideValue: binding(
          "{{[{ label: 'Open', value: 14 }, { label: 'Due today', value: 3 }, 'Late 1', 'Paused 2', 'Spare 9']}}"
        ),
        asideLabel: binding('Today'),
      },
    });

    await waitFor(() => expect(document.querySelector('[data-aside]')).toHaveAttribute('data-aside', 'facts'));
    const aside = document.querySelector('[data-aside]');
    expect(aside).toHaveTextContent('Today');
    expect([...aside.querySelectorAll('dl > div')].map((row) => row.textContent)).toEqual([
      'Open14',
      'Due today3',
      'Late 1',
      'Paused 2',
    ]);
  });

  test('[ShadHero-PROP-005] icon draws the named lucide icon in a tile beside the title', async () => {
    render({ properties: { icon: binding('sparkles') } });

    await waitFor(() => expect(panel().querySelector('svg.lucide-sparkles')).toBeTruthy());
  });

  test('[ShadHero-PROP-006] background picks the panel; dark and image draw the main action in a fixed dark ink', async () => {
    render({ properties: { background: binding('plain') } });
    await waitFor(() => expect(panel()).toHaveAttribute('data-background', 'plain'));
    expect(panel().style.borderRadius).toBe('');

    render({ properties: { background: binding('gradient') } });
    await waitFor(() => expect(panel()).toHaveAttribute('data-background', 'gradient'));

    // A dark app's foreground is near-white: a theme-coloured button on the dark panel was a blank white box.
    render({ properties: { background: binding('dark'), title: binding('Riviera') } });
    await waitFor(() => expect(panel()).toHaveAttribute('data-background', 'dark'));
    const action = screen.getByRole('button', { name: 'New booking' });
    expect(action.className).toContain('tw-bg-white');
    expect(action.className).toContain('tw-text-[#0f172a]');
    expect(title().style.color).toBe('rgb(255, 255, 255)');

    render({ properties: { background: binding('nonsense') } });
    await waitFor(() => expect(panel()).toHaveAttribute('data-background', 'tint'));
  });

  test('[ShadHero-PROP-007] imageUrl is drawn behind a dark overlay when background is image', async () => {
    render({
      properties: { background: binding('image'), imageUrl: binding('https://example.com/hero.jpg') },
    });

    await waitFor(() => expect(panel()).toHaveAttribute('data-background', 'image'));
    // jsdom drops the layered gradient-plus-url value itself; the photo's cover sizing is drawn only with a URL.
    expect(panel().style.backgroundSize).toBe('cover');
    expect(panel().style.backgroundPosition).toBe('center');
    expect(title().style.color).toBe('rgb(255, 255, 255)');

    render({ properties: { background: binding('image'), imageUrl: binding('') } });
    await waitFor(() => expect(panel().style.backgroundSize).toBe(''));
  });

  test('[ShadHero-PROP-008] align center stacks the text centred; size sets the title scale', async () => {
    render({ properties: { align: binding('center'), size: binding('large') } });

    await waitFor(() => expect(panel()).toHaveClass('tw-flex-col', 'tw-items-center', 'tw-text-center'));
    expect(title()).toHaveClass('tw-text-4xl');

    render({ properties: { size: binding('compact') } });
    await waitFor(() => expect(title()).toHaveClass('tw-text-2xl'));
    expect(panel()).toHaveClass('tw-px-6', 'tw-py-5');
  });

  test('[ShadHero-EVT-001] the two actions fire onActionClicked and onSecondaryActionClicked', async () => {
    render({ properties: { actionLabel: binding('Book now'), secondaryActionLabel: binding('Learn more') } });
    widget.setEvents([
      ...setVariableOn(ID, 'onActionClicked', { key: 'primary' }),
      ...setVariableOn(ID, 'onSecondaryActionClicked', { key: 'secondary' }),
    ]);

    // The secondary (outline) action comes first, the main action last.
    await waitFor(() =>
      expect(screen.getAllByRole('button').map((b) => b.textContent)).toEqual(['Learn more', 'Book now'])
    );
    fireEvent.click(screen.getByRole('button', { name: 'Book now' }));
    await waitFor(() => expect(widget.variables().primary).toBe('YES'));
    expect(widget.variables().secondary).toBeUndefined();
    fireEvent.click(screen.getByRole('button', { name: 'Learn more' }));
    await waitFor(() => expect(widget.variables().secondary).toBe('YES'));
  });

  test('[ShadHero-PROP-009] empty actionLabel and secondaryActionLabel hide both actions', async () => {
    render({ properties: { actionLabel: binding(''), secondaryActionLabel: binding('') } });

    await waitFor(() => expect(title()).toBeInTheDocument());
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  test('[ShadHero-DEF-002] long action labels wrap under the text and end in an ellipsis', async () => {
    render({ properties: { title: binding('Good morning'), actionLabel: binding(LONG) } });

    await waitFor(() => expect(screen.getByText(LONG)).toBeInTheDocument());
    expect(panel()).toHaveClass('tw-flex-wrap');
    const label = screen.getByText(LONG);
    expect(label).toHaveClass('tw-truncate');
    expect(label.parentElement.closest('.tw-max-w-full')).toBeTruthy();
  });

  // A hero taller than its saved box drew past its bottom edge over the widget under it (Daymark, 2026-10-15). The
  // viewer grows the box (dynamic height); the editor draws every widget at its saved size, so there the panel stops
  // at its box and its content scrolls inside it.
  test('[ShadHero-DEF-003] grows with its content in the viewer, and stays inside its box in the editor', async () => {
    const contained = (shell) =>
      classes(shell).includes('tw-h-full') &&
      classes(panel()).includes('tw-max-h-full') &&
      classes(panel()).includes('tw-overflow-y-auto') &&
      classes(panel().parentElement).includes('tw-h-full');

    const view = render({ properties: { asideValue: binding('{{19}}') } });
    await waitFor(() => expect(panel()).toBeInTheDocument());
    expect(contained(root(view.container))).toBe(false);
    expect(panel().className).not.toMatch(/\b(overflow-|max-h-)/);

    const edit = widget.render({ currentMode: 'edit' });
    await waitFor(() => expect(contained(root(edit.container))).toBe(true));

    const fixed = render({ properties: { dynamicHeight: binding('{{false}}') } });
    await waitFor(() => expect(contained(root(fixed.container))).toBe(true));
  });

  test('[ShadHero-DEF-004] a loading skeleton hero in the editor scrolls inside its box too', async () => {
    const { container } = widget.render({
      currentMode: 'edit',
      properties: { loadingState: binding('{{true}}'), loadingIndicator: binding('skeleton') },
    });

    await waitFor(() => expect(container.querySelector('.tw-animate-pulse')).toBeTruthy());
    expect(classes(root(container))).toEqual(expect.arrayContaining(['tw-h-full', 'tw-overflow-y-auto']));
  });

  test('[ShadHero-STY-001] accent, panel, title and text colours, radius and title typeface reach the hero', async () => {
    const { container } = render({
      styles: {
        accentColor: binding('#e11d48'),
        backgroundColor: binding('#fef3c7'),
        titleColor: binding('#111827'),
        textColor: binding('#475569'),
        borderRadius: binding('{{4}}'),
        titleFontFamily: binding('serif'),
      },
    });

    await waitFor(() => expect(root(container).style.getPropertyValue('--lk-accent')).toBe('#e11d48'));
    const vars = root(container).style;
    expect(vars.getPropertyValue('--lk-bg')).toBe('#fef3c7');
    expect(vars.getPropertyValue('--lk-title')).toBe('#111827');
    expect(vars.getPropertyValue('--lk-fg')).toBe('#475569');
    expect(vars.getPropertyValue('--lk-radius')).toBe('4px');
    expect(vars.getPropertyValue('--lk-title-font')).toMatch(/Georgia, serif$/);
    expect(title().style.fontFamily).toBe('var(--lk-title-font,inherit)');
  });
});
