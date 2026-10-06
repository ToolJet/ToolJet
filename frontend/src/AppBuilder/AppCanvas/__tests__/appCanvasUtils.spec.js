import { getSubContainerWidthAfterPadding } from '../appCanvasUtils';
import { CONTAINER_FORM_CANVAS_PADDING, HOVER_CLICK_OUTLINE_BORDER } from '../appCanvasConstants';

describe('getSubContainerWidthAfterPadding', () => {
  test("[Table-BUG-030] a Table widget's expanded-row sub-canvas subtracts its real CSS padding, not the generic subcontainer fallback", () => {
    // ExpandedRowContainer.jsx applies `padding: ${CONTAINER_FORM_CANVAS_PADDING}px` to
    // `.table-expanded-row-content`, and Container.jsx applies `padding: ${HOVER_CLICK_OUTLINE_BORDER}px`
    // to its own `.real-canvas` child inside that — the same two terms the 'Container'/'Form'/'Accordion'/
    // 'FlexContainer' branch already accounts for (minus the border width, which Table's expanded row
    // doesn't render). A child widget's internal grid (`gridWidth = containerCanvasWidth / NO_OF_GRIDS`)
    // must be sized against the real padded content width, or a widget positioned at the sub-canvas's
    // own right edge renders past the real visible boundary.
    const canvasWidth = 500;
    const expectedRealPadding = 2 * CONTAINER_FORM_CANVAS_PADDING + 2 * HOVER_CLICK_OUTLINE_BORDER;

    const result = getSubContainerWidthAfterPadding(canvasWidth, 'Table', 'tbl1-row-0', { current: null });

    expect(result).toBe(canvasWidth - expectedRealPadding);
  });
});
