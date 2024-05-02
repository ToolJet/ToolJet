import React, { useState, useCallback } from 'react';
import { getComponentToRender } from '@/_helpers/editorHelpers';
import _ from 'lodash';

import { getComponentsToRenders } from '@/_stores/editorStore';

function deepEqualityCheckusingLoDash(obj1, obj2) {
  return _.isEqual(obj1, obj2);
}

export const shouldUpdate = (prevProps, nextProps) => {
  const listToRender = getComponentsToRenders();

  let needToRender = false;

  const componentId = prevProps?.id === nextProps?.id ? prevProps?.id : null;

  if (componentId) {
    const componentToRender = listToRender.find((item) => item === componentId);

    if (componentToRender) {
      needToRender = true;
    }
  }

  // Added to render the defaukt child components
  if (prevProps?.childComponents === null && nextProps?.childComponents) return false;

  return (
    deepEqualityCheckusingLoDash(prevProps?.id, nextProps?.id) &&
    deepEqualityCheckusingLoDash(prevProps?.component?.definition, nextProps?.component?.definition) &&
    prevProps?.width === nextProps?.width &&
    prevProps?.height === nextProps?.height &&
    prevProps?.darkMode === nextProps?.darkMode &&
    !needToRender
  );
};

const ComponentWrapper = React.memo(({ componentName, ...props }) => {
  const [key, setKey] = useState(Math.random());

  const resetComponent = useCallback(() => {
    setKey(Math.random());
  }, []);

  const ComponentToRender = getComponentToRender(componentName);

  if (ComponentToRender === null) return;
  if (componentName === 'Form') {
    return <ComponentToRender key={key} resetComponent={resetComponent} {...props} />;
  }

  return <ComponentToRender {...props} />;
}, shouldUpdate);

export default ComponentWrapper;
