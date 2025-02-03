import React from 'react';
import GetAvatar from './Avatar';

export const MessageAvatar = ({ type, userAvatar, respondentAvatar }) => (
  <div className="d-flex flex-row align-items-start justify-content-center" style={{ minWidth: '38px' }}>
    <div
      className="d-flex flex-row align-items-center justify-content-center"
      style={{
        borderRadius: '50%',
        width: '38px',
        height: '38px',
        border: '1px solid var(--borders-weak-disabled)',
      }}
    >
      <GetAvatar chatType={type} userAvatar={userAvatar} respondentAvatar={respondentAvatar} />
    </div>
  </div>
);
