/**
 * The selected components that act together on the canvas (move, resize, copy): the top-level ones if any are
 * selected, otherwise those sharing the first one's parent.
 */
import useStore from '@/AppBuilder/_stores/store';

export function findHighestLevelofSelection(_selectedComponents) {
  const selectedComponents = _selectedComponents || useStore.getState().getSelectedComponentsDefinition();
  let result = [];
  if (selectedComponents.some((widget) => !widget?.component?.parent)) {
    result = selectedComponents.filter((widget) => !widget?.component?.parent);
  } else {
    result = selectedComponents.filter(
      (widget) => widget?.component?.parent === selectedComponents[0]?.component?.parent
    );
  }
  return result;
}
