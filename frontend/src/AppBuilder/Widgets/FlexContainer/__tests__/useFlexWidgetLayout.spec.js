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

describe('a dynamic height child whose box follows its content, in the viewer', () => {
  // `followsContent`: WidgetWrapper's dynamicHeightPolicy.boxFollowsContent. The measured (temporary) height never
  // sizes the slot: the slot follows what the child draws, floored at the height it is drawn at.
  const grown = { dynamicHeight: true, temporaryHeight: 150, followsContent: true };

  it('[DynamicHeight-FLEXSLOT-004] in a column, follows its content from its drawn height up', () => {
    const layout = child({ fillWidth: true, height: 120 }, { ...grown, flexDirection: 'column' });
    expect(layout.outerStyle).toMatchObject({ flex: '0 0 auto', height: 'auto', minHeight: '120px' });
  });

  it('[DynamicHeight-FLEXSLOT-005] in a row, follows its content from its drawn height up', () => {
    const layout = child({ fillWidth: false, widthPx: 300, height: 120 }, grown);
    expect(layout.outerStyle).toMatchObject({ flex: '0 0 300px', height: 'auto', minHeight: '120px' });
  });

  it('[DynamicHeight-FLEXSLOT-006] when stretched by an Equal heights row, is floored at its drawn height, not the measured one', () => {
    // The line is as tall as its tallest child's content; a floor at a measured height kept it from ever shrinking.
    const layout = child({ fillWidth: true, height: 120 }, { ...grown, layoutV2: true, stretch: true });
    expect(layout.outerStyle).toMatchObject({ height: 'auto', minHeight: '120px', alignSelf: 'stretch' });
  });

  it('[DynamicHeight-FLEXSLOT-007] keeps the measured height where its box does not follow its content', () => {
    // A container in a FlexContainer is sized from its children by the engine.
    const layout = child({ fillWidth: false, widthPx: 300, height: 120 }, { ...grown, followsContent: false });
    expect(layout.outerStyle).toMatchObject({ height: '150px' });
  });

  it('[DynamicHeight-FLEXSLOT-008] is drawn at its drawn height in the editor, and hidden as before', () => {
    expect(child({ height: 120 }, { ...grown, dynamicHeight: false, mode: 'edit' }).outerStyle).toMatchObject({
      height: '120px',
    });
    expect(child({ height: 120 }, { ...grown, visibility: false }).outerStyle).toMatchObject({ display: 'none' });
  });
});
