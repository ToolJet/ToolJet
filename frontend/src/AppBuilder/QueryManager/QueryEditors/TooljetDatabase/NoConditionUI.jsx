import React from 'react';
import Information from '@/_ui/Icon/solidIcons/Information';
import { generateCypressDataCy } from '../../../../modules/common/helpers/cypressHelpers.js';
export const NoCondition = ({ text = 'There are no condition' }) => {
  return (
    <div className="border-dashed d-flex justify-content-center align-items-center h-32 border-radius-6">
      <Information width="14" />
      <span className="tj-text-sm" style={{ color: 'var(--slate11)' }} data-cy={`${generateCypressDataCy(text)}-text`}>
        {text}
      </span>
    </div>
  );
};
