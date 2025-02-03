import React from 'react';
import { Button } from '@/components/ui/Button/Button';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { formatTimestamp } from '../utils/helpers';

export const MessageHeader = ({ type, userName, respondentName, timestamp, onCopy, onDelete, computedStyles }) => (
  <div className="d-flex flex-row custom-gap-16 align-items-start justify-content-between">
    <div className="d-flex flex-row custom-gap-16">
      <span
        className="tj-header-h8 message-title tj-text-color-not-important"
        style={{ color: computedStyles.messageContent.name }}
      >
        {type === 'message' ? userName : respondentName}
      </span>
      <span
        className="tj-text-xsm message-timestamp tj-text-color-not-important"
        style={{ color: computedStyles.messageContent.timestamp }}
      >
        {formatTimestamp(timestamp)}
      </span>
    </div>
    <div className="d-flex gap-1 message-actions">
      <Button variant="ghost" onClick={onCopy} iconOnly className="action-button" title="Copy message">
        <SolidIcon name="copy" width="14" fill="var(--icons-strong)" />
      </Button>
      <Button variant="ghost" onClick={onDelete} iconOnly className="action-button" title="Delete message">
        <SolidIcon name="trash" width="14" fill="var(--red9)" />
      </Button>
    </div>
  </div>
);
