import React from 'react';
import HydrateWithResolveReferences from './Middlewares/HydrateWithResolveReferences';
import BoxUI from './BoxUI';
import _ from 'lodash';
import { useEditorStore, flushComponentsToRender } from '@/_stores/editorStore';
import { shallow } from 'zustand/shallow';

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

  /**
   * This component does not consume the value returned from the below hook.
   * Only purpose of the hook is to force rerender the component
   * */
  useEditorStore((state) => state.componentsNeedsUpdateOnNextRender.find((compId) => compId === id), shallow);
  console.log('deepEqualityCheckusingLoDash>> 1');

  return (
    <HydrateWithResolveReferences id={id} mode={mode} component={component} customResolvables={customResolvables}>
      <BoxUI {...props} />
    </HydrateWithResolveReferences>
  );
};
