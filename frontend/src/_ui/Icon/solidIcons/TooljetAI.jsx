import React from 'react';
import tooljetAiIcon from '@assets/images/tooljet-ai.svg?url';

const TooljetAi = ({ className, width = '14', height = '15' }) => (
  <img
    src={tooljetAiIcon}
    width={width}
    height={height}
    className={className}
    style={{ display: 'inline-block', flexShrink: 0, maxWidth: 'none', objectFit: 'contain' }}
    alt=""
    aria-hidden="true"
    data-cy="ai-icon"
  />
);

export default TooljetAi;
