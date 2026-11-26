import { resolveWidgetVisibility } from '../visibility';

// A widget as resolved at one row context: its properties, legacy styles, "show on" toggles, and what
// `setVisibility` exposed at runtime.
const visibilityOf = ({ properties, styles, others, exposed, currentLayout = 'desktop', contextIndices = null }) => {
  const asked = [];
  const visible = resolveWidgetVisibility({
    componentId: 'text1',
    contextIndices,
    currentLayout,
    getResolvedComponent: (id, ctx) => {
      asked.push(['component', id, ctx]);
      return { properties, styles, others };
    },
    getExposedPropertyForAdditionalActions: (id, ctx, property) => {
      asked.push(['exposed', id, ctx, property]);
      return exposed;
    },
  });
  return { visible, asked };
};

describe('dynamic height: widget visibility', () => {
  it('[DynamicHeight-VIS-001] counts a widget as visible when nothing says otherwise', () => {
    expect(visibilityOf({}).visible).toBe(true);
  });

  it('[DynamicHeight-VIS-002] follows the Visibility property', () => {
    expect(visibilityOf({ properties: { visibility: false } }).visible).toBe(false);
    expect(visibilityOf({ properties: { visibility: true } }).visible).toBe(true);
  });

  it('[DynamicHeight-VIS-003] lets a runtime setVisibility override the property, both ways', () => {
    expect(visibilityOf({ properties: { visibility: true }, exposed: false }).visible).toBe(false);
    expect(visibilityOf({ properties: { visibility: false }, exposed: true }).visible).toBe(true);
  });

  it('[DynamicHeight-VIS-004] falls back to the legacy style visibility of older widgets', () => {
    expect(visibilityOf({ styles: { visibility: false } }).visible).toBe(false);
    // The property wins over the legacy style when both are set.
    expect(visibilityOf({ properties: { visibility: true }, styles: { visibility: false } }).visible).toBe(true);
  });

  it('[DynamicHeight-VIS-005] hides a widget turned off for the current layout, whatever else says', () => {
    const offOnDesktop = { others: { showOnDesktop: false }, properties: { visibility: true }, exposed: true };
    expect(visibilityOf(offOnDesktop).visible).toBe(false);
    expect(visibilityOf({ ...offOnDesktop, currentLayout: 'mobile' }).visible).toBe(true);
    expect(visibilityOf({ others: { showOnMobile: false }, currentLayout: 'mobile' }).visible).toBe(false);
  });

  it('[DynamicHeight-VIS-006] reads the widget at the row it is asked about', () => {
    const { asked } = visibilityOf({ contextIndices: [2] });
    expect(asked).toEqual([
      ['component', 'text1', [2]],
      ['exposed', 'text1', [2], 'isVisible'],
    ]);
  });
});
