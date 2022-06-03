import React from 'react';

const Avatar = ({ text, image, title = '', borderColor = '' }) => {
  return (
    <span
      data-tip={title}
      style={{ border: `1.5px solid ${borderColor}`, ...(image ? { backgroundImage: `url(${image})` } : {}) }}
      className="avatar avatar-sm avatar-rounded animation-fade"
    >
      {!image && text}
    </span>
  );
};

export default Avatar;
