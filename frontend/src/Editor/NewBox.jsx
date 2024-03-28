// Box.js
import React from 'react';
import HydrateWithResolveReferences from './Middlewares/HydrateWithResolveReferences';
import BoxUI from './BoxUI';
import useRenderCount from '@/_hooks/useRenderCount';
import _ from 'lodash';

function deepEqualityCheckusingLoDash(obj1, obj2) {
  return _.isEqual(obj1, obj2);
}

export const shouldUpdate = (prevProps, nextProps) => {
  return (
    deepEqualityCheckusingLoDash(prevProps?.id, nextProps?.id) &&
    deepEqualityCheckusingLoDash(prevProps?.component?.definition, nextProps?.component?.definition) &&
    prevProps?.width === nextProps?.width &&
    prevProps?.height === nextProps?.height
  );
};

const Box = (props) => {
  const { id, component, mode, customResolvables } = props;
  // useRenderCount(`tooljet--New Box.jsx [box component] ${id}`);

  return (
    <HydrateWithResolveReferences id={id} mode={mode} component={component} customResolvables={customResolvables}>
      <BoxUI {...props} />
    </HydrateWithResolveReferences>
  );
};

export default Box;
