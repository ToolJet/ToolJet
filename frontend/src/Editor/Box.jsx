import React from 'react';
import HydrateWithResolveReferences from './Middlewares/HydrateWithResolveReferences';
import BoxUI from './BoxUI';
import _ from 'lodash';

import { shouldUpdate } from './ControlledComponentToRender';

export const Box = React.memo((props) => {
  const { id, component, mode, customResolvables } = props;

  return (
    <HydrateWithResolveReferences id={id} mode={mode} component={component} customResolvables={customResolvables}>
      <BoxUI {...props} />
    </HydrateWithResolveReferences>
  );
}, shouldUpdate);
