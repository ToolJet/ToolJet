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
export const ChatMessage = ({
  chat,
  userName,
  respondentName,
  userAvatar,
  respondentAvatar,
  onDelete,
  computedStyles,
}) => (
  <div
    className={cx('message-bubble custom-gap-16', {
      'message-response': chat.type === 'response',
      'message-sender': chat.type === 'message',
      'message-error': chat.type === 'error',
    })}
  >
    <div className="d-flex flex-row align-items-start custom-gap-8 position-relative message-container w-100">
      <MessageAvatar type={chat.type} userAvatar={userAvatar} respondentAvatar={respondentAvatar} />
      <div className="d-flex flex-column flex-grow-1">
        <MessageHeader
          type={chat.type}
          userName={userName}
          respondentName={respondentName}
          timestamp={chat.timestamp}
          onCopy={() => copyToClipboard(chat.message)}
          onDelete={() => onDelete(chat.messageId)}
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
