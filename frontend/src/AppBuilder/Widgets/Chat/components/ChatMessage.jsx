import React from 'react';
import cx from 'classnames';
import { MessageAvatar } from './MessageAvatar';
import { MessageHeader } from './MessageHeader';
import { MarkdownMessage } from './MarkdownMessage';
import toast from 'react-hot-toast';

const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success('Message copied to clipboard');
  } catch (err) {
    toast.error('Failed to copy message');
  }
};
export const ChatMessage = ({ chat, userName, respondentName, userAvatar, respondentAvatar, computedStyles }) => (
  <div
    className={cx('message-bubble custom-gap-16', {
      'message-response': chat.type === 'response',
      'message-sender': chat.type === 'message',
      'message-error': chat.type === 'error',
    })}
  >
    <div className="d-flex flex-row align-items-start custom-gap-12 position-relative message-container w-100">
      <MessageAvatar
        type={chat.type}
        chatAvatar={chat?.avatar || ''}
        userAvatar={userAvatar}
        respondentAvatar={respondentAvatar}
      />
      <div className="d-flex flex-column flex-grow-1 message-content-title-container">
        <MessageHeader
          type={chat.type}
          name={typeof chat.name === 'string' ? chat.name : ''}
          userName={userName}
          respondentName={respondentName}
          timestamp={chat.timestamp}
          onCopy={() => copyToClipboard(chat.message)}
          computedStyles={computedStyles}
        />
        <div
          className="tj-text-md message-content tj-text-color-not-important"
          style={{ color: computedStyles.messageContent.message }}
        >
          <MarkdownMessage content={chat.message} />
        </div>
      </div>
    </div>
  </div>
);
