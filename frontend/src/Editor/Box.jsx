import React from 'react';
import HydrateWithResolveReferences from './Middlewares/HydrateWithResolveReferences';
import BoxUI from './BoxUI';
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

export const Box = (props) => {
  const { id, component, mode, customResolvables } = props;

  return (
    <HydrateWithResolveReferences id={id} mode={mode} component={component} customResolvables={customResolvables}>
      <BoxUI {...props} />
    </HydrateWithResolveReferences>
  );
};
