import { getAdjustedDropPosition } from '../dragEnd';
import { getMouseDistanceFromParentDiv } from '../../gridUtils';

// A widget dropped with the pointer left of the target's first column (near the left edge of a pack Card's slot, whose
// box starts inside the card's padding) saved a negative left, and the widget was cut off (QA round four).
jest.mock('../../gridUtils', () => ({
  ...jest.requireActual('../../gridUtils'),
  getMouseDistanceFromParentDiv: jest.fn(),
}));

describe('getAdjustedDropPosition', () => {
  test('never places a dropped widget left of the first column', () => {
    getMouseDistanceFromParentDiv.mockReturnValue({ left: -37, top: 42 });
    const pos = getAdjustedDropPosition({}, { slotId: 'card-1-body', widgetType: 'PackComponent' }, true, 20, {});
    expect(pos.left).toBe(0);
    expect(pos.top).toBe(40);
  });

  test('keeps a drop inside the target where it is, snapped to the grid', () => {
    getMouseDistanceFromParentDiv.mockReturnValue({ left: 61, top: 0 });
    const pos = getAdjustedDropPosition({}, { slotId: 'canvas', widgetType: 'Container' }, true, 20, {});
    expect(pos.left).toBe(60);
  });
});
