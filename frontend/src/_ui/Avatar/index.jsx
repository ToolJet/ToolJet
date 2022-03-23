import React from 'react';

const Avatar = ({ text, borderColor = '' }) => {
  return (
    <span style={{ border: `1px solid ${borderColor}` }} className="avatar avatar-sm avatar-rounded animation-fade">
      {text}
    </span>
  );
};

export default Avatar;
