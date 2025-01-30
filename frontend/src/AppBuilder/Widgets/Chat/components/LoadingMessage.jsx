import React from 'react';
import { MessageAvatar } from './MessageAvatar';
import SolidIcon from '@/_ui/Icon/SolidIcons';

export const LoadingMessage = ({ isResponse, userAvatar, respondentAvatar }) => (
  <div className="message-bubble custom-gap-16 message-loading">
    <div className="d-flex flex-row align-items-start custom-gap-8 position-relative message-container w-100 h-100">
      <MessageAvatar
        type={isResponse ? 'response' : 'message'}
        userAvatar={userAvatar}
        respondentAvatar={respondentAvatar}
      />
      <div className="h-100 d-flex align-items-center">
        <SolidIcon name="loadingstate" width="16" fill={isResponse ? 'var(--icons-strong)' : 'var(--primary-brand)'} />
      </div>
    </div>
  </div>
);
