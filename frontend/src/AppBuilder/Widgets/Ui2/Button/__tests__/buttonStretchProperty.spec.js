import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
/**
 * The Button's "Full width" toggle did nothing the team could see: on the grid a button always fills its box, and only
 * a button in a Flex container's fill slot keeps its label's width unless the toggle is on (ShadButton.spec.jsx,
 * PROP-002, covers that behaviour). The property now says where it applies and what it does.
 */
import { shadButtonConfig } from '@/AppBuilder/WidgetManager/widgets/shadButton';

test('the stretch property names the flex container and says what the grid does', () => {
  const property = shadButtonConfig.properties.fullWidth;
  expect(property.displayName).toBe('Stretch in flex container');
  expect(property.note).toMatch(/Flex container/);
  expect(property.note).toMatch(/label's width/);
  expect(property.note).toMatch(/grid it always fills its box/);
  // The saved key and default are unchanged, so saved apps keep their buttons as they are.
  expect(shadButtonConfig.definition.properties.fullWidth.value).toBe('{{false}}');
});
