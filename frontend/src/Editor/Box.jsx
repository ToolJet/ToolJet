import React from 'react';
import HydrateWithResolveReferences from './Middlewares/HydrateWithResolveReferences';
import BoxUI from './BoxUI';
import _ from 'lodash';

import { shouldUpdate } from './ControlledComponentToRender';
import { useEditorStore } from '@/_stores/editorStore';

export const Box = React.memo((props) => {
  const { id, component, mode, customResolvables } = props;

  useEditorStore((state) => state.componentsNeedsUpdateOnNextRender);
  //!Force a re-render of the component

  return (
    <HydrateWithResolveReferences id={id} mode={mode} component={component} customResolvables={customResolvables}>
      <BoxUI {...props} />
    </HydrateWithResolveReferences>
  );
}, shouldUpdate);
