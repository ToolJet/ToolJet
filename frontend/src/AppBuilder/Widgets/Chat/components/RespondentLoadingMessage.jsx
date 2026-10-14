import React from 'react';
import { MessageAvatar } from './MessageAvatar';

export const RespondentLoadingMessage = ({ userAvatar, respondentAvatar }) => (
  <div className="message-bubble custom-gap-16 message-loading">
    <div className="d-flex flex-row align-items-start custom-gap-8 position-relative message-container w-100 h-100">
      <MessageAvatar type={'response'} userAvatar={userAvatar} respondentAvatar={respondentAvatar} />
      <div className="h-100 d-flex align-items-center position-relative">
        <span className="loader"></span>
      </div>
    </div>
  </div>
);
