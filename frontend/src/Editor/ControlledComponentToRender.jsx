import React, { useState, useCallback } from 'react';
// import { getComponentToRender } from '@/_helpers/editorHelpers';
import _ from 'lodash';
import { getComponentsToRenders, flushComponentsToRender } from '@/_stores/editorStore';

function deepEqualityCheckusingLoDash(obj1, obj2) {
  return _.isEqual(obj1, obj2);
}

export const shouldUpdate = (prevProps, nextProps) => {
  const listToRender = getComponentsToRenders();
  // evaluate change in exposedVariables only for Modal component, because open/close in modal relies on exposedVariables
  const compareExposedVariables = nextProps.componentName === 'Modal' || nextProps.componentName === 'ModalV2';

  let needToRender = false;

  const componentId = prevProps?.id === nextProps?.id ? prevProps?.id : null;

  if (componentId) {
    const componentToRender = listToRender.find((item) => item === componentId);

    const parentReRendered = listToRender.find((item) => item === prevProps?.parentId);

    const grandParentReRendered = listToRender.find((item) => item === prevProps?.grandParentId);

    if (componentToRender || parentReRendered || grandParentReRendered) {
      needToRender = true;
    }
  }

  // Flushing the component after the function is called from ControlledComponentToRender component
  if (nextProps?.componentName) flushComponentsToRender([prevProps?.id]);

  // Added to render the default child components
  if (prevProps?.childComponents === null && nextProps?.childComponents) return false;

  return (
    deepEqualityCheckusingLoDash(prevProps?.id, nextProps?.id) &&
    deepEqualityCheckusingLoDash(prevProps?.component?.definition, nextProps?.component?.definition) &&
    deepEqualityCheckusingLoDash(prevProps?.customResolvables, nextProps?.customResolvables) &&
    deepEqualityCheckusingLoDash(prevProps?.properties, nextProps?.properties) &&
    deepEqualityCheckusingLoDash(prevProps?.styles, nextProps?.styles) &&
    (compareExposedVariables
      ? deepEqualityCheckusingLoDash(prevProps?.exposedVariables, nextProps?.exposedVariables)
      : true) &&
    prevProps?.width === nextProps?.width &&
    prevProps?.height === nextProps?.height &&
    prevProps?.darkMode === nextProps?.darkMode &&
    prevProps?.childComponents === nextProps?.childComponents &&
    !needToRender
  );
};

const ComponentWrapper = React.memo(({ componentName, ...props }) => {
  const [key, setKey] = useState(Math.random());

  const resetComponent = useCallback(() => {
    setKey(Math.random());
  }, []);

  const ComponentToRender = <></>; // getComponentToRender(componentName);

  if (ComponentToRender === null) return;
  if (componentName === 'Form') {
    return <ComponentToRender key={key} resetComponent={resetComponent} {...props} />;
  }

  return <ComponentToRender {...props} />;
}, shouldUpdate);

export default ComponentWrapper;
