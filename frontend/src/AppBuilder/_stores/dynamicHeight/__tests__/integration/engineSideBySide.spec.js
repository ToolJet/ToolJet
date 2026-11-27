/**
 * The dynamic height engine and widgets that grow side by side. Ported from the old engine's
 * dynamicHeightReflowSideBySide.spec.js (same IDs, same drawn layouts), where these were bugs: each text's growth ran
 * its own pass on top of the layout the earlier passes left, so the widget below was pushed by the sum of both. Here
 * each growth is its own pass too, in the order the browser reported it.
 *
 * Runs on the real composed store, seeded through `seedApp`, as engine.spec.js does.
 */
import useStore from '@/AppBuilder/_stores/store';
import { seedApp, binding } from '@/test/app-builder';
import { flushDynamicHeight } from '../../engine';
import { widget } from './dynamicHeightPage';

const pass = (options) => flushDynamicHeight(useStore.getState, options);
const DH = { dynamicHeight: binding('{{true}}') };

// Grows the texts one pass at a time, in order. Returns where the widget below ends up.
const growInTurn = (steps) => {
  for (const [id, height] of steps) pass({ changes: [{ id, height }] });
  return useStore.getState().temporaryLayouts.below.top;
};

describe('dynamic height engine: a widget under two side-by-side texts that grow', () => {
  // Two texts drawn side by side (0–100 tall), with a widget spanning both drawn 20px below them (top 120).
  beforeEach(() =>
    seedApp({
      left: widget('left', 'Text', { top: 0, left: 0, width: 20, height: 100, properties: DH }),
      right: widget('right', 'Text', { top: 0, left: 20, width: 23, height: 100, properties: DH }),
      below: widget('below', 'Button', { top: 120, left: 0, width: 43, height: 40 }),
    })
  );

  it('[DynamicHeight-SIDE-001] sits its drawn gap under the lower text, not pushed by the sum of both growths', () => {
    expect(
      growInTurn([
        ['left', 200],
        ['right', 300],
      ])
    ).toBe(320);
  });

  it('[DynamicHeight-SIDE-002] lands in the same place whichever text grows first', () => {
    expect(
      growInTurn([
        ['right', 300],
        ['left', 200],
      ])
    ).toBe(320);
  });

  it('[DynamicHeight-SIDE-003] is pushed by the whole growth of a single text', () => {
    expect(growInTurn([['left', 200]])).toBe(220);
  });
});

describe('dynamic height engine: a widget under two side-by-side texts that grow, below a widget over its lane', () => {
  // A Switch over the left lane (or, 43 columns wide, over both), two texts under it at 60 (drawn 40 tall), and a
  // widget spanning both texts 20px below them (top 120).
  const seed = (textType, { switchWidth = 10 } = {}) =>
    seedApp({
      switch: widget('switch', 'ToggleSwitchV2', { top: 0, left: 0, width: switchWidth, height: 40 }),
      left: widget('left', textType, { top: 60, left: 0, width: 20, height: 40, properties: DH }),
      right: widget('right', textType, { top: 60, left: 20, width: 23, height: 40, properties: DH }),
      below: widget('below', 'Button', { top: 120, left: 0, width: 43, height: 40 }),
    });

  // A pack text fitted to 32 when it is first drawn, then grown to 60 and 116: under the lower one, 60 + 116 + 20.
  const FIT_THEN_GROW = [
    ['left', 32],
    ['right', 32],
    ['left', 60],
    ['right', 116],
  ];

  it.each(['PackComponent', 'ShadText'])(
    '[DynamicHeight-SIDE-004] %s: sits its drawn gap under the lower text',
    (textType) => {
      seed(textType);
      expect(growInTurn(FIT_THEN_GROW)).toBe(196);
    }
  );

  it('[DynamicHeight-SIDE-005] PackComponent: lands in the same place whichever text grows first', () => {
    seed('PackComponent');
    expect(
      growInTurn([
        ['right', 32],
        ['left', 32],
        ['right', 116],
        ['left', 60],
      ])
    ).toBe(196);
  });

  it('[DynamicHeight-SIDE-007] PackComponent: sits its drawn gap under the lower text below a full-width widget', () => {
    seed('PackComponent', { switchWidth: 43 });
    expect(growInTurn(FIT_THEN_GROW)).toBe(196);
  });

  it('[DynamicHeight-SIDE-006] native Text keeps its place, as before', () => {
    seed('Text');
    expect(
      growInTurn([
        ['left', 60],
        ['right', 116],
      ])
    ).toBe(196);
  });
});
