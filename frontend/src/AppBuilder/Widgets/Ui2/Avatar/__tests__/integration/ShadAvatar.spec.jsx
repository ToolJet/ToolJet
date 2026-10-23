/**
 * UI 2.0 Avatar: one person's avatar, or an overlapping group of them.
 *
 * Real store, real RenderWidget, real widget; nothing about the widget is mocked. Standard control behaviour
 * (visibility, disabled, loading, tooltip) is covered for every UI 2.0 widget in Ui2/__tests__/controlState.spec.jsx;
 * this file covers what the Avatar itself does. Titles carry [ShadAvatar-<AREA>-<NNN>] scenario ids.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { screen, waitFor } from '@testing-library/react';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const widget = createWidgetHarness({
  componentType: 'ShadAvatar',
  handle: 'avatar1',
  id: 'avatar1',
  widgetHeight: 600,
  widgetWidth: 240,
  defaultProperties: { names: binding('Ada Lovelace') },
});

const render = (options = {}) => widget.render({ currentMode: 'view', ...options });
/** Each avatar carries its person's name as its title (the +N chip says how many more). */
const avatars = (container) => [...container.querySelectorAll('.tj-shadcn [title]')];
const titles = (container) => avatars(container).map((a) => a.getAttribute('title'));

describe('UI 2.0 Avatar', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadAvatar-DEF-001] shows one person by their initials', async () => {
    const { container } = render();

    expect(await screen.findByText('AL')).toBeInTheDocument();
    expect(titles(container)).toEqual(['Ada Lovelace']);
    expect(container.querySelector('img')).toBeNull();
  });

  test('[ShadAvatar-PROP-001] names takes a comma-separated list, an array, or { name } objects', async () => {
    const { container } = render({ properties: { names: binding('Ada Lovelace, Grace Hopper') } });
    await waitFor(() => expect(titles(container)).toEqual(['Ada Lovelace', 'Grace Hopper']));
    expect(screen.getByText('GH')).toBeInTheDocument();

    render({ properties: { names: binding("{{[{ name: 'Alan Turing' }, 'Edsger Dijkstra', null, '']}}") } });
    await waitFor(() => expect(titles(container)).toEqual(['Alan Turing', 'Edsger Dijkstra']));
    expect(screen.getByText('AT')).toBeInTheDocument();
  });

  // A rank or code before the name ("01 Nina Park") is not part of it (2026-10-14: every leaderboard avatar read "0P").
  test('[ShadAvatar-PROP-002] initials skip a leading rank or code', async () => {
    render({ properties: { names: binding('01 Nina Park') } });

    expect(await screen.findByText('NP')).toBeInTheDocument();
  });

  test('[ShadAvatar-PROP-003] maxVisible caps the group and a +N chip counts the rest', async () => {
    const { container } = render({
      properties: {
        names: binding("{{['Ada Lovelace','Grace Hopper','Alan Turing','Edsger Dijkstra','Barbara Liskov']}}"),
        maxVisible: binding('{{3}}'),
      },
    });

    await waitFor(() => expect(titles(container)).toEqual(['Ada Lovelace', 'Grace Hopper', 'Alan Turing', '2 more']));
    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  // The pack's utilities are !important, so an inline width lost to the Avatar's h-8 w-8 and every avatar drew at 32px;
  // the size is a variable the classes read, with the initials' font and the group's overlap scaled to it.
  test('[ShadAvatar-PROP-004] size sets each avatar size, scaling the initials and the overlap, clamped to 16-256', async () => {
    const { container } = render({ properties: { size: binding('{{64}}') } });
    const group = () => container.querySelector('.tj-shadcn > div');

    await waitFor(() => expect(group().style.getPropertyValue('--av-size')).toBe('64px'));
    expect(group().style.getPropertyValue('--av-font')).toBe('26px');
    expect(group().style.getPropertyValue('--av-overlap')).toBe('13px');
    expect(avatars(container)[0].className).toContain('tw-h-[var(--av-size)]');

    render({ properties: { size: binding('{{4000}}') } });
    await waitFor(() => expect(group().style.getPropertyValue('--av-size')).toBe('256px'));
  });

  describe('with an image that loads', () => {
    // Radix shows the image once the browser has loaded it (a window.Image probe), else the initials. jsdom never loads
    // images, so this probe loads every src at once.
    let RealImage;
    beforeAll(() => {
      RealImage = window.Image;
      window.Image = class {
        set src(value) {
          this._src = value;
          setTimeout(() => this.onload?.({}), 0);
        }
        get src() {
          return this._src;
        }
        addEventListener(type, fn) {
          if (type === 'load') this.onload = fn;
        }
        removeEventListener() {}
      };
    });
    afterAll(() => (window.Image = RealImage));

    test('[ShadAvatar-PROP-005] src shows the photo of a single person once it has loaded', async () => {
      render({ properties: { src: binding('https://example.invalid/ada.png') } });

      const img = await screen.findByRole('img', { name: 'Ada Lovelace' });
      expect(img).toHaveAttribute('src', 'https://example.invalid/ada.png');
    });

    test('[ShadAvatar-PROP-006] in a group each person takes their own src, and the single src is ignored', async () => {
      render({
        properties: {
          names: binding("{{[{ name: 'Ada Lovelace', src: 'https://example.invalid/a.png' }, 'Grace Hopper']}}"),
          src: binding('https://example.invalid/shared.png'),
        },
      });

      expect(await screen.findByRole('img', { name: 'Ada Lovelace' })).toHaveAttribute(
        'src',
        'https://example.invalid/a.png'
      );
      expect(screen.queryByRole('img', { name: 'Grace Hopper' })).toBeNull();
      expect(screen.getByText('GH')).toBeInTheDocument();
    });
  });

  test('[ShadAvatar-STY-001] fill, text and ring colours reach the avatars as CSS variables they read', async () => {
    const { container } = render({
      styles: { backgroundColor: binding('#e0e7ff'), textColor: binding('#3730a3'), ringColor: binding('#ffffff') },
    });

    await screen.findByText('AL');
    const root = container.querySelector('.tj-shadcn');
    expect(root.style.getPropertyValue('--lk-bg')).toBe('#e0e7ff');
    expect(root.style.getPropertyValue('--lk-fg')).toBe('#3730a3');
    expect(root.style.getPropertyValue('--lk-ring')).toBe('#ffffff');
    expect(screen.getByText('AL').className).toContain('tw-bg-[color:var(--lk-bg,var(--sc-muted))]');
  });

  test('[ShadAvatar-STY-010] a box shorter than the avatar draws it at the box height', async () => {
    // A 32px avatar in a 20px box painted 14px over the widget below (the Cypress geometry check). The box is its
    // height less the canvas's 2px padding above and below.
    const small = createWidgetHarness({
      componentType: 'ShadAvatar',
      handle: 'avatar2',
      id: 'avatar2',
      widgetHeight: 20,
      widgetWidth: 240,
      defaultProperties: { names: binding('Ada Lovelace') },
    });
    await small.setup();
    try {
      small.render({ currentMode: 'view' });
      const avatar = await screen.findByText('AL');
      expect(avatar.closest('[style*="--av-size"]').style.getPropertyValue('--av-size')).toBe('16px');
    } finally {
      small.teardown();
    }
  });
});
