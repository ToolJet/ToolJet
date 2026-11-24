import { getMenuPortalLeft } from '../useMenuWidth';

// A menu wider than the space right of its field must move left to stay inside the window.
describe('[DropdownV2-MENU-001] menu portal left edge', () => {
  // Break this catches: capping the menu width at the window width but keeping its left edge at the field, so a
  // wide custom menu runs past the right edge and the page scrolls sideways.
  test('[DropdownV2-MENU-001] a custom-width menu shifts left by whatever would overflow the window', () => {
    expect(getMenuPortalLeft(140, { width: '3000px', maxWidth: 'calc(100vw - 24px)' })).toBe(
      'min(140px, calc(100vw - min(3000px, calc(100vw - 24px)) - 12px))'
    );
  });

  test('[DropdownV2-MENU-001] a menu that matches its field keeps the field position', () => {
    expect(getMenuPortalLeft(140, { maxWidth: 'calc(100vw - 24px)' })).toBe(140);
  });
});
