import React from 'react';

const Avatar = ({ text, title = '', borderColor = '' }) => {
  return (
    <span
      data-tip={title}
      style={{ border: `1px solid ${borderColor}` }}
      className="avatar avatar-sm avatar-rounded animation-fade"
    >
      {text}
    </span>
  );
};

export default Avatar;
