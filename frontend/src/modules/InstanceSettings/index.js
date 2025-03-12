// src/modules/instanceSettings/index.js
import React from 'react';
import withEditionSpecificModule from '@/modules/common/helpers/withEditionSpecificModule';
import { MODULE_CONSTANTS } from '../common/constants';
import { TJLoader } from '@/_ui/TJLoader';

const InstanceSettings = withEditionSpecificModule('InstanceSettings', {
  moduleRequiredIn: [MODULE_CONSTANTS.MODULE_EDITIONS.EE],
  LoadingComponent: () => (
    <>
      <TJLoader />
    </>
  ),
});

export default InstanceSettings;
