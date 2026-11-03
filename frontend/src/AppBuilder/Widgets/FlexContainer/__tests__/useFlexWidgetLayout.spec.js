import { renderHook } from '@testing-library/react';
import { useFlexWidgetLayout } from '../useFlexWidgetLayout';

// A child of a FlexContainer row 1200px wide. layoutV2 is the container's layout version: false for one saved before
// UI 2.0 (lts-3.16 layout), true for one created since.
const child = (layoutData, options = {}) =>
  renderHook(() =>
    useFlexWidgetLayout({
      layoutData,
      gridWidth: 20,
      containerWidth: 1200,
      flexDirection: 'row',
      flexShouldStack: false,
      visibility: true,
      mode: 'view',
      isWidgetActive: false,
      ...options,
    })
  ).result.current;

describe('a fill-width child of a row', () => {
  it('takes the whole line in a container saved before layout version 2, so fill children stack one per line', () => {
    const layout = child({ fillWidth: true, height: 60 }, { layoutV2: false });
    expect(layout.outerStyle).toMatchObject({ flex: '1 0 auto', height: '60px', minWidth: 0 });
    expect(layout.widgetWidth).toBe(1200);
  });

  it('shares the line from a zero basis in a new container', () => {
    const layout = child({ fillWidth: true, height: 60 }, { layoutV2: true });
    expect(layout.outerStyle).toMatchObject({ flex: '1 1 0px', height: '60px', minWidth: '0px' });
  });
});

describe('a fixed-width child wider than its row', () => {
  it('keeps its own width in a container saved before layout version 2', () => {
    const layout = child({ fillWidth: false, widthPx: 1500, height: 40 }, { layoutV2: false });
    expect(layout.outerStyle).toMatchObject({ flex: '0 0 1500px', minWidth: 0 });
    expect(layout.outerStyle.maxWidth).toBeUndefined();
    expect(layout.widgetWidth).toBe(1500);
  });

  it('is held to the row in a new container', () => {
    const layout = child({ fillWidth: false, widthPx: 1500, height: 40 }, { layoutV2: true });
    expect(layout.outerStyle).toMatchObject({ flex: '0 0 1500px', maxWidth: '100%' });
    expect(layout.widgetWidth).toBe(1200);
  });
});

describe('a child stretched by an Equal heights row', () => {
  it("fills the line's height, its own height kept as the floor", () => {
    const layout = child(
      { fillWidth: true, height: 120 },
      { layoutV2: true, stretch: true, dynamicHeight: true, temporaryHeight: 150 }
    );
    expect(layout.isStretched).toBe(true);
    expect(layout.outerStyle).toMatchObject({ height: 'auto', minHeight: '150px', alignSelf: 'stretch' });
  });

  it('is not stretched in a column or while stacked', () => {
    expect(child({ height: 120 }, { stretch: true, flexDirection: 'column' }).isStretched).toBe(false);
    expect(child({ height: 120 }, { stretch: true, flexShouldStack: true }).isStretched).toBe(false);
  });
});
