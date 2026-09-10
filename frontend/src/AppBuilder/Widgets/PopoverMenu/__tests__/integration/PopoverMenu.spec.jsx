/**
 * PopoverMenu — Menu width style property, against the REAL store.
 *
 * Before this property existed, the popover's overlay width was hardcoded to
 * the trigger widget's own canvas box width (`style={{ width, maxWidth: width }}`
 * in PopoverMenu.jsx), so a narrow, icon-only trigger could never open a menu
 * wider than itself. `menuWidthMode`/`menuCustomWidth` (mirroring Dropdown's
 * own Menu width property) let the menu match the field, match its content,
 * or take an explicit custom width instead.
 *
 * The widget is seeded at a deliberately narrow width (40px) to reproduce the
 * icon-only-button use case that motivated the feature.
 */
import { screen, waitFor } from '@testing-library/react';
import { createWidgetHarness, binding } from '../../../widgetHarness';

const ID = 'pm1';
const NAME = 'popovermenu1';
const NARROW_WIDTH = 40;

const widget = createWidgetHarness({
  componentType: 'PopoverMenu',
  handle: NAME,
  id: ID,
  widgetWidth: NARROW_WIDTH,
  defaultProperties: {
    label: binding('Menu'),
    trigger: binding('click'),
    visibility: binding('{{true}}'),
  },
});

const openPopover = async () => {
  await widget.session.user.click(screen.getByRole('button', { name: 'Menu' }));
  const dialog = await waitFor(() => {
    const el = screen.getByRole('dialog', { name: 'Menu options' });
    expect(el).toBeInTheDocument();
    return el;
  });
  return dialog;
};

const WIDE_WIDTH = 380;

const wideWidget = createWidgetHarness({
  componentType: 'PopoverMenu',
  handle: 'popovermenu2',
  id: 'pm2',
  widgetWidth: WIDE_WIDTH,
  defaultProperties: {
    label: binding('Menu'),
    trigger: binding('click'),
    visibility: binding('{{true}}'),
  },
});

describe('PopoverMenu — Menu width', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('defaults to matchField: the menu is pinned to the (narrow) trigger width', async () => {
    widget.render();

    const dialog = await openPopover();

    expect(dialog.style.width).toBe(`${NARROW_WIDTH}px`);
    expect(dialog.style.minWidth).toBe(`${NARROW_WIDTH}px`);
  });

  test('matchContent leaves width and minWidth unset so the menu can grow past the trigger', async () => {
    widget.render({ styles: { menuWidthMode: binding('matchContent') } });

    const dialog = await openPopover();

    expect(dialog.style.width).toBe('');
    expect(dialog.style.minWidth).toBe('');
  });

  test('custom with a numeric value sets an explicit pixel width, wider than the trigger', async () => {
    widget.render({
      styles: { menuWidthMode: binding('custom'), menuCustomWidth: binding('400') },
    });

    const dialog = await openPopover();

    expect(dialog.style.width).toBe('400px');
  });

  test('custom with a percentage value passes the unit through untouched', async () => {
    widget.render({
      styles: { menuWidthMode: binding('custom'), menuCustomWidth: binding('75%') },
    });

    const dialog = await openPopover();

    expect(dialog.style.width).toBe('75%');
  });
});

describe('PopoverMenu — Menu width, wide trigger', () => {
  beforeEach(wideWidget.setup);
  afterEach(wideWidget.teardown);

  // Break this catches: a wide (e.g. full-width) trigger button forcing the popover to stay
  // that wide under matchContent, even when the content itself is much narrower.
  test('matchContent does not pin the menu to a wide trigger button', async () => {
    wideWidget.render({ styles: { menuWidthMode: binding('matchContent') } });

    await wideWidget.session.user.click(screen.getByRole('button', { name: 'Menu' }));
    const dialog = await waitFor(() => {
      const el = screen.getByRole('dialog', { name: 'Menu options' });
      expect(el).toBeInTheDocument();
      return el;
    });

    expect(dialog.style.width).toBe('');
    expect(dialog.style.minWidth).toBe('');
  });
});
