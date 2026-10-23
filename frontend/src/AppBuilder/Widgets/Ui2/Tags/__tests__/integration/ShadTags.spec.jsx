/**
 * UI 2.0 Tags: a row of read-only tag chips, each clickable.
 *
 * Real store, real RenderWidget, real widget; nothing about the widget is mocked. Standard control behaviour
 * (visibility, disabled, loading, tooltip) is covered for every UI 2.0 widget in Ui2/__tests__/controlState.spec.jsx;
 * this file covers what the Tags itself does. Titles carry [ShadTags-<AREA>-<NNN>] scenario ids.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, screen, waitFor, fireEvent } from '@testing-library/react';
import { binding, setVariableOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'tags1';
const widget = createWidgetHarness({
  componentType: 'ShadTags',
  handle: 'tags1',
  id: ID,
  widgetHeight: 40,
  widgetWidth: 320,
  defaultProperties: { tags: binding("{{['Design', 'Frontend', 'Urgent']}}"), tagColors: binding('{{{}}}') },
});

const render = (options = {}) => widget.render({ currentMode: 'view', ...options });
const chip = (name) => screen.getByRole('button', { name });
const chipNames = () => screen.getAllByRole('listitem').map((item) => item.textContent);
const exposed = () => widget.exposed() ?? {};

describe('UI 2.0 Tags', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadTags-DEF-001] lists each tag as a soft chip that wraps, and exposes the tags', async () => {
    render();

    await waitFor(() => expect(chipNames()).toEqual(['Design', 'Frontend', 'Urgent']));
    expect(screen.getByRole('list', { name: 'Tags' })).toHaveClass('tw-flex-wrap');
    expect(chip('Design').className).toContain('tw-bg-[color:var(--lk-bg,var(--sc-secondary))]');
    expect(chip('Design')).toHaveClass('tw-h-6');
    expect(exposed().tags).toEqual(['Design', 'Frontend', 'Urgent']);
    expect(exposed().lastClickedTag).toBe('');
  });

  test('[ShadTags-PROP-001] tags takes a comma-separated string or { label } objects; blanks are dropped', async () => {
    render({ properties: { tags: binding('Paid, , Urgent ') } });
    await waitFor(() => expect(exposed().tags).toEqual(['Paid', 'Urgent']));

    render({ properties: { tags: binding("{{[{ label: 'Alpha' }, { name: 'Beta' }, null, '']}}") } });
    await waitFor(() => expect(chipNames()).toEqual(['Alpha', 'Beta']));
  });

  test('[ShadTags-PROP-002] no tags shows a dash', async () => {
    const { container } = render({ properties: { tags: binding('{{[]}}') } });

    await waitFor(() => expect(container.querySelector('.tj-shadcn')).toHaveTextContent('—'));
    expect(screen.queryByRole('list')).toBeNull();
  });

  test('[ShadTags-PROP-003] tagColors colours the tags it names, matching case-insensitively', async () => {
    render({ properties: { tags: binding('Paid, Urgent'), tagColors: binding("{{{ paid: '#16a34a' }}}") } });

    await waitFor(() => expect(chip('Paid').style.getPropertyValue('--tg')).toBe('#16a34a'));
    expect(chip('Urgent').style.getPropertyValue('--tg')).toBe('');
  });

  test('[ShadTags-PROP-004] variant solid and outline, size and pill change the chips', async () => {
    render({ properties: { variant: binding('solid'), size: binding('lg'), pill: binding('{{true}}') } });
    await waitFor(() => expect(chip('Design').className).toContain('tw-bg-[color:var(--lk-bg,var(--sc-primary))]'));
    expect(chip('Design')).toHaveClass('tw-h-7', 'tw-rounded-full');

    render({ properties: { variant: binding('outline'), size: binding('sm') } });
    await waitFor(() =>
      expect(chip('Design').className).toContain('tw-border-[color:var(--lk-border,var(--sc-border))]')
    );
    expect(chip('Design')).toHaveClass('tw-h-5');
    expect(chip('Design')).not.toHaveClass('tw-rounded-full');
  });

  describe('on one line', () => {
    // jsdom has no layout: every chip measures 60px and the row 200px, so two chips fit beside a +N chip.
    let restore;
    beforeEach(() => {
      const offset = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth');
      const client = Object.getOwnPropertyDescriptor(Element.prototype, 'clientWidth');
      Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, get: () => 60 });
      Object.defineProperty(Element.prototype, 'clientWidth', { configurable: true, get: () => 200 });
      restore = () => {
        Object.defineProperty(HTMLElement.prototype, 'offsetWidth', offset);
        Object.defineProperty(Element.prototype, 'clientWidth', client);
      };
    });
    afterEach(() => restore());

    test('[ShadTags-PROP-005] overflow single keeps one line and counts the tags that do not fit in a +N chip', async () => {
      render({ properties: { tags: binding('A, B, C, D, E'), overflow: binding('single') } });

      await waitFor(() => expect(chipNames()).toEqual(['A', 'B']));
      expect(screen.getByRole('list', { name: 'Tags' })).toHaveClass('tw-flex-nowrap');
      expect(screen.getByTitle('C, D, E')).toHaveTextContent('+3');
    });
  });

  test('[ShadTags-EVT-001] clicking a tag fires onTagClicked, and its handler reads lastClickedTag', async () => {
    render();
    widget.setEvents(setVariableOn(ID, 'onTagClicked', { value: '{{components.tags1.lastClickedTag}}' }));

    await act(async () => fireEvent.click(chip('Frontend')));

    await waitFor(() => expect(widget.variables().seen).toBe('Frontend'));
    expect(exposed().lastClickedTag).toBe('Frontend');
    expect(chip('Frontend')).toHaveClass('tw-cursor-pointer');
  });

  test('[ShadTags-EVT-002] disabled tags cannot be clicked', async () => {
    render({ properties: { disabledState: binding('{{true}}') } });
    widget.setEvents(setVariableOn(ID, 'onTagClicked'));

    await waitFor(() => expect(chip('Design')).toBeDisabled());
    await act(async () => fireEvent.click(chip('Design')));
    expect(widget.variables().seen).toBeUndefined();
    expect(exposed().lastClickedTag).toBe('');
  });

  test('[ShadTags-STY-001] fill, text, border and radius styles reach the chips as CSS variables they read', async () => {
    const { container } = render({
      styles: {
        backgroundColor: binding('#fef3c7'),
        textColor: binding('#92400e'),
        borderColor: binding('#fcd34d'),
        borderRadius: binding('{{4}}'),
      },
    });

    await waitFor(() => expect(chipNames()).toHaveLength(3));
    const root = container.querySelector('.tj-shadcn');
    expect(root.style.getPropertyValue('--lk-bg')).toBe('#fef3c7');
    expect(root.style.getPropertyValue('--lk-fg')).toBe('#92400e');
    expect(root.style.getPropertyValue('--lk-border')).toBe('#fcd34d');
    expect(root.style.getPropertyValue('--lk-radius')).toBe('4px');
    expect(chip('Design').className).toContain('tw-rounded-[var(--lk-radius,calc(var(--sc-radius)-2px))]');
  });

  test('[ShadTags-DATA-001] 5,000 tags: all are exposed, 500 are drawn with Show more for the rest', async () => {
    // tags exposed only the first 500, and the list ended at Audit 500 with no word of the other 4,500.
    render({ properties: { tags: binding('{{Array.from({ length: 5000 }, (_, i) => `Audit ${i + 1}`)}}') } });
    await waitFor(() => expect(exposed().tags).toHaveLength(5000));
    expect(exposed().tags[4999]).toBe('Audit 5000');
    expect(screen.getAllByRole('listitem')).toHaveLength(500);
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Show 500 more of 4500' })));
    expect(screen.getAllByRole('listitem')).toHaveLength(1000);
    expect(chip('Audit 1000')).toBeInTheDocument();
  });

  test('[ShadTags-DATA-002] on one line, the +N chip counts every tag not drawn', async () => {
    render({
      properties: {
        overflow: binding('single'),
        tags: binding('{{Array.from({ length: 5000 }, (_, i) => `Audit ${i + 1}`)}}'),
      },
    });
    await waitFor(() => expect(exposed().tags).toHaveLength(5000));
    const shown = screen.getAllByRole('listitem').length;
    expect(screen.getByText(`+${5000 - shown}`)).toBeInTheDocument();
  });
});
