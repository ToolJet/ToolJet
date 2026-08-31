/** @jest-environment node */
import { ANNOTATION_LABEL_HEIGHT, annotationLabelPosition } from '../annotationLabel';

// The label row sits directly under its annotation box at `top: (y + height)%`
// of the image. It is absolutely positioned, so it contributes no height, and
// nothing between the widget and the canvas clips overflow — an annotation low
// in the image therefore renders its label outside the widget box, on top of
// whatever component sits below. Flipping the label above the box when there is
// no room beneath keeps it inside without touching grid heights.
describe('annotationLabelPosition', () => {
  const container = 500; // px; label is 40px => 8% of the container

  it('anchors the label below the annotation when there is room', () => {
    expect(annotationLabelPosition({ y: 20, height: 16 }, container)).toEqual({ top: '36%' });
  });

  it('flips the label above the annotation when it would leave the container', () => {
    // 80 + 16 = 96%, plus an 8% label = 104% — past the bottom edge.
    expect(annotationLabelPosition({ y: 80, height: 16 }, container)).toEqual({ bottom: '20%' });
  });

  it('keeps the label below when flipping it would push it out of the top', () => {
    // Sits low enough to overflow below, but only 4% from the top, so there is
    // no room above for a 8% label either. Overflowing down is the lesser evil:
    // flipping up would clip the label against the widget's own top edge.
    expect(annotationLabelPosition({ y: 4, height: 94 }, container)).toEqual({ top: '98%' });
  });

  it('treats a POINT annotation, which carries no height, as zero-height', () => {
    // Previously produced `top: "NaN%"` in RenderEditor, an invalid declaration
    // that browsers drop — leaving the label at its static position.
    expect(annotationLabelPosition({ y: 30 }, container)).toEqual({ top: '30%' });
    expect(annotationLabelPosition({ y: 30 }, container).top).not.toContain('NaN');
  });

  it('anchors below without flipping while the container is still unmeasured', () => {
    // BoundedBox measures the image on load; before that the height is unknown
    // and there is nothing to compare against.
    [undefined, null, 0].forEach((unmeasured) => {
      expect(annotationLabelPosition({ y: 90, height: 8 }, unmeasured)).toEqual({ top: '98%' });
    });
  });

  it('scales the flip threshold with the container, not a fixed percentage', () => {
    const geometry = { y: 84, height: 10 };
    // 94% + 40/1000 => 98% fits in a tall image...
    expect(annotationLabelPosition(geometry, 1000)).toEqual({ top: '94%' });
    // ...but 94% + 40/200 => 114% does not in a short one.
    expect(annotationLabelPosition(geometry, 200)).toEqual({ bottom: '16%' });
  });

  it('exposes the label height it reserves', () => {
    expect(ANNOTATION_LABEL_HEIGHT).toBeGreaterThan(0);
  });
});
