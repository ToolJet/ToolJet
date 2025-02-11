import React from 'react';
import { Button } from '@/components/ui/Button/Button';
import { ToolTip } from '@/_components/ToolTip';

export const ChatHeader = ({ title, onDownload, onClear, enableDownloadHistoryButton, enableClearHistoryButton }) => (
  <div className="chat-header">
    <span className="chat-title tj-text-xx-large">{title}</span>
    <div className="button-group">
      <ToolTip message="Download chat history" show={enableDownloadHistoryButton}>
        <Button
          variant="ghost"
          onClick={onDownload}
          iconOnly
          title="Download chat history"
          disabled={!enableDownloadHistoryButton}
          leadingIcon="pagedownload"
          fill={enableDownloadHistoryButton ? 'var(--icons-strong)' : 'var(--icons-disabled)'}
        />
      </ToolTip>

      <ToolTip message="Clear chat history" show={enableClearHistoryButton}>
        <Button
          variant="ghost"
          onClick={onClear}
          iconOnly
          disabled={!enableClearHistoryButton}
          leadingIcon="clearhistory"
          fill={enableClearHistoryButton ? 'var(--icons-strong)' : 'var(--icons-disabled)'}
        />
      </ToolTip>
    </div>
  </div>
);
