import React from 'react';
import { Button } from '@/components/ui/Button/Button';
import { ToolTip } from '@/_components/ToolTip';
import SolidIcon from '@/_ui/Icon/SolidIcons';

export const ChatHeader = ({ title, onDownload, onClear }) => (
  <div className="chat-header">
    <span className="chat-title tj-text-xx-large">{title}</span>
    <div className="button-group">
      <ToolTip message="Download chat history">
        <Button variant="ghost" onClick={onDownload} iconOnly title="Download chat history">
          <SolidIcon name="pagedownload" width="16" fill="var(--icons-strong)" />
        </Button>
      </ToolTip>

      <ToolTip message="Clear chat history">
        <Button variant="ghost" onClick={onClear} iconOnly>
          <SolidIcon name="clearhistory" width="16" fill="var(--icons-strong)" />
        </Button>
      </ToolTip>
    </div>
  </div>
);
