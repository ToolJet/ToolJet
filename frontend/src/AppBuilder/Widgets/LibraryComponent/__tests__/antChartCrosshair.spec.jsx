import { tooltipInteraction } from '../../../../../../packs/antd/src/lib/chartTheme';

// The tooltip's hover line is drawn at the hovered x, right where a point or an area's edge is clicked: it took the
// click, so no element was clicked and selectedDatum stayed as it was. G2 already lets clicks through its hover markers.
describe('Ant charts: the hover line lets clicks through', () => {
  it.each([[undefined], [document.createElement('div')]])('mount %#', (mount) => {
    expect(tooltipInteraction(mount).tooltip.crosshairsPointerEvents).toBe('none');
  });
});
