// Release audit round 3 (Codex fixture reviewHeadingLevelFallback, trimmed): a Heading level of 'constructor',
// 'toString' or '__proto__' passed the level lookup (an inherited Object property) and crashed the widget. Unknown
// levels, these included, fall back to h2.
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { screen } from '@testing-library/react';

const w = createWidgetHarness({
  componentType: 'ShadHeading',
  id: 'heading1',
  handle: 'heading1',
  widgetHeight: 120,
  widgetWidth: 500,
});
beforeEach(() => w.setup());
afterEach(w.teardown);

test.each([
  ['h1', 1],
  ['h4', 4],
  ['unknown', 2],
  ['constructor', 2],
  ['toString', 2],
  ['__proto__', 2],
])('heading level %s renders an h%i', (level, expected) => {
  w.render({ currentMode: 'view', properties: { text: binding('Audit title'), level: binding(level) } });
  expect(screen.getByRole('heading', { name: 'Audit title', level: expected })).toBeInTheDocument();
});
