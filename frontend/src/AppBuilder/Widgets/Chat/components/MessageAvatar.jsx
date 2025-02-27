import React from 'react';
import GetAvatar from './Avatar';

export const MessageAvatar = ({ type, userAvatar, respondentAvatar, chatAvatar }) => (
  <div
    className="d-flex flex-row align-items-center justify-content-center"
    style={{
      borderRadius: '50%',
      width: '38px',
      height: '38px',
      border: '1px solid var(--borders-weak-disabled)',
      boxSizing: 'content-box',
      flexShrink: 0,
    }}
  >
    <GetAvatar chatType={type} chatAvatar={chatAvatar} userAvatar={userAvatar} respondentAvatar={respondentAvatar} />
  </div>
);
