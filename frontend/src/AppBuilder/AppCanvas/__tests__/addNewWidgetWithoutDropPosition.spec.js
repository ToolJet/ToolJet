import { addNewWidgetToTheEditor } from '../appCanvasUtils';
import { useGridStore } from '@/_stores/gridStore';

// A drag that is cancelled (released off the canvas) can still reach the drop path, but there is no drop position.
test('[Grid-DROP-001] adding a widget without a drop position adds nothing and does not throw', () => {
  // Break this catches: destructuring the ghost drag position unguarded, so a cancelled drag throws
  // "Cannot destructure property 'e' of getGhostDragPosition() as it is null".
  useGridStore.getState().actions.setGhostDragPosition(null);

  expect(() => addNewWidgetToTheEditor('Button', 'desktop', null, 'canvas')).not.toThrow();
  expect(addNewWidgetToTheEditor('Button', 'desktop', null, 'canvas')).toBeNull();
});
