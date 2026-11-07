import { panelHeaderClearance } from '../panelHeaderClearance';

const rect = (left, top, width, height) => ({ left, top, width, height, right: left + width, bottom: top + height });

describe('panelHeaderClearance', () => {
  // The version button at the header's right; the menu opens below it, right-aligned, 320 px wide.
  const trigger = rect(1000, 8, 120, 32); // bottom 40, right 1120
  const menu = { width: 320, height: 300 };

  it('opens below a panel header the menu would cover, so its close button stays clickable', () => {
    const inspectorHeader = rect(1040, 48, 400, 44); // bottom 92
    expect(panelHeaderClearance(trigger, menu, [inspectorHeader])).toBe(92 - 44 + 4);
  });

  it('is 0 when no panel header is under the menu', () => {
    expect(panelHeaderClearance(trigger, menu, [])).toBe(0);
    expect(panelHeaderClearance(trigger, menu, [rect(1200, 48, 300, 44)])).toBe(0); // right of the menu
    expect(panelHeaderClearance(trigger, menu, [rect(700, 400, 600, 44)])).toBe(0); // far below
    expect(panelHeaderClearance(trigger, menu, [rect(1040, 48, 0, 0)])).toBe(0); // hidden panel
  });
});
