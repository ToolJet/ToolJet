// Release audit round 3 (Codex fixture reviewActionsModelCurrent, its aspect ratio cases): a Carousel aspect ratio of
// 'constructor', 'toString' or '__proto__' passed the named-ratio lookup and returned a function (or an object), not a
// number. Unknown names fall back to 16/9.
import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
import { aspectRatio } from '@/AppBuilder/Widgets/Ui2/_actions/actionsModel';

test.each(['constructor', 'toString', '__proto__', 'junk'])('aspect ratio %s falls back to 16/9', (value) => {
  expect(aspectRatio(value)).toBeCloseTo(16 / 9);
});

test('named and written ratios still apply (the controls)', () => {
  expect(aspectRatio('4:3')).toBeCloseTo(4 / 3);
  expect(aspectRatio('21/9')).toBeCloseTo(21 / 9);
  expect(aspectRatio('5/2')).toBeCloseTo(5 / 2);
  expect(aspectRatio('fill')).toBeNull();
});
