import React from 'react';
import { withEditionSpecificModule } from '@/modules/common/helpers';
import { MODULE_CONSTANTS } from '../common/constants';
import { TJLoader } from '@/_ui/TJLoader';

const Workflows = withEditionSpecificModule('Workflows', {
  moduleRequiredIn: [MODULE_CONSTANTS.MODULE_EDITIONS.EE],
  LoadingComponent: () => (
    <>
      <TJLoader />
    </>
  ),
});

// Export the wrapped component
export default Workflows;
