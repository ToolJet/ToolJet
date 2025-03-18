import React from 'react';
import cx from 'classnames';
import { Tooltip } from 'react-tooltip';

// eslint-disable-next-line no-unused-vars
const CustomAvatar = ({ text, title = '', borderColor = '', borderShape, indexId = 0, className }) => {
  const formattedTitle = String(title).toLowerCase().replace(/\s+/g, '-');

  return (
    <span
      data-tooltip-id={`tooltip-for-avatar-${formattedTitle}-${indexId}`}
      data-tooltip-content={title}
      className={cx(`animation-fade avatar tj-avatar ${className}`, {
        'avatar-rounded': borderShape === 'rounded',
      })}
      data-cy="avatar-image"
    >
      {text}
      <Tooltip id={`tooltip-for-avatar-${formattedTitle}-${indexId}`} className="tooltip" />
    </span>
  );
};

export default CustomAvatar;
