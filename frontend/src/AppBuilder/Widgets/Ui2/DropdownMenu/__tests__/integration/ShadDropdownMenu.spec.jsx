/**
 * UI 2.0 Dropdown menu: a button that opens a menu of actions (icons, shortcuts, groups, a destructive last item).
 *
 * Real store, real RenderWidget, real widget; nothing about the widget is mocked. Standard control behaviour
 * (visibility, disabled, loading, tooltip) is covered for every UI 2.0 widget in Ui2/__tests__/controlState.spec.jsx;
 * this file covers what the Dropdown menu itself does. Titles carry [ShadDropdownMenu-<AREA>-<NNN>] scenario ids.
 */
import { act, screen, waitFor, fireEvent } from '@testing-library/react';
import { createWidgetHarness, binding, setVariableOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'dd1';
const ITEMS =
  "{{[{ label: 'Edit', value: 'edit', description: 'Change it', shortcut: '⌘E' }, { label: 'Locked', value: 'locked', disabled: true }, { label: 'Hidden', value: 'hidden', visible: false }, { label: 'Delete', value: 'delete', destructive: true, separator: true }]}}";
const widget = createWidgetHarness({
  componentType: 'ShadDropdownMenu',
  handle: 'menu1',
  id: ID,
  widgetHeight: 40,
  widgetWidth: 240,
  defaultProperties: { label: binding('Actions'), items: binding(ITEMS) },
});

// Interactions are tested as an app user meets them: in view mode, where the editor's canvas does not take presses.
const render = (options = {}) => widget.render({ currentMode: 'view', ...options });
const exposed = () => widget.exposed() ?? {};
const handle = (events) => act(async () => widget.setEvents(events));
const trigger = () => document.querySelector('.tj-shadcn button');
/** Opens the menu the way a pointer does (Radix listens for pointerdown). */
const openMenu = async () => {
  await waitFor(() => expect(trigger()).toBeInTheDocument());
  await act(async () => {
    fireEvent.pointerDown(trigger(), { button: 0, pointerType: 'mouse', ctrlKey: false });
  });
  return screen.findByRole('menu');
};
const menuItems = () => screen.queryAllByRole('menuitem').map((el) => el.textContent);

describe('UI 2.0 Dropdown menu', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadDropdownMenu-DEF-001] shows its label with a chevron, the menu closed and nothing picked', async () => {
    render();

    await waitFor(() => expect(trigger()).toHaveTextContent('Actions'));
    expect(trigger().querySelector('.lucide-chevron-down')).toBeInTheDocument();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    await waitFor(() => expect(exposed().isOpen).toBe(false));
    expect(exposed().lastClickedOption).toBeNull();
  });

  test('[ShadDropdownMenu-PROP-001] items list the visible options with descriptions and shortcuts; disabled ones cannot be picked', async () => {
    render();

    await openMenu();

    expect(menuItems()).toEqual(['EditChange it⌘E', 'Locked', 'Delete']);
    expect(screen.getByRole('menuitem', { name: /Locked/ })).toHaveAttribute('data-disabled');
    expect(screen.getByRole('separator')).toBeInTheDocument();
  });

  test('[ShadDropdownMenu-PROP-002] menuLabel heads the menu; optionsLoadingState shows placeholder rows instead of options', async () => {
    render({ properties: { menuLabel: binding('Row actions') } });
    await openMenu();
    expect(screen.getByRole('menu')).toHaveTextContent('Row actions');

    await act(async () => render({ properties: { optionsLoadingState: binding('{{true}}') } }));

    await waitFor(() => expect(menuItems()).toEqual([]));
    expect(screen.getByRole('menu').querySelector('[aria-busy=true]')).toBeInTheDocument();
  });

  test('[ShadDropdownMenu-PROP-003] align and side place the menu against its button', async () => {
    render({ properties: { align: binding('end'), side: binding('top') } });

    const menu = await openMenu();

    expect(menu).toHaveAttribute('data-align', 'end');
    expect(menu).toHaveAttribute('data-side', 'top');
  });

  test('[ShadDropdownMenu-PROP-004] triggerType icon draws an icon button named by its label', async () => {
    render({ properties: { triggerType: binding('icon') } });

    expect(await screen.findByRole('button', { name: 'Actions' })).toHaveAttribute('title', 'Actions');
    expect(trigger()).not.toHaveTextContent('Actions');
    expect(trigger().querySelector('.lucide-ellipsis')).toBeInTheDocument();

    await act(async () => render({ properties: { triggerType: binding('icon'), label: binding('') } }));
    expect(screen.getByRole('button', { name: 'More actions' })).toBeInTheDocument();
  });

  test('[ShadDropdownMenu-PROP-005] triggerIcon draws that icon beside the label; showChevron off drops the chevron', async () => {
    render({ properties: { triggerIcon: binding('IconBolt'), showChevron: binding('{{false}}') } });

    await waitFor(() => expect(trigger().querySelector('.tabler-icon-bolt')).toBeInTheDocument());
    expect(trigger().querySelector('.lucide-chevron-down')).not.toBeInTheDocument();
  });

  test('[ShadDropdownMenu-PROP-006] variant, size and fullWidth shape the button', async () => {
    render({ properties: { variant: binding('destructive'), size: binding('sm'), fullWidth: binding('{{true}}') } });

    await waitFor(() => expect(trigger()).toHaveClass('tw-bg-ui2-destructive'));
    expect(trigger()).toHaveClass('tw-h-8');
    expect(trigger()).toHaveClass('tw-w-full');
  });

  // A long label ran past the widget's box (a long-text sweep in a browser): it now ends in an ellipsis inside it.
  test('[ShadDropdownMenu-PROP-007] a long label ends in an ellipsis inside the button', async () => {
    const long = 'A deliberately long piece of text that keeps going well past what this space was designed to hold';
    render({ properties: { label: binding(long) } });

    const text = await screen.findByText(long);
    expect(text).toHaveClass('tw-truncate');
    expect(trigger()).toHaveClass('tw-max-w-full');
  });

  test('[ShadDropdownMenu-EVT-001] opening the menu fires onOpen, whose handler reads isOpen', async () => {
    render();
    await handle(setVariableOn(ID, 'onOpen', { value: '{{components.menu1.isOpen}}' }));

    await openMenu();

    await waitFor(() => expect(widget.variables().seen).toBe(true));
  });

  test('[ShadDropdownMenu-EVT-002] picking an item fires onSelect with lastClickedOption, and closes the menu', async () => {
    render();
    await handle(setVariableOn(ID, 'onSelect', { value: '{{components.menu1.lastClickedOption.value}}' }));
    await openMenu();

    await act(async () => fireEvent.click(screen.getByRole('menuitem', { name: /Delete/ })));

    await waitFor(() => expect(widget.variables().seen).toBe('delete'));
    expect(exposed().lastClickedOption).toEqual({ label: 'Delete', value: 'delete', description: '' });
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
    expect(exposed().isOpen).toBe(false);
  });

  test('[ShadDropdownMenu-EVT-003] Escape closes the menu and fires onClose', async () => {
    render();
    await handle(setVariableOn(ID, 'onClose', { value: '{{components.menu1.isOpen}}' }));
    await openMenu();

    await act(async () => fireEvent.keyDown(document.activeElement, { key: 'Escape' }));

    await waitFor(() => expect(widget.variables().seen).toBe(false));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  test('[ShadDropdownMenu-KBD-001] Enter on the button opens the menu', async () => {
    render();
    await waitFor(() => expect(trigger()).toBeInTheDocument());

    await act(async () => fireEvent.keyDown(trigger(), { key: 'Enter' }));

    expect(await screen.findByRole('menu')).toBeInTheDocument();
    await waitFor(() => expect(exposed().isOpen).toBe(true));
  });

  test('[ShadDropdownMenu-ACT-001] open and close show and hide the menu', async () => {
    render();

    await widget.act('open');
    expect(await screen.findByRole('menu')).toBeInTheDocument();
    await waitFor(() => expect(exposed().isOpen).toBe(true));

    await widget.act('close');
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
    expect(exposed().isOpen).toBe(false);
  });

  test('[ShadDropdownMenu-ACT-002] a disabled menu opens neither from its button nor from open()', async () => {
    render({ properties: { disabledState: binding('{{true}}') } });
    await waitFor(() => expect(trigger()).toBeDisabled());

    await act(async () => fireEvent.keyDown(trigger(), { key: 'Enter' }));
    await widget.act('open');

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(exposed().isOpen).toBe(false);
  });

  test('[ShadDropdownMenu-STY-001] button styles reach the widget and menu styles reach the menu as CSS variables', async () => {
    const { container } = render({
      styles: {
        backgroundColor: binding('#0f172a'),
        textColor: binding('#f8fafc'),
        borderColor: binding('#334155'),
        hoverBackgroundColor: binding('#1e293b'),
        borderRadius: binding('{{10}}'),
        menuBackgroundColor: binding('#fafafa'),
        menuBorderColor: binding('#e4e4e7'),
        itemTextColor: binding('#18181b'),
        itemHoverBackgroundColor: binding('#f4f4f5'),
        itemHoverTextColor: binding('#09090b'),
        descriptionColor: binding('#71717a'),
        iconColor: binding('#a1a1aa'),
        destructiveColor: binding('#be123c'),
        menuRadius: binding('{{6}}'),
        menuWidth: binding('{{280}}'),
      },
    });

    const root = container.querySelector('.tj-shadcn');
    await waitFor(() => expect(root.style.getPropertyValue('--lk-bg')).toBe('#0f172a'));
    expect(root.style.getPropertyValue('--lk-fg')).toBe('#f8fafc');
    expect(root.style.getPropertyValue('--lk-border')).toBe('#334155');
    expect(root.style.getPropertyValue('--lk-hover')).toBe('#1e293b');
    expect(root.style.getPropertyValue('--lk-radius')).toBe('10px');
    expect(trigger().className).toContain('tw-bg-[color:var(--lk-bg)]');

    const menu = await openMenu();
    const vars = {
      '--lk-menu-bg': '#fafafa',
      '--lk-menu-border': '#e4e4e7',
      '--lk-item-fg': '#18181b',
      '--lk-item-hover': '#f4f4f5',
      '--lk-item-hover-fg': '#09090b',
      '--lk-desc': '#71717a',
      '--lk-icon': '#a1a1aa',
      '--lk-destructive': '#be123c',
      '--lk-menu-radius': '6px',
      '--lk-menu-width': '280px',
    };
    Object.entries(vars).forEach(([name, value]) => expect(menu.style.getPropertyValue(name)).toBe(value));
  });
});
