import React from 'react';

const Avatar = ({ text, image, title = '', borderColor = '', borderShape, bgColorClass = '' }) => {
  return (
    <span
      data-tip={title}
      style={{
        border: borderColor ? `1.5px solid ${borderColor}` : 'none',
        ...(image ? { backgroundImage: `url(${image})` } : {}),
      }}
      className={`avatar avatar-sm ${borderShape === 'rounded' ? 'avatar-rounded' : ''} animation-fade ${bgColorClass}`}
    >
      {!image && text}
    </span>
  );
};

export default Avatar;
