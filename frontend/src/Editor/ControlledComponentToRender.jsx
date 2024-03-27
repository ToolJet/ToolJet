import React from 'react';
import { getComponentToRender } from '@/_helpers/editorHelpers';
import _ from 'lodash';

function deepEqualityCheckusingLoDash(obj1, obj2) {
  return _.isEqual(obj1, obj2);
}

const areEqual = (prevProps, nextProps) => {
  return (
    deepEqualityCheckusingLoDash(prevProps?.id, nextProps?.id) &&
    deepEqualityCheckusingLoDash(prevProps?.component?.definition, nextProps?.component?.definition) &&
    prevProps?.width === nextProps?.width &&
    prevProps?.height === nextProps?.height
  );
};

// This is your wrapper component
const ComponentWrapper = React.memo(({ componentName, ...props }) => {
  // Dynamically determine which component to render based on the componentName prop
  const ComponentToRender = getComponentToRender(componentName);

  // Render the component with the passed props
  return <ComponentToRender {...props} />;
}, areEqual);

export default ComponentWrapper;
